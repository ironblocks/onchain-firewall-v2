import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

const CONFIRMATION_BLOCKS = 1;

const policyAddress = "0x";
const subnets = [
  {
    taskDefinitionId: 1,
    requiredOperatorIds: [] as BigNumberish[],
  },
];

async function main() {
  console.log(
    `Subscribing protocol ${policyAddress} to task definition ids ${subnets.map((subnet) => subnet.taskDefinitionId)}`,
  );

  const l2Deployment = await getL2Deployments();
  const protocolRegistry = await ethers.getContractAt("ProtocolRegistry", l2Deployment.ProtocolRegistry);

  for (const subnet of subnets) {
    console.log(`Subscribing protocol ${policyAddress} to task definition id ${subnet.taskDefinitionId}`);
    let tx = await protocolRegistry.subscribeSubnet(policyAddress, subnet.taskDefinitionId, subnet.requiredOperatorIds);
    await tx.wait(CONFIRMATION_BLOCKS);
  }

  console.log(`Protocol subscribed`);
}

main().catch(console.error);

// npx hardhat run scripts/flows/subscribeProtocol.ts --network localhost
