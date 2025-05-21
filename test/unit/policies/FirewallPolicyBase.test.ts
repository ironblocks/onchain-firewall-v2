import { deployFirewallPolicyBase } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADDRESS_1, ADDRESS_2] = await ethers.getSigners();

  const { firewallPolicyBase } = await deployFirewallPolicyBase();
  return { firewallPolicyBase, ADDRESS_1, ADDRESS_2 };
}

describe("FirewallPolicyBase", () => {
  describe("#_setConsumersStatuses", () => {
    it("should set the correct consumer statuses", async () => {
      const { firewallPolicyBase, ADDRESS_1, ADDRESS_2 } = await loadFixture(deployFixture);

      const tx = await firewallPolicyBase.setConsumersStatuses([ADDRESS_1, ADDRESS_2], [true, false]);
      await expect(tx).to.emit(firewallPolicyBase, "ConsumerStatusSet").withArgs(ADDRESS_1, true);
      await expect(tx).to.emit(firewallPolicyBase, "ConsumerStatusSet").withArgs(ADDRESS_2, false);

      expect(await firewallPolicyBase.approvedConsumer(ADDRESS_1)).to.be.true;
      expect(await firewallPolicyBase.approvedConsumer(ADDRESS_2)).to.be.false;
    });
  });

  describe("#_setExecutorStatus", () => {
    it("should set the correct executor status", async () => {
      const { firewallPolicyBase, ADDRESS_1 } = await loadFixture(deployFixture);

      const tx = await firewallPolicyBase.setExecutorStatus(ADDRESS_1, true);
      await expect(tx).to.emit(firewallPolicyBase, "ExecutorStatusSet").withArgs(ADDRESS_1, true);

      expect(await firewallPolicyBase.authorizedExecutors(ADDRESS_1)).to.be.true;
    });
  });

  describe("#onlyAuthorized", () => {
    it("should work if the executor is authorized and the consumer is approved", async () => {
      const { firewallPolicyBase, ADDRESS_1 } = await loadFixture(deployFixture);
      await firewallPolicyBase.setExecutorStatus(ADDRESS_1, true);
      await firewallPolicyBase.setConsumersStatuses([ADDRESS_1], [true]);

      await firewallPolicyBase.onlyAuthorized(ADDRESS_1);
    });

    it("should revert if the executor is not authorized", async () => {
      const { firewallPolicyBase, ADDRESS_1 } = await loadFixture(deployFixture);
      await firewallPolicyBase.setConsumersStatuses([ADDRESS_1], [true]);

      await expect(firewallPolicyBase.onlyAuthorized(ADDRESS_1)).to.be.revertedWith(
        "FirewallPolicyBase: Only authorized executor.",
      );
    });

    it("should revert if the consumer is not approved", async () => {
      const { firewallPolicyBase, ADDRESS_1 } = await loadFixture(deployFixture);
      await firewallPolicyBase.setExecutorStatus(ADDRESS_1, true);

      await expect(firewallPolicyBase.onlyAuthorized(ADDRESS_1)).to.be.revertedWith(
        "FirewallPolicyBase: Only approved consumers.",
      );
    });
  });
});
