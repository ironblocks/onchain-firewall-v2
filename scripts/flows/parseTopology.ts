import { IAttestationCenter__factory } from "@/generated-types/ethers";
import { AddressLike, BaseContract, BigNumberish, EventLog } from "ethers";
import { writeFileSync } from "fs";
import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

const BLOCK_RANGE = 5000;

function bigIntReplacer(_key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  // Handle ethers.js BigNumber objects
  if (value?._isBigNumber) {
    return value.toString();
  }
  return value;
}

async function main() {
  console.log("Parsing topology");

  console.log("Getting all othentic operators");
  const allOthenticOperators = await getAllOthenticOperators();

  console.log("Getting all othentic subnets");
  const allOthenticSubnets = await getAllOthenticSubnets();

  console.log("Extending venn operators");
  const extendedVennOperators = await extendVennOperators(allOthenticOperators, allOthenticSubnets);

  console.log("Getting all venn protocols");
  const allVennProtocols = await getAllVennProtocols();

  const topology = {
    operators: extendedVennOperators,
    subnets: allOthenticSubnets,
    protocols: allVennProtocols,
  };

  writeFileSync("topology.json", JSON.stringify(topology, bigIntReplacer, 2));
}

async function getAllOthenticSubnets() {
  const l2Deployment = await getL2Deployments();
  const attestationCenter = await ethers.getContractAt("IAttestationCenter", l2Deployment.AttestationCenter);

  const allOthenticSubnets = [];

  const numOfTaskDefinitions = Number(await attestationCenter.numOfTaskDefinitions()) + 1; // +1 for the 0th subnet

  for (let i = 0; i < numOfTaskDefinitions; i++) {
    const restrictedAttestersIds: BigNumberish[] = await attestationCenter.getTaskDefinitionRestrictedAttesters(i);

    const restrictedAttesters: { address: AddressLike; id: BigNumberish }[] = await Promise.all(
      restrictedAttestersIds.map(async (restrictedAttesterId) => {
        const restrictedAttesterPaymentDetail = await attestationCenter.getOperatorPaymentDetail(restrictedAttesterId);
        return { address: restrictedAttesterPaymentDetail.operator, id: restrictedAttesterId };
      }),
    );
    restrictedAttesters.sort((a, b) => Number(a.id) - Number(b.id));

    const minimumVotingPower = await attestationCenter.getTaskDefinitionMinimumVotingPower(i);
    const maximumNumberOfAttesters = await attestationCenter.getTaskDefinitionMaximumNumberOfAttesters(i);

    allOthenticSubnets.push({
      subnetId: i,
      minimumVotingPower,
      maximumNumberOfAttesters,
      restrictedAttesters,
    });
  }

  return allOthenticSubnets.sort((a, b) => a.subnetId - b.subnetId);
}

async function getAllOthenticOperators() {
  const l2Deployment = await getL2Deployments();
  const attestationCenter = await ethers.getContractAt("IAttestationCenter", l2Deployment.AttestationCenter);
  const obls = await ethers.getContractAt("IOBLS", l2Deployment.OBLS);

  const numOfTotalOperators = Number(await attestationCenter.numOfTotalOperators()) + 1;

  const operators = await Promise.all(
    Array.from({ length: numOfTotalOperators }, (_, i) =>
      Promise.all([attestationCenter.getOperatorPaymentDetail(i), obls.isActive(i), obls.votingPower(i)]).then(
        ([operator, isActive, votingPower]) => ({
          operator: operator.operator,
          operatorId: i,
          isActive,
          votingPower,
        }),
      ),
    ),
  );

  return operators.slice(1).sort((a, b) => Number(a.operatorId) - Number(b.operatorId)); // Skip the 0th operator and sort by operatorId
}

async function extendVennOperators(
  allOthenticOperators: {
    operator: AddressLike;
    operatorId: BigNumberish;
  }[],
  allOthenticSubnets: {
    subnetId: number;
  }[],
) {
  const l2Deployment = await getL2Deployments();
  const operatorRegistry = await ethers.getContractAt("OperatorRegistry", l2Deployment.OperatorRegistry);

  // Process all operators in parallel
  const extendedVennOperators = await Promise.all(
    allOthenticOperators.map(async (othenticOperator) => {
      const [vennOperator, allSubscribedOperatorFees] = await Promise.all([
        // Get operator details
        operatorRegistry.getOperator(othenticOperator.operator),
        // Get all subnet fees in parallel
        Promise.all(
          allOthenticSubnets.map(async (othenticSubnet) => {
            const [operatorIds, fees] = await operatorRegistry.getSubscribedOperatorFees(
              othenticSubnet.subnetId,
              othenticOperator.operatorId,
            );

            if (operatorIds.length === 0) {
              // skip if no subscribed operators
              return null;
            }

            const subscribedOperators = operatorIds.map((operatorId, index) => ({
              operatorId,
              fee: fees[index],
            }));

            subscribedOperators.sort((a, b) => Number(a.operatorId) - Number(b.operatorId));

            return {
              subnetId: othenticSubnet.subnetId,
              subscribedOperators,
            };
          }),
        ),
      ]);

      const { operator, operatorId, ...othenticData } = othenticOperator;
      return {
        operatorAddress: operator,
        operatorId,
        othentic: othenticData,
        venn: {
          isRegistered: vennOperator.operator !== ethers.ZeroAddress,
          metadata: vennOperator.metadata,
          subscribedOperatorFeesPerSubnet: allSubscribedOperatorFees.filter(
            (fee): fee is NonNullable<typeof fee> => fee !== null,
          ),
        },
      };
    }),
  );

  return extendedVennOperators;
}

async function getAllEvents(
  contract: BaseContract,
  eventName: string,
  fromBlock: number,
  blockRange = BLOCK_RANGE,
): Promise<EventLog[]> {
  const latestBlock = await ethers.provider.getBlockNumber();
  const events = [] as EventLog[];

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + blockRange - 1, latestBlock);

    try {
      const pageEvents = await contract.queryFilter(contract.getEvent(eventName), fromBlock, toBlock);
      events.push(...(pageEvents as EventLog[]));
    } catch (error) {
      console.warn(`Error fetching ${eventName} events for blocks ${fromBlock}-${toBlock}:`, error);
      console.warn(`Try again with a smaller block range`);
    }

    fromBlock = toBlock + 1;
  }

  return events;
}

async function getAllVennProtocols() {
  const l2Deployment = await getL2Deployments();
  const protocolRegistry = await ethers.getContractAt("ProtocolRegistry", l2Deployment.ProtocolRegistry);

  // Fetch all events in parallel with pagination
  const [registeredEvents, updatedEvents] = await Promise.all([
    getAllEvents(protocolRegistry, "ProtocolRegistered", l2Deployment.StartBlock),
    getAllEvents(protocolRegistry, "ProtocolUpdated", l2Deployment.StartBlock),
  ]);

  // Create initial protocols map from registered events
  const protocolsMap = new Map(
    registeredEvents.map((event) => [
      event.args.policyAddress,
      {
        policyAddress: event.args.policyAddress,
        metadataURI: event.args.metadataURI,
        subnets: [] as { subnetId: BigNumberish; requiredOperatorIds: BigNumberish[] }[],
      },
    ]),
  );

  // Apply updates
  for (const event of updatedEvents) {
    const { policyAddress, metadataURI } = event.args;
    const protocol = protocolsMap.get(policyAddress);

    if (protocol) {
      protocol.metadataURI = metadataURI;
    } else {
      console.log(`Protocol ${policyAddress} not found. Update event was triggered for a non-existent protocol.`);
    }
  }

  // Fetch subnet information in parallel for all protocols
  const protocols = Array.from(protocolsMap.values());
  await Promise.all(
    protocols.map(async (protocol) => {
      const taskDefinitionIds = await protocolRegistry.getProtocolTaskDefinitionIds(protocol.policyAddress);

      const subnets = await Promise.all(
        taskDefinitionIds.map(async (taskDefinitionId) => ({
          subnetId: taskDefinitionId,
          requiredOperatorIds: await protocolRegistry.getRequiredOperatorIds(protocol.policyAddress, taskDefinitionId),
        })),
      );

      subnets.sort((a, b) => Number(a.subnetId) - Number(b.subnetId));

      protocol.subnets = subnets;
    }),
  );

  return protocols;
}

main().catch(console.error);

// npx hardhat run scripts/flows/parseTopology.ts --network holesky
