import { execSafeTx } from "@/scripts/gnosis";
import { deployFirewall, deployFirewallModule, deployGnosisSafe } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, DEPLOYER_1, DEPLOYER_2, FIREWALL_2, POLICY] = await ethers.getSigners();

  const { firewall } = await deployFirewall();
  const { gnosisSafe } = await deployGnosisSafe(ADMIN);
  const { firewallModule } = await deployFirewallModule(gnosisSafe);

  await firewall.transferOwnership(gnosisSafe);
  await execSafeTx(gnosisSafe, {
    to: await firewall.getAddress(),
    data: firewall.interface.encodeFunctionData("acceptOwnership"),
  });

  return { gnosisSafe, module: firewallModule, firewall, ADMIN, DEPLOYER_1, DEPLOYER_2, FIREWALL_2, POLICY };
}

describe("FirewallModule", () => {
  describe("#constructor", () => {
    it("should set the gnosisSafe address", async () => {
      const { gnosisSafe, module } = await loadFixture(deployFixture);

      expect(await module.gnosisSafe()).to.be.equal(await gnosisSafe.getAddress());
    });
  });

  describe("#approvePolicy", () => {
    it("should approve a policy", async () => {
      const { gnosisSafe, module, firewall, ADMIN, POLICY } = await loadFixture(deployFixture);
      await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setDeployersStatus", [[await ADMIN.getAddress()], true]),
      });
      await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setFirewallsStatus", [[await firewall.getAddress()], true]),
      });

      const tx = await module.approvePolicy(POLICY, firewall);
      await expect(tx).to.emit(firewall, "PolicyStatusUpdate").withArgs(POLICY, true);

      expect(await firewall.approvedPolicies(POLICY)).to.be.true;
    });

    it("should revert if the caller is not approved", async () => {
      const { module, firewall, gnosisSafe, POLICY } = await loadFixture(deployFixture);

      await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setFirewallsStatus", [[await firewall.getAddress()], true]),
      });

      const tx = module.approvePolicy(POLICY, firewall);
      await expect(tx).to.be.revertedWith("FirewallModule: Not approved deployer.");
    });

    it("should revert if the firewall is not approved", async () => {
      const { module, firewall, gnosisSafe, POLICY, ADMIN } = await loadFixture(deployFixture);

      await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setDeployersStatus", [[await ADMIN.getAddress()], true]),
      });

      const tx = module.approvePolicy(POLICY, firewall);
      await expect(tx).to.be.revertedWith("FirewallModule: Not approved firewall.");
    });

    it("should revert if the firewall call fails", async () => {
      const { module, gnosisSafe, POLICY, ADMIN } = await loadFixture(deployFixture);

      await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setDeployersStatus", [[await ADMIN.getAddress()], true]),
      });
      await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setFirewallsStatus", [[await module.getAddress()], true]),
      });

      const tx = module.approvePolicy(POLICY, module);
      await expect(tx).to.be.revertedWith("FirewallModule: Could not execute.");
    });
  });

  describe("#setDeployersStatus", () => {
    it("should set the deployers status", async () => {
      const { gnosisSafe, module, DEPLOYER_1, DEPLOYER_2 } = await loadFixture(deployFixture);

      const tx = await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setDeployersStatus", [
          [await DEPLOYER_1.getAddress(), await DEPLOYER_2.getAddress()],
          true,
        ]),
      });
      await expect(tx).to.emit(module, "DeployerStatusSet").withArgs(DEPLOYER_1, true);
      await expect(tx).to.emit(module, "DeployerStatusSet").withArgs(DEPLOYER_2, true);

      expect(await module.approvedDeployers(DEPLOYER_1)).to.be.true;
      expect(await module.approvedDeployers(DEPLOYER_2)).to.be.true;

      const tx2 = await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setDeployersStatus", [
          [await DEPLOYER_1.getAddress(), await DEPLOYER_2.getAddress()],
          false,
        ]),
      });
      await expect(tx2).to.emit(module, "DeployerStatusSet").withArgs(DEPLOYER_1, false);
      await expect(tx2).to.emit(module, "DeployerStatusSet").withArgs(DEPLOYER_2, false);

      expect(await module.approvedDeployers(DEPLOYER_1)).to.be.false;
      expect(await module.approvedDeployers(DEPLOYER_2)).to.be.false;
    });

    it("should revert if the caller is not the gnosisSafe", async () => {
      const { module, DEPLOYER_1 } = await loadFixture(deployFixture);

      const tx = module.setDeployersStatus([DEPLOYER_1], true);
      await expect(tx).to.be.revertedWith("FirewallModule: Only gnosis safe.");
    });
  });

  describe("#setFirewallsStatus", () => {
    it("should set the firewalls status", async () => {
      const { gnosisSafe, module, firewall, FIREWALL_2 } = await loadFixture(deployFixture);

      const tx = await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setFirewallsStatus", [
          [await firewall.getAddress(), await FIREWALL_2.getAddress()],
          true,
        ]),
      });
      await expect(tx).to.emit(module, "FirewallStatusSet").withArgs(firewall, true);
      await expect(tx).to.emit(module, "FirewallStatusSet").withArgs(FIREWALL_2, true);

      expect(await module.approvedFirewalls(firewall)).to.be.true;
      expect(await module.approvedFirewalls(FIREWALL_2)).to.be.true;

      const tx2 = await execSafeTx(gnosisSafe, {
        to: await module.getAddress(),
        data: module.interface.encodeFunctionData("setFirewallsStatus", [
          [await firewall.getAddress(), await FIREWALL_2.getAddress()],
          false,
        ]),
      });
      await expect(tx2).to.emit(module, "FirewallStatusSet").withArgs(firewall, false);
      await expect(tx2).to.emit(module, "FirewallStatusSet").withArgs(FIREWALL_2, false);

      expect(await module.approvedFirewalls(firewall)).to.be.false;
      expect(await module.approvedFirewalls(FIREWALL_2)).to.be.false;
    });

    it("should revert if the caller is not the gnosisSafe", async () => {
      const { module, firewall } = await loadFixture(deployFixture);

      const tx = module.setFirewallsStatus([firewall], true);
      await expect(tx).to.be.revertedWith("FirewallModule: Only gnosis safe.");
    });
  });
});
