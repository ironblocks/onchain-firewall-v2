import {
  IAccessControl__factory,
  IApprovedCallsPolicy__factory,
  IAttestationCenter,
  IFirewall__factory,
} from "@/generated-types/ethers";
import {
  deployAttestationCenter,
  deployAttestationCenterProxy,
  deployAttestationCenterProxyV20,
  deployFeePool,
  deployOBLS,
  deployPolicy,
  deployProtocolRegistry,
  deployVennFeeCalculator,
} from "@/test/fixtures";
import { getInterfaceId } from "@/test/helpers";
import { defaultProtocolRegistryInitData } from "@/test/unit/ProtocolRegisrty.test";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumberish, hexlify, parseEther, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

function compareTaskInfo(taskInfo: IAttestationCenter.TaskInfoStruct, taskInfo2: IAttestationCenter.TaskInfoStruct) {
  return (
    taskInfo.proofOfTask === taskInfo2.proofOfTask &&
    hexlify(taskInfo.data).toLowerCase() === hexlify(taskInfo2.data).toLowerCase() &&
    taskInfo.taskPerformer === taskInfo2.taskPerformer &&
    Number(taskInfo.taskDefinitionId) === Number(taskInfo2.taskDefinitionId)
  );
}

function compareTaskSubmissionDetails(
  taskSubmissionDetails: IAttestationCenter.TaskSubmissionDetailsStruct,
  taskSubmissionDetails2: IAttestationCenter.TaskSubmissionDetailsStruct,
) {
  return (
    taskSubmissionDetails.isApproved === taskSubmissionDetails2.isApproved &&
    hexlify(taskSubmissionDetails.tpSignature).toLowerCase() ===
      hexlify(taskSubmissionDetails2.tpSignature).toLowerCase() &&
    taskSubmissionDetails.taSignature.length === taskSubmissionDetails2.taSignature.length &&
    taskSubmissionDetails.taSignature.every(
      (id: any, index: number) => Number(id) === Number(taskSubmissionDetails2.taSignature[index]),
    ) &&
    taskSubmissionDetails.attestersIds.length === taskSubmissionDetails2.attestersIds.length &&
    taskSubmissionDetails.attestersIds.every(
      (id: any, index: number) => Number(id) === Number(taskSubmissionDetails2.attestersIds[index]),
    )
  );
}

const POLICY_FEE = parseEther("0.001");

async function deployFixture() {
  const [ADMIN, NON_ADMIN, PERFORMER_1, PERFORMER_2, CONSUMER_1, CONSUMER_2] = await ethers.getSigners();

  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);
  const { vennFeeCalculator } = await deployVennFeeCalculator(ZeroAddress, ADMIN);
  const { feePool } = await deployFeePool(ZeroAddress, vennFeeCalculator, ADMIN);
  const { protocolRegistry } = await deployProtocolRegistry(
    ADMIN,
    defaultProtocolRegistryInitData(attestationCenter, ADMIN),
  );
  await feePool.setProtocolRegistry(protocolRegistry);
  const { policy } = await deployPolicy();

  await attestationCenter.setNumOfTaskDefinitions(2);
  await protocolRegistry.registerProtocol(policy, "");
  await protocolRegistry.subscribeSubnet(policy, 0, []);
  await vennFeeCalculator.setTaskDefinitionFee(0, POLICY_FEE);
  await vennFeeCalculator.setTaskDefinitionFee(1, POLICY_FEE);
  await vennFeeCalculator.setTaskDefinitionFee(2, POLICY_FEE);

  const { attestationCenterProxy } = await deployAttestationCenterProxy(feePool, attestationCenter, ADMIN);
  const { attestationCenterProxyV20Implementation } = await deployAttestationCenterProxyV20();

  return {
    ADMIN,
    NON_ADMIN,
    PERFORMER_1,
    PERFORMER_2,
    CONSUMER_1,
    CONSUMER_2,
    policy,
    attestationCenterProxy,
    attestationCenter,
    feePool,
    protocolRegistry,
    attestationCenterProxyV20Implementation,
    vennFeeCalculator,
  };
}

describe("AttestationCenterProxy", () => {
  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { attestationCenterProxy } = await loadFixture(deployFixture);

        await expect(attestationCenterProxy.__AttestationCenterProxy_init(ZeroAddress, ZeroAddress)).to.be.revertedWith(
          reason,
        );
      });
    });

    describe("#__AttestationCenterProxy_init", () => {
      it("should set correct data after creation", async () => {
        const { attestationCenterProxy, attestationCenter, feePool, ADMIN } = await loadFixture(deployFixture);
        await loadFixture(deployFixture);

        expect(await attestationCenterProxy.attestationCenter()).to.eq(attestationCenter);
        expect(await attestationCenterProxy.feePool()).to.eq(feePool);

        expect(await attestationCenterProxy.hasRole(await attestationCenterProxy.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be
          .true;
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { attestationCenterProxy } = await loadFixture(deployFixture);

        await expect(attestationCenterProxy.__AttestationCenterProxy_init(ZeroAddress, ZeroAddress)).to.be.revertedWith(
          reason,
        );
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { attestationCenterProxy, attestationCenterProxyV20Implementation } = await loadFixture(deployFixture);

        await attestationCenterProxy.upgradeTo(await attestationCenterProxyV20Implementation.getAddress());

        expect(await attestationCenterProxy.version()).to.eq(20);
      });

      it("should revert if caller is not the admin", async () => {
        const { attestationCenterProxy, NON_ADMIN } = await loadFixture(deployFixture);

        const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await attestationCenterProxy.ADMIN_ROLE()}`;

        await expect(attestationCenterProxy.connect(NON_ADMIN).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { attestationCenterProxy } = await loadFixture(deployFixture);

        expect(await attestationCenterProxy.version()).to.eq(1);
      });
    });
  });

  describe("submitTask", () => {
    it("should call the attestation center submitTask function", async () => {
      const { attestationCenterProxy, attestationCenter, PERFORMER_1 } = await loadFixture(deployFixture);

      const taskInfo = {
        proofOfTask: "proofOfTask",
        data: "0x123456",
        taskPerformer: await PERFORMER_1.getAddress(),
        taskDefinitionId: 1,
      };
      const taskSubmissionDetails = {
        isApproved: true,
        tpSignature: "0x1234",
        taSignature: [1, 2] as [BigNumberish, BigNumberish],
        attestersIds: [3, 4, 5],
      };

      const tx = await attestationCenterProxy.submitTask(taskInfo, taskSubmissionDetails);
      await expect(tx)
        .to.emit(attestationCenter, "TaskSubmitted")
        .withArgs(
          (x: IAttestationCenter.TaskInfoStruct) => compareTaskInfo(x, taskInfo),
          (x: IAttestationCenter.TaskSubmissionDetailsStruct) => compareTaskSubmissionDetails(x, taskSubmissionDetails),
        );
    });

    it("should call the fee pool if msg.value is greater than 0", async () => {
      const { attestationCenterProxy, attestationCenter, feePool, ADMIN, PERFORMER_1, policy } =
        await loadFixture(deployFixture);

      const data = `${await policy.getAddress()}1234`;

      const taskInfo = {
        proofOfTask: "proofOfTask",
        data: data,
        taskPerformer: await PERFORMER_1.getAddress(),
        taskDefinitionId: 1,
      };
      const taskSubmissionDetails = {
        isApproved: true,
        tpSignature: "0x1234",
        taSignature: [1, 2] as [BigNumberish, BigNumberish],
        attestersIds: [3, 4, 5],
      };
      const value = parseEther("1");

      const tx = await attestationCenterProxy.submitTask(taskInfo, taskSubmissionDetails, {
        value: value,
      });
      await expect(tx)
        .to.emit(attestationCenter, "TaskSubmitted")
        .withArgs(
          (x: IAttestationCenter.TaskInfoStruct) => compareTaskInfo(x, taskInfo),
          (x: IAttestationCenter.TaskSubmissionDetailsStruct) => compareTaskSubmissionDetails(x, taskSubmissionDetails),
        );
      await expect(tx).to.emit(feePool, "NativeFeesDeposited").withArgs(policy, value);
      await expect(tx).to.changeEtherBalances([ADMIN, attestationCenterProxy, feePool], [-value, 0, value]);

      expect(await feePool.policyBalance(policy)).to.eq(value);
    });

    it("should revert if data is not a valid policy address", async () => {
      const { attestationCenterProxy, PERFORMER_1 } = await loadFixture(deployFixture);

      const data = `0x1234`;

      const taskInfo = {
        proofOfTask: "proofOfTask",
        data: data,
        taskPerformer: await PERFORMER_1.getAddress(),
        taskDefinitionId: 1,
      };
      const taskSubmissionDetails = {
        isApproved: true,
        tpSignature: "0x1234",
        taSignature: [1, 2] as [BigNumberish, BigNumberish],
        attestersIds: [3, 4, 5],
      };
      const value = parseEther("1");

      const tx = attestationCenterProxy.submitTask(taskInfo, taskSubmissionDetails, {
        value: value,
      });
      await expect(tx).to.be.revertedWith("AttestationCenterProxy: Invalid policy address");
    });
  });

  describe("submitTasks", () => {
    it("should call the attestation center submitTasks function", async () => {
      const { attestationCenterProxy, attestationCenter, feePool, ADMIN, PERFORMER_1, PERFORMER_2, policy } =
        await loadFixture(deployFixture);

      const data1 = `${await policy.getAddress()}1234`;
      const data2 = `${await policy.getAddress()}12345678`;
      const taskInfo = [
        {
          proofOfTask: "proofOfTask1",
          data: data1,
          taskPerformer: await PERFORMER_1.getAddress(),
          taskDefinitionId: 1,
        },
        {
          proofOfTask: "proofOfTask2",
          data: data2,
          taskPerformer: await PERFORMER_2.getAddress(),
          taskDefinitionId: 2,
        },
      ];
      const taskSubmissionDetails = [
        {
          isApproved: true,
          tpSignature: "0x1234",
          taSignature: [1, 2] as [BigNumberish, BigNumberish],
          attestersIds: [3, 4, 5],
        },
        {
          isApproved: false,
          tpSignature: "0x12345678",
          taSignature: [11, 22] as [BigNumberish, BigNumberish],
          attestersIds: [33, 44, 55],
        },
      ];
      const requiredAmount = await feePool.getTotalRequiredNativeAmountForPolicies([policy, policy], [1, 2]);

      const tx = await attestationCenterProxy.submitTasks(taskInfo, taskSubmissionDetails, {
        value: requiredAmount,
      });
      await expect(tx)
        .to.emit(attestationCenter, "TaskSubmitted")
        .withArgs(
          (x: IAttestationCenter.TaskInfoStruct) => compareTaskInfo(x, taskInfo[0]),
          (x: IAttestationCenter.TaskSubmissionDetailsStruct) =>
            compareTaskSubmissionDetails(x, taskSubmissionDetails[0]),
        );
      await expect(tx)
        .to.emit(attestationCenter, "TaskSubmitted")
        .withArgs(
          (x: IAttestationCenter.TaskInfoStruct) => compareTaskInfo(x, taskInfo[1]),
          (x: IAttestationCenter.TaskSubmissionDetailsStruct) =>
            compareTaskSubmissionDetails(x, taskSubmissionDetails[1]),
        );
      await expect(tx)
        .to.emit(feePool, "NativeFeesDeposited")
        .withArgs(policy, requiredAmount / 2n);
      await expect(tx).to.changeEtherBalances(
        [ADMIN, attestationCenterProxy, feePool],
        [-requiredAmount, 0, requiredAmount],
      );
    });

    it("should deposit rescued fees if msg.value is greater than required amount", async () => {
      const { attestationCenterProxy, attestationCenter, feePool, ADMIN, PERFORMER_1, PERFORMER_2, policy } =
        await loadFixture(deployFixture);

      const data1 = `${await policy.getAddress()}1234`;
      const data2 = `${await policy.getAddress()}12345678`;
      const taskInfo = [
        {
          proofOfTask: "proofOfTask1",
          data: data1,
          taskPerformer: await PERFORMER_1.getAddress(),
          taskDefinitionId: 1,
        },
        {
          proofOfTask: "proofOfTask2",
          data: data2,
          taskPerformer: await PERFORMER_2.getAddress(),
          taskDefinitionId: 2,
        },
      ];
      const taskSubmissionDetails = [
        {
          isApproved: true,
          tpSignature: "0x1234",
          taSignature: [1, 2] as [BigNumberish, BigNumberish],
          attestersIds: [3, 4, 5],
        },
        {
          isApproved: false,
          tpSignature: "0x12345678",
          taSignature: [11, 22] as [BigNumberish, BigNumberish],
          attestersIds: [33, 44, 55],
        },
      ];
      const value = parseEther("1");
      const requiredAmount = await feePool.getTotalRequiredNativeAmountForPolicies([policy, policy], [1, 2]);

      const tx = await attestationCenterProxy.submitTasks(taskInfo, taskSubmissionDetails, {
        value: value,
      });
      await expect(tx)
        .to.emit(attestationCenter, "TaskSubmitted")
        .withArgs(
          (x: IAttestationCenter.TaskInfoStruct) => compareTaskInfo(x, taskInfo[0]),
          (x: IAttestationCenter.TaskSubmissionDetailsStruct) =>
            compareTaskSubmissionDetails(x, taskSubmissionDetails[0]),
        );
      await expect(tx)
        .to.emit(attestationCenter, "TaskSubmitted")
        .withArgs(
          (x: IAttestationCenter.TaskInfoStruct) => compareTaskInfo(x, taskInfo[1]),
          (x: IAttestationCenter.TaskSubmissionDetailsStruct) =>
            compareTaskSubmissionDetails(x, taskSubmissionDetails[1]),
        );
      await expect(tx)
        .to.emit(feePool, "NativeFeesDeposited")
        .withArgs(policy, requiredAmount / 2n);
      await expect(tx).to.changeEtherBalances([ADMIN, attestationCenterProxy, feePool], [-value, 0, value]);
    });

    it("should revert if msg.value is less than required amount", async () => {
      const { attestationCenterProxy, PERFORMER_1, PERFORMER_2, policy } = await loadFixture(deployFixture);

      const data1 = `${await policy.getAddress()}1234`;
      const data2 = `${await policy.getAddress()}12345678`;
      const taskInfo = [
        {
          proofOfTask: "proofOfTask1",
          data: data1,
          taskPerformer: await PERFORMER_1.getAddress(),
          taskDefinitionId: 1,
        },
        {
          proofOfTask: "proofOfTask2",
          data: data2,
          taskPerformer: await PERFORMER_2.getAddress(),
          taskDefinitionId: 2,
        },
      ];
      const taskSubmissionDetails = [
        {
          isApproved: true,
          tpSignature: "0x1234",
          taSignature: [1, 2] as [BigNumberish, BigNumberish],
          attestersIds: [3, 4, 5],
        },
        {
          isApproved: false,
          tpSignature: "0x12345678",
          taSignature: [11, 22] as [BigNumberish, BigNumberish],
          attestersIds: [33, 44, 55],
        },
      ];

      const tx = attestationCenterProxy.submitTasks(taskInfo, taskSubmissionDetails, {
        value: 1,
      });
      await expect(tx).to.be.revertedWith("AttestationCenterProxy: Insufficient balance for fees.");
    });

    it("should not deposit to policy if required amount is 0", async () => {
      const { attestationCenterProxy, vennFeeCalculator, feePool, PERFORMER_1, PERFORMER_2, policy } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(0, 0);

      const data1 = `${await policy.getAddress()}1234`;
      const data2 = `${await policy.getAddress()}12345678`;
      const taskInfo = [
        {
          proofOfTask: "proofOfTask1",
          data: data1,
          taskPerformer: await PERFORMER_1.getAddress(),
          taskDefinitionId: 0,
        },
        {
          proofOfTask: "proofOfTask2",
          data: data2,
          taskPerformer: await PERFORMER_2.getAddress(),
          taskDefinitionId: 0,
        },
      ];
      const taskSubmissionDetails = [
        {
          isApproved: true,
          tpSignature: "0x1234",
          taSignature: [1, 2] as [BigNumberish, BigNumberish],
          attestersIds: [3, 4, 5],
        },
        {
          isApproved: false,
          tpSignature: "0x12345678",
          taSignature: [11, 22] as [BigNumberish, BigNumberish],
          attestersIds: [33, 44, 55],
        },
      ];

      const tx = attestationCenterProxy.submitTasks(taskInfo, taskSubmissionDetails, {
        value: 0,
      });
      await expect(tx).to.not.emit(feePool, "NativeFeesDeposited");
    });

    it("should deposit all msg.value to rescued fees if required amount is 0", async () => {
      const { attestationCenterProxy, vennFeeCalculator, feePool, PERFORMER_1, PERFORMER_2, policy } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(0, 0);

      const data1 = `${await policy.getAddress()}1234`;
      const data2 = `${await policy.getAddress()}12345678`;
      const taskInfo = [
        {
          proofOfTask: "proofOfTask1",
          data: data1,
          taskPerformer: await PERFORMER_1.getAddress(),
          taskDefinitionId: 0,
        },
        {
          proofOfTask: "proofOfTask2",
          data: data2,
          taskPerformer: await PERFORMER_2.getAddress(),
          taskDefinitionId: 0,
        },
      ];
      const taskSubmissionDetails = [
        {
          isApproved: true,
          tpSignature: "0x1234",
          taSignature: [1, 2] as [BigNumberish, BigNumberish],
          attestersIds: [3, 4, 5],
        },
        {
          isApproved: false,
          tpSignature: "0x12345678",
          taSignature: [11, 22] as [BigNumberish, BigNumberish],
          attestersIds: [33, 44, 55],
        },
      ];

      const value = parseEther("1");

      const tx = attestationCenterProxy.submitTasks(taskInfo, taskSubmissionDetails, {
        value: value,
      });
      await expect(tx).to.not.emit(feePool, "NativeFeesDeposited");
      await expect(tx).to.emit(feePool, "RescuedFeesDeposited").withArgs(value);
    });
  });

  describe("setAttestationCenter", () => {
    it("should set the attestation center", async () => {
      const { attestationCenterProxy, attestationCenter } = await loadFixture(deployFixture);

      const tx = await attestationCenterProxy.setAttestationCenter(attestationCenter);
      await expect(tx).to.emit(attestationCenterProxy, "AttestationCenterUpdated");

      expect(await attestationCenterProxy.attestationCenter()).to.eq(attestationCenter);
    });

    it("should revert if caller is not the admin", async () => {
      const { attestationCenterProxy, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await attestationCenterProxy.ADMIN_ROLE()}`;

      await expect(attestationCenterProxy.connect(NON_ADMIN).setAttestationCenter(ZeroAddress)).to.be.revertedWith(
        reason,
      );
    });
  });

  describe("setFeePool", () => {
    it("should set the fee pool", async () => {
      const { attestationCenterProxy, feePool } = await loadFixture(deployFixture);

      const tx = await attestationCenterProxy.setFeePool(feePool);
      await expect(tx).to.emit(attestationCenterProxy, "FeePoolUpdated");

      expect(await attestationCenterProxy.feePool()).to.eq(feePool);
    });

    it("should revert if caller is not the admin", async () => {
      const { attestationCenterProxy, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await attestationCenterProxy.ADMIN_ROLE()}`;

      await expect(attestationCenterProxy.connect(NON_ADMIN).setFeePool(ZeroAddress)).to.be.revertedWith(reason);
    });
  });

  describe("supportsInterface", () => {
    it("should return true for the IApprovedCallsPolicy", async () => {
      const { attestationCenterProxy } = await loadFixture(deployFixture);

      const IApprovedCallsPolicyInterfaceId = getInterfaceId(IApprovedCallsPolicy__factory.createInterface());

      expect(await attestationCenterProxy.supportsInterface(IApprovedCallsPolicyInterfaceId)).to.be.true;
    });

    it("should return true for the IAccessControl", async () => {
      const { attestationCenterProxy } = await loadFixture(deployFixture);

      const IAccessControlInterfaceId = getInterfaceId(IAccessControl__factory.createInterface());
      expect(await attestationCenterProxy.supportsInterface(IAccessControlInterfaceId)).to.be.true;
    });

    it("should return false for the incorrect interface id", async () => {
      const { attestationCenterProxy } = await loadFixture(deployFixture);

      const IFirewallInterfaceId = getInterfaceId(IFirewall__factory.createInterface());
      expect(await attestationCenterProxy.supportsInterface(IFirewallInterfaceId)).to.be.false;
    });
  });
});
