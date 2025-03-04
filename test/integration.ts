import { SampleVennConsumer__factory } from "@/generated-types/ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress, parseEther } from "ethers";
import { ethers } from "hardhat";
import {
  buildAndCreateDepositCallHash,
  createDepositCallHash,
  createMulticallCallHash,
  deployBaseFixture,
  deployLargeOperatorAmountFixture,
  deployMulticallFixture,
  encodeApprovedCalls,
  getErrorBytes,
  getOperatorPaymentDetails,
  getProofOfTask,
  getSubmitTaskData,
  getSubmitTasksData,
} from "../scripts/utils";

const OTHENTIC_PROTOCOL_FEE = 100_000; // TODO: figure this out dynamically
const OTHENTIC_PROTOCOL_FEE_BASE = 1_000_000;
const OTHENTIC_LEFTOVER = OTHENTIC_PROTOCOL_FEE_BASE - OTHENTIC_PROTOCOL_FEE;

describe("integration", () => {
  const depositData = SampleVennConsumer__factory.createInterface().encodeFunctionData("deposit");
  const metadataURI = "https://example.com/metadata";

  const depositAmount = ethers.parseEther("1");

  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let chainId: bigint;

  before(async () => {
    deployer = (await ethers.getSigners())[0];
    user1 = (await ethers.getSigners())[1];
    chainId = (await ethers.provider.getNetwork()).chainId;
  });

  describe("Fees", () => {
    it("should allow protocol to prepay fees for users", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];
      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );

      const feeAmount = ethers.parseEther("0.01");

      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });
      expect(await feePool.policyBalance(approvedCallsPolicy)).to.equal(feeAmount * BigInt(2));
      expect(await feePool.collectedNativeFees()).to.equal(BigInt(0));

      await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      expect(await feePool.policyBalance(approvedCallsPolicy)).to.equal(feeAmount);
      expect(await feePool.collectedNativeFees()).to.equal(feeAmount);
    });

    it("should allow protocol to prepay fees for users, but have txs revert if not enough fees are paid", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount + BigInt(1) });
      const prePolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const preCollectedNativeFees = await feePool.collectedNativeFees();
      expect(prePolicyBalance).to.equal(feeAmount + BigInt(1));
      expect(preCollectedNativeFees).to.equal(BigInt(0));

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;

      const postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(BigInt(1));
      expect(postCollectedNativeFees).to.equal(feeAmount);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
        chainId,
        true,
      );

      tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData2, depositData, { value: depositAmount, gasLimit: 1000000 });
      const expectedErrorBytes = getErrorBytes("FeePool: Insufficient balance.");
      await expect(tx)
        .to.be.revertedWithCustomError(sampleVennConsumer, `ProxyCallFailed(bytes)`)
        .withArgs(expectedErrorBytes);
    });

    it("should allow protocol to prepay fees for users, and for fee to be updated", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(5) });
      const prePolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const preCollectedNativeFees = await feePool.collectedNativeFees();
      expect(prePolicyBalance).to.equal(feeAmount * BigInt(5));
      expect(preCollectedNativeFees).to.equal(BigInt(0));

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;

      let postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      let postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(feeAmount * BigInt(4));
      expect(postCollectedNativeFees).to.equal(feeAmount);

      const feeAmount2 = feeAmount * BigInt(2);
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount2);

      const encodedData2 = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask2,
        encodedData2,
        0,
        chainId,
        true,
      );

      tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData2, depositData, { value: depositAmount, gasLimit: 1000000 });

      await expect(tx).to.not.be.reverted;
      postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(feeAmount * BigInt(2));
      expect(postCollectedNativeFees).to.equal(feeAmount * BigInt(3));
    });

    it("should allow users to pay fees for themselves, not be included in msgValue()", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      const prePolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const preCollectedNativeFees = await feePool.collectedNativeFees();
      expect(prePolicyBalance).to.equal(BigInt(0));
      expect(preCollectedNativeFees).to.equal(BigInt(0));

      let tx = sampleVennConsumer.connect(user1).safeFunctionCall(feeAmount, submitTaskData, depositData, {
        value: depositAmount + feeAmount,
        gasLimit: 1000000,
      });
      await expect(tx).to.not.be.reverted;
      const user1Balance = await sampleVennConsumer.deposits(user1);
      expect(user1Balance).to.equal(depositAmount);

      const postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(BigInt(0));
      expect(postCollectedNativeFees).to.equal(feeAmount);
    });

    it("should allow users to pay fees for themselves, but have txs revert if not enough fees are paid", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      const prePolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const preCollectedNativeFees = await feePool.collectedNativeFees();
      expect(prePolicyBalance).to.equal(BigInt(0));
      expect(preCollectedNativeFees).to.equal(BigInt(0));

      let tx = sampleVennConsumer.connect(user1).safeFunctionCall(feeAmount, submitTaskData, depositData, {
        value: depositAmount + feeAmount,
        gasLimit: 1000000,
      });
      await expect(tx).to.not.be.reverted;
      const user1Balance = await sampleVennConsumer.deposits(user1);
      expect(user1Balance).to.equal(depositAmount);

      const postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(BigInt(0));
      expect(postCollectedNativeFees).to.equal(feeAmount);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
        chainId,
        true,
      );

      tx = sampleVennConsumer.connect(user1).safeFunctionCall(feeAmount - BigInt(1), submitTaskData2, depositData, {
        value: depositAmount + feeAmount - BigInt(1),
        gasLimit: 1000000,
      });
      const expectedErrorBytes = getErrorBytes("FeePool: Insufficient balance.");
      await expect(tx)
        .to.be.revertedWithCustomError(sampleVennConsumer, `ProxyCallFailed(bytes)`)
        .withArgs(expectedErrorBytes);
    });

    it("should allow users to pay fees for themselves, and for fee to be updated", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      const prePolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      const preCollectedNativeFees = await feePool.collectedNativeFees();
      expect(prePolicyBalance).to.equal(BigInt(0));
      expect(preCollectedNativeFees).to.equal(BigInt(0));

      let tx = sampleVennConsumer.connect(user1).safeFunctionCall(feeAmount, submitTaskData, depositData, {
        value: depositAmount + feeAmount,
        gasLimit: 1000000,
      });
      await expect(tx).to.not.be.reverted;

      let postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      let postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(BigInt(0));
      expect(postCollectedNativeFees).to.equal(feeAmount);

      const encodedData2 = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );

      const feeAmount2 = feeAmount * BigInt(2);
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount2);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask2,
        encodedData2,
        0,
        chainId,
        true,
      );

      tx = sampleVennConsumer.connect(user1).safeFunctionCall(feeAmount2, submitTaskData2, depositData, {
        value: depositAmount + feeAmount2,
        gasLimit: 1000000,
      });

      await expect(tx).to.not.be.reverted;
      postPolicyBalance = await feePool.policyBalance(approvedCallsPolicy);
      postCollectedNativeFees = await feePool.collectedNativeFees();
      expect(postPolicyBalance).to.equal(BigInt(0));
      expect(postCollectedNativeFees).to.equal(feeAmount * BigInt(3));
    });
  });

  describe("Approved Calls", () => {
    it("should pass basic protected deposit with three operators approving, no subnet (taskDefinitionId = 0)", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;
    });

    it("should pass basic protected deposit with majority two of three operators approving, no subnet (taskDefinitionId = 0)", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      const taskPerformerPrivateKey = operatorKeys[0];
      const activeOperatorKeys = [operatorKeys[0], operatorKeys[1]];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        activeOperatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;
    });

    it("should revert basic protected deposit with minority one of three operators approving, no subnet (taskDefinitionId = 0)", async () => {
      const { attestationCenter, sampleVennConsumer, approvedCallsPolicy, operatorKeys } =
        await loadFixture(deployBaseFixture);

      const taskPerformerPrivateKey = operatorKeys[0];
      const activeOperatorKeys = [operatorKeys[0]];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        activeOperatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      // TODO: find out which custom error 0xcabeb655 is, assert withArgs with it
      await expect(tx).to.be.revertedWithCustomError(sampleVennConsumer, "ProxyCallFailed(bytes)");
    });

    it("should pass basic protected deposit with one of two operators approving, subnet (taskDefinitionId = 1)", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        avsGovernanceMultisig,
        operatorKeys,
      } = await loadFixture(deployBaseFixture);

      const activeOperatorKeys = [operatorKeys[0], operatorKeys[1]];

      const taskDefinitionName = "subnet deposit";
      const taskDefinitionParams = {
        blockExpiry: ethers.MaxUint256,
        baseRewardFeeForAttesters: 0,
        baseRewardFeeForPerformer: 0,
        baseRewardFeeForAggregator: 0,
        disputePeriodBlocks: 0,
        minimumVotingPower: 0,
        restrictedOperatorIndexes: [1, 2],
      };

      const newTaskDefinitionId = await attestationCenter
        .connect(avsGovernanceMultisig)
        .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

      await attestationCenter
        .connect(avsGovernanceMultisig)
        .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], newTaskDefinitionId, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        activeOperatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        Number(newTaskDefinitionId),
        chainId,
        true,
      );

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 10000000 });
      await expect(tx).to.not.be.reverted;
    });
  });

  describe("Multi Approved Calls", () => {
    it("should process a chain of approved calls with prefunded fee pool", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        approvedCallsPolicy,
        operatorKeys,
        multicallVennConsumer,
        approvedCallsPolicy2,
        protocolRegistry,
        feePool,
      } = await loadFixture(deployMulticallFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      await protocolRegistry.registerProtocol(approvedCallsPolicy2, [], 0, metadataURI);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      await feePool.depositNativeForPolicy(approvedCallsPolicy2, {
        value: ethers.parseEther("0.01"),
      });

      const requiredNativeFee = await feePool.getTotalRequiredNativeAmountForPolicies([
        approvedCallsPolicy,
        approvedCallsPolicy2,
      ]);
      expect(requiredNativeFee).to.equal(ethers.parseEther("0"));

      const taskPerformerPrivateKey = operatorKeys[0];

      const multicallCallHash = await createMulticallCallHash(
        multicallVennConsumer.interface,
        multicallVennConsumer,
        user1,
        user1,
        ethers.parseEther("1"),
        [sampleVennConsumer],
        [sampleVennConsumer.interface.encodeFunctionData("deposit")],
        [ethers.parseEther("1")],
      );
      const depositCallHash = await createDepositCallHash(
        sampleVennConsumer.interface,
        sampleVennConsumer,
        multicallVennConsumer,
        user1,
        ethers.parseEther("1"),
      );

      const encodedData1 = await encodeApprovedCalls(approvedCallsPolicy2, multicallCallHash, user1);
      const encodedData2 = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy2);
      const submitTaskData = await getSubmitTasksData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        [proofOfTask, proofOfTask2],
        [encodedData1, encodedData2],
        [0, 0],
        chainId,
        [true, true],
      );
      const internalDepositPayload = multicallVennConsumer.interface.encodeFunctionData("multicall", [
        [await sampleVennConsumer.getAddress()],
        [sampleVennConsumer.interface.encodeFunctionData("deposit")],
        [ethers.parseEther("1")],
      ]);

      let tx = multicallVennConsumer.connect(user1).safeFunctionCall(0, submitTaskData, internalDepositPayload, {
        value: ethers.parseEther("1"),
      });

      await expect(tx).to.not.be.reverted;
    });

    it("should process a chain of approved calls with one prefunded fee pool, one half funded", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        approvedCallsPolicy,
        operatorKeys,
        multicallVennConsumer,
        approvedCallsPolicy2,
        protocolRegistry,
        feePool,
      } = await loadFixture(deployMulticallFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      await protocolRegistry.registerProtocol(approvedCallsPolicy2, [], 0, metadataURI);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      await feePool.depositNativeForPolicy(approvedCallsPolicy2, {
        value: ethers.parseEther("0.005"),
      });

      const requiredNativeFee = await feePool.getTotalRequiredNativeAmountForPolicies([
        approvedCallsPolicy,
        approvedCallsPolicy2,
      ]);
      expect(requiredNativeFee).to.equal(ethers.parseEther("0.005"));

      const taskPerformerPrivateKey = operatorKeys[0];

      const multicallCallHash = await createMulticallCallHash(
        multicallVennConsumer.interface,
        multicallVennConsumer,
        user1,
        user1,
        ethers.parseEther("1"),
        [sampleVennConsumer],
        [sampleVennConsumer.interface.encodeFunctionData("deposit")],
        [ethers.parseEther("1")],
      );
      const depositCallHash = await createDepositCallHash(
        sampleVennConsumer.interface,
        sampleVennConsumer,
        multicallVennConsumer,
        user1,
        ethers.parseEther("1"),
      );
      const encodedData1 = await encodeApprovedCalls(approvedCallsPolicy2, multicallCallHash, user1);
      const encodedData2 = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy2);
      const submitTaskData = await getSubmitTasksData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        [proofOfTask, proofOfTask2],
        [encodedData1, encodedData2],
        [0, 0],
        chainId,
        [true, true],
      );
      const internalDepositPayload = multicallVennConsumer.interface.encodeFunctionData("multicall", [
        [await sampleVennConsumer.getAddress()],
        [sampleVennConsumer.interface.encodeFunctionData("deposit")],
        [ethers.parseEther("1")],
      ]);

      let tx = multicallVennConsumer
        .connect(user1)
        .safeFunctionCall(requiredNativeFee, submitTaskData, internalDepositPayload, {
          value: ethers.parseEther("1") + requiredNativeFee,
        });

      await expect(tx).to.not.be.reverted;
    });

    it("should process a batch of approved calls", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        approvedCallsPolicy,
        operatorKeys,
        multicallVennConsumer,
        approvedCallsPolicy2,
        protocolRegistry,
        feePool,
      } = await loadFixture(deployMulticallFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      await protocolRegistry.registerProtocol(approvedCallsPolicy2, [], 0, metadataURI);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      await feePool.depositNativeForPolicy(approvedCallsPolicy2, {
        value: ethers.parseEther("0.01"),
      });

      const multicallFactory = await ethers.getContractFactory("Multicall");
      const multicall = await multicallFactory.deploy();

      const taskPerformerPrivateKey = operatorKeys[0];

      const multicallCallHash = await createMulticallCallHash(
        multicallVennConsumer.interface,
        multicallVennConsumer,
        multicall,
        user1,
        0n,
        [sampleVennConsumer],
        [sampleVennConsumer.interface.encodeFunctionData("owner")],
        [0n],
      );
      const depositCallHash = await createDepositCallHash(
        sampleVennConsumer.interface,
        sampleVennConsumer,
        multicall,
        user1,
        ethers.parseEther("1"),
      );
      const encodedData1 = await encodeApprovedCalls(approvedCallsPolicy2, multicallCallHash, user1, 0n);
      const encodedData2 = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1, 0n);
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy2);
      const submitTaskData = await getSubmitTasksData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        [proofOfTask, proofOfTask2],
        [encodedData1, encodedData2],
        [0, 0],
        chainId,
        [true, true],
      );
      const multicallPayload = multicallVennConsumer.interface.encodeFunctionData("multicall", [
        [await sampleVennConsumer.getAddress()],
        [sampleVennConsumer.interface.encodeFunctionData("owner")],
        [0n],
      ]);
      const depositPayload = sampleVennConsumer.interface.encodeFunctionData("deposit");

      const safeFunctionCallPayload = multicallVennConsumer.interface.encodeFunctionData("safeFunctionCall", [
        0,
        submitTaskData,
        multicallPayload,
      ]);

      let tx = multicall
        .connect(user1)
        .multicall(
          [multicallVennConsumer, sampleVennConsumer],
          [safeFunctionCallPayload, depositPayload],
          [0n, ethers.parseEther("1")],
          {
            value: ethers.parseEther("1"),
          },
        );

      await expect(tx).to.not.be.reverted;
    });
  });

  describe("VennFeeCalculator", () => {
    it("should return zero fees for a zero protocol fee", async () => {
      const { vennFeeCalculator, protocolRegistry, approvedCallsPolicy } = await loadFixture(deployBaseFixture);

      await protocolRegistry.setTaskDefinitionFee(0, ethers.parseEther("0"));
      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const feeCalculatorData = {
        data: {
          proofOfTask: "proofOfTask",
          data: await approvedCallsPolicy.getAddress(),
          taskPerformer: ZeroAddress,
          taskDefinitionId: 0,
        },
        aggregatorId: 0,
        performerId: 0,
        attestersIds: [0, 1, 2],
      };

      const res = await vennFeeCalculator.calculateBaseRewardFees(feeCalculatorData);

      expect(res.baseRewardFeeForAttesters).to.equal(0);
      expect(res.baseRewardFeeForAggregator).to.equal(0);
      expect(res.baseRewardFeeForPerformer).to.equal(0);
    });

    it("should return equal parts for a protocol fee", async () => {
      const { vennFeeCalculator, approvedCallsPolicy, protocolRegistry } = await loadFixture(deployBaseFixture);

      const feeAmount = ethers.parseEther("4");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const feeCalculatorData = {
        data: {
          proofOfTask: "proofOfTask",
          data: await approvedCallsPolicy.getAddress(),
          taskPerformer: ZeroAddress,
          taskDefinitionId: 0,
        },
        aggregatorId: 0,
        performerId: 0,
        attestersIds: [0, 1, 2],
      };

      const res = await vennFeeCalculator.calculateBaseRewardFees(feeCalculatorData);

      expect(res.baseRewardFeeForAttesters).to.equal(feeAmount / 4n);
      expect(res.baseRewardFeeForAggregator).to.equal(feeAmount / 4n);
      expect(res.baseRewardFeeForPerformer).to.equal(0);
    });

    it("should return correct fees for a protocol fee", async () => {
      const { vennFeeCalculator, approvedCallsPolicy, protocolRegistry } = await loadFixture(deployBaseFixture);

      const feeAmount = ethers.parseEther("30");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const attestersCount = [0, 1, 2, 3, 10, 100, 10000];
      for (const count of attestersCount) {
        const feeCalculatorData = {
          data: {
            proofOfTask: "proofOfTask",
            data: await approvedCallsPolicy.getAddress(),
            taskPerformer: ZeroAddress,
            taskDefinitionId: 0,
          },
          aggregatorId: 0,
          performerId: 0,
          attestersIds: Array.from({ length: count }, (_, i) => i),
        };

        const res = await vennFeeCalculator.calculateBaseRewardFees(feeCalculatorData);

        expect(res.baseRewardFeeForAttesters).to.equal(feeAmount / BigInt(count + 1));
        expect(res.baseRewardFeeForAggregator).to.equal(feeAmount / BigInt(count + 1));
        expect(res.baseRewardFeeForPerformer).to.equal(0);
      }
    });

    it("should return correct fees for a different protocol fee", async () => {
      const { vennFeeCalculator, approvedCallsPolicy, protocolRegistry } = await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      const protocolFees = [
        ethers.parseEther("0.00001"),
        ethers.parseEther("0.0001"),
        ethers.parseEther("0.001"),
        ethers.parseEther("0.01"),
        ethers.parseEther("1"),
        ethers.parseEther("100"),
      ];
      for (const fee of protocolFees) {
        await protocolRegistry.setTaskDefinitionFee(0, fee);

        const feeCalculatorData = {
          data: {
            proofOfTask: "proofOfTask",
            data: await approvedCallsPolicy.getAddress(),
            taskPerformer: ZeroAddress,
            taskDefinitionId: 0,
          },
          aggregatorId: 0,
          performerId: 0,
          attestersIds: [0, 1, 2],
        };

        const res = await vennFeeCalculator.calculateBaseRewardFees(feeCalculatorData);

        expect(res.baseRewardFeeForAttesters).to.equal(fee / 4n);
        expect(res.baseRewardFeeForAggregator).to.equal(fee / 4n);
        expect(res.baseRewardFeeForPerformer).to.equal(0);
      }
    });
  });

  describe("Operator rewards", () => {
    it("should allow operators to get their vault share rewards by deployer minting and batch payment when allowOperatorClaim is false", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operatorKeys,
        feePool,
        vennVaultL2,
        l2AvsTreasury,
        vennToken,
      } = await loadFixture(deployBaseFixture);

      await vennVaultL2.setAllowOperatorClaim(false);
      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;

      const operatorPrePaymentDetails = await getOperatorPaymentDetails(attestationCenter, operatorKeys);
      const requiredRewards = operatorPrePaymentDetails.reduce(
        (acc, curr) => acc + curr.paymentDetail.feeToClaim,
        BigInt(0),
      );
      const requiredRewardsWithProtocolFee =
        (requiredRewards * BigInt(OTHENTIC_PROTOCOL_FEE_BASE)) / BigInt(OTHENTIC_LEFTOVER);
      await vennVaultL2.ownerMint(deployer, requiredRewardsWithProtocolFee);
      await vennVaultL2.approve(l2AvsTreasury, requiredRewardsWithProtocolFee);
      await l2AvsTreasury["depositERC20(address,uint256)"](deployer, requiredRewardsWithProtocolFee);
      await attestationCenter.connect(deployer)["requestBatchPayment()"]();
      const operatorPostPaymentDetails = await getOperatorPaymentDetails(attestationCenter, operatorKeys);

      const vennRewardsAmount = requiredRewardsWithProtocolFee * BigInt(1000);
      await vennToken.transfer(vennVaultL2, vennRewardsAmount);
      for (let i = 0; i < operatorPostPaymentDetails.length; i++) {
        const operatorPostPaymentDetail = operatorPostPaymentDetails[i];
        const operatorPrePaymentDetail = operatorPrePaymentDetails[i];
        const operatorFeeToClaim = operatorPrePaymentDetail.paymentDetail.feeToClaim;
        const operatorVaultTokenBalance = await vennVaultL2.balanceOf(operatorPostPaymentDetail.operatorAddress);
        expect(operatorVaultTokenBalance).to.equal(operatorFeeToClaim);
        expect(operatorPostPaymentDetail.paymentDetail.feeToClaim).to.equal(BigInt(0));
        const operatorPreVennBalance = await vennToken.balanceOf(operatorPostPaymentDetail.operatorAddress);
        const expectedVennRewards = (operatorFeeToClaim * vennRewardsAmount) / requiredRewardsWithProtocolFee;
        await vennVaultL2
          .connect(operatorPostPaymentDetail.operatorWallet)
          .redeem(
            operatorVaultTokenBalance,
            operatorPostPaymentDetail.operatorAddress,
            operatorPostPaymentDetail.operatorAddress,
          );
        const operatorPostVennBalance = await vennToken.balanceOf(operatorPostPaymentDetail.operatorAddress);
        const diffExpected = expectedVennRewards - (operatorPostVennBalance - operatorPreVennBalance);
        const absDiffExpected = diffExpected < 0n ? -diffExpected : diffExpected;
        const smallEnoughDiff = absDiffExpected < parseEther("0.0000001");
        // We expect the difference to be small enough to be negligible, due to vault rounding down
        expect(smallEnoughDiff).to.be.true;
      }
    });

    it("should not allow operators to get their vault share rewards by calling themselves when allowOperatorClaim is false", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operatorKeys,
        feePool,
        vennVaultL2,
        vennToken,
      } = await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);
      await vennVaultL2.setAllowOperatorClaim(false);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

      const operatorPrePaymentDetails = await getOperatorPaymentDetails(attestationCenter, operatorKeys);
      const {
        operatorWallet: operator1,
        paymentDetail: paymentDetail1,
        operatorId: operatorId1,
      } = operatorPrePaymentDetails[0];
      const requiredRewards = paymentDetail1.feeToClaim;
      const requiredRewardsWithProtocolFee =
        (requiredRewards * BigInt(OTHENTIC_PROTOCOL_FEE_BASE)) / BigInt(OTHENTIC_LEFTOVER);
      const vennRewardsAmount = requiredRewardsWithProtocolFee * BigInt(1000);
      await vennToken.transfer(vennVaultL2, vennRewardsAmount);

      tx = attestationCenter.connect(operator1).requestPayment(operatorId1);
      await expect(tx).to.be.revertedWith("VennVaultL2: Operator claim is not allowed.");
    });

    it("should allow operators to get their vault share rewards by calling themselves when allowOperatorClaim is true", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operatorKeys,
        feePool,
        vennVaultL2,
        vennToken,
      } = await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;

      const operatorPrePaymentDetails = await getOperatorPaymentDetails(attestationCenter, operatorKeys);
      const {
        operatorWallet: operator1,
        paymentDetail: paymentDetail1,
        operatorId: operatorId1,
      } = operatorPrePaymentDetails[0];
      const requiredRewardsOperator1 = paymentDetail1.feeToClaim;
      const requiredRewards = paymentDetail1.feeToClaim;
      const requiredRewardsWithProtocolFee =
        (requiredRewards * BigInt(OTHENTIC_PROTOCOL_FEE_BASE)) / BigInt(OTHENTIC_LEFTOVER);
      const vennRewardsAmount = requiredRewardsWithProtocolFee * BigInt(1000);
      await vennToken.transfer(vennVaultL2, vennRewardsAmount);

      const operatorPreVennBalance = await vennToken.balanceOf(operator1);
      await attestationCenter.connect(operator1).requestPayment(operatorId1);
      const operatorPostPaymentDetails = await getOperatorPaymentDetails(attestationCenter, operatorKeys);

      const paymentDetail1Post = operatorPostPaymentDetails[0].paymentDetail;
      const operatorVaultTokenBalance = await vennVaultL2.balanceOf(operator1);
      // console.log(`Operator 1 vault token balance: ${formatEther(operatorVaultTokenBalance)}`);
      // console.log(`Operator 1 pre payment detail: ${formatEther(requiredRewardsOperator1)}`);
      // console.log(`Operator 1 post payment detail: ${formatEther(paymentDetail1Post.feeToClaim)}`);
      expect(operatorVaultTokenBalance).to.equal(requiredRewardsOperator1);
      expect(paymentDetail1Post.feeToClaim).to.equal(BigInt(0));

      const expectedVennRewards = (requiredRewardsOperator1 * vennRewardsAmount) / requiredRewardsWithProtocolFee;
      await vennVaultL2.connect(operator1).redeem(operatorVaultTokenBalance, operator1, operator1);
      const operatorPostVennBalance = await vennToken.balanceOf(operator1);
      const diffExpected = expectedVennRewards - (operatorPostVennBalance - operatorPreVennBalance);
      const absDiffExpected = diffExpected < 0n ? -diffExpected : diffExpected;
      const smallEnoughDiff = absDiffExpected < parseEther("0.0000001");
      // We expect the difference to be small enough to be negligible, due to vault rounding down
      expect(smallEnoughDiff).to.be.true;
    });
  });

  describe.skip("Gas test", () => {
    //Gas used first time: 617835
    //Gas used second time: 527595
    it("gas test for 3/3 operators", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let txResponse = await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount });
      const txReceipt = await txResponse.wait();
      console.log(`Gas used first time: ${txReceipt?.gasUsed}`);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
        chainId,
        true,
      );

      let txResponse2 = await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData2, depositData, { value: depositAmount });
      const txReceipt2 = await txResponse2.wait();
      console.log(`Gas used second time: ${txReceipt2?.gasUsed}`);
    });

    //Gas used first time: 2894111
    //Gas used second time: 2014604
    it("gas test for 50/50 operators", async () => {
      await reset();
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operatorKeys, feePool } =
        await loadFixture(deployLargeOperatorAmountFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], 0, metadataURI);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        chainId,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await protocolRegistry.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let txResponse = await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount });
      const txReceipt = await txResponse.wait();
      console.log(`Gas used first time: ${txReceipt?.gasUsed}`);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
        chainId,
        true,
      );

      let txResponse2 = await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData2, depositData, { value: depositAmount });
      const txReceipt2 = await txResponse2.wait();
      console.log(`Gas used second time: ${txReceipt2?.gasUsed}`);
    });
  });

  describe("Required Operators (Othentic part)", () => {
    const requiredOperatorIds = [1, 2, 3];

    describe("taskDefinitionId = 0", () => {
      const taskDefinitionId = 0;

      it("should register protocol with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter } = await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy);
        expect(_requiredOperatorIds).to.deep.equal([]);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operatorKeys, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          operatorKeys,
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx).to.not.be.reverted;
      });

      it("should revert basic protected deposit with missing required operator", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operatorKeys, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [3]);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        await expect(tx).to.be.reverted;
      });

      it("should revert basic protected deposit with < 1/3 operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operatorKeys, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx)
          .to.be.revertedWithCustomError(sampleVennConsumer, `ProxyCallFailed(bytes)`)
          .withArgs("0xcabeb655"); // InsufficientVotingPower
      });
    });

    describe("taskDefinitionId = 1", async () => {
      it("should register protocol with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, avsGovernanceMultisig } =
          await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy);
        expect(_requiredOperatorIds).to.deep.equal([]);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operatorKeys,
          sampleVennConsumer,
        } = await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          operatorKeys,
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx).to.not.be.reverted;
      });

      it("should revert basic protected deposit with missing required operator", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operatorKeys,
          sampleVennConsumer,
        } = await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        await expect(tx).to.be.reverted;
      });

      it("should revert basic protected deposit with < 1/3 operators", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operatorKeys,
          sampleVennConsumer,
        } = await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await protocolRegistry.registerProtocol(approvedCallsPolicy, [], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx)
          .to.be.revertedWithCustomError(sampleVennConsumer, `ProxyCallFailed(bytes)`)
          .withArgs("0xcabeb655"); // InsufficientVotingPower
      });
    });
  });

  describe("Required Operators (Veto part)", () => {
    const requiredOperatorIds = [1, 2, 3];

    it("should revert if operator is not active", async () => {
      const { protocolRegistry, approvedCallsPolicy } = await loadFixture(deployBaseFixture);

      await expect(protocolRegistry.registerProtocol(approvedCallsPolicy, [100], 0, metadataURI)).to.be.revertedWith(
        "ProtocolRegistry: Operator not active.",
      );
    });

    describe("taskDefinitionId = 0", () => {
      const taskDefinitionId = 0;

      it("should not revert if operator exists with taskDefinitionId 0", async () => {
        const { protocolRegistry, approvedCallsPolicy } = await loadFixture(deployBaseFixture);

        await expect(protocolRegistry.registerProtocol(approvedCallsPolicy, [1], taskDefinitionId, metadataURI)).to.not
          .be.reverted;
      });

      it("should register protocol with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter } = await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operatorKeys, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          operatorKeys,
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx).to.not.be.reverted;
      });

      it("should revert basic protected deposit with missing required operator", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operatorKeys, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [3]);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, [3], taskDefinitionId, metadataURI);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        await expect(tx).to.be.reverted;
      });

      it("should revert basic protected deposit with 2/3 operators, but not all veto operators voted", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operatorKeys, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0], operatorKeys[1]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        const expectedErrorBytes = getErrorBytes("VennAvsLogic: Missing operator id.");
        await expect(tx)
          .to.be.revertedWithCustomError(sampleVennConsumer, `ProxyCallFailed(bytes)`)
          .withArgs(expectedErrorBytes);
      });
    });

    describe("taskDefinitionId = 1", async () => {
      it("should revert if operator is not in the subnet", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, avsGovernanceMultisig } =
          await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: [],
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await expect(
          protocolRegistry.registerProtocol(approvedCallsPolicy, [1], taskDefinitionId, metadataURI),
        ).to.be.revertedWith("ProtocolRegistry: Missing operator id.");
      });

      it("should register protocol with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, avsGovernanceMultisig } =
          await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operatorKeys,
          sampleVennConsumer,
        } = await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          operatorKeys,
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx).to.not.be.reverted;
      });

      it("should revert basic protected deposit with missing required operator", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operatorKeys,
          sampleVennConsumer,
        } = await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        await expect(tx).to.be.reverted;
      });

      it("should revert basic protected deposit with 2/3 operators, but not all veto operators voted", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operatorKeys,
          sampleVennConsumer,
        } = await loadFixture(deployBaseFixture);

        const taskDefinitionName = "subnet deposit";
        const taskDefinitionParams = {
          blockExpiry: ethers.MaxUint256,
          baseRewardFeeForAttesters: 0,
          baseRewardFeeForPerformer: 0,
          baseRewardFeeForAggregator: 0,
          disputePeriodBlocks: 0,
          minimumVotingPower: 0,
          restrictedOperatorIndexes: requiredOperatorIds,
        };

        const taskDefinitionId = await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

        await attestationCenter
          .connect(avsGovernanceMultisig)
          .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

        await protocolRegistry.registerProtocol(
          approvedCallsPolicy,
          requiredOperatorIds,
          taskDefinitionId,
          metadataURI,
        );
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformerPrivateKey = operatorKeys[0];

        const depositCallHash = await createDepositCallHash(
          sampleVennConsumer.interface,
          sampleVennConsumer,
          user1,
          user1,
          depositAmount,
        );

        const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, user1);
        const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
        const submitTaskData = await getSubmitTaskData(
          [operatorKeys[0], operatorKeys[1]],
          taskPerformerPrivateKey,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),
          chainId,
          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        const expectedErrorBytes = getErrorBytes("VennAvsLogic: Missing operator id.");
        await expect(tx)
          .to.be.revertedWithCustomError(sampleVennConsumer, `ProxyCallFailed(bytes)`)
          .withArgs(expectedErrorBytes);
      });
    });
  });
});
