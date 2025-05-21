import { BigNumberish, ZeroAddress } from "ethers";
import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

const CONFIRMATION_BLOCKS = 1;

const subnets = [
  {
    taskDefinitionId: 1,
    requiredOperatorIds: [] as BigNumberish[],
  },
];

const baseMetadataURI = "https://venn-protocol.com/";

async function main() {
  console.log("Registering protocol");

  const l2Deployment = await getL2Deployments();
  const protocolRegistry = await ethers.getContractAt("ProtocolRegistry", l2Deployment.ProtocolRegistry);

  const policy = await ethers.getContractAt("TransientApprovedCallsPolicy", l2Deployment.SampleVennPolicy);

  if ((await protocolRegistry.getProtocol(policy)).policyAddress === ZeroAddress) {
    console.log("Registering protocol");
    const tx = await protocolRegistry.registerProtocol(policy, baseMetadataURI + `${await policy.getAddress()}`);
    await tx.wait(CONFIRMATION_BLOCKS);
  }

  for (const subnet of subnets) {
    console.log(`Subscribing to subnet ${subnet.taskDefinitionId}`);
    const tx = await protocolRegistry.subscribeSubnet(policy, subnet.taskDefinitionId, subnet.requiredOperatorIds);
    await tx.wait(CONFIRMATION_BLOCKS);
  }

  console.log(`Protocol with policy ${await policy.getAddress()} registered`);
}

main().catch(console.error);

// npx hardhat run scripts/flows/registerProtocol.ts --network localhost
