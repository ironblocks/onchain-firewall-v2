import {
  AttestationCenterProxy__factory,
  IAttestationCenter,
  IDynamicTransientApprovedCallsPolicy,
  SampleVennBeaconConsumer,
  SampleVennConsumer,
  SampleVennUpgradeableConsumer,
  TransientApprovedCallsPolicy,
} from "@/generated-types/ethers";
import { MulticallVennConsumerInterface } from "@/generated-types/ethers/artifacts/contracts/mock/samples/MulticallVennConsumer";
import { SampleVennConsumerInterface } from "@/generated-types/ethers/artifacts/contracts/mock/samples/SampleVennConsumer";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { impersonateAccount, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import {
  Addressable,
  AddressLike,
  BaseWallet,
  BigNumberish,
  FunctionFragment,
  HDNodeWallet,
  Interface,
  MaxUint256,
  Mnemonic,
  resolveAddress,
} from "ethers";
import { ethers } from "hardhat";
import { sign } from "../scripts/signatures";

export async function getCurrentBlockTime() {
  return (await ethers.provider.getBlock("latest"))!.timestamp;
}

export async function buildAndCreateDepositCallHash(
  sampleVennConsumer: SampleVennConsumer | SampleVennUpgradeableConsumer | SampleVennBeaconConsumer,
  depositAmount: bigint,
  sender: Addressable,
  origin: Addressable,
  approvedCallsPolicy: TransientApprovedCallsPolicy,
  nonce?: BigNumberish,
) {
  const depositCallHash = await createDepositCallHash(
    sampleVennConsumer.interface,
    sampleVennConsumer,
    sender,
    origin,
    depositAmount,
  );
  const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, origin, nonce);

  return encodedData;
}

export async function encodeApprovedCalls(
  approvedCallsPolicy: TransientApprovedCallsPolicy,
  depositCallHash: string,
  txOrigin: AddressLike,
  nonce?: BigNumberish,
) {
  if (!nonce) {
    nonce = await approvedCallsPolicy.nonces(txOrigin);
  }

  const encodedApprovedCalls = approvedCallsPolicy.interface.encodeFunctionData("approveCalls", [
    [depositCallHash],
    MaxUint256,
    await resolveAddress(txOrigin),
    nonce,
  ]);
  const encodedData = `${await approvedCallsPolicy.getAddress()}${encodedApprovedCalls.substring(2)}`;

  return encodedData;
}

export async function createCallsApprovedSignature(
  signer: SignerWithAddress,
  callHashes: string[],
  expiration: number,
  origin: Addressable,
  nonce: number,
  policy: Addressable,
) {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32[]", "uint256", "address", "uint256", "address", "uint256"],
      [callHashes, expiration, await origin.getAddress(), nonce, await policy.getAddress(), chainId],
    ),
  );

  const signature = await signer.signMessage(ethers.getBytes(messageHash));
  return signature;
}

export async function createAdvancedCallsApprovedSignature(
  signer: SignerWithAddress,
  advancedCalls: IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCallStruct[],
  expiration: number,
  origin: Addressable,
  nonce: number,
  policy: Addressable,
) {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "tuple(bytes32 callHash,uint256[] maxValues,uint256[] minValues)[]",
        "uint256",
        "address",
        "uint256",
        "address",
        "uint256",
      ],
      [advancedCalls, expiration, await origin.getAddress(), nonce, await policy.getAddress(), chainId],
    ),
  );

  const signature = await signer.signMessage(ethers.getBytes(messageHash));
  return signature;
}

export async function createCallHash(
  consumer: Addressable,
  sender: Addressable,
  origin: Addressable,
  data: string,
  value: BigNumberish,
) {
  return ethers.solidityPackedKeccak256(
    ["address", "address", "address", "bytes", "uint256"],
    [await consumer.getAddress(), await sender.getAddress(), await origin.getAddress(), data, value],
  );
}

export function createAdvancedApprovedCall(
  callHash: string,
  maxValues: BigNumberish[] = [],
  minValues: BigNumberish[] = [],
): IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCallStruct {
  return { callHash, maxValues, minValues };
}

export function getInterfaceId(contractInterface: Interface): string {
  return (
    "0x" +
    contractInterface.fragments
      .filter(FunctionFragment.isFragment)
      .reduce((acc, fragment) => acc ^ BigInt(fragment.selector), 0n)
      .toString(16)
      .padStart(8, "0")
  );
}

const privateKeys: Record<string, string> = {};

export async function getWallet(signer: AddressLike) {
  const privateKey = privateKeys[await resolveAddress(signer)];
  if (!privateKey) {
    throw new Error("Private key not found for the given signer");
  }

  const wallet = new ethers.Wallet(privateKey, ethers.provider);

  if ((await ethers.provider.getBalance(wallet.address)) === 0n) {
    await setBalance(wallet.address, ethers.parseEther("1000000"));
  }

  return wallet;
}

export async function getWallets(n: number) {
  const baseEntropy = 0x1d353b1f4bd2fa177ca2d6daf66344a6n;
  const alreadyExistingWallets = Object.keys(privateKeys).length;

  for (let i = alreadyExistingWallets; i < n; i++) {
    const mnemonic = Mnemonic.fromEntropy("0x" + (baseEntropy + BigInt(i)).toString(16));
    const wallet = HDNodeWallet.fromMnemonic(mnemonic);
    privateKeys[wallet.address] = wallet.privateKey;

    await setBalance(wallet.address, ethers.parseEther("1000000"));
  }

  const wallets = [];
  for (let i = 0; i < n; i++) {
    wallets.push(await getWallet(Object.keys(privateKeys)[i]));
  }

  return wallets;
}

export async function impersonateAccounts(accounts: string[]) {
  const accountBalance = ethers.parseEther("1000000");

  const signerAccounts: SignerWithAddress[] = [];
  for (const account of accounts) {
    await impersonateAccount(account);
    await setBalance(account, accountBalance);
    signerAccounts.push(await ethers.getSigner(account));
  }

  return signerAccounts;
}

export async function setForking() {
  await ethers.provider.send("hardhat_reset", [
    {
      forking: {
        jsonRpcUrl: process.env.FORKING_URL,
        blockNumber: Number(process.env.FORKING_BLOCK_NUMBER),
      },
    },
  ]);
}

export async function resetForking() {
  await ethers.provider.send("hardhat_reset");
}

export async function createDepositCallHash(
  iface: SampleVennConsumerInterface,
  consumer: Addressable,
  sender: Addressable,
  origin: Addressable,
  value: bigint,
) {
  const depositPayload = iface.encodeFunctionData("deposit()");

  const depositCallHash = await createCallHash(consumer, sender, origin, depositPayload, value);

  return depositCallHash;
}

export async function createMulticallCallHash(
  iface: MulticallVennConsumerInterface,
  consumer: Addressable,
  sender: Addressable,
  origin: Addressable,
  value: bigint,
  targets: Addressable[],
  data: string[],
  values: bigint[],
) {
  const resolvedTargets = await Promise.all(targets.map(async (target) => await resolveAddress(target)));

  const multicallPayload = iface.encodeFunctionData("multicall", [resolvedTargets, data, values]);

  const multicallCallHash = await createCallHash(consumer, sender, origin, multicallPayload, value);

  return multicallCallHash;
}

// This is important for the task submission to be deterministic
export async function getProofOfTask(txOrigin: SignerWithAddress, policy: Addressable) {
  const txOriginNonce = await txOrigin.provider.getTransactionCount(txOrigin);
  return `${await txOrigin.getAddress()}:${await policy.getAddress()}:${txOriginNonce}`;
}

export async function getSubmitTaskData(
  operators: BaseWallet[],
  taskPerformer: BaseWallet,
  attestationCenter: IAttestationCenter,
  proofOfTask: string,
  data: string,
  taskDefinitionId: number,
  isApproved: boolean,
) {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const taskInfo = {
    proofOfTask,
    data,
    taskPerformer: await taskPerformer.getAddress(),
    taskDefinitionId,
  };
  const signatureRequest = {
    taskInfo,
    chainId,
    isApproved,
  };
  const { mcl, ecdsa } = await sign(signatureRequest, attestationCenter, operators, taskPerformer);

  const indexes: bigint[] = [];
  for (const operator of operators) {
    indexes.push(await attestationCenter.operatorsIdsByAddress(operator));
  }
  indexes.sort((a, b) => Number(a - b));

  const taskSubmissionDetails = {
    isApproved: true,
    tpSignature: ecdsa,
    taSignature: mcl,
    attestersIds: indexes,
  };

  const submitTaskData = attestationCenter.interface.encodeFunctionData(
    "submitTask((string,bytes,address,uint16),(bool,bytes,uint256[2],uint256[]))",
    [taskInfo, taskSubmissionDetails],
  );

  return submitTaskData;
}

export async function getSubmitTasksData(
  operators: BaseWallet[],
  taskPerformer: BaseWallet,
  attestationCenter: IAttestationCenter,
  proofOfTasks: string[],
  data: string[],
  taskDefinitionIds: number[],
  isApproved: boolean[],
) {
  if (proofOfTasks.length !== data.length || proofOfTasks.length !== taskDefinitionIds.length) {
    throw new Error("Invalid input length");
  }

  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const taskPerformerAddress = await taskPerformer.getAddress();
  const taskInfos = proofOfTasks.map((proofOfTask, index) => ({
    proofOfTask,
    data: data[index],
    taskPerformer: taskPerformerAddress,
    taskDefinitionId: taskDefinitionIds[index],
  }));
  const taskSubmissionDetails = [];
  for (let index = 0; index < taskInfos.length; index++) {
    const taskInfo = taskInfos[index];
    const signatureRequest = {
      taskInfo,
      chainId,
      isApproved: isApproved[index],
    };

    const { mcl, ecdsa } = await sign(signatureRequest, attestationCenter, operators);

    const indexes: bigint[] = [];
    for (const operator of operators) {
      indexes.push(await attestationCenter.operatorsIdsByAddress(operator));
    }
    indexes.sort((a, b) => Number(a - b));

    taskSubmissionDetails.push({
      isApproved: isApproved[index],
      tpSignature: ecdsa,
      taSignature: mcl,
      attestersIds: indexes,
    });
  }
  const submitTasksData = AttestationCenterProxy__factory.createInterface().encodeFunctionData("submitTasks", [
    taskInfos,
    taskSubmissionDetails,
  ]);

  return submitTasksData;
}

export function getErrorBytes(error: string) {
  return "0x08c379a0" + ethers.AbiCoder.defaultAbiCoder().encode(["string"], [error]).slice(2);
}

export async function getOperatorPaymentDetails(attestationCenter: IAttestationCenter, operators: BaseWallet[]) {
  const details = [];

  for (const operator of operators) {
    const operatorId = await attestationCenter.operatorsIdsByAddress(operator);
    const paymentDetail = await attestationCenter.getOperatorPaymentDetail(operatorId);

    details.push({
      operator,
      operatorId,
      paymentDetail,
    });
  }

  return details;
}
