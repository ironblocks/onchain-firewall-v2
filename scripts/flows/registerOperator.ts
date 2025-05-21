import dotenv from "dotenv";
import { AddressLike, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

dotenv.config();

const CONFIRMATION_BLOCKS = 1;

const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
if (!operatorPrivateKey) {
  throw new Error("OPERATOR_PRIVATE_KEY is not set");
}

const operator = new ethers.Wallet(operatorPrivateKey, ethers.provider);

const subscribedOperators = [
  {
    taskDefinitionId: 1,
    subscribedOperators: [] as AddressLike[],
    subscribedOperatorFeeShares: [] as BigNumberish[],
  },
];

const baseMetadataURI = "https://venn-operator.com/";

async function main() {
  const l2Deployment = await getL2Deployments();
  const operatorRegistry = await ethers.getContractAt("OperatorRegistry", l2Deployment.OperatorRegistry);

  console.log(`Registering operator ${operator.address}`);
  const tx = await operatorRegistry.registerOperator(operator, baseMetadataURI + `${operator.address}`);
  await tx.wait(CONFIRMATION_BLOCKS);

  for (const subscribedOperator of subscribedOperators) {
    console.log(`Subscribing to subnet ${subscribedOperator.taskDefinitionId}`);
    const tx = await operatorRegistry
      .connect(operator)
      .subscribeOperators(
        subscribedOperator.taskDefinitionId,
        subscribedOperator.subscribedOperators,
        subscribedOperator.subscribedOperatorFeeShares,
      );
    await tx.wait(CONFIRMATION_BLOCKS);
  }

  console.log(`Operator ${operator.address} registered`);
}

main().catch(console.error);

// npx hardhat run scripts/flows/registerOperator.ts --network localhost
