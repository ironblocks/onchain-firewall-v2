import { deployBeaconProxyVennFirewallConsumer } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, FIREWALL] = await ethers.getSigners();

  const { beaconProxyVennFirewallConsumer } = await deployBeaconProxyVennFirewallConsumer();

  return { consumer: beaconProxyVennFirewallConsumer, ADMIN, NON_ADMIN, FIREWALL };
}

describe("BeaconProxyVennFirewallConsumer", () => {
  it("should initialize the firewall admin", async () => {
    const { consumer, ADMIN } = await loadFixture(deployFixture);

    await consumer.initializeFirewallAdmin(ADMIN);

    await consumer.acceptFirewallAdmin();

    expect(await consumer.firewallAdmin()).to.equal(ADMIN);
  });

  it("should revert if the admin is already set", async () => {
    const { consumer, ADMIN } = await loadFixture(deployFixture);

    await consumer.initializeFirewallAdmin(ADMIN);
    await consumer.acceptFirewallAdmin();

    await expect(consumer.initializeFirewallAdmin(ADMIN)).to.be.revertedWith(
      "ProxyFirewallConsumerBase: Admin already set.",
    );
  });

  it("should revert if called by a non-admin", async () => {
    const { consumer, NON_ADMIN } = await loadFixture(deployFixture);

    await expect(consumer.connect(NON_ADMIN).initializeFirewallAdmin(NON_ADMIN)).to.be.revertedWith(
      "ProxyFirewallConsumerBase: Sender is not allowed.",
    );
  });
});
