import { SampleVennConsumer__factory } from "@/generated-types/ethers";
import { execSafeTx, getSafeTxSignatures } from "@/scripts/gnosis";
import { getFeePercentage } from "@/scripts/helpers";
import { getAddresses } from "@/scripts/addresses";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { clearSnapshots, loadFixture, mine, reset } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress, parseEther } from "ethers";
import { ethers } from "hardhat";
import {
  buildAndCreateDepositCallHash,
  createDepositCallHash,
  createMulticallCallHash,
  encodeApprovedCalls,
  getErrorBytes,
  getOperatorPaymentDetails,
  getProofOfTask,
  getSubmitTaskData,
  getSubmitTasksData,
  resetForking,
  setForking,
} from "../helpers";
import { OperatorType } from "../unit/othentic/VennFeeCalculator.test";
import {
  deployBaseFixture,
  deployLargeOperatorAmountFixture,
  deployMulticallFixture,
  deployGnosisSafeViaFactory,
} from "./fixtures";

const OTHENTIC_PROTOCOL_FEE = 100_000; // TODO: figure this out dynamically
const OTHENTIC_PROTOCOL_FEE_BASE = 1_000_000;
const OTHENTIC_LEFTOVER = OTHENTIC_PROTOCOL_FEE_BASE - OTHENTIC_PROTOCOL_FEE;

describe("integration", () => {
  const depositData = SampleVennConsumer__factory.createInterface().encodeFunctionData("deposit");
  const metadataURI = "https://example.com/metadata";

  const depositAmount = ethers.parseEther("1");

  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let chainId: number;

  before(async () => {
    await clearSnapshots();
    await setForking();

    deployer = (await ethers.getSigners())[0];
    user1 = (await ethers.getSigners())[1];
    chainId = Number((await ethers.provider.getNetwork()).chainId);
  });

  after(async () => {
    await resetForking();
  });

  describe("VennGuard", () => {
    const guardStorageSlot = "0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8";
    const ifaceMultisend = new ethers.Interface(["function multiSend(bytes)"]);

    it("Should only allow configured safe to add VennGuard", async () => {
      const { attestationCenterProxy } = await loadFixture(deployBaseFixture);

      const { gnosisSafe } = await deployGnosisSafeViaFactory(deployer);
      const VennGuardFactory = await ethers.getContractFactory("VennGuard");
      const vennGuard = await VennGuardFactory.deploy(
        attestationCenterProxy,
        (await getAddresses()).multisendCallOnlyAddress,
        gnosisSafe,
        1,
      );
      const vennGuardMisconfigured = await VennGuardFactory.deploy(
        attestationCenterProxy,
        (await getAddresses()).multisendCallOnlyAddress,
        (await getAddresses()).multisendCallOnlyAddress,
        1,
      );
      const invalidSetGuardTx = execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [await vennGuardMisconfigured.getAddress()]),
      });
      await expect(invalidSetGuardTx).to.be.revertedWith("GS013");
      let guardStorageSlotValue = await ethers.provider.getStorage(await gnosisSafe.getAddress(), guardStorageSlot);
      expect(guardStorageSlotValue).to.equal(ethers.ZeroHash);
      await execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [await vennGuard.getAddress()]),
      });
      guardStorageSlotValue = await ethers.provider.getStorage(await gnosisSafe.getAddress(), guardStorageSlot);
      const guardStorageAddress = `0x${guardStorageSlotValue.slice(26).toLowerCase()}`;
      expect(guardStorageAddress).to.equal((await vennGuard.getAddress()).toLowerCase());
    });

    it("Should only misconfigured safe to manually disable VennGuard", async () => {
      const { attestationCenterProxy } = await loadFixture(deployBaseFixture);
      const singletonAddressWithoutGuardCheck = "0xd9db270c1b5e3bd161e8c8503c55ceabee709552";

      const { gnosisSafe } = await deployGnosisSafeViaFactory(deployer, undefined, singletonAddressWithoutGuardCheck);
      const VennGuardFactory = await ethers.getContractFactory("VennGuard");
      const vennGuardMisconfigured = await VennGuardFactory.deploy(
        attestationCenterProxy,
        (await getAddresses()).multisendCallOnlyAddress,
        (await getAddresses()).multisendCallOnlyAddress,
        1,
      );
      await execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [await vennGuardMisconfigured.getAddress()]),
      });
      const guardStorageSlotValue = await ethers.provider.getStorage(await gnosisSafe.getAddress(), guardStorageSlot);
      const guardStorageAddress = `0x${guardStorageSlotValue.slice(26).toLowerCase()}`;
      expect(guardStorageAddress).to.equal((await vennGuardMisconfigured.getAddress()).toLowerCase());

      let removeGuardTx = execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      await expect(removeGuardTx).to.be.revertedWith("VennGuard: only safe can call");
      const removeGuardSignatures = await getSafeTxSignatures(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      let bypassGuardTx = vennGuardMisconfigured.bypassGuard(
        gnosisSafe,
        0,
        gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
        0,
        0,
        0,
        0,
        ZeroAddress,
        ZeroAddress,
        removeGuardSignatures,
      );
      // reverts because the safe is configured incorrectly, cannot read nonce
      await expect(bypassGuardTx).to.be.reverted;
      await vennGuardMisconfigured.grantRole(await vennGuardMisconfigured.ADMIN_ROLE(), await deployer.getAddress());
      await vennGuardMisconfigured.setEnabled(false);
      removeGuardTx = execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      await expect(removeGuardTx).to.not.be.reverted;
    });

    it("should be able to bypass the guard after the bypass guard wait time has passed", async () => {
      const { attestationCenterProxy, protocolRegistry, vennAvsLogic } = await loadFixture(deployBaseFixture);

      const { gnosisSafe } = await deployGnosisSafeViaFactory(deployer);
      const VennGuardFactory = await ethers.getContractFactory("VennGuard");
      const vennGuard = await VennGuardFactory.deploy(
        attestationCenterProxy,
        (await getAddresses()).multisendCallOnlyAddress,
        gnosisSafe,
        5,
      );
      await vennGuard.grantRole(await protocolRegistry.ADMIN_ROLE(), await deployer.getAddress());
      await vennGuard.grantRole(await vennGuard.SIGNER_ROLE(), await vennAvsLogic.getAddress());
      await execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [await vennGuard.getAddress()]),
      });
      await protocolRegistry.registerProtocol(vennGuard, metadataURI);
      await protocolRegistry.subscribeSubnet(vennGuard, 0, []);

      const removeGuardTx = execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      await expect(removeGuardTx).to.be.reverted;
      const removeGuardSignatures = await getSafeTxSignatures(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      await vennGuard.bypassGuard(
        gnosisSafe,
        0,
        gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
        0,
        0,
        0,
        0,
        ZeroAddress,
        ZeroAddress,
        removeGuardSignatures,
      );
      const earlyBypassRemoveGuardTx = execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      await expect(earlyBypassRemoveGuardTx).to.be.revertedWith("VennGuard: Only multisend contract can be called.");
      await mine(10);
      const bypassRemoveGuardTx = execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [ZeroAddress]),
      });
      await expect(bypassRemoveGuardTx).to.not.be.reverted;
    });

    it("should be able to approve and execute an approved safe tx", async () => {
      const { attestationCenter, attestationCenterProxy, protocolRegistry, operators, feePool, vennAvsLogic } =
        await loadFixture(deployBaseFixture);

      const { gnosisSafe } = await deployGnosisSafeViaFactory(deployer);
      const VennGuardFactory = await ethers.getContractFactory("VennGuard");
      const vennGuard = await VennGuardFactory.deploy(
        attestationCenterProxy,
        (await getAddresses()).multisendCallOnlyAddress,
        gnosisSafe,
        1,
      );
      await vennGuard.grantRole(await protocolRegistry.ADMIN_ROLE(), await deployer.getAddress());
      await vennGuard.grantRole(await vennGuard.SIGNER_ROLE(), await vennAvsLogic.getAddress());
      await execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [await vennGuard.getAddress()]),
      });

      await protocolRegistry.registerProtocol(vennGuard, metadataURI);
      await protocolRegistry.subscribeSubnet(vennGuard, 0, []);
      await feePool.depositNativeForPolicy(vennGuard, {
        value: ethers.parseEther("0.01"),
      });
      const taskPerformer = operators[0];

      const basicTransferMetaTxHash = ethers.solidityPackedKeccak256(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, await user1.getAddress(), 0, 0, "0x"],
      );
      const encodedApproveMetaTx = vennGuard.interface.encodeFunctionData("approveMetaTxHash", [
        basicTransferMetaTxHash,
        ethers.MaxUint256,
        0,
      ]);
      const encodedData = `${await vennGuard.getAddress()}${encodedApproveMetaTx.substring(2)}`;

      const proofOfTask = await getProofOfTask(deployer, vennGuard);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );

      const multisendTxData = ethers.solidityPacked(
        ["uint8", "address", "uint256", "uint256", "bytes", "uint8", "address", "uint256", "uint256", "bytes"],
        [
          0,
          await attestationCenterProxy.getAddress(),
          0,
          (submitTaskData.length - 2) / 2,
          submitTaskData,
          0,
          await user1.getAddress(),
          0,
          0,
          "0x",
        ],
      );
      const encodedMultisendTx = ifaceMultisend.encodeFunctionData("multiSend", [multisendTxData]);

      const execTx = execSafeTx(gnosisSafe, {
        to: (await getAddresses()).multisendCallOnlyAddress,
        data: encodedMultisendTx,
        operation: 1,
      });

      await expect(execTx).to.not.be.reverted;
    });

    it("should not be able to execute a non approved safe tx", async () => {
      const { attestationCenter, attestationCenterProxy, protocolRegistry, operators, feePool, vennAvsLogic } =
        await loadFixture(deployBaseFixture);

      const { gnosisSafe } = await deployGnosisSafeViaFactory(deployer);
      const VennGuardFactory = await ethers.getContractFactory("VennGuard");
      const vennGuard = await VennGuardFactory.deploy(
        attestationCenterProxy,
        (await getAddresses()).multisendCallOnlyAddress,
        gnosisSafe,
        1,
      );
      await vennGuard.grantRole(await protocolRegistry.ADMIN_ROLE(), await deployer.getAddress());
      await vennGuard.grantRole(await vennGuard.SIGNER_ROLE(), await vennAvsLogic.getAddress());
      await execSafeTx(gnosisSafe, {
        to: await gnosisSafe.getAddress(),
        data: gnosisSafe.interface.encodeFunctionData("setGuard", [await vennGuard.getAddress()]),
      });

      await protocolRegistry.registerProtocol(vennGuard, metadataURI);
      await protocolRegistry.subscribeSubnet(vennGuard, 0, []);
      await feePool.depositNativeForPolicy(vennGuard, {
        value: ethers.parseEther("0.01"),
      });
      const taskPerformer = operators[0];

      const basicTransferMetaTxHash = ethers.solidityPackedKeccak256(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, await user1.getAddress(), 0, 0, "0x"],
      );
      const encodedApproveMetaTx = vennGuard.interface.encodeFunctionData("approveMetaTxHash", [
        basicTransferMetaTxHash,
        ethers.MaxUint256,
        0,
      ]);
      const encodedData = `${await vennGuard.getAddress()}${encodedApproveMetaTx.substring(2)}`;

      const proofOfTask = await getProofOfTask(deployer, vennGuard);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );

      const multisendTxData = ethers.solidityPacked(
        ["uint8", "address", "uint256", "uint256", "bytes", "uint8", "address", "uint256", "uint256", "bytes"],
        // note that we changed the user1 address to the deployer address, while only the former was approved
        [
          0,
          await attestationCenterProxy.getAddress(),
          0,
          (submitTaskData.length - 2) / 2,
          submitTaskData,
          0,
          await deployer.getAddress(),
          0,
          0,
          "0x",
        ],
      );
      const encodedMultisendTx = ifaceMultisend.encodeFunctionData("multiSend", [multisendTxData]);

      const execTx = execSafeTx(gnosisSafe, {
        to: (await getAddresses()).multisendCallOnlyAddress,
        data: encodedMultisendTx,
        operation: 1,
      });

      await expect(execTx).to.be.revertedWith("VennGuard: Invalid meta tx hash.");
    });
  });

  describe("Fees", () => {
    it("should allow protocol to prepay fees for users", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operators, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];
      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operators, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
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
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operators,
        feePool,
        vennFeeCalculator,
      } = await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
      await vennFeeCalculator.setTaskDefinitionFee(0, feeAmount2);

      const encodedData2 = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask2,
        encodedData2,
        0,
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
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operators, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operators, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
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
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operators,
        feePool,
        vennFeeCalculator,
      } = await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
      await vennFeeCalculator.setTaskDefinitionFee(0, feeAmount2);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask2,
        encodedData2,
        0,
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
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operators, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;
    });

    it("should pass basic protected deposit with majority two of three operators approving, no subnet (taskDefinitionId = 0)", async () => {
      const { attestationCenter, sampleVennConsumer, protocolRegistry, approvedCallsPolicy, operators, feePool } =
        await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      const taskPerformer = operators[0];
      const activeoperators = [operators[0], operators[1]];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        activeoperators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;
    });

    it("should revert basic protected deposit with minority one of three operators approving, no subnet (taskDefinitionId = 0)", async () => {
      const { attestationCenter, sampleVennConsumer, approvedCallsPolicy, operators } =
        await loadFixture(deployBaseFixture);

      const taskPerformer = operators[0];
      const activeoperators = [operators[0]];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        activeoperators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
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
        operators,
      } = await loadFixture(deployBaseFixture);

      const activeoperators = [operators[0], operators[1]];

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

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, newTaskDefinitionId, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        activeoperators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        Number(newTaskDefinitionId),
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
        operators,
        multicallVennConsumer,
        approvedCallsPolicy2,
        protocolRegistry,
        feePool,
      } = await loadFixture(deployMulticallFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);
      await protocolRegistry.registerProtocol(approvedCallsPolicy2, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy2, 0, []);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      await feePool.depositNativeForPolicy(approvedCallsPolicy2, {
        value: ethers.parseEther("0.01"),
      });

      const requiredNativeFee = await feePool.getTotalRequiredNativeAmountForPolicies(
        [approvedCallsPolicy, approvedCallsPolicy2],
        [0, 0],
      );
      expect(requiredNativeFee).to.equal(ethers.parseEther("0"));

      const taskPerformer = operators[0];

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
        operators,
        taskPerformer,
        attestationCenter,
        [proofOfTask, proofOfTask2],
        [encodedData1, encodedData2],
        [0, 0],
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
        operators,
        multicallVennConsumer,
        approvedCallsPolicy2,
        protocolRegistry,
        feePool,
      } = await loadFixture(deployMulticallFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);
      await protocolRegistry.registerProtocol(approvedCallsPolicy2, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy2, 0, []);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      await feePool.depositNativeForPolicy(approvedCallsPolicy2, {
        value: ethers.parseEther("0.005"),
      });

      const requiredNativeFee = await feePool.getTotalRequiredNativeAmountForPolicies(
        [approvedCallsPolicy, approvedCallsPolicy2],
        [0, 0],
      );
      expect(requiredNativeFee).to.equal(ethers.parseEther("0.005"));

      const taskPerformer = operators[0];

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
        operators,
        taskPerformer,
        attestationCenter,
        [proofOfTask, proofOfTask2],
        [encodedData1, encodedData2],
        [0, 0],

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
        operators,
        multicallVennConsumer,
        approvedCallsPolicy2,
        protocolRegistry,
        feePool,
      } = await loadFixture(deployMulticallFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);
      await protocolRegistry.registerProtocol(approvedCallsPolicy2, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy2, 0, []);
      await feePool.depositNativeForPolicy(approvedCallsPolicy, {
        value: ethers.parseEther("0.01"),
      });
      await feePool.depositNativeForPolicy(approvedCallsPolicy2, {
        value: ethers.parseEther("0.01"),
      });

      const multicallFactory = await ethers.getContractFactory("Multicall");
      const multicall = await multicallFactory.deploy();

      const taskPerformer = operators[0];

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
        operators,
        taskPerformer,
        attestationCenter,
        [proofOfTask, proofOfTask2],
        [encodedData1, encodedData2],
        [0, 0],

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

      await vennFeeCalculator.setTaskDefinitionFee(0, ethers.parseEther("0"));

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

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
        isApproved: true,
      };

      const res = await vennFeeCalculator.calculateBaseRewardFees(feeCalculatorData);

      expect(res.baseRewardFeeForAttesters).to.equal(0);
      expect(res.baseRewardFeeForAggregator).to.equal(0);
      expect(res.baseRewardFeeForPerformer).to.equal(0);
    });
  });

  describe("Operator rewards", () => {
    it("should allow operators to get their vault share rewards by deployer minting and batch payment when allowOperatorClaim is false", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operators,
        feePool,
        vennVaultL2,
        l2AvsTreasury,
        vennToken,
        vennFeeCalculator,
      } = await loadFixture(deployBaseFixture);

      await vennVaultL2.setAllowOperatorClaim(false);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await vennFeeCalculator.setTaskDefinitionFee(0, feeAmount);
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        0,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [getFeePercentage(50), getFeePercentage(20), getFeePercentage(30)],
      );
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let tx = sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
      await expect(tx).to.not.be.reverted;

      const operatorPrePaymentDetails = await getOperatorPaymentDetails(attestationCenter, operators);
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
      const operatorPostPaymentDetails = await getOperatorPaymentDetails(attestationCenter, operators);

      const vennRewardsAmount = requiredRewardsWithProtocolFee * BigInt(1000);
      await vennToken.transfer(vennVaultL2, vennRewardsAmount);
      for (let i = 0; i < operatorPostPaymentDetails.length; i++) {
        const operatorPostPaymentDetail = operatorPostPaymentDetails[i];
        const operatorPrePaymentDetail = operatorPrePaymentDetails[i];
        const operatorFeeToClaim = operatorPrePaymentDetail.paymentDetail.feeToClaim;
        const operatorVaultTokenBalance = await vennVaultL2.balanceOf(operatorPostPaymentDetail.operator);
        expect(operatorVaultTokenBalance).to.equal(operatorFeeToClaim);
        expect(operatorPostPaymentDetail.paymentDetail.feeToClaim).to.equal(BigInt(0));
        const operatorPreVennBalance = await vennToken.balanceOf(operatorPostPaymentDetail.operator);
        const expectedVennRewards = (operatorFeeToClaim * vennRewardsAmount) / requiredRewardsWithProtocolFee;
        await vennVaultL2
          .connect(operatorPostPaymentDetail.operator)
          .redeem(operatorVaultTokenBalance, operatorPostPaymentDetail.operator, operatorPostPaymentDetail.operator);
        const operatorPostVennBalance = await vennToken.balanceOf(operatorPostPaymentDetail.operator);
        const diffExpected = expectedVennRewards - (operatorPostVennBalance - operatorPreVennBalance);
        const absDiffExpected = diffExpected < 0n ? -diffExpected : diffExpected;
        const smallEnoughDiff = absDiffExpected < parseEther("0.0000001");
        // We expect the difference to be small enough to be negligible, due to vault rounding down
        expect(smallEnoughDiff).to.be.true;
      }
    });
  });

  describe.skip("Gas test", () => {
    //Gas used first time: 617835
    //Gas used second time: 527595
    it("gas test for 3/3 operators", async () => {
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operators,
        feePool,
        vennFeeCalculator,
      } = await loadFixture(deployBaseFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await vennFeeCalculator.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let txResponse = await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount });
      const txReceipt = await txResponse.wait();
      console.log(`Gas used first time: ${txReceipt?.gasUsed}`);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
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
      const {
        attestationCenter,
        sampleVennConsumer,
        protocolRegistry,
        approvedCallsPolicy,
        operators,
        feePool,
        vennFeeCalculator,
      } = await loadFixture(deployLargeOperatorAmountFixture);

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, []);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        sampleVennConsumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        0,
        true,
      );
      const feeAmount = ethers.parseEther("0.01");
      await vennFeeCalculator.setTaskDefinitionFee(0, feeAmount);
      await feePool.connect(deployer).depositNativeForPolicy(approvedCallsPolicy, { value: feeAmount * BigInt(2) });

      let txResponse = await sampleVennConsumer
        .connect(user1)
        .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount });
      const txReceipt = await txResponse.wait();
      console.log(`Gas used first time: ${txReceipt?.gasUsed}`);

      const proofOfTask2 = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData2 = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask2,
        encodedData,
        0,
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
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy, taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal([]);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operators, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          operators,
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,

          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx).to.not.be.reverted;
      });

      it("should revert basic protected deposit with missing required operator", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operators, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [3]);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,

          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        await expect(tx).to.be.reverted;
      });

      it("should revert basic protected deposit with < 1/3 operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operators, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,

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
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy, taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal([]);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operators,
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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          operators,
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),

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
          operators,
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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),

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
          operators,
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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),

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

      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);

      await expect(protocolRegistry.subscribeSubnet(approvedCallsPolicy, 0, [100])).to.be.revertedWith(
        "ProtocolRegistry: Operator not active.",
      );
    });

    describe("taskDefinitionId = 0", () => {
      const taskDefinitionId = 0;

      it("should not revert if operator exists with taskDefinitionId 0", async () => {
        const { protocolRegistry, approvedCallsPolicy } = await loadFixture(deployBaseFixture);

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);

        await expect(protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, [1])).to.not.be.reverted;
      });

      it("should register protocol with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter } = await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, requiredOperatorIds);

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy, taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operators, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          operators,
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,

          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });
        await expect(tx).to.not.be.reverted;
      });

      it("should revert basic protected deposit with missing required operator", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operators, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [3]);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, []);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,

          true,
        );

        let tx = sampleVennConsumer
          .connect(user1)
          .safeFunctionCall(0, submitTaskData, depositData, { value: depositAmount, gasLimit: 1000000 });

        await expect(tx).to.be.reverted;
      });

      it("should revert basic protected deposit with 2/3 operators, but not all veto operators voted", async () => {
        const { protocolRegistry, approvedCallsPolicy, attestationCenter, sampleVennConsumer, operators, feePool } =
          await loadFixture(deployBaseFixture);

        await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, requiredOperatorIds);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0], operators[1]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          taskDefinitionId,

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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);

        await expect(protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, [1])).to.be.revertedWith(
          "ProtocolRegistry: Missing operator id.",
        );
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
        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, requiredOperatorIds);

        let _requiredOperatorIds = await attestationCenter.getTaskDefinitionRestrictedOperators(taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);

        _requiredOperatorIds = await protocolRegistry.getRequiredOperatorIds(approvedCallsPolicy, taskDefinitionId);
        expect(_requiredOperatorIds).to.deep.equal(requiredOperatorIds);
      });

      it("should pass basic protected deposit with required operators", async () => {
        const {
          protocolRegistry,
          approvedCallsPolicy,
          attestationCenter,
          avsGovernanceMultisig,
          feePool,
          operators,
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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, requiredOperatorIds);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          operators,
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),

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
          operators,
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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, requiredOperatorIds);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),

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
          operators,
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

        await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
        await protocolRegistry.subscribeSubnet(approvedCallsPolicy, taskDefinitionId, requiredOperatorIds);
        await feePool.depositNativeForPolicy(approvedCallsPolicy, {
          value: ethers.parseEther("0.01"),
        });

        const taskPerformer = operators[0];

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
          [operators[0], operators[1]],
          taskPerformer,
          attestationCenter,
          proofOfTask,
          encodedData,
          Number(taskDefinitionId),

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
