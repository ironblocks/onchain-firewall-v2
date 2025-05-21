import {
  deployAttestationCenter,
  deployFeePool,
  deployOBLS,
  deployPolicy,
  deployProtocolRegistry,
  deployVennAvsLogic,
  deployVennFeeCalculator,
} from "@/test/fixtures";
import { defaultProtocolRegistryInitData } from "@/test/unit/ProtocolRegisrty.test";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

const TASK_DEFINITION_ID = 1;
const PROTOCOL_FEE = parseEther("0.001");

async function deployFixture() {
  const [ADMIN, NON_ADMIN, VENN_FEE_RECIPIENT] = await ethers.getSigners();

  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);
  const { protocolRegistry } = await deployProtocolRegistry(
    ADMIN,
    defaultProtocolRegistryInitData(attestationCenter, VENN_FEE_RECIPIENT),
  );
  const { vennFeeCalculator } = await deployVennFeeCalculator(ZeroAddress, ADMIN);
  const { feePool } = await deployFeePool(protocolRegistry, vennFeeCalculator, ADMIN);
  await vennFeeCalculator.grantRole(await vennFeeCalculator.FEE_POOL_ROLE(), feePool);

  const { vennAvsLogic } = await deployVennAvsLogic(attestationCenter, feePool, protocolRegistry, ADMIN);

  const { policy } = await deployPolicy();
  await attestationCenter.setNumOfTaskDefinitions(TASK_DEFINITION_ID + 1);
  await protocolRegistry.registerProtocol(policy, "");
  await protocolRegistry.subscribeSubnet(policy, TASK_DEFINITION_ID, []);
  await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, PROTOCOL_FEE);

  await feePool.grantRole(await feePool.FEE_CLAIMER_ROLE(), await vennAvsLogic.getAddress());

  return { ADMIN, NON_ADMIN, attestationCenter, VENN_FEE_RECIPIENT, vennAvsLogic, feePool, protocolRegistry, policy };
}

describe("VennAvsLogic", () => {
  describe("#constructor", () => {
    it("should set the data", async () => {
      const { vennAvsLogic, feePool, protocolRegistry } = await loadFixture(deployFixture);

      expect(await vennAvsLogic.feePool()).to.equal(feePool);
      expect(await vennAvsLogic.protocolRegistry()).to.equal(protocolRegistry);
    });
  });

  describe("#beforeTaskSubmission", () => {
    it("should claim the fee from the policy", async () => {
      const { vennAvsLogic, ADMIN, policy, feePool } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      await feePool.depositNativeForPolicy(policy, { value: PROTOCOL_FEE });

      const taskInfo = {
        proofOfTask: "0x",
        data: await policy.getAddress(),
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const tx = await vennAvsLogic.beforeTaskSubmission(taskInfo, true, "0x", [0, 0], [0]);
      await expect(tx).to.emit(feePool, "NativeFeeClaimed").withArgs(policy, PROTOCOL_FEE);
    });

    it("should claim the fee from the policy with required operators", async () => {
      const { vennAvsLogic, attestationCenter, protocolRegistry, ADMIN, policy, feePool } =
        await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(TASK_DEFINITION_ID, [1, 2, 3]);
      await protocolRegistry.subscribeSubnet(policy, TASK_DEFINITION_ID, [1, 2, 3]);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      await feePool.depositNativeForPolicy(policy, { value: PROTOCOL_FEE });

      const taskInfo = {
        proofOfTask: "0x",
        data: await policy.getAddress(),
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const tx = await vennAvsLogic.beforeTaskSubmission(taskInfo, true, "0x", [0, 0], [1, 2, 3]);
      await expect(tx).to.emit(feePool, "NativeFeeClaimed").withArgs(policy, PROTOCOL_FEE);
    });

    it("should revert if the caller is not the attestation center", async () => {
      const { vennAvsLogic, NON_ADMIN } = await loadFixture(deployFixture);

      const taskInfo = {
        proofOfTask: "0x",
        data: "0x",
        taskPerformer: await NON_ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const reason = "AvsLogicBase: Only the attestation center can call this function.";

      await expect(
        vennAvsLogic.connect(NON_ADMIN).beforeTaskSubmission(taskInfo, true, "0x", [0, 0], [0]),
      ).to.be.revertedWith(reason);
    });

    it("should revert if the data is too short", async () => {
      const { vennAvsLogic, ADMIN } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      const taskInfo = {
        proofOfTask: "0x",
        data: "0x",
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const reason = "VennAvsLogic: Invalid policy address";

      await expect(vennAvsLogic.beforeTaskSubmission(taskInfo, true, "0x", [0, 0], [0])).to.be.revertedWith(reason);
    });

    it("should revert if the task definition id does not match", async () => {
      const { vennAvsLogic, policy, ADMIN } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      const taskInfo = {
        proofOfTask: "0x",
        data: await policy.getAddress(),
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID + 1,
      };

      const reason = "VennAvsLogic: Task definition id mismatch.";

      await expect(vennAvsLogic.beforeTaskSubmission(taskInfo, true, "0x", [0, 0], [0])).to.be.revertedWith(reason);
    });

    it("should revert if the required operator is not present", async () => {
      const { vennAvsLogic, ADMIN, policy, protocolRegistry, attestationCenter } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      await attestationCenter.setTaskDefinitionRestrictedOperators(TASK_DEFINITION_ID, [1, 2, 3]);
      await protocolRegistry.subscribeSubnet(policy, TASK_DEFINITION_ID, [1, 2, 3]);

      const taskInfo = {
        proofOfTask: "0x",
        data: await policy.getAddress(),
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const reason = "VennAvsLogic: Missing operator id.";

      await expect(vennAvsLogic.beforeTaskSubmission(taskInfo, true, "0x", [0, 0], [1, 2])).to.be.revertedWith(reason);
    });
  });

  describe("#afterTaskSubmission", () => {
    it("should call the policy", async () => {
      const { vennAvsLogic, ADMIN, policy } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      const data = `${await policy.getAddress()}${policy.interface.encodeFunctionData("performTask", ["0x12345678"]).substring(2)}`;

      const taskInfo = {
        proofOfTask: "",
        data: data,
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const tx = await vennAvsLogic.afterTaskSubmission(taskInfo, true, "0x", [0, 0], []);
      await expect(tx).to.emit(policy, "TaskPerformed").withArgs(vennAvsLogic, "0x12345678");
    });

    it("should do nothing if is not approved", async () => {
      const { vennAvsLogic, ADMIN, policy } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      const taskInfo = {
        proofOfTask: "0x",
        data: await policy.getAddress(),
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const tx = await vennAvsLogic.afterTaskSubmission(taskInfo, false, "0x", [0, 0], []);
      await expect(tx).to.not.emit(policy, "TaskPerformed");
    });

    it("should revert if the caller is not the attestation center", async () => {
      const { vennAvsLogic, NON_ADMIN } = await loadFixture(deployFixture);

      const taskInfo = {
        proofOfTask: "0x",
        data: "0x",
        taskPerformer: await NON_ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const reason = "AvsLogicBase: Only the attestation center can call this function.";

      await expect(
        vennAvsLogic.connect(NON_ADMIN).afterTaskSubmission(taskInfo, true, "0x", [0, 0], []),
      ).to.be.revertedWith(reason);
    });

    it("should revert if the data is too short", async () => {
      const { vennAvsLogic, ADMIN } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      const taskInfo = {
        proofOfTask: "0x",
        data: "0x",
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const reason = "VennAvsLogic: Invalid policy address";

      await expect(vennAvsLogic.afterTaskSubmission(taskInfo, true, "0x", [0, 0], [])).to.be.revertedWith(reason);
    });

    it("should revert if policy call fails", async () => {
      const { vennAvsLogic, ADMIN, policy } = await loadFixture(deployFixture);

      await vennAvsLogic.setAttestationCenter(ADMIN);

      const data = `${await policy.getAddress()}4879325743275439`;

      const taskInfo = {
        proofOfTask: "0x",
        data: data,
        taskPerformer: await ADMIN.getAddress(),
        taskDefinitionId: TASK_DEFINITION_ID,
      };

      const reason = "VennAvsLogic: Call to policy failed.";

      await expect(vennAvsLogic.afterTaskSubmission(taskInfo, true, "0x", [0, 0], [])).to.be.revertedWith(reason);
    });
  });

  describe("#setFeePool", () => {
    it("should set the fee pool", async () => {
      const { vennAvsLogic, NON_ADMIN } = await loadFixture(deployFixture);

      const tx = await vennAvsLogic.setFeePool(NON_ADMIN);
      await expect(tx).to.emit(vennAvsLogic, "FeePoolUpdated").withArgs(NON_ADMIN);

      expect(await vennAvsLogic.feePool()).to.equal(await NON_ADMIN.getAddress());
    });

    it("should revert if the caller is not the admin", async () => {
      const { vennAvsLogic, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennAvsLogic.ADMIN_ROLE()}`;

      await expect(vennAvsLogic.connect(NON_ADMIN).setFeePool(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });

  describe("#setProtocolRegistry", () => {
    it("should set the protocol registry", async () => {
      const { vennAvsLogic, NON_ADMIN } = await loadFixture(deployFixture);

      const tx = await vennAvsLogic.setProtocolRegistry(NON_ADMIN);
      await expect(tx).to.emit(vennAvsLogic, "ProtocolRegistryUpdated").withArgs(NON_ADMIN);

      expect(await vennAvsLogic.protocolRegistry()).to.equal(await NON_ADMIN.getAddress());
    });

    it("should revert if the caller is not the admin", async () => {
      const { vennAvsLogic, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennAvsLogic.ADMIN_ROLE()}`;

      await expect(vennAvsLogic.connect(NON_ADMIN).setProtocolRegistry(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });
});
