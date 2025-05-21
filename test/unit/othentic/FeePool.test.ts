import {
  deployAttestationCenter,
  deployFeePool,
  deployFeePoolV20,
  deployPolicy,
  deployProtocolRegistry,
  deployVennFeeCalculator,
} from "@/test/fixtures";
import { defaultProtocolRegistryInitData } from "@/test/unit/ProtocolRegisrty.test";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, VENN_FEE_RECIPIENT, POLICY_2, OPERATOR_REGISTRY] = await ethers.getSigners();

  const { attestationCenter } = await deployAttestationCenter(ADMIN);
  const { protocolRegistry } = await deployProtocolRegistry(
    ADMIN,
    defaultProtocolRegistryInitData(attestationCenter, VENN_FEE_RECIPIENT),
  );
  const { vennFeeCalculator } = await deployVennFeeCalculator(OPERATOR_REGISTRY, ADMIN);
  const { feePool } = await deployFeePool(protocolRegistry, vennFeeCalculator, ADMIN);
  await vennFeeCalculator.grantRole(await vennFeeCalculator.FEE_POOL_ROLE(), feePool);

  const { feePoolV20Implementation } = await deployFeePoolV20();

  const { policy } = await deployPolicy();

  await attestationCenter.setNumOfTaskDefinitions(2);
  await protocolRegistry.registerProtocol(policy, "");
  await protocolRegistry.subscribeSubnet(policy, 1, []);
  await vennFeeCalculator.setTaskDefinitionFee(1, parseEther("0.0001"));

  await feePool.grantRole(await feePool.FEE_WITHDRAWER_ROLE(), ADMIN);
  await feePool.grantRole(await feePool.FEE_CLAIMER_ROLE(), ADMIN);

  return {
    feePool,
    protocolRegistry,
    vennFeeCalculator,
    ADMIN,
    NON_ADMIN,
    feePoolV20Implementation,
    policy,
    POLICY_2,
  };
}

describe("FeePool", () => {
  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { feePool } = await loadFixture(deployFixture);

        await expect(feePool.__FeePool_init(ZeroAddress, ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#__FeePool_init", () => {
      it("should set correct data after creation", async () => {
        const { feePool, protocolRegistry, ADMIN } = await loadFixture(deployFixture);
        await loadFixture(deployFixture);

        expect(await feePool.protocolRegistry()).to.eq(await protocolRegistry.getAddress());

        expect(await feePool.hasRole(await feePool.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { feePool } = await loadFixture(deployFixture);

        await expect(feePool.__FeePool_init(ZeroAddress, ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { feePool, feePoolV20Implementation } = await loadFixture(deployFixture);

        await feePool.upgradeTo(await feePoolV20Implementation.getAddress());

        expect(await feePool.version()).to.eq(20);
      });

      it("should revert if caller is not the admin", async () => {
        const { feePool, NON_ADMIN } = await loadFixture(deployFixture);

        const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await feePool.ADMIN_ROLE()}`;

        await expect(feePool.connect(NON_ADMIN).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { feePool } = await loadFixture(deployFixture);

        expect(await feePool.version()).to.eq(1);
      });
    });
  });

  describe("#withdrawFees", () => {
    it("should withdraw fees", async () => {
      const { feePool, vennFeeCalculator, ADMIN, policy } = await loadFixture(deployFixture);

      const protocolFee = await vennFeeCalculator.taskDefinitionIdTotalFees(1);

      const nativeFees = ethers.parseEther("100");
      await feePool.depositNativeForPolicy(policy, { value: nativeFees });
      await feePool.claimNativeFeeFromPolicy(policy, 1);

      const tx = await feePool.withdrawFees(ADMIN, protocolFee / 2n);
      await expect(tx)
        .to.emit(feePool, "FeesWithdrawn")
        .withArgs(ADMIN, protocolFee / 2n);
      await expect(tx).to.changeEtherBalances([feePool, ADMIN], [-protocolFee / 2n, protocolFee / 2n]);

      expect(await feePool.collectedNativeFees()).to.eq(protocolFee / 2n);

      const tx2 = await feePool.withdrawFees(ADMIN, protocolFee / 2n);
      await expect(tx2)
        .to.emit(feePool, "FeesWithdrawn")
        .withArgs(ADMIN, protocolFee / 2n);
      await expect(tx2).to.changeEtherBalances([feePool, ADMIN], [-protocolFee / 2n, protocolFee / 2n]);
      expect(await feePool.collectedNativeFees()).to.eq(0n);
    });

    it("should revert if amount is greater than collected native fees", async () => {
      const { feePool, ADMIN } = await loadFixture(deployFixture);

      await expect(feePool.withdrawFees(ADMIN, 1n)).to.be.revertedWith("FeePool: Insufficient balance.");
    });

    it("should revert if caller is not the fee withdrawer", async () => {
      const { feePool, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await feePool.FEE_WITHDRAWER_ROLE()}`;

      await expect(feePool.connect(NON_ADMIN).withdrawFees(NON_ADMIN, 1n)).to.be.revertedWith(reason);
    });
  });

  describe("#withdrawRescuedFees", () => {
    it("should withdraw rescued fees", async () => {
      const { feePool, ADMIN } = await loadFixture(deployFixture);

      const rescuedFees = ethers.parseEther("100");

      await feePool.depositRescuedFees({ value: rescuedFees });

      const tx = await feePool.withdrawRescuedFees(ADMIN, rescuedFees / 2n);
      await expect(tx)
        .to.emit(feePool, "RescuedFeesWithdrawn")
        .withArgs(ADMIN, rescuedFees / 2n);
      await expect(tx).to.changeEtherBalances([feePool, ADMIN], [-rescuedFees / 2n, rescuedFees / 2n]);

      expect(await feePool.collectedRescuedFees()).to.eq(rescuedFees / 2n);

      const tx2 = await feePool.withdrawRescuedFees(ADMIN, rescuedFees / 2n);
      await expect(tx2)
        .to.emit(feePool, "RescuedFeesWithdrawn")
        .withArgs(ADMIN, rescuedFees / 2n);
      await expect(tx2).to.changeEtherBalances([feePool, ADMIN], [-rescuedFees / 2n, rescuedFees / 2n]);
      expect(await feePool.collectedRescuedFees()).to.eq(0n);
    });

    it("should revert if amount is greater than collected rescued fees", async () => {
      const { feePool, ADMIN } = await loadFixture(deployFixture);

      const rescuedFees = ethers.parseEther("100");

      await feePool.depositRescuedFees({ value: rescuedFees });

      await expect(feePool.withdrawRescuedFees(ADMIN, rescuedFees + 1n)).to.be.revertedWith(
        "FeePool: Insufficient balance.",
      );
    });

    it("should revert if caller is not the fee withdrawer", async () => {
      const { feePool, NON_ADMIN } = await loadFixture(deployFixture);

      const rescuedFees = ethers.parseEther("100");

      await feePool.depositRescuedFees({ value: rescuedFees });

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await feePool.FEE_WITHDRAWER_ROLE()}`;

      await expect(feePool.connect(NON_ADMIN).withdrawRescuedFees(NON_ADMIN, rescuedFees)).to.be.revertedWith(reason);
    });
  });

  describe("#depositRescuedFees", () => {
    it("should deposit rescued fees", async () => {
      const { feePool, ADMIN } = await loadFixture(deployFixture);

      const rescuedFees = ethers.parseEther("100");

      const tx = await feePool.depositRescuedFees({ value: rescuedFees });
      await expect(tx).to.emit(feePool, "RescuedFeesDeposited").withArgs(rescuedFees);

      expect(await feePool.collectedRescuedFees()).to.eq(rescuedFees);

      const tx2 = await feePool.depositRescuedFees({ value: rescuedFees });
      await expect(tx2).to.emit(feePool, "RescuedFeesDeposited").withArgs(rescuedFees);

      expect(await feePool.collectedRescuedFees()).to.eq(rescuedFees * 2n);
    });
  });

  describe("#depositNativeForPolicy", () => {
    it("should deposit native for policy", async () => {
      const { feePool, policy, POLICY_2 } = await loadFixture(deployFixture);

      const nativeFees = ethers.parseEther("100");

      const tx = await feePool.depositNativeForPolicy(policy, { value: nativeFees });
      await expect(tx).to.emit(feePool, "NativeFeesDeposited").withArgs(policy, nativeFees);

      expect(await feePool.policyBalance(policy)).to.eq(nativeFees);

      const tx2 = await feePool.depositNativeForPolicy(policy, { value: nativeFees });
      await expect(tx2).to.emit(feePool, "NativeFeesDeposited").withArgs(policy, nativeFees);

      expect(await feePool.policyBalance(policy)).to.eq(nativeFees * 2n);

      const tx3 = await feePool.depositNativeForPolicy(POLICY_2, { value: nativeFees });
      await expect(tx3).to.emit(feePool, "NativeFeesDeposited").withArgs(POLICY_2, nativeFees);

      expect(await feePool.policyBalance(POLICY_2)).to.eq(nativeFees);
    });
  });

  describe("#claimNativeFeeFromPolicy", () => {
    it("should claim native fee from policy", async () => {
      const { feePool, policy, vennFeeCalculator } = await loadFixture(deployFixture);

      const nativeFees = ethers.parseEther("100");
      await feePool.depositNativeForPolicy(policy, { value: nativeFees });

      const protocolFee = await vennFeeCalculator.taskDefinitionIdTotalFees(1);

      const tx = await feePool.claimNativeFeeFromPolicy(policy, 1);
      await expect(tx).to.emit(feePool, "NativeFeeClaimed").withArgs(policy, protocolFee);
      await expect(tx).to.changeEtherBalances([feePool, policy], [0, 0]);

      expect(await feePool.policyBalance(policy)).to.eq(nativeFees - protocolFee);
      expect(await feePool.collectedNativeFees()).to.eq(protocolFee);

      const tx2 = await feePool.claimNativeFeeFromPolicy(policy, 1);
      await expect(tx2).to.emit(feePool, "NativeFeeClaimed").withArgs(policy, protocolFee);
      await expect(tx2).to.changeEtherBalances([feePool, policy], [0, 0]);

      expect(await feePool.policyBalance(policy)).to.eq(nativeFees - protocolFee * 2n);
      expect(await feePool.collectedNativeFees()).to.eq(protocolFee * 2n);
    });

    it("should revert if policy balance is less than protocol fee", async () => {
      const { feePool, policy } = await loadFixture(deployFixture);

      await expect(feePool.claimNativeFeeFromPolicy(policy, 1)).to.be.revertedWith("FeePool: Insufficient balance.");
    });

    it("should revert if caller is not the fee claimer", async () => {
      const { feePool, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await feePool.FEE_CLAIMER_ROLE()}`;

      await expect(feePool.connect(NON_ADMIN).claimNativeFeeFromPolicy(NON_ADMIN, 1)).to.be.revertedWith(reason);
    });
  });

  describe("#setProtocolRegistry", () => {
    it("should set protocol registry", async () => {
      const { feePool, ADMIN } = await loadFixture(deployFixture);

      const tx = await feePool.setProtocolRegistry(ADMIN);
      await expect(tx).to.emit(feePool, "ProtocolRegistrySet").withArgs(ADMIN);

      expect(await feePool.protocolRegistry()).to.eq(await ADMIN.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { feePool, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await feePool.ADMIN_ROLE()}`;

      await expect(feePool.connect(NON_ADMIN).setProtocolRegistry(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });

  describe("#setVennFeeCalculator", () => {
    it("should set venn fee calculator", async () => {
      const { feePool, ADMIN } = await loadFixture(deployFixture);

      const tx = await feePool.setVennFeeCalculator(ADMIN);
      await expect(tx).to.emit(feePool, "VennFeeCalculatorSet").withArgs(ADMIN);

      expect(await feePool.vennFeeCalculator()).to.eq(await ADMIN.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { feePool, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await feePool.ADMIN_ROLE()}`;

      await expect(feePool.connect(NON_ADMIN).setVennFeeCalculator(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });

  describe("#getRequiredNativeAmountForPolicy", () => {
    it("should get required native amount for policy", async () => {
      const { feePool, vennFeeCalculator, policy } = await loadFixture(deployFixture);

      const protocolFee = await vennFeeCalculator.taskDefinitionIdTotalFees(1);
      expect(await feePool.getRequiredNativeAmountForPolicy(policy, 1)).to.eq(protocolFee);

      await feePool.depositNativeForPolicy(policy, { value: 1 });
      expect(await feePool.getRequiredNativeAmountForPolicy(policy, 1)).to.eq(protocolFee - 1n);

      await feePool.depositNativeForPolicy(policy, { value: parseEther("100") });
      expect(await feePool.getRequiredNativeAmountForPolicy(policy, 1)).to.eq(0);
    });
  });

  describe("#getTotalRequiredNativeAmountForPolicies", () => {
    it("should get total required native amount for policies", async () => {
      const { vennFeeCalculator, feePool, policy } = await loadFixture(deployFixture);

      const protocolFee = await vennFeeCalculator.taskDefinitionIdTotalFees(1);
      expect(await feePool.getTotalRequiredNativeAmountForPolicies([policy, policy], [1, 1])).to.eq(protocolFee * 2n);

      await feePool.depositNativeForPolicy(policy, { value: 1 });
      expect(await feePool.getTotalRequiredNativeAmountForPolicies([policy, policy], [1, 1])).to.eq(
        (protocolFee - 1n) * 2n,
      );

      await feePool.depositNativeForPolicy(policy, { value: parseEther("100") });
      expect(await feePool.getTotalRequiredNativeAmountForPolicies([policy, policy], [1, 1])).to.eq(0);
    });
  });
});
