import dotenv from "dotenv";
import { SampleVennConsumer__factory } from "@/generated-types/ethers";
import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { buildAndCreateDepositCallHash, getSubmitTaskData, getProofOfTask } from "@/test/helpers";
import { getL2Deployments } from "../../../deploy/data/utils";

dotenv.config();

const operatorPrivateKeys = process.env.OPERATOR_PRIVATE_KEYS;
if (!operatorPrivateKeys) {
  throw new Error("OPERATOR_PRIVATE_KEYS is not set");
}
const operatorPrivateKeysArray = operatorPrivateKeys.split(",");

const operators = operatorPrivateKeysArray.map((privateKey) => new Wallet(privateKey, ethers.provider));
const depositAmount = ethers.parseEther("0.00001");

async function main() {
  const l2Deployment = await getL2Deployments();
  for (const operator of operators) {
    console.log(`Operator balance: ${await ethers.provider.getBalance(operator.address)}`);
  }

  const [deployer] = await ethers.getSigners();
  const sampleVennConsumer = await ethers.getContractAt("SampleVennConsumer", l2Deployment.SampleVennConsumer);
  const sampleVennPolicy = await ethers.getContractAt("TransientApprovedCallsPolicy", l2Deployment.SampleVennPolicy);
  const attestationCenter = await ethers.getContractAt("IAttestationCenter", l2Deployment.AttestationCenter);

  const encodedData = await buildAndCreateDepositCallHash(
    sampleVennConsumer,
    depositAmount,
    deployer,
    deployer,
    sampleVennPolicy,
  );
  const proofOfTask = await getProofOfTask(deployer, sampleVennPolicy);

  const submitTaskData = await getSubmitTaskData(
    operators,
    operators[0],
    attestationCenter,
    proofOfTask,
    encodedData,
    1,
    true,
  );

  const depositData = SampleVennConsumer__factory.createInterface().encodeFunctionData("deposit");
  const tx = await sampleVennConsumer.safeFunctionCall(0, submitTaskData, depositData, {
    value: depositAmount,
  });
  console.log(`Deposit tx: ${tx.hash}`);
  await tx.wait();
}

main().catch(console.error);

// npx hardhat run scripts/flows/dependencies/registerOperator.ts --network localhost
