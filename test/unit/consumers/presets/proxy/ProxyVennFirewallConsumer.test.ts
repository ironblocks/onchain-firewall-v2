import { deployProxyVennFirewallConsumerMock, deployVennToken } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, FIREWALL] = await ethers.getSigners();

  const { vennToken } = await deployVennToken(0);
  const { proxyVennFirewallConsumerMock } = await deployProxyVennFirewallConsumerMock();

  return { consumer: proxyVennFirewallConsumerMock, initializer: vennToken, ADMIN, NON_ADMIN, FIREWALL };
}

describe("ProxyVennFirewallConsumer", () => {
  describe("_initializeFirewallAdmin", () => {
    it("should set the firewall admin", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      expect(await consumer.getNewFirewallAdmin()).to.equal(ZeroAddress);

      await consumer.initializeFirewallAdmin(ADMIN);

      expect(await consumer.getNewFirewallAdmin()).to.equal(ADMIN);
    });

    it("should revert if the firewall admin is zero address", async () => {
      const { consumer } = await loadFixture(deployFixture);

      await expect(consumer.initializeFirewallAdmin(ZeroAddress)).to.be.revertedWith(
        "ProxyFirewallConsumerBase: Zero address.",
      );
    });

    it("should revert if the firewall admin is already set", async () => {
      const { consumer, ADMIN } = await loadFixture(deployFixture);

      await consumer.initializeFirewallAdmin(ADMIN);
      await consumer.acceptFirewallAdmin();

      await expect(consumer.initializeFirewallAdmin(ADMIN)).to.be.revertedWith(
        "ProxyFirewallConsumerBase: Admin already set.",
      );
    });
  });

  describe("isAllowedInitializer", () => {
    it("should execute if the sender is the initializer", async () => {
      const { consumer, initializer } = await loadFixture(deployFixture);

      await consumer.setInitializerAddress(initializer);

      await expect(consumer.isAllowedInitializerFunction("0x" + 0n.toString(16).padStart(64, "0"))).to.not.be.reverted;
    });

    it("should revert if the sender is not the initializer", async () => {
      const { consumer, initializer, NON_ADMIN } = await loadFixture(deployFixture);

      await consumer.setInitializerAddress(initializer);

      await initializer.transferOwnership(NON_ADMIN);
      await initializer.connect(NON_ADMIN).acceptOwnership();

      await expect(consumer.isAllowedInitializerFunction("0x" + 0n.toString(16).padStart(64, "0"))).to.be.revertedWith(
        "ProxyFirewallConsumerBase: Sender is not allowed.",
      );
    });
  });
});
