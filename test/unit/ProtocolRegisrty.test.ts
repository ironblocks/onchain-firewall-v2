import { getFeePercentage } from "@/scripts/helpers";
import {
  deployAttestationCenter,
  deployOBLS,
  deployPolicy,
  deployProtocolRegistry,
  deployProtocolRegistryV20,
} from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AddressLike, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

export function defaultProtocolRegistryInitData(attestationCenter: AddressLike, vennFeeRecipient: AddressLike) {
  const vennDetectionFee = getFeePercentage("2");
  const vennProtocolFee = getFeePercentage("3");

  return {
    attestationCenter,
    vennFeeRecipient,
    vennDetectionFee,
    vennProtocolFee,
  };
}

async function deployFixture() {
  const [OWNER, VENN_FEE_RECIPIENT, NOT_OWNER, ASSET_1, ASSET_2, ADMIN_1, ADMIN_2] = await ethers.getSigners();
  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);

  const { protocolRegistryImplementation, protocolRegistry } = await deployProtocolRegistry(
    OWNER,
    defaultProtocolRegistryInitData(attestationCenter, VENN_FEE_RECIPIENT),
  );
  const { protocolRegistryV20Implementation } = await deployProtocolRegistryV20();

  await attestationCenter.setNumOfTaskDefinitions(2);

  const { policy } = await deployPolicy();

  return {
    OWNER,
    VENN_FEE_RECIPIENT,
    NOT_OWNER,
    ASSETS: [await ASSET_1.getAddress(), await ASSET_2.getAddress()],
    ADMINS: [await ADMIN_1.getAddress(), await ADMIN_2.getAddress()],
    attestationCenter,
    protocolRegistryImplementation,
    protocolRegistry,
    protocolRegistryV20Implementation,
    policy,
  };
}

describe("ProtocolRegistry", () => {
  const metadataURI = "https://example.com/metadata";

  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { protocolRegistryImplementation } = await loadFixture(deployFixture);

        await expect(
          protocolRegistryImplementation.__ProtocolRegistry_init(ZeroAddress, ZeroAddress, 0, 0),
        ).to.be.revertedWith(reason);
      });
    });

    describe("#__ProtocolRegistry_init", () => {
      it("should set correct data after creation", async () => {
        const { protocolRegistry, attestationCenter, VENN_FEE_RECIPIENT, OWNER } = await loadFixture(deployFixture);

        const defaultData = defaultProtocolRegistryInitData(attestationCenter, VENN_FEE_RECIPIENT);

        expect(await protocolRegistry.attestationCenter()).to.eq(defaultData.attestationCenter);
        expect(await protocolRegistry.vennFeeRecipient()).to.eq(defaultData.vennFeeRecipient);

        expect(await protocolRegistry.vennDetectionFee()).to.eq(defaultData.vennDetectionFee);
        expect(await protocolRegistry.vennProtocolFee()).to.eq(defaultData.vennProtocolFee);

        expect(await protocolRegistry.hasRole(await protocolRegistry.DEFAULT_ADMIN_ROLE(), OWNER)).to.be.true;
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { protocolRegistry } = await loadFixture(deployFixture);

        await expect(protocolRegistry.__ProtocolRegistry_init(ZeroAddress, ZeroAddress, 0, 0)).to.be.revertedWith(
          reason,
        );
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { protocolRegistry, protocolRegistryV20Implementation } = await loadFixture(deployFixture);

        await protocolRegistry.upgradeTo(await protocolRegistryV20Implementation.getAddress());

        expect(await protocolRegistry.version()).to.eq(20);
      });

      it("should revert if caller is not the owner", async () => {
        const { protocolRegistry, NOT_OWNER } = await loadFixture(deployFixture);

        const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await protocolRegistry.ADMIN_ROLE()}`;

        await expect(protocolRegistry.connect(NOT_OWNER).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { protocolRegistry } = await loadFixture(deployFixture);

        expect(await protocolRegistry.version()).to.eq(1);
      });
    });
  });

  describe("createAndRegisterProtocolDetection", () => {
    it("should create and register protocol detection", async () => {
      const { protocolRegistry, ASSETS, ADMINS, OWNER } = await loadFixture(deployFixture);

      const operator = OWNER;

      const detectionEscrow = await protocolRegistry.createAndRegisterProtocolDetection.staticCall(
        operator,
        ASSETS,
        ADMINS,
        metadataURI,
      );
      const tx = await protocolRegistry.createAndRegisterProtocolDetection(operator, ASSETS, ADMINS, metadataURI);
      await expect(tx)
        .to.emit(protocolRegistry, "ProtocolDetectionRegistered")
        .withArgs(detectionEscrow, operator, ASSETS, ADMINS, protocolRegistry.vennDetectionFee(), metadataURI);

      const protocolDetection = await protocolRegistry.getProtocolDetection(detectionEscrow);

      expect(protocolDetection.protocolAdmin).to.eq(OWNER);
      expect(protocolDetection.operator).to.eq(operator);
      expect(protocolDetection.assets).to.deep.eq(ASSETS);
      expect(protocolDetection.admins).to.deep.eq(ADMINS);
      expect(protocolDetection.vennFee).to.eq(await protocolRegistry.vennDetectionFee());
      expect(protocolDetection.isApproved).to.be.false;
      expect(protocolDetection.metadataURI).to.eq(metadataURI);
    });

    it("should revert if operator is not found", async () => {
      const { protocolRegistry, ASSETS, ADMINS } = await loadFixture(deployFixture);

      await expect(
        protocolRegistry.createAndRegisterProtocolDetection(ZeroAddress, ASSETS, ADMINS, metadataURI),
      ).to.be.revertedWith("ProtocolRegistry: Operator not found.");
    });

    it("should correctly create detection escrow", async () => {
      const { protocolRegistry, ASSETS, ADMINS, OWNER } = await loadFixture(deployFixture);

      const operator = OWNER;

      const detectionEscrow = await protocolRegistry.createAndRegisterProtocolDetection.staticCall(
        operator,
        ASSETS,
        ADMINS,
        metadataURI,
      );
      await protocolRegistry.createAndRegisterProtocolDetection(operator, ASSETS, ADMINS, metadataURI);

      const detectionEscrowContract = await ethers.getContractAt("DetectionEscrow", detectionEscrow);

      expect(await detectionEscrowContract.protocolRegistry()).to.eq(await protocolRegistry.getAddress());
      expect(await detectionEscrowContract.protocolAdmin()).to.eq(OWNER);
      expect(await detectionEscrowContract.operator()).to.eq(operator);
    });
  });

  describe("approveProtocolDetectionAsOperator", () => {
    it("should approve protocol detection as operator", async () => {
      const { protocolRegistry, ASSETS, ADMINS, OWNER } = await loadFixture(deployFixture);

      const operator = OWNER;

      const detectionEscrow = await protocolRegistry.createAndRegisterProtocolDetection.staticCall(
        operator,
        ASSETS,
        ADMINS,
        metadataURI,
      );
      await protocolRegistry.createAndRegisterProtocolDetection(operator, ASSETS, ADMINS, metadataURI);

      const tx = await protocolRegistry.approveProtocolDetectionAsOperator(detectionEscrow);
      await expect(tx)
        .to.emit(protocolRegistry, "ProtocolDetectionApproved")
        .withArgs(detectionEscrow, operator, ASSETS, ADMINS, metadataURI);

      const protocolDetection = await protocolRegistry.getProtocolDetection(detectionEscrow);

      expect(protocolDetection.isApproved).to.be.true;
    });

    it("should revert if caller is not the operator", async () => {
      const { protocolRegistry, ASSETS, ADMINS, OWNER, NOT_OWNER } = await loadFixture(deployFixture);

      const operator = OWNER;

      const detectionEscrow = await protocolRegistry.createAndRegisterProtocolDetection.staticCall(
        operator,
        ASSETS,
        ADMINS,
        metadataURI,
      );
      await protocolRegistry.createAndRegisterProtocolDetection(operator, ASSETS, ADMINS, metadataURI);

      const tx = protocolRegistry.connect(NOT_OWNER).approveProtocolDetectionAsOperator(detectionEscrow);
      await expect(tx).to.be.revertedWith("ProtocolRegistry: Only operator.");
    });
  });

  describe("#registerProtocol", () => {
    it("should register protocol", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      const tx = await protocolRegistry.registerProtocol(policy, metadataURI);
      await expect(tx).to.emit(protocolRegistry, "ProtocolRegistered").withArgs(policy, metadataURI);

      const protocol = await protocolRegistry.getProtocol(policy);

      expect(protocol.policyAddress).to.eq(policy);
      expect(protocol.metadataURI).to.eq(metadataURI);
    });

    it("should revert if protocol already registered", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, metadataURI);

      await expect(protocolRegistry.registerProtocol(policy, metadataURI)).to.be.revertedWith(
        "ProtocolRegistry: Protocol already registered.",
      );
    });

    it("should revert if caller is not the admin of the policy", async () => {
      const { protocolRegistry, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(protocolRegistry.connect(NOT_OWNER).registerProtocol(policy, metadataURI)).to.be.revertedWith(
        "ProtocolRegistry: Only policy admin.",
      );
    });
  });

  describe("#updateProtocol", () => {
    const taskDefinitionId = 1;
    const requiredOperatorIds = [1, 2, 3];

    const newTaskDefinitionId = 2;
    const newRequiredOperatorIds = [2, 3, 4];

    it("should update protocol", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
      await attestationCenter.setTaskDefinitionRestrictedOperators(newTaskDefinitionId, newRequiredOperatorIds);
      await protocolRegistry.registerProtocol(policy, metadataURI);

      const tx = await protocolRegistry.updateProtocol(policy, metadataURI);
      await expect(tx).to.emit(protocolRegistry, "ProtocolUpdated").withArgs(policy, metadataURI);

      const protocol = await protocolRegistry.getProtocol(policy);

      expect(protocol.metadataURI).to.eq(metadataURI);
    });

    it("should revert if caller is not the admin of the policy", async () => {
      const { protocolRegistry, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(protocolRegistry.connect(NOT_OWNER).updateProtocol(policy, metadataURI)).to.be.revertedWith(
        "ProtocolRegistry: Only policy admin.",
      );
    });
    it("should revert if protocol is not registered", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await expect(protocolRegistry.updateProtocol(policy, metadataURI)).to.be.revertedWith(
        "ProtocolRegistry: Protocol not registered.",
      );
    });
  });

  describe("#subscribeSubnet", () => {
    const taskDefinitionId = 1;
    const requiredOperatorIds = [1, 2, 3];

    it("should subscribe subnet", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);
      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId + 1, requiredOperatorIds);

      await protocolRegistry.registerProtocol(policy, "");

      let tx = await protocolRegistry.subscribeSubnet(policy, taskDefinitionId, requiredOperatorIds);
      await expect(tx)
        .to.emit(protocolRegistry, "SubnetSubscribed")
        .withArgs(policy, taskDefinitionId, requiredOperatorIds);

      expect(await protocolRegistry.getProtocolTaskDefinitionIds(policy)).to.be.deep.eq([taskDefinitionId]);
      expect(await protocolRegistry.getRequiredOperatorIds(policy, taskDefinitionId)).to.be.deep.eq(
        requiredOperatorIds,
      );

      tx = await protocolRegistry.subscribeSubnet(policy, taskDefinitionId + 1, requiredOperatorIds);
      await expect(tx)
        .to.emit(protocolRegistry, "SubnetSubscribed")
        .withArgs(policy, taskDefinitionId + 1, requiredOperatorIds);

      expect(await protocolRegistry.getProtocolTaskDefinitionIds(policy)).to.be.deep.eq([
        taskDefinitionId,
        taskDefinitionId + 1,
      ]);
      expect(await protocolRegistry.getRequiredOperatorIds(policy, taskDefinitionId + 1)).to.be.deep.eq(
        requiredOperatorIds,
      );
    });

    it("should update list of task operators ids", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);

      await protocolRegistry.registerProtocol(policy, "");

      await protocolRegistry.subscribeSubnet(policy, taskDefinitionId, requiredOperatorIds);

      const newRequiredOperatorIds = [4, 5, 6];

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, newRequiredOperatorIds);

      await protocolRegistry.subscribeSubnet(policy, taskDefinitionId, newRequiredOperatorIds);

      expect(await protocolRegistry.getRequiredOperatorIds(policy, taskDefinitionId)).to.be.deep.eq(
        newRequiredOperatorIds,
      );
    });

    it("should subscribe subnet with task definition id 0", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, []);

      await protocolRegistry.registerProtocol(policy, "");

      await protocolRegistry.subscribeSubnet(policy, 0, requiredOperatorIds);
    });

    it("should revert if task definition id is invalid", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, "");

      await expect(protocolRegistry.subscribeSubnet(policy, 100, requiredOperatorIds)).to.be.revertedWith(
        "ProtocolRegistry: Invalid task definition id.",
      );
    });

    it("should revert if required operator is not sorted", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [1, 2, 3]);

      await protocolRegistry.registerProtocol(policy, "");

      await expect(protocolRegistry.subscribeSubnet(policy, taskDefinitionId, [1, 3, 2])).to.be.revertedWith(
        "ProtocolRegistry: Required operator ids must be sorted.",
      );
    });

    it("should revert if required operator is not active", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [1, 2, 3]);

      await protocolRegistry.registerProtocol(policy, "");

      await expect(protocolRegistry.subscribeSubnet(policy, taskDefinitionId, [0])).to.be.revertedWith(
        "ProtocolRegistry: Operator not active.",
      );
    });

    it("should revert if required operator is missing from task definition restricted operators", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, [1, 2, 3]);

      await protocolRegistry.registerProtocol(policy, "");

      await expect(protocolRegistry.subscribeSubnet(policy, taskDefinitionId, [1, 2, 4])).to.be.revertedWith(
        "ProtocolRegistry: Missing operator id.",
      );
    });

    it("should revert if protocol is not registered", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await expect(protocolRegistry.subscribeSubnet(policy, taskDefinitionId, requiredOperatorIds)).to.be.revertedWith(
        "ProtocolRegistry: Protocol not registered.",
      );
    });

    it("should revert if caller is not the admin of the policy", async () => {
      const { protocolRegistry, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(
        protocolRegistry.connect(NOT_OWNER).subscribeSubnet(policy, taskDefinitionId, requiredOperatorIds),
      ).to.be.revertedWith("ProtocolRegistry: Only policy admin.");
    });
  });

  describe("#unsubscribeSubnet", () => {
    const taskDefinitionId = 0;
    const requiredOperatorIds = [1, 2, 3];

    it("should unsubscribe subnet", async () => {
      const { protocolRegistry, policy, attestationCenter } = await loadFixture(deployFixture);

      await attestationCenter.setTaskDefinitionRestrictedOperators(taskDefinitionId, requiredOperatorIds);

      await protocolRegistry.registerProtocol(policy, "");

      await protocolRegistry.subscribeSubnet(policy, taskDefinitionId, requiredOperatorIds);

      const tx = await protocolRegistry.unsubscribeSubnet(policy, taskDefinitionId);
      await expect(tx).to.emit(protocolRegistry, "SubnetUnsubscribed").withArgs(policy, taskDefinitionId);

      expect(await protocolRegistry.getProtocolTaskDefinitionIds(policy)).to.be.deep.eq([]);
      expect(await protocolRegistry.getRequiredOperatorIds(policy, taskDefinitionId)).to.be.deep.eq([]);
    });

    it("should revert if protocol is not registered", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await expect(protocolRegistry.unsubscribeSubnet(policy, taskDefinitionId)).to.be.revertedWith(
        "ProtocolRegistry: Protocol not registered.",
      );
    });

    it("should revert if caller is not the admin of the policy", async () => {
      const { protocolRegistry, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(protocolRegistry.connect(NOT_OWNER).unsubscribeSubnet(policy, taskDefinitionId)).to.be.revertedWith(
        "ProtocolRegistry: Only policy admin.",
      );
    });

    it("should revert if protocol is not exists", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await expect(protocolRegistry.unsubscribeSubnet(policy, taskDefinitionId)).to.be.revertedWith(
        "ProtocolRegistry: Protocol not registered.",
      );
    });

    it("should revert if subnet was not subscribed", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, "");

      await expect(protocolRegistry.unsubscribeSubnet(policy, taskDefinitionId)).to.be.revertedWith(
        "ProtocolRegistry: Subnet not subscribed.",
      );
    });
  });

  describe("#setAttestationCenter", () => {
    it("should set attestation center", async () => {
      const { protocolRegistry, OWNER } = await loadFixture(deployFixture);

      const tx = await protocolRegistry.setAttestationCenter(OWNER);
      await expect(tx).to.emit(protocolRegistry, "AttestationCenterSet").withArgs(OWNER);

      expect(await protocolRegistry.attestationCenter()).to.eq(await OWNER.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { protocolRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await protocolRegistry.ADMIN_ROLE()}`;

      await expect(protocolRegistry.connect(NOT_OWNER).setAttestationCenter(ZeroAddress)).to.be.revertedWith(reason);
    });
  });

  describe("#setVennDetectionFee", () => {
    it("should set venn detection fee", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      const tx = await protocolRegistry.setVennDetectionFee(getFeePercentage("10"));
      await expect(tx).to.emit(protocolRegistry, "VennDetectionFeeSet").withArgs(getFeePercentage("10"));

      expect(await protocolRegistry.vennDetectionFee()).to.eq(getFeePercentage("10"));
    });

    it("should revert if caller is not the admin", async () => {
      const { protocolRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await protocolRegistry.ADMIN_ROLE()}`;

      await expect(protocolRegistry.connect(NOT_OWNER).setVennDetectionFee(0)).to.be.revertedWith(reason);
    });

    it("should revert if fee is greater than max venn detection fee", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      const reason = "ProtocolRegistry: Venn detection fee must be less than or equal to max venn detection fee.";

      await expect(protocolRegistry.setVennDetectionFee(getFeePercentage("101"))).to.be.revertedWith(reason);
    });
  });

  describe("#setVennProtocolFee", () => {
    it("should set venn protocol fee", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      const tx = await protocolRegistry.setVennProtocolFee(getFeePercentage("10"));
      await expect(tx).to.emit(protocolRegistry, "VennProtocolFeeSet").withArgs(getFeePercentage("10"));

      expect(await protocolRegistry.vennProtocolFee()).to.eq(getFeePercentage("10"));
    });

    it("should revert if caller is not the admin", async () => {
      const { protocolRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await protocolRegistry.ADMIN_ROLE()}`;

      await expect(protocolRegistry.connect(NOT_OWNER).setVennProtocolFee(0)).to.be.revertedWith(reason);
    });

    it("should revert if fee is greater than max venn protocol fee", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      const reason = "ProtocolRegistry: Venn protocol fee must be less than or equal to max venn protocol fee.";

      await expect(protocolRegistry.setVennProtocolFee(getFeePercentage("101"))).to.be.revertedWith(reason);
    });
  });

  describe("#setVennFeeRecipient", () => {
    it("should set venn fee recipient", async () => {
      const { protocolRegistry, VENN_FEE_RECIPIENT } = await loadFixture(deployFixture);

      const tx = await protocolRegistry.setVennFeeRecipient(VENN_FEE_RECIPIENT);
      await expect(tx).to.emit(protocolRegistry, "VennFeeRecipientSet").withArgs(VENN_FEE_RECIPIENT);

      expect(await protocolRegistry.vennFeeRecipient()).to.eq(await VENN_FEE_RECIPIENT.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { protocolRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await protocolRegistry.ADMIN_ROLE()}`;

      await expect(protocolRegistry.connect(NOT_OWNER).setVennFeeRecipient(ZeroAddress)).to.be.revertedWith(reason);
    });

    it("should revert if fee recipient is the zero address", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      const reason = "ProtocolRegistry: Venn fee recipient cannot be the zero address.";

      await expect(protocolRegistry.setVennFeeRecipient(ZeroAddress)).to.be.revertedWith(reason);
    });
  });

  describe("#getProtocolTaskDefinitionIds", () => {
    const taskDefinitionId = 1;

    it("should get protocol task definition ids", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, metadataURI);

      expect(await protocolRegistry.getProtocolTaskDefinitionIds(policy)).to.be.deep.eq([]);

      await protocolRegistry.subscribeSubnet(policy, taskDefinitionId, []);

      expect(await protocolRegistry.getProtocolTaskDefinitionIds(policy)).to.be.deep.eq([taskDefinitionId]);

      await protocolRegistry.subscribeSubnet(policy, taskDefinitionId + 1, []);

      expect(await protocolRegistry.getProtocolTaskDefinitionIds(policy)).to.be.deep.eq([
        taskDefinitionId,
        taskDefinitionId + 1,
      ]);
    });

    it("should revert if protocol is not registered", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      await expect(protocolRegistry.getProtocolTaskDefinitionIds(ZeroAddress)).to.be.revertedWith(
        "ProtocolRegistry: Protocol not registered.",
      );
    });
  });

  describe("#isSubnetSubscribed", () => {
    const taskDefinitionId = 0;

    it("should return true if subnet is subscribed", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, metadataURI);

      await protocolRegistry.subscribeSubnet(policy, taskDefinitionId, []);

      expect(await protocolRegistry.isSubnetSubscribed(policy, taskDefinitionId)).to.be.true;
    });

    it("should return false if subnet is not subscribed", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, metadataURI);

      expect(await protocolRegistry.isSubnetSubscribed(policy, taskDefinitionId)).to.be.false;
    });
  });

  describe("#getRequiredOperatorIds", () => {
    const requiredOperatorIds = [1, 2, 3];

    it("should get required operator ids", async () => {
      const { protocolRegistry, policy } = await loadFixture(deployFixture);

      await protocolRegistry.registerProtocol(policy, metadataURI);

      await protocolRegistry.subscribeSubnet(policy, 0, requiredOperatorIds);

      expect(await protocolRegistry.getRequiredOperatorIds(policy, 0)).to.be.deep.eq(requiredOperatorIds);
    });

    it("should revert if protocol is not registered", async () => {
      const { protocolRegistry } = await loadFixture(deployFixture);

      await expect(protocolRegistry.getRequiredOperatorIds(ZeroAddress, 0)).to.be.revertedWith(
        "ProtocolRegistry: Protocol not registered.",
      );
    });
  });
});
