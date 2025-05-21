import { deployL2AvsTreasuryMock, deployVennToken, deployVennVaultL2, deployVennVaultL2V20 } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

const ALLOW_OPERATOR_CLAIM = true;
const INITIAL_SUPPLY = parseEther("1000000000");

async function deployFixture() {
  const [ADMIN, NON_ADMIN, ATTESTATION_CENTER, VENN_FEE_RECIPIENT, FEE_POOL, POLICY_2] = await ethers.getSigners();

  const { l2AvsTreasuryMock: l2AvsTreasury } = await deployL2AvsTreasuryMock();
  const { vennToken } = await deployVennToken(INITIAL_SUPPLY);
  const { vennVaultL2 } = await deployVennVaultL2(
    vennToken,
    ATTESTATION_CENTER,
    l2AvsTreasury,
    ALLOW_OPERATOR_CLAIM,
    ADMIN,
  );
  const { vennVaultL2V20Implementation } = await deployVennVaultL2V20();

  return {
    vennVaultL2,
    vennVaultL2V20Implementation,
    ADMIN,
    NON_ADMIN,
    ATTESTATION_CENTER,
    l2AvsTreasury,
    VENN_FEE_RECIPIENT,
    FEE_POOL,
    POLICY_2,
  };
}

describe("VennVaultL2", () => {
  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { vennVaultL2 } = await loadFixture(deployFixture);

        await expect(
          vennVaultL2.__VennVaultL2_init(ZeroAddress, ZeroAddress, ZeroAddress, ALLOW_OPERATOR_CLAIM),
        ).to.be.revertedWith(reason);
      });
    });

    describe("#__VennVaultL2_init", () => {
      it("should set correct data after creation", async () => {
        const { vennVaultL2, ADMIN, ATTESTATION_CENTER, l2AvsTreasury } = await loadFixture(deployFixture);

        expect(await vennVaultL2.attestationCenter()).to.eq(await ATTESTATION_CENTER.getAddress());
        expect(await vennVaultL2.l2AvsTreasury()).to.eq(await l2AvsTreasury.getAddress());
        expect(await vennVaultL2.allowOperatorClaim()).to.be.true;

        expect(await vennVaultL2.hasRole(await vennVaultL2.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { vennVaultL2 } = await loadFixture(deployFixture);

        await expect(
          vennVaultL2.__VennVaultL2_init(ZeroAddress, ZeroAddress, ZeroAddress, ALLOW_OPERATOR_CLAIM),
        ).to.be.revertedWith(reason);
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { vennVaultL2, vennVaultL2V20Implementation } = await loadFixture(deployFixture);

        await vennVaultL2.upgradeTo(await vennVaultL2V20Implementation.getAddress());

        expect(await vennVaultL2.version()).to.eq(20);
      });

      it("should revert if caller is not the admin", async () => {
        const { vennVaultL2, NON_ADMIN } = await loadFixture(deployFixture);

        const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennVaultL2.ADMIN_ROLE()}`;

        await expect(vennVaultL2.connect(NON_ADMIN).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { vennVaultL2 } = await loadFixture(deployFixture);

        expect(await vennVaultL2.version()).to.eq(1);
      });
    });
  });

  describe("#ownerMint", () => {
    it("should mint tokens", async () => {
      const { vennVaultL2, ADMIN } = await loadFixture(deployFixture);

      const amount = parseEther("1000");

      const tx = await vennVaultL2.ownerMint(ADMIN, amount);
      await expect(tx).to.emit(vennVaultL2, "Transfer").withArgs(ZeroAddress, ADMIN, amount);
      await expect(tx).to.changeTokenBalances(vennVaultL2, [ADMIN], [amount]);
      expect(await vennVaultL2.balanceOf(ADMIN)).to.eq(amount);
    });

    it("should revert if caller is not the admin", async () => {
      const { vennVaultL2, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennVaultL2.ADMIN_ROLE()}`;

      await expect(vennVaultL2.connect(NON_ADMIN).ownerMint(NON_ADMIN, 0)).to.be.revertedWith(reason);
    });
  });

  describe("#beforePaymentRequest", () => {
    it("should mint tokens", async () => {
      const { vennVaultL2, ADMIN, l2AvsTreasury, ATTESTATION_CENTER } = await loadFixture(deployFixture);

      const feeToClaim = parseEther("1000");

      const requiredAmount = (feeToClaim * 1_000_000n) / 900_000n;

      const tx = await vennVaultL2.connect(ATTESTATION_CENTER).beforePaymentRequest(
        0,
        {
          operator: ADMIN,
          lastPaidTaskNumber: 0,
          feeToClaim: feeToClaim,
          paymentStatus: 0,
        },
        0,
      );

      await expect(tx).to.emit(vennVaultL2, "Transfer").withArgs(ZeroAddress, vennVaultL2, requiredAmount);
      await expect(tx).to.emit(vennVaultL2, "Approval").withArgs(vennVaultL2, l2AvsTreasury, requiredAmount);
      await expect(tx).to.emit(l2AvsTreasury, "DepositERC20").withArgs(requiredAmount);
    });

    it("should revert if allowOperatorClaim is false", async () => {
      const { vennVaultL2, ADMIN } = await loadFixture(deployFixture);

      await vennVaultL2.setAllowOperatorClaim(false);

      const reason = "VennVaultL2: Operator claim is not allowed.";

      await expect(
        vennVaultL2.beforePaymentRequest(
          0,
          {
            operator: ADMIN,
            lastPaidTaskNumber: 0,
            feeToClaim: 0,
            paymentStatus: 0,
          },
          0,
        ),
      ).to.be.revertedWith(reason);
    });

    it("should revert if caller is not the attestation center", async () => {
      const { vennVaultL2, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = "VennVaultL2: Only attestation center can call this function.";

      await expect(
        vennVaultL2.connect(NON_ADMIN).beforePaymentRequest(
          0,
          {
            operator: NON_ADMIN,
            lastPaidTaskNumber: 0,
            feeToClaim: 0,
            paymentStatus: 0,
          },
          0,
        ),
      ).to.be.revertedWith(reason);
    });
  });

  describe("#setAllowOperatorClaim", () => {
    it("should set allow operator claim", async () => {
      const { vennVaultL2, ADMIN } = await loadFixture(deployFixture);

      const tx = await vennVaultL2.setAllowOperatorClaim(true);
      await expect(tx).to.emit(vennVaultL2, "AllowOperatorClaimUpdated").withArgs(true);
      expect(await vennVaultL2.allowOperatorClaim()).to.be.true;

      const tx2 = await vennVaultL2.setAllowOperatorClaim(false);
      await expect(tx2).to.emit(vennVaultL2, "AllowOperatorClaimUpdated").withArgs(false);
      expect(await vennVaultL2.allowOperatorClaim()).to.be.false;
    });

    it("should revert if caller is not the admin", async () => {
      const { vennVaultL2, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennVaultL2.ADMIN_ROLE()}`;

      await expect(vennVaultL2.connect(NON_ADMIN).setAllowOperatorClaim(true)).to.be.revertedWith(reason);
    });
  });

  describe("#setAttestationCenter", () => {
    it("should set attestation center", async () => {
      const { vennVaultL2, ADMIN } = await loadFixture(deployFixture);

      const tx = await vennVaultL2.setAttestationCenter(ADMIN);
      await expect(tx).to.emit(vennVaultL2, "AttestationCenterUpdated").withArgs(ADMIN);
      expect(await vennVaultL2.attestationCenter()).to.eq(await ADMIN.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { vennVaultL2, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennVaultL2.ADMIN_ROLE()}`;

      await expect(vennVaultL2.connect(NON_ADMIN).setAttestationCenter(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });

  describe("#setL2AvsTreasury", () => {
    it("should set l2 avs treasury", async () => {
      const { vennVaultL2, ADMIN } = await loadFixture(deployFixture);

      const tx = await vennVaultL2.setL2AvsTreasury(ADMIN);
      await expect(tx).to.emit(vennVaultL2, "L2AvsTreasuryUpdated").withArgs(ADMIN);
      expect(await vennVaultL2.l2AvsTreasury()).to.eq(await ADMIN.getAddress());
    });

    it("should revert if caller is not the admin", async () => {
      const { vennVaultL2, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennVaultL2.ADMIN_ROLE()}`;

      await expect(vennVaultL2.connect(NON_ADMIN).setL2AvsTreasury(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });
});
