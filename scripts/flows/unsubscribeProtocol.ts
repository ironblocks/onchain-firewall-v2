import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

const CONFIRMATION_BLOCKS = 1;

const policyAddress = "0x";
const taskDefinitionIds = [0, 1];

async function main() {
  console.log(`Unsubscribing protocol ${policyAddress} from task definition ids ${taskDefinitionIds}`);

  const l2Deployment = await getL2Deployments();
  const protocolRegistry = await ethers.getContractAt("ProtocolRegistry", l2Deployment.ProtocolRegistry);

  for (const taskDefinitionId of taskDefinitionIds) {
    console.log(`Unsubscribing protocol ${policyAddress} from task definition id ${taskDefinitionId}`);
    let tx = await protocolRegistry.unsubscribeSubnet(policyAddress, taskDefinitionId);
    await tx.wait(CONFIRMATION_BLOCKS);
  }

  console.log(`Protocol unsubscribed`);
}

main().catch(console.error);

// npx hardhat run scripts/flows/unsubscribeProtocol.ts --network localhost
