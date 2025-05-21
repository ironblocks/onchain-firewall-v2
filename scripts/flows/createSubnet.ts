import { BigNumberish, MaxUint256 } from "ethers";
import { ethers } from "hardhat";
import { getFeePercentage, OperatorType } from "../helpers";
import { getL2Deployments } from "../../deploy/data/utils";

const CONFIRMATION_BLOCKS = 1;

// const subnetFee = 1000000000000000000n;
// const treasuries = [
//   "0x0000000000000000000000000000000000000000000000000000000000000001",
//   "0x0000000000000000000000000000000000000000000000000000000000000002",
//   "0x0000000000000000000000000000000000000000000000000000000000000003",
// ];
// const treasuriesShares = [getFeePercentage("1"), getFeePercentage("2"), getFeePercentage("3")];

const restrictedOperatorIndexes = [1, 2];

const subnetFee = 0n;
const treasuries: string[] = [];
const treasuriesShares: BigNumberish[] = [];

const attesterFee = getFeePercentage("70");
const aggregatorFee = getFeePercentage("20");
const performerFee = getFeePercentage("10");

async function main() {
  const l2Deployment = await getL2Deployments();
  console.log(`Creating subnet on vennFeeCalculator ${l2Deployment.VennFeeCalculator}`);

  const taskDefinitionId = await createTaskDefinition();
  console.log(`Task definition created with id ${taskDefinitionId}`);

  const vennFeeCalculator = await ethers.getContractAt("VennFeeCalculator", l2Deployment.VennFeeCalculator);

  console.log(`Setting taskDefinitionId ${taskDefinitionId} fee to ${subnetFee}`);
  let tx = await vennFeeCalculator.setTaskDefinitionFee(taskDefinitionId, subnetFee);
  await tx.wait(CONFIRMATION_BLOCKS);

  console.log(`Setting taskDefinitionId ${taskDefinitionId} fee recipients to ${treasuries}`);
  tx = await vennFeeCalculator.setTaskDefinitionFeeRecipients(taskDefinitionId, treasuries, treasuriesShares);
  await tx.wait(CONFIRMATION_BLOCKS);

  console.log(`Setting taskDefinitionId ${taskDefinitionId} operator fees`);
  tx = await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
    taskDefinitionId,
    [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
    [attesterFee, aggregatorFee, performerFee],
  );
  await tx.wait(CONFIRMATION_BLOCKS);

  console.log(`Subnet created`);
}

async function createTaskDefinition() {
  const l2Deployment = await getL2Deployments();
  const attestationCenter = await ethers.getContractAt("IAttestationCenter", l2Deployment.AttestationCenter);

  const taskDefinitionId = await attestationCenter.createNewTaskDefinition.staticCall("Task Name", {
    blockExpiry: MaxUint256,
    baseRewardFeeForAttesters: 0n,
    baseRewardFeeForPerformer: 0n,
    baseRewardFeeForAggregator: 0n,
    disputePeriodBlocks: 0n,
    minimumVotingPower: 0n,
    restrictedOperatorIndexes,
  });
  const tx = await attestationCenter.createNewTaskDefinition("Task Name", {
    blockExpiry: MaxUint256,
    baseRewardFeeForAttesters: 0n,
    baseRewardFeeForPerformer: 0n,
    baseRewardFeeForAggregator: 0n,
    disputePeriodBlocks: 0n,
    minimumVotingPower: 0n,
    restrictedOperatorIndexes,
  });
  await tx.wait(CONFIRMATION_BLOCKS);

  return taskDefinitionId;
}

main().catch(console.error);

// npx hardhat run scripts/flows/createSubnet.ts --network localhost
