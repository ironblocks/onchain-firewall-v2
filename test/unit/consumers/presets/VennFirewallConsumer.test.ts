import { deployVennFirewallConsumerMock } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, FIREWALL] = await ethers.getSigners();

  const { vennFirewallConsumerMock } = await deployVennFirewallConsumerMock(FIREWALL, ADMIN);

  return { consumer: vennFirewallConsumerMock, ADMIN, FIREWALL };
}

describe("VennFirewallConsumer", () => {
  describe("constructor", () => {
    it("should set the firewall and firewall admin", async () => {
      const { consumer, ADMIN, FIREWALL } = await loadFixture(deployFixture);

      expect(await consumer.firewallAdmin()).to.equal(ADMIN);
      expect(await consumer.getFirewall()).to.equal(FIREWALL);
    });
  });
});
