import {
  deployAttestationCenter,
  deployOBLS,
  deployOperatorRegistry,
  deployOperatorRegistryV20,
} from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumberish, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

const MAX_SUBSCRIBED_OPERATORS_COUNT = 10;

async function deployFixture() {
  const [OWNER, VENN_FEE_RECIPIENT, NOT_OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2] = await ethers.getSigners();
  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);
  const { operatorRegistryImplementation, operatorRegistry } = await deployOperatorRegistry(
    attestationCenter,
    MAX_SUBSCRIBED_OPERATORS_COUNT,
    OWNER,
  );

  await attestationCenter.setNumOfTaskDefinitions(2);

  const { operatorRegistryV20Implementation } = await deployOperatorRegistryV20();

  return {
    OWNER,
    VENN_FEE_RECIPIENT,
    NOT_OWNER,
    SECURITY_OPERATOR_1,
    SECURITY_OPERATOR_2,
    attestationCenter,
    operatorRegistryImplementation,
    operatorRegistry,
    operatorRegistryV20Implementation,
  };
}

describe("OperatorRegistry", () => {
  const metadataURI = "https://example.com/metadata";

  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { operatorRegistryImplementation } = await loadFixture(deployFixture);

        await expect(
          operatorRegistryImplementation.__OperatorRegistry_init(ZeroAddress, MAX_SUBSCRIBED_OPERATORS_COUNT),
        ).to.be.revertedWith(reason);
      });
    });

    describe("#__OperatorRegistry_init", () => {
      it("should set correct data after creation", async () => {
        const { operatorRegistry, attestationCenter, OWNER } = await loadFixture(deployFixture);

        expect(await operatorRegistry.attestationCenter()).to.eq(attestationCenter);
        expect(await operatorRegistry.maxSubscribedOperatorsCount()).to.eq(MAX_SUBSCRIBED_OPERATORS_COUNT);

        expect(await operatorRegistry.hasRole(await operatorRegistry.DEFAULT_ADMIN_ROLE(), OWNER)).to.be.true;
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { operatorRegistry } = await loadFixture(deployFixture);

        await expect(
          operatorRegistry.__OperatorRegistry_init(ZeroAddress, MAX_SUBSCRIBED_OPERATORS_COUNT),
        ).to.be.revertedWith(reason);
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { operatorRegistry, operatorRegistryV20Implementation } = await loadFixture(deployFixture);

        await operatorRegistry.upgradeTo(await operatorRegistryV20Implementation.getAddress());

        expect(await operatorRegistry.version()).to.eq(20);
      });

      it("should revert if caller is not the owner", async () => {
        const { operatorRegistry, NOT_OWNER } = await loadFixture(deployFixture);

        const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await operatorRegistry.ADMIN_ROLE()}`;

        await expect(operatorRegistry.connect(NOT_OWNER).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { operatorRegistry } = await loadFixture(deployFixture);

        expect(await operatorRegistry.version()).to.eq(1);
      });
    });
  });

  describe("#registerOperator", () => {
    it("should register as operator", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      const tx = await operatorRegistry.registerOperator(OWNER, metadataURI);
      await expect(tx)
        .to.emit(operatorRegistry, "OperatorRegistered")
        .withArgs(OWNER, (operatorId: BigNumberish) => BigInt(operatorId) > 0n, metadataURI);

      const operator = await operatorRegistry.getOperator(OWNER);

      expect(operator.operator).to.eq(OWNER);
      expect(operator.operatorId).to.not.eq(0);
      expect(operator.metadata).to.eq(metadataURI);
    });

    it("should register another user as operator", async () => {
      const { operatorRegistry, OWNER, VENN_FEE_RECIPIENT } = await loadFixture(deployFixture);

      const tx = await operatorRegistry.registerOperator(VENN_FEE_RECIPIENT, metadataURI);
      await expect(tx)
        .to.emit(operatorRegistry, "OperatorRegistered")
        .withArgs(VENN_FEE_RECIPIENT, (operatorId: BigNumberish) => BigInt(operatorId) > 0n, metadataURI);

      const operator = await operatorRegistry.getOperator(VENN_FEE_RECIPIENT);

      expect(operator.operator).to.eq(VENN_FEE_RECIPIENT);
      expect(operator.operatorId).to.not.eq(0);
      expect(operator.metadata).to.eq(metadataURI);
    });

    it("should revert if operator is already registered", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);

      await expect(operatorRegistry.registerOperator(OWNER, metadataURI)).to.be.revertedWith(
        "Operator already registered",
      );
    });

    it("should revert if caller is not the admin", async () => {
      const { operatorRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(operatorRegistry.connect(NOT_OWNER).registerOperator(NOT_OWNER, metadataURI)).to.be.revertedWith(
        `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await operatorRegistry.ADMIN_ROLE()}`,
      );
    });
  });

  describe("#unregisterOperator", () => {
    it("should unregister as operator", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);

      const tx = await operatorRegistry.unregisterOperator(OWNER);
      await expect(tx).to.emit(operatorRegistry, "OperatorUnregistered").withArgs(OWNER);

      const operator = await operatorRegistry.getOperator(OWNER);
      expect(operator.operator).to.eq(ZeroAddress);
    });

    it("should revert if operator is not registered", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      await expect(operatorRegistry.unregisterOperator(OWNER)).to.be.revertedWith(
        "OperatorRegistry: Operator not registered",
      );
    });

    it("should revert if caller is not the admin", async () => {
      const { operatorRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(operatorRegistry.connect(NOT_OWNER).unregisterOperator(NOT_OWNER)).to.be.revertedWith(
        `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await operatorRegistry.ADMIN_ROLE()}`,
      );
    });
  });

  describe("#subscribeOperators", () => {
    it("should subscribe operators", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_2, metadataURI);

      const tx = await operatorRegistry.subscribeOperators(
        0,
        [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2],
        [300_000, 200_000],
      );
      await expect(tx)
        .to.emit(operatorRegistry, "OperatorSubscriptionSet")
        .withArgs(0, OWNER, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [300_000, 200_000]);

      const subscribedOperatorsFees = await operatorRegistry.getSubscribedOperatorFees(0, await OWNER.getAddress());
      expect(subscribedOperatorsFees.operatorIds).to.deep.eq([
        await SECURITY_OPERATOR_1.getAddress(),
        await SECURITY_OPERATOR_2.getAddress(),
      ]);
      expect(subscribedOperatorsFees.operatorFees).to.deep.eq([300_000, 200_000]);
    });

    it("should modify existing subscription", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_2, metadataURI);

      await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [100_000]);

      let tx = await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [600_000]);
      await expect(tx)
        .to.emit(operatorRegistry, "OperatorSubscriptionSet")
        .withArgs(0, OWNER, [SECURITY_OPERATOR_1], [600_000]);

      let subscribedOperatorsFees = await operatorRegistry.getSubscribedOperatorFees(0, await OWNER.getAddress());
      expect(subscribedOperatorsFees.operatorIds).to.deep.eq([await SECURITY_OPERATOR_1.getAddress()]);
      expect(subscribedOperatorsFees.operatorFees).to.deep.eq([600_000]);

      tx = await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [0, 500_000]);
      await expect(tx)
        .to.emit(operatorRegistry, "OperatorSubscriptionSet")
        .withArgs(0, OWNER, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [0, 500_000]);

      subscribedOperatorsFees = await operatorRegistry.getSubscribedOperatorFees(0, await OWNER.getAddress());
      expect(subscribedOperatorsFees.operatorIds).to.deep.eq([await SECURITY_OPERATOR_2.getAddress()]);
      expect(subscribedOperatorsFees.operatorFees).to.deep.eq([500_000]);
    });

    it("should revert if try to subscribe unregistered operator", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);

      await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [1]);

      await operatorRegistry.unregisterOperator(SECURITY_OPERATOR_1);

      await expect(operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [1])).to.be.revertedWith(
        "OperatorRegistry: Subscribed operator not registered",
      );
    });

    it("should not revert if try to unsubscribe unregistered operator", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);

      await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [1]);

      await operatorRegistry.unregisterOperator(SECURITY_OPERATOR_1);

      await expect(operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [0])).to.not.be.reverted;
    });

    it("should revert if length of operatorIds and operatorFees arrays are not the same", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);

      await expect(operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [])).to.be.revertedWith(
        "OperatorRegistry: Subscribed operators and fee shares length mismatch",
      );
    });

    it("should subscribe operators with task definition id 0", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);

      await expect(operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [10000])).to.be.not.reverted;
    });

    it("should revert if task definition id is invalid", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);

      await expect(operatorRegistry.subscribeOperators(999, [SECURITY_OPERATOR_1], [10000])).to.be.revertedWith(
        "OperatorRegistry: Invalid task definition id",
      );
    });

    it("should revert if operator is not registered", async () => {
      const { operatorRegistry, SECURITY_OPERATOR_1 } = await loadFixture(deployFixture);

      await expect(operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1], [10000])).to.be.revertedWith(
        "OperatorRegistry: Operator not registered",
      );
    });

    it("should revert if operator is subscribed to itself", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);

      await expect(operatorRegistry.subscribeOperators(0, [OWNER], [10000])).to.be.revertedWith(
        "OperatorRegistry: Operator has to be not subscribed to itself",
      );
    });

    it("should revert if total operator fee share is >= 100%", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_2, metadataURI);

      await expect(
        operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [500_000, 500_005]),
      ).to.be.revertedWith("OperatorRegistry: Total subscribed operator fee share has to be less than 100%");
    });

    it("should revert if number of subscribed operators is greater than max subscribed operators count", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2 } = await loadFixture(deployFixture);

      await operatorRegistry.setMaxSubscribedOperatorsCount(1);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_2, metadataURI);

      await expect(
        operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [300_000, 200_000]),
      ).to.be.revertedWith("OperatorRegistry: Max subscribed operators count exceeded");
    });
  });

  describe("#getSubscribedOperatorFees", () => {
    it("should return the correct subscribed operator fees", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_2, metadataURI);

      let subscribedOperatorsFees = await operatorRegistry.getSubscribedOperatorFees(0, await OWNER.getAddress());
      expect(subscribedOperatorsFees.operatorIds).to.deep.eq([]);
      expect(subscribedOperatorsFees.operatorFees).to.deep.eq([]);

      await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [300_000, 200_000]);

      subscribedOperatorsFees = await operatorRegistry.getSubscribedOperatorFees(0, await OWNER.getAddress());
      expect(subscribedOperatorsFees.operatorIds).to.deep.eq([
        await SECURITY_OPERATOR_1.getAddress(),
        await SECURITY_OPERATOR_2.getAddress(),
      ]);

      await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_2], [500_000]);

      subscribedOperatorsFees = await operatorRegistry.getSubscribedOperatorFees(0, await OWNER.getAddress());
      expect(subscribedOperatorsFees.operatorIds).to.deep.eq([
        await SECURITY_OPERATOR_1.getAddress(),
        await SECURITY_OPERATOR_2.getAddress(),
      ]);
      expect(subscribedOperatorsFees.operatorFees).to.deep.eq([300_000, 500_000]);
    });
  });

  describe("#getSubscribedOperatorTotalCount", () => {
    it("should return the correct subscribed operator total count", async () => {
      const { operatorRegistry, OWNER, SECURITY_OPERATOR_1, SECURITY_OPERATOR_2 } = await loadFixture(deployFixture);

      await operatorRegistry.registerOperator(OWNER, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_1, metadataURI);
      await operatorRegistry.registerOperator(SECURITY_OPERATOR_2, metadataURI);

      expect(
        await operatorRegistry.getSubscribedOperatorTotalCount(0, [
          await OWNER.getAddress(),
          await SECURITY_OPERATOR_1.getAddress(),
          await SECURITY_OPERATOR_2.getAddress(),
        ]),
      ).to.eq(0);

      await operatorRegistry.subscribeOperators(0, [SECURITY_OPERATOR_1, SECURITY_OPERATOR_2], [300_000, 200_000]);

      expect(
        await operatorRegistry.getSubscribedOperatorTotalCount(0, [
          await OWNER.getAddress(),
          await SECURITY_OPERATOR_1.getAddress(),
          await SECURITY_OPERATOR_2.getAddress(),
        ]),
      ).to.eq(2);

      await operatorRegistry
        .connect(SECURITY_OPERATOR_2)
        .subscribeOperators(0, [OWNER, SECURITY_OPERATOR_1], [500_000, 100_000]);

      expect(
        await operatorRegistry.getSubscribedOperatorTotalCount(0, [
          await OWNER.getAddress(),
          await SECURITY_OPERATOR_1.getAddress(),
          await SECURITY_OPERATOR_2.getAddress(),
        ]),
      ).to.eq(4);
    });

    it("should return 0 if task definition id is invalid", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      expect(await operatorRegistry.getSubscribedOperatorTotalCount(2, [await OWNER.getAddress()])).to.eq(0);
    });
  });

  describe("#setAttestationCenter", () => {
    it("should set attestation center", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      const tx = await operatorRegistry.setAttestationCenter(OWNER);
      await expect(tx).to.emit(operatorRegistry, "AttestationCenterSet").withArgs(OWNER);

      expect(await operatorRegistry.attestationCenter()).to.eq(await OWNER.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { operatorRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await operatorRegistry.ADMIN_ROLE()}`;

      await expect(operatorRegistry.connect(NOT_OWNER).setAttestationCenter(ZeroAddress)).to.be.revertedWith(reason);
    });
  });

  describe("#setMaxSubscribedOperatorsCount", () => {
    it("should set max subscribed operators count", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      const tx = await operatorRegistry.setMaxSubscribedOperatorsCount(10);
      await expect(tx).to.emit(operatorRegistry, "MaxSubscribedOperatorsCountSet").withArgs(10);

      expect(await operatorRegistry.maxSubscribedOperatorsCount()).to.eq(10);
    });

    it("should revert if caller is not the admin", async () => {
      const { operatorRegistry, NOT_OWNER } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NOT_OWNER.getAddress()).toLowerCase()} is missing role ${await operatorRegistry.ADMIN_ROLE()}`;

      await expect(operatorRegistry.connect(NOT_OWNER).setMaxSubscribedOperatorsCount(10)).to.be.revertedWith(reason);
    });
  });

  describe("#getOperator", () => {
    it("should return the correct operator", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      let operator = await operatorRegistry.getOperator(await OWNER.getAddress());

      expect(operator.operator).to.eq(ZeroAddress);
      expect(operator.operatorId).to.eq(0);
      expect(operator.metadata).to.eq("");

      await operatorRegistry.registerOperator(OWNER, metadataURI);

      operator = await operatorRegistry.getOperator(await OWNER.getAddress());

      expect(operator.operator).to.eq(await OWNER.getAddress());
      expect(operator.operatorId).to.not.eq(0);
      expect(operator.metadata).to.eq(metadataURI);
    });
  });

  describe("#isOperatorRegistered", () => {
    it("should return the correct operator registered status", async () => {
      const { operatorRegistry, OWNER } = await loadFixture(deployFixture);

      expect(await operatorRegistry.isOperatorRegistered(await OWNER.getAddress())).to.be.false;

      await operatorRegistry.registerOperator(OWNER, metadataURI);

      expect(await operatorRegistry.isOperatorRegistered(await OWNER.getAddress())).to.be.true;
    });
  });
});
