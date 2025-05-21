import { execSafeTx } from "@/scripts/gnosis";
import {
  deployFirewall,
  deployFirewallModule,
  deployGnosisSafe,
  deployPolicyDeployer,
  deployTransientApprovedCallsPolicyFactory,
} from "@/test/fixtures";
import { encodeCreatePolicyData } from "@/test/unit/policies/factories/TransientApprovedCallsPolicyFactory.test";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, CONSUMER_1, CONSUMER_2, SIGNER_1, SIGNER_2] = await ethers.getSigners();
  const { firewall } = await deployFirewall();
  const { gnosisSafe } = await deployGnosisSafe(ADMIN);
  const { firewallModule } = await deployFirewallModule(gnosisSafe);
  const { policyDeployer } = await deployPolicyDeployer(firewallModule, ADMIN);
  const { transientApprovedCallsPolicyFactory: factory_1 } = await deployTransientApprovedCallsPolicyFactory();
  const { transientApprovedCallsPolicyFactory: factory_2 } = await deployTransientApprovedCallsPolicyFactory();

  await firewall.transferOwnership(gnosisSafe);
  await execSafeTx(gnosisSafe, {
    to: firewall,
    data: firewall.interface.encodeFunctionData("acceptOwnership"),
  });

  await execSafeTx(gnosisSafe, {
    to: firewallModule,
    data: firewallModule.interface.encodeFunctionData("setDeployersStatus", [
      [await policyDeployer.getAddress()],
      true,
    ]),
  });

  await execSafeTx(gnosisSafe, {
    to: firewallModule,
    data: firewallModule.interface.encodeFunctionData("setFirewallsStatus", [[await firewall.getAddress()], true]),
  });

  return {
    firewall,
    firewallModule,
    policyDeployer,
    ADMIN,
    NON_ADMIN,
    factory_1,
    factory_2,
    SIGNER_1,
    SIGNER_2,
    CONSUMER_1,
    CONSUMER_2,
  };
}

describe("PolicyDeployer", () => {
  describe("#constructor", () => {
    it("should set correct data after creation", async () => {
      const { firewallModule, policyDeployer, ADMIN } = await loadFixture(deployFixture);

      expect(await policyDeployer.firewallModule()).to.equal(firewallModule);

      expect(await policyDeployer.hasRole(await policyDeployer.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
    });
  });

  describe("#deployPolicies", () => {
    it("should deploy policies", async () => {
      const { firewall, policyDeployer, ADMIN, factory_1, factory_2, SIGNER_1, SIGNER_2, CONSUMER_1, CONSUMER_2 } =
        await loadFixture(deployFixture);

      await policyDeployer.setFactoryStatuses([factory_1, factory_2], [true, true]);

      const data_1 = await encodeCreatePolicyData(firewall, ADMIN, ADMIN, [SIGNER_1], [CONSUMER_1], [true]);
      const data_2 = await encodeCreatePolicyData(firewall, ADMIN, ADMIN, [SIGNER_2], [CONSUMER_2], [true]);

      const policies = await policyDeployer.deployPolicies.staticCall(
        firewall,
        [factory_1, factory_2],
        [data_1, data_2],
      );
      const tx = await policyDeployer.deployPolicies(firewall, [factory_1, factory_2], [data_1, data_2]);
      await expect(tx).to.emit(policyDeployer, "PolicyCreated").withArgs(factory_1, policies[0]);
      await expect(tx).to.emit(policyDeployer, "PolicyCreated").withArgs(factory_2, policies[1]);

      expect(await firewall.approvedPolicies(policies[0])).to.be.true;
      expect(await firewall.approvedPolicies(policies[1])).to.be.true;
    });

    it("should revert if the length of the arrays do not match", async () => {
      const { firewall, policyDeployer, factory_1 } = await loadFixture(deployFixture);

      await expect(policyDeployer.deployPolicies(firewall, [factory_1], [])).to.be.revertedWith(
        "PolicyDeployer: Length mismatch.",
      );
    });

    it("should revert if the factory is not approved", async () => {
      const { firewall, policyDeployer, ADMIN, factory_1, factory_2, SIGNER_1, SIGNER_2, CONSUMER_1, CONSUMER_2 } =
        await loadFixture(deployFixture);

      await policyDeployer.setFactoryStatuses([factory_1, factory_2], [true, false]);

      const data_1 = await encodeCreatePolicyData(firewall, ADMIN, ADMIN, [SIGNER_1], [CONSUMER_1], [true]);
      const data_2 = await encodeCreatePolicyData(firewall, ADMIN, ADMIN, [SIGNER_2], [CONSUMER_2], [true]);

      await expect(
        policyDeployer.deployPolicies(firewall, [factory_1, factory_2], [data_1, data_2]),
      ).to.be.revertedWith("PolicyDeployer: Factory not approved.");
    });
  });

  describe("#setFactoryStatuses", () => {
    it("should set factory statuses", async () => {
      const { policyDeployer, factory_1, factory_2 } = await loadFixture(deployFixture);

      const tx = await policyDeployer.setFactoryStatuses([factory_1, factory_2], [true, false]);
      await expect(tx).to.emit(policyDeployer, "FactoryStatusSet").withArgs(factory_1, true);
      await expect(tx).to.emit(policyDeployer, "FactoryStatusSet").withArgs(factory_2, false);

      expect(await policyDeployer.approvedFactories(factory_1)).to.be.true;
      expect(await policyDeployer.approvedFactories(factory_2)).to.be.false;
    });

    it("should revert if the length of the arrays do not match", async () => {
      const { policyDeployer, factory_1 } = await loadFixture(deployFixture);

      await expect(policyDeployer.setFactoryStatuses([factory_1], [true, false])).to.be.revertedWith(
        "PolicyDeployer: Length mismatch.",
      );
    });

    it("should revert if the caller is not the admin", async () => {
      const { policyDeployer, factory_1, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await policyDeployer.ADMIN_ROLE()}`;

      await expect(policyDeployer.connect(NON_ADMIN).setFactoryStatuses([factory_1], [true])).to.be.revertedWith(
        reason,
      );
    });
  });

  describe("#setFirewallModule", () => {
    it("should set the firewall module", async () => {
      const { policyDeployer, NON_ADMIN } = await loadFixture(deployFixture);

      const tx = await policyDeployer.setFirewallModule(NON_ADMIN);
      await expect(tx).to.emit(policyDeployer, "FirewallModuleSet").withArgs(NON_ADMIN);

      expect(await policyDeployer.firewallModule()).to.equal(NON_ADMIN);
    });

    it("should revert if the caller is not the admin", async () => {
      const { policyDeployer, firewallModule, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await policyDeployer.ADMIN_ROLE()}`;

      await expect(policyDeployer.connect(NON_ADMIN).setFirewallModule(firewallModule)).to.be.revertedWith(reason);
    });
  });
});
