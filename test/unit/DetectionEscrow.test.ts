import { deployAttestationCenter, deployDetectionEscrow, deployOBLS, deployProtocolRegistry } from "@/test/fixtures";
import { defaultProtocolRegistryInitData } from "@/test/unit/ProtocolRegisrty.test";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumberish, formatUnits, parseEther } from "ethers";
import { ethers } from "hardhat";

const OPERATOR_PAYMENT = BigInt(parseEther("1"));

function fromFeeScale(amount: BigNumberish) {
  return BigInt(Number(formatUnits(amount.toString(), 6)));
}

async function deployFixture() {
  const [OWNER, VENN_FEE_RECIPIENT, OPERATOR, PROTOCOL_ADMIN] = await ethers.getSigners();

  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);
  const { protocolRegistry } = await deployProtocolRegistry(
    OWNER,
    defaultProtocolRegistryInitData(attestationCenter, VENN_FEE_RECIPIENT),
  );

  const { detectionEscrow } = await deployDetectionEscrow(protocolRegistry, PROTOCOL_ADMIN, OPERATOR);
  await OWNER.sendTransaction({
    to: detectionEscrow.getAddress(),
    value: OPERATOR_PAYMENT,
  });

  return { OWNER, detectionEscrow, protocolRegistry, PROTOCOL_ADMIN, OPERATOR, VENN_FEE_RECIPIENT };
}

describe("DetectionEscrow", () => {
  describe("#constructor", () => {
    it("should set correct data after creation", async () => {
      const { detectionEscrow, protocolRegistry, PROTOCOL_ADMIN, OPERATOR } = await loadFixture(deployFixture);

      expect(await detectionEscrow.protocolRegistry()).to.eq(protocolRegistry);
      expect(await detectionEscrow.protocolAdmin()).to.eq(PROTOCOL_ADMIN);
      expect(await detectionEscrow.operator()).to.eq(OPERATOR);
    });
  });

  describe("#approveClaimPayment", () => {
    it("should approve the payment", async () => {
      const { detectionEscrow, protocolRegistry, PROTOCOL_ADMIN, OPERATOR, VENN_FEE_RECIPIENT } =
        await loadFixture(deployFixture);

      await detectionEscrow.connect(OPERATOR)["initializeClaimPayment(uint256)"](OPERATOR_PAYMENT);

      const vennDetectionFee = await protocolRegistry.vennDetectionFee();
      const vennDetectionFeeAmount = fromFeeScale(vennDetectionFee * OPERATOR_PAYMENT);
      const operatorPayment = OPERATOR_PAYMENT - vennDetectionFeeAmount;
      const tx = await detectionEscrow.connect(PROTOCOL_ADMIN).approveClaimPayment(OPERATOR_PAYMENT);

      await expect(tx).to.emit(detectionEscrow, "PaymentApproved").withArgs(OPERATOR_PAYMENT);
      await expect(tx).to.emit(detectionEscrow, "PaymentSent").withArgs(operatorPayment);
      await expect(tx).to.emit(detectionEscrow, "VennFeeSent").withArgs(vennDetectionFeeAmount);

      await expect(tx).to.changeEtherBalances(
        [detectionEscrow, OPERATOR, VENN_FEE_RECIPIENT],
        [-OPERATOR_PAYMENT, operatorPayment, vennDetectionFeeAmount],
      );
    });

    it("should revert if the caller is not the protocol admin", async () => {
      const { detectionEscrow } = await loadFixture(deployFixture);

      await expect(detectionEscrow.approveClaimPayment(OPERATOR_PAYMENT)).to.be.revertedWith(
        "DetectionEscrow: Only protocol admin.",
      );
    });

    it("should revert if the amount is not the same as the pending operator payment", async () => {
      const { detectionEscrow, PROTOCOL_ADMIN, OPERATOR } = await loadFixture(deployFixture);

      await detectionEscrow.connect(OPERATOR)["initializeClaimPayment(uint256)"](OPERATOR_PAYMENT);

      await expect(detectionEscrow.connect(PROTOCOL_ADMIN).approveClaimPayment(0)).to.be.revertedWith(
        "DetectionEscrow: Amount mismatch.",
      );
    });

    it("should revert if the contract does not have enough balance", async () => {
      const { detectionEscrow, PROTOCOL_ADMIN, OPERATOR } = await loadFixture(deployFixture);

      await detectionEscrow.connect(OPERATOR)["initializeClaimPayment(uint256)"](OPERATOR_PAYMENT + 1n);

      await expect(
        detectionEscrow.connect(PROTOCOL_ADMIN).approveClaimPayment(OPERATOR_PAYMENT + 1n),
      ).to.be.revertedWith("DetectionEscrow: Insufficient balance.");
    });

    it("should revert if the pending operator payment is 0", async () => {
      const { detectionEscrow, PROTOCOL_ADMIN } = await loadFixture(deployFixture);

      await expect(detectionEscrow.connect(PROTOCOL_ADMIN).approveClaimPayment(0)).to.be.revertedWith(
        "DetectionEscrow: No pending payment.",
      );
    });
  });

  describe("#withdrawFunds", () => {
    it("should withdraw the funds", async () => {
      const { detectionEscrow, PROTOCOL_ADMIN } = await loadFixture(deployFixture);

      const tx = await detectionEscrow.connect(PROTOCOL_ADMIN).withdrawFunds(OPERATOR_PAYMENT);
      await expect(tx).to.emit(detectionEscrow, "FundsWithdrawn").withArgs(OPERATOR_PAYMENT);
      await expect(tx).to.changeEtherBalances([detectionEscrow, PROTOCOL_ADMIN], [-OPERATOR_PAYMENT, OPERATOR_PAYMENT]);
    });

    it("should revert if the caller is not the protocol admin", async () => {
      const { detectionEscrow } = await loadFixture(deployFixture);

      await expect(detectionEscrow.withdrawFunds(OPERATOR_PAYMENT)).to.be.revertedWith(
        "DetectionEscrow: Only protocol admin.",
      );
    });
  });

  describe("#initializeClaimPayment(uint256,string)", () => {
    const amount = BigInt(parseEther("100"));
    const invoiceDetails = "Invoice details";

    it("should initialize the claim payment", async () => {
      const { detectionEscrow, OPERATOR } = await loadFixture(deployFixture);

      const tx = await detectionEscrow
        .connect(OPERATOR)
        ["initializeClaimPayment(uint256,string)"](amount, invoiceDetails);

      await expect(tx).to.emit(detectionEscrow, "PaymentRequested").withArgs(amount, invoiceDetails);

      expect(await detectionEscrow.pendingOperatorPayment()).to.eq(amount);
    });

    it("should revert if the caller is not the operator", async () => {
      const { detectionEscrow } = await loadFixture(deployFixture);

      await expect(
        detectionEscrow["initializeClaimPayment(uint256,string)"](amount, invoiceDetails),
      ).to.be.revertedWith("DetectionEscrow: Only operator.");
    });
  });

  describe("#initializeClaimPayment(uint256)", () => {
    const amount = BigInt(parseEther("100"));

    it("should initialize the claim payment", async () => {
      const { detectionEscrow, OPERATOR } = await loadFixture(deployFixture);

      const tx = await detectionEscrow.connect(OPERATOR)["initializeClaimPayment(uint256)"](amount);

      await expect(tx).to.emit(detectionEscrow, "PaymentRequested").withArgs(amount, "");

      expect(await detectionEscrow.pendingOperatorPayment()).to.eq(amount);
    });

    it("should revert if the caller is not the operator", async () => {
      const { detectionEscrow } = await loadFixture(deployFixture);

      await expect(detectionEscrow["initializeClaimPayment(uint256)"](amount)).to.be.revertedWith(
        "DetectionEscrow: Only operator.",
      );
    });
  });
});
