import { deployAttestationCenterProxy, deployFirewallMock, deployVennFirewallConsumerBaseMock } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, FEE_POOL, ATTESTATION_CENTER] = await ethers.getSigners();

  const { firewallMock } = await deployFirewallMock();

  const { attestationCenterProxy } = await deployAttestationCenterProxy(ATTESTATION_CENTER, FEE_POOL, ADMIN);
  const { vennFirewallConsumerBaseMock } = await deployVennFirewallConsumerBaseMock();

  return { consumer: vennFirewallConsumerBaseMock, firewall: firewallMock, attestationCenterProxy, ADMIN, NON_ADMIN };
}

describe("VennFirewallConsumerBase", () => {
  const ACTIVE = 1;
  const INACTIVE = 0;

  describe("storage", () => {
    it("should not have storage slots", async () => {
      const { consumer } = await loadFixture(deployFixture);

      const storage = await ethers.provider.getStorage(consumer, 0);
      expect(storage).to.equal("0x" + 234554321n.toString(16).padStart(64, "0"));
    });
  });

  describe("#safeFunctionCall", () => {
    it("should call this contract", async () => {
      const { consumer } = await loadFixture(deployFixture);

      const tx = await consumer.safeFunctionCall(
        0,
        "0x",
        consumer.interface.encodeFunctionData("arbitraryCall", ["0x12"]),
      );
      await expect(tx).to.emit(consumer, "ArbitraryCall").withArgs("0x12");
    });

    it("should revert if function is non-payable, but value is provided", async () => {
      const { consumer } = await loadFixture(deployFixture);

      await expect(
        consumer.safeFunctionCall(0, "0x", consumer.interface.encodeFunctionData("arbitraryCall", ["0x12"]), {
          value: 123,
        }),
      ).to.be.revertedWith("Address: low-level delegate call failed");
    });

    it("should revert if the user native fee is not enough", async () => {
      const { consumer } = await loadFixture(deployFixture);

      await expect(consumer.safeFunctionCall(100, "0x", "0x")).to.be.revertedWithCustomError(consumer, "NotEnoughFee");
    });

    it("should revert if the proxy call fails", async () => {
      const { consumer, ADMIN, attestationCenterProxy } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);
      await consumer.setAttestationCenterProxy(attestationCenterProxy);

      await expect(consumer.safeFunctionCall(0, "0x12", "0x"))
        .to.be.revertedWithCustomError(consumer, "ProxyCallFailed")
        .withArgs("0x");
    });

    it("should set safe call flags", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.safeFunctionCall(0, "0x", consumer.interface.encodeFunctionData("saveSafeFunctionCallFlag"), {
        value: 123,
      });

      expect(await consumer.safeFunctionCaller()).to.equal(await ADMIN.getAddress());
      expect(await consumer.safeFunctionCallFlag()).to.equal(1);
      expect(await consumer.userPaidFee()).to.equal(0);
    });
  });

  describe("#setAttestationCenterProxy", () => {
    it("should set the attestation center proxy", async () => {
      const { consumer, attestationCenterProxy, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      expect(await consumer.attestationCenter()).to.equal(ZeroAddress);

      const tx = await consumer.setAttestationCenterProxy(attestationCenterProxy);
      await expect(tx).to.emit(consumer, "AttestationCenterProxyUpdated").withArgs(attestationCenterProxy);

      expect(await consumer.attestationCenter()).to.equal(await attestationCenterProxy.getAddress());
    });

    it("should set zero address", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      const tx = await consumer.setAttestationCenterProxy(ZeroAddress);
      await expect(tx).to.emit(consumer, "AttestationCenterProxyUpdated").withArgs(ZeroAddress);

      expect(await consumer.attestationCenter()).to.equal(ZeroAddress);
    });

    it("should revert if the attestation center proxy is not supported", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      await expect(consumer.setAttestationCenterProxy(ADMIN)).to.be.reverted;
    });

    it("should revert if the caller is not the admin", async () => {
      const { consumer, NON_ADMIN } = await loadFixture(deployFixture);
      await expect(consumer.connect(NON_ADMIN).setAttestationCenterProxy(NON_ADMIN)).to.be.revertedWithCustomError(
        consumer,
        "NotFirewallAdmin",
      );
    });
  });

  describe("#firewallAdmin", () => {
    it("should return the firewall admin", async () => {
      const { consumer, ADMIN, NON_ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      await consumer.setFirewallAdmin(NON_ADMIN);
      await consumer.connect(NON_ADMIN).acceptFirewallAdmin();

      expect(await consumer.firewallAdmin()).to.equal(await NON_ADMIN.getAddress());
    });
  });

  describe("#setFirewall", () => {
    it("should set the firewall", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      expect(await consumer.firewall()).to.equal(ZeroAddress);

      const tx = await consumer.setFirewall(ADMIN);
      await expect(tx).to.emit(consumer, "FirewallUpdated").withArgs(ADMIN);

      expect(await consumer.firewall()).to.equal(await ADMIN.getAddress());
    });

    it("should revert if the caller is not the firewall admin", async () => {
      const { consumer, NON_ADMIN } = await loadFixture(deployFixture);

      await expect(consumer.connect(NON_ADMIN).setFirewall(NON_ADMIN)).to.be.revertedWithCustomError(
        consumer,
        "NotFirewallAdmin",
      );
    });
  });

  describe("#setFirewallAdmin", () => {
    it("should set the new firewall admin", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      expect(await consumer.newFirewallAdmin()).to.equal(ZeroAddress);

      await consumer.setFirewallAdmin(ADMIN);
      expect(await consumer.newFirewallAdmin()).to.equal(await ADMIN.getAddress());

      await expect(consumer.acceptFirewallAdmin()).to.emit(consumer, "FirewallAdminUpdated").withArgs(ADMIN);

      expect(await consumer.firewallAdmin()).to.equal(await ADMIN.getAddress());
      expect(await consumer.newFirewallAdmin()).to.equal(ZeroAddress);
    });

    it("should revert if the caller is not the admin", async () => {
      const { consumer, NON_ADMIN } = await loadFixture(deployFixture);

      await expect(consumer.connect(NON_ADMIN).setFirewallAdmin(NON_ADMIN)).to.be.revertedWithCustomError(
        consumer,
        "NotFirewallAdmin",
      );
    });
  });

  describe("#acceptFirewallAdmin", () => {
    it("should accept the new firewall admin", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);

      await consumer.setFirewallAdmin(ADMIN);
      await expect(consumer.acceptFirewallAdmin()).to.emit(consumer, "FirewallAdminUpdated").withArgs(ADMIN);

      expect(await consumer.firewallAdmin()).to.equal(await ADMIN.getAddress());
    });

    it("should revert if the caller is not the new firewall admin", async () => {
      const { consumer, NON_ADMIN } = await loadFixture(deployFixture);

      await expect(consumer.connect(NON_ADMIN).acceptFirewallAdmin()).to.be.revertedWithCustomError(
        consumer,
        "NotNewFirewallAdmin",
      );
    });
  });

  describe("#_msgValue", () => {
    it("should return the value without the fee", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      const initialValue = 1000;
      const fee = 123;

      const value = await consumer.setSafeFunctionCallFlagAndReturnMsgValue.staticCall(ADMIN, ACTIVE, fee, {
        value: initialValue,
      });

      expect(value).to.equal(initialValue - fee);
    });

    it("should return the value if caller is not the safe function caller", async () => {
      const { consumer, NON_ADMIN } = await loadFixture(deployFixture);

      const initialValue = 1000;
      const fee = 123;

      const value = await consumer.setSafeFunctionCallFlagAndReturnMsgValue.staticCall(NON_ADMIN, ACTIVE, fee, {
        value: initialValue,
      });

      expect(value).to.equal(initialValue);
    });

    it("should return the value if the safe function call flag is not set", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      const initialValue = 1000;
      const fee = 123;

      const value = await consumer.setSafeFunctionCallFlagAndReturnMsgValue.staticCall(ADMIN, INACTIVE, fee, {
        value: initialValue,
      });

      expect(value).to.equal(initialValue);
    });
  });

  describe("#firewallProtected", () => {
    it("should call firewall and function itself", async () => {
      const { consumer, firewall, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);
      await consumer.setFirewall(firewall);

      const value = 123;
      const fee = 100;

      const tx = await consumer.setSafeFunctionCallFlagAndCallFunction(
        ADMIN,
        ACTIVE,
        fee,
        consumer.interface.encodeFunctionData("firewallProtectedFunction"),
        {
          value: value,
        },
      );
      await expect(tx).to.emit(consumer, "ArbitraryCall").withArgs("0x");
      await expect(tx)
        .to.emit(firewall, "PreExecution")
        .withArgs(ADMIN, consumer.interface.encodeFunctionData("firewallProtectedFunction"), value - fee);
      await expect(tx)
        .to.emit(firewall, "PostExecution")
        .withArgs(ADMIN, consumer.interface.encodeFunctionData("firewallProtectedFunction"), value - fee);
    });

    it("should revert if the pre-execution fails", async () => {
      const { consumer, firewall, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);
      await consumer.setFirewall(firewall);

      await firewall.setPreExecutionFails(true);

      await expect(consumer.firewallProtectedFunction({ value: 123 })).to.be.revertedWith("Pre-execution failed");
    });

    it("should revert if the post-execution fails", async () => {
      const { consumer, firewall, ADMIN } = await loadFixture(deployFixture);

      await consumer.setFirewallAdminMock(ADMIN);
      await consumer.setFirewall(firewall);

      await firewall.setPostExecutionFails(true);

      await expect(consumer.firewallProtectedFunction({ value: 123 })).to.be.revertedWith("Post-execution failed");
    });

    it("should just call the function if the firewall is not set", async () => {
      const { consumer, firewall } = await loadFixture(deployFixture);

      const tx = await consumer.firewallProtectedFunction({ value: 123 });
      await expect(tx).to.emit(consumer, "ArbitraryCall").withArgs("0x");
      await expect(tx).to.not.emit(firewall, "PreExecution");
      await expect(tx).to.not.emit(firewall, "PostExecution");
    });
  });
});
