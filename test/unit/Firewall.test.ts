import { deployConsumer, deployFirewall, deployFirewallV20, deployPolicy } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";
import { getErrorBytes } from "../helpers";

async function deployFixture() {
  const [OWNER, NOT_OWNER] = await ethers.getSigners();

  const { firewallImplementation, firewall } = await deployFirewall();

  const { firewallV20Implementation } = await deployFirewallV20();

  const { policy } = await deployPolicy(firewall);
  const { policy: policy2 } = await deployPolicy(firewall);

  const { consumer } = await deployConsumer(firewall);

  return { OWNER, NOT_OWNER, firewallImplementation, firewall, firewallV20Implementation, consumer, policy, policy2 };
}

describe("Firewall", function () {
  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { firewallImplementation } = await loadFixture(deployFixture);

        await expect(firewallImplementation.__Firewall_init()).to.be.revertedWith(reason);
      });
    });

    describe("#__Firewall_init", () => {
      it("should set correct data after creation", async () => {
        const { firewall, OWNER } = await loadFixture(deployFixture);

        expect(await firewall.owner()).to.eq(await OWNER.getAddress());
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { firewall } = await loadFixture(deployFixture);

        await expect(firewall.__Firewall_init()).to.be.revertedWith(reason);
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { firewall, firewallV20Implementation } = await loadFixture(deployFixture);

        await firewall.upgradeTo(await firewallV20Implementation.getAddress());

        expect(await firewall.version()).to.eq(20);
      });
      it("should revert if caller is not the owner", async () => {
        const reason = "Ownable: caller is not the owner";

        const { firewall, NOT_OWNER } = await loadFixture(deployFixture);

        await expect(firewall.connect(NOT_OWNER).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { firewall } = await loadFixture(deployFixture);

        expect(await firewall.version()).to.eq(1);
      });
    });
  });

  describe("#preExecution", () => {
    const selector = "0x12345678";
    const data = selector + "12345678901234567890";
    const value = 1;

    describe("dryrun Enabled", () => {
      describe("policies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addPolicy(consumer, selector, policy);

          const tx = await consumer.preExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "DryrunPolicyPreSuccess").withArgs(consumer, selector, policy);
          await expect(tx).to.emit(policy, "PreExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should not revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addPolicy(consumer, selector, policy);

          await policy.setPreAlwaysFails(true);

          const tx = await consumer.preExecution(OWNER, data, value);
          const expectedErrorBytes = getErrorBytes("ConsumerMock: Pre always fails");
          await expect(tx)
            .to.emit(firewall, "DryrunPolicyPreError")
            .withArgs(consumer, selector, policy, expectedErrorBytes);
        });
      });

      describe("globalPolicies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addGlobalPolicy(consumer, policy);

          const tx = await consumer.preExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "GlobalDryrunPolicyPreSuccess").withArgs(consumer, policy);
          await expect(tx).to.emit(policy, "PreExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should not revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addGlobalPolicy(consumer, policy);

          await policy.setPreAlwaysFails(true);

          const tx = await consumer.preExecution(OWNER, data, value);
          const expectedErrorBytes = getErrorBytes("ConsumerMock: Pre always fails");
          await expect(tx)
            .to.emit(firewall, "GlobalDryrunPolicyPreError")
            .withArgs(consumer, policy, expectedErrorBytes);
        });
      });
    });

    describe("dryrun Disabled", () => {
      describe("policies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addPolicy(consumer, selector, policy);

          const tx = await consumer.preExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "PolicyPreSuccess").withArgs(consumer, selector, policy);
          await expect(tx).to.emit(policy, "PreExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addPolicy(consumer, selector, policy);

          await policy.setPreAlwaysFails(true);

          const tx = consumer.preExecution(OWNER, data, value);
          await expect(tx).to.be.revertedWith("ConsumerMock: Pre always fails");
        });
      });

      describe("globalPolicies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addGlobalPolicy(consumer, policy);

          const tx = await consumer.preExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "GlobalPolicyPreSuccess").withArgs(consumer, policy);
          await expect(tx).to.emit(policy, "PreExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addGlobalPolicy(consumer, policy);

          await policy.setPreAlwaysFails(true);

          const tx = consumer.preExecution(OWNER, data, value);
          await expect(tx).to.be.revertedWith("ConsumerMock: Pre always fails");
        });
      });
    });

    it("should not revert if provided data is not a valid selector", async () => {
      const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);

      await firewall.addGlobalPolicy(consumer, policy);

      const tx = consumer.preExecution(OWNER, "0x", value);
      await expect(tx).to.emit(policy, "PreExecutionMock").withArgs(consumer, OWNER, "0x", value);
    });
  });

  describe("#postExecution", () => {
    const selector = "0x12345678";
    const data = selector + "12345678901234567890";
    const value = 1;

    describe("dryrun Enabled", () => {
      describe("policies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addPolicy(consumer, selector, policy);

          const tx = await consumer.postExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "DryrunPolicyPostSuccess").withArgs(consumer, selector, policy);
          await expect(tx).to.emit(policy, "PostExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should not revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addPolicy(consumer, selector, policy);

          await policy.setPostAlwaysFails(true);

          const tx = consumer.postExecution(OWNER, data, value);
          const expectedErrorBytes = getErrorBytes("ConsumerMock: Post always fails");
          await expect(tx)
            .to.emit(firewall, "DryrunPolicyPostError")
            .withArgs(consumer, selector, policy, expectedErrorBytes);
        });
      });

      describe("globalPolicies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addGlobalPolicy(consumer, policy);

          const tx = await consumer.postExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "GlobalDryrunPolicyPostSuccess").withArgs(consumer, policy);
          await expect(tx).to.emit(policy, "PostExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should not revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, true);
          await firewall.addGlobalPolicy(consumer, policy);

          await policy.setPostAlwaysFails(true);

          const tx = consumer.postExecution(OWNER, data, value);
          const expectedErrorBytes = getErrorBytes("ConsumerMock: Post always fails");
          await expect(tx)
            .to.emit(firewall, "GlobalDryrunPolicyPostError")
            .withArgs(consumer, policy, expectedErrorBytes);
        });
      });
    });

    describe("dryrun Disabled", () => {
      describe("policies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addPolicy(consumer, selector, policy);

          const tx = await consumer.postExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "PolicyPostSuccess").withArgs(consumer, selector, policy);
          await expect(tx).to.emit(policy, "PostExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addPolicy(consumer, selector, policy);

          await policy.setPostAlwaysFails(true);

          const tx = consumer.postExecution(OWNER, data, value);
          await expect(tx).to.be.revertedWith("ConsumerMock: Post always fails");
        });
      });

      describe("globalPolicies", () => {
        it("should execute policy", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addGlobalPolicy(consumer, policy);

          const tx = await consumer.postExecution(OWNER, data, value);
          await expect(tx).to.emit(firewall, "GlobalPolicyPostSuccess").withArgs(consumer, policy);
          await expect(tx).to.emit(policy, "PostExecutionMock").withArgs(consumer, OWNER, data, value);
        });

        it("should revert if policy fails", async () => {
          const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);
          await firewall.setConsumerDryrunStatus(consumer, false);
          await firewall.addGlobalPolicy(consumer, policy);

          await policy.setPostAlwaysFails(true);

          const tx = consumer.postExecution(OWNER, data, value);
          await expect(tx).to.be.revertedWith("ConsumerMock: Post always fails");
        });
      });
    });

    it("should not revert if provided data is not a valid selector", async () => {
      const { firewall, consumer, policy, OWNER } = await loadFixture(deployFixture);

      await firewall.addGlobalPolicy(consumer, policy);

      const tx = consumer.postExecution(OWNER, "0x", value);
      await expect(tx).to.emit(policy, "PostExecutionMock").withArgs(consumer, OWNER, "0x", value);
    });
  });

  describe("#setPolicyStatus", () => {
    it("should set policy status", async () => {
      const { firewall } = await loadFixture(deployFixture);

      const tx = await firewall.setPolicyStatus(ZeroAddress, true);
      await expect(tx).to.emit(firewall, "PolicyStatusUpdate").withArgs(ZeroAddress, true);
      expect(await firewall.approvedPolicies(ZeroAddress)).to.equal(true);

      const tx2 = await firewall.setPolicyStatus(ZeroAddress, false);
      await expect(tx2).to.emit(firewall, "PolicyStatusUpdate").withArgs(ZeroAddress, false);
      expect(await firewall.approvedPolicies(ZeroAddress)).to.equal(false);
    });

    it("should revert if caller is not the owner", async () => {
      const reason = "Ownable: caller is not the owner";

      const { firewall, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).setPolicyStatus(ZeroAddress, true)).to.be.revertedWith(reason);
    });
  });

  describe("#setConsumerDryrunStatus", () => {
    it("should set consumer dryrun status", async () => {
      const { firewall, consumer } = await loadFixture(deployFixture);

      const tx = await firewall.setConsumerDryrunStatus(consumer, true);
      await expect(tx).to.emit(firewall, "ConsumerDryrunStatusUpdate").withArgs(consumer, true);
      expect(await firewall.dryrunEnabled(consumer)).to.equal(true);

      const tx2 = await firewall.setConsumerDryrunStatus(consumer, false);
      await expect(tx2).to.emit(firewall, "ConsumerDryrunStatusUpdate").withArgs(consumer, false);
      expect(await firewall.dryrunEnabled(consumer)).to.equal(false);
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).setConsumerDryrunStatus(consumer, true)).to.be.revertedWith(reason);
    });
  });

  describe("#addGlobalPolicy", () => {
    it("should add global policy", async () => {
      const { firewall, consumer, policy, policy2 } = await loadFixture(deployFixture);

      const tx = await firewall.addGlobalPolicy(consumer, policy);
      await expect(tx).to.emit(firewall, "GlobalPolicyAdded").withArgs(consumer, policy);
      expect(await firewall.subscribedGlobalPolicies(consumer, 0)).to.equal(policy);

      const tx2 = await firewall.addGlobalPolicy(consumer, policy2);
      await expect(tx2).to.emit(firewall, "GlobalPolicyAdded").withArgs(consumer, policy2);
      expect(await firewall.subscribedGlobalPolicies(consumer, 1)).to.equal(policy2);
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).addGlobalPolicy(consumer, policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is already subscribed", async () => {
      const reason = "Firewall: Policy already exists.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await firewall.addGlobalPolicy(consumer, policy);

      await expect(firewall.addGlobalPolicy(consumer, policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is not approved", async () => {
      const reason = "Firewall: Policy not approved.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      await firewall.setPolicyStatus(policy, false);

      await expect(firewall.addGlobalPolicy(consumer, policy)).to.be.revertedWith(reason);
    });
  });

  describe("#removeGlobalPolicy", () => {
    it("should remove global policy", async () => {
      const { firewall, consumer, policy, policy2 } = await loadFixture(deployFixture);

      await firewall.addGlobalPolicy(consumer, policy);
      await firewall.addGlobalPolicy(consumer, policy2);

      const tx = await firewall.removeGlobalPolicy(consumer, policy2);
      await expect(tx).to.emit(firewall, "GlobalPolicyRemoved").withArgs(consumer, policy2);
      expect(await firewall.subscribedGlobalPolicies(consumer, 0)).to.be.equal(await policy.getAddress());

      await firewall.addGlobalPolicy(consumer, policy2);

      const tx2 = await firewall.removeGlobalPolicy(consumer, policy);
      await expect(tx2).to.emit(firewall, "GlobalPolicyRemoved").withArgs(consumer, policy);
      expect(await firewall.subscribedGlobalPolicies(consumer, 0)).to.be.equal(await policy2.getAddress());

      const tx3 = await firewall.removeGlobalPolicy(consumer, policy2);
      await expect(tx3).to.emit(firewall, "GlobalPolicyRemoved").withArgs(consumer, policy2);
      expect(firewall.subscribedGlobalPolicies(consumer, 0)).to.be.reverted;
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).removeGlobalPolicy(consumer, policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is not subscribed", async () => {
      const reason = "Firewall: Policy not found.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await expect(firewall.removeGlobalPolicy(consumer, policy)).to.be.revertedWith(reason);
    });
  });

  describe("#addGlobalPolicyForConsumers", () => {
    it("should add global policy for consumers", async () => {
      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      const { consumer: consumer2 } = await deployConsumer(firewall);

      const tx = await firewall.addGlobalPolicyForConsumers([consumer, consumer2], policy);
      await expect(tx).to.emit(firewall, "GlobalPolicyAdded").withArgs(consumer, policy);
      await expect(tx).to.emit(firewall, "GlobalPolicyAdded").withArgs(consumer2, policy);
      expect(await firewall.subscribedGlobalPolicies(consumer, 0)).to.equal(policy);
      expect(await firewall.subscribedGlobalPolicies(consumer2, 0)).to.equal(policy);
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).addGlobalPolicyForConsumers([consumer], policy)).to.be.revertedWith(
        reason,
      );
    });

    it("should revert if caller is not the consumer admin of one of the consumers", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      const { consumer: consumer2 } = await deployConsumer(firewall);
      await consumer.setFirewallAdmin(NOT_OWNER);

      await expect(
        firewall.connect(NOT_OWNER).addGlobalPolicyForConsumers([consumer, consumer2], policy),
      ).to.be.revertedWith(reason);
    });

    it("should revert if policy is not approved", async () => {
      const reason = "Firewall: Policy not approved.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      await firewall.setPolicyStatus(policy, false);

      await expect(firewall.addGlobalPolicyForConsumers([consumer], policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is already subscribed", async () => {
      const reason = "Firewall: Policy already exists.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await firewall.addGlobalPolicy(consumer, policy);

      await expect(firewall.addGlobalPolicyForConsumers([consumer], policy)).to.be.revertedWith(reason);
    });

    it("should not revert if list of consumers is empty", async () => {
      const { firewall, policy } = await loadFixture(deployFixture);

      await expect(firewall.addGlobalPolicyForConsumers([], policy)).to.not.be.reverted;
    });
  });

  describe("#removeGlobalPolicyForConsumers", () => {
    it("should remove global policy for consumers", async () => {
      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      const { consumer: consumer2 } = await deployConsumer(firewall);

      await firewall.addGlobalPolicyForConsumers([consumer, consumer2], policy);

      const tx = await firewall.removeGlobalPolicyForConsumers([consumer, consumer2], policy);
      await expect(tx).to.emit(firewall, "GlobalPolicyRemoved").withArgs(consumer, policy);
      await expect(tx).to.emit(firewall, "GlobalPolicyRemoved").withArgs(consumer2, policy);
      expect(firewall.subscribedGlobalPolicies(consumer, 0)).to.be.reverted;
      expect(firewall.subscribedGlobalPolicies(consumer2, 0)).to.be.reverted;
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).removeGlobalPolicyForConsumers([consumer], policy)).to.be.revertedWith(
        reason,
      );
    });

    it("should revert if policy is not subscribed", async () => {
      const reason = "Firewall: Policy not found.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await expect(firewall.removeGlobalPolicyForConsumers([consumer], policy)).to.be.revertedWith(reason);
    });

    it("should not revert if list of consumers is empty", async () => {
      const { firewall, policy } = await loadFixture(deployFixture);

      await expect(firewall.removeGlobalPolicyForConsumers([], policy)).to.not.be.reverted;
    });
  });

  describe("#addPolicies", () => {
    const METHOD_SIGS = ["0x12345678", "0x87654321"];

    it("should add policies", async () => {
      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      const { policy: policy2 } = await deployPolicy(firewall);

      const tx = await firewall.addPolicies(consumer, METHOD_SIGS, [policy, policy2]);
      await expect(tx).to.emit(firewall, "PolicyAdded").withArgs(consumer, METHOD_SIGS[0], policy);
      await expect(tx).to.emit(firewall, "PolicyAdded").withArgs(consumer, METHOD_SIGS[1], policy2);
      expect(await firewall.subscribedPolicies(consumer, METHOD_SIGS[0], 0)).to.equal(policy);
      expect(await firewall.subscribedPolicies(consumer, METHOD_SIGS[1], 0)).to.equal(policy2);
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).addPolicies(consumer, METHOD_SIGS, [policy])).to.be.revertedWith(reason);
    });

    it("should revert if method sigs and policies length mismatch", async () => {
      const reason = "Firewall: Method sigs and policies length mismatch.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await expect(firewall.addPolicies(consumer, METHOD_SIGS, [policy])).to.be.revertedWith(reason);
    });

    it("should revert if policy is not approved", async () => {
      const reason = "Firewall: Policy not approved.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      const { policy: policy2 } = await deployPolicy(firewall);
      await firewall.setPolicyStatus(policy2, false);

      await expect(firewall.addPolicies(consumer, METHOD_SIGS, [policy, policy2])).to.be.revertedWith(reason);
    });

    it("should revert if policy is already subscribed", async () => {
      const reason = "Firewall: Policy already exists.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      const { policy: policy2 } = await deployPolicy(firewall);

      await firewall.addPolicies(consumer, [METHOD_SIGS[1]], [policy2]);

      await expect(firewall.addPolicies(consumer, METHOD_SIGS, [policy, policy2])).to.be.revertedWith(reason);
    });
  });

  describe("#addPolicy", () => {
    const METHOD_SIG = "0x12345678";

    it("should add policy", async () => {
      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      const tx = await firewall.addPolicy(consumer, METHOD_SIG, policy);
      await expect(tx).to.emit(firewall, "PolicyAdded").withArgs(consumer, METHOD_SIG, policy);
      expect(await firewall.subscribedPolicies(consumer, METHOD_SIG, 0)).to.equal(policy);
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).addPolicy(consumer, METHOD_SIG, policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is already subscribed", async () => {
      const reason = "Firewall: Policy already exists.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await firewall.addPolicy(consumer, METHOD_SIG, policy);

      await expect(firewall.addPolicy(consumer, METHOD_SIG, policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is not approved", async () => {
      const reason = "Firewall: Policy not approved.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      await firewall.setPolicyStatus(policy, false);

      await expect(firewall.addPolicy(consumer, METHOD_SIG, policy)).to.be.revertedWith(reason);
    });
  });

  describe("#removePolicies", () => {
    const METHOD_SIGS = ["0x12345678", "0x87654321"];

    it("should remove policies", async () => {
      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      const { policy: policy2 } = await deployPolicy(firewall);

      await firewall.addPolicies(consumer, METHOD_SIGS, [policy, policy2]);

      const tx = await firewall.removePolicies(consumer, METHOD_SIGS, [policy, policy2]);
      await expect(tx).to.emit(firewall, "PolicyRemoved").withArgs(consumer, METHOD_SIGS[0], policy);
      await expect(tx).to.emit(firewall, "PolicyRemoved").withArgs(consumer, METHOD_SIGS[1], policy2);
      expect(firewall.subscribedPolicies(consumer, METHOD_SIGS[0], 0)).to.be.reverted;
      expect(firewall.subscribedPolicies(consumer, METHOD_SIGS[1], 0)).to.be.reverted;
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).removePolicies(consumer, METHOD_SIGS, [policy])).to.be.revertedWith(
        reason,
      );
    });

    it("should revert if policy is not subscribed", async () => {
      const reason = "Firewall: Policy not found.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);
      const { policy: policy2 } = await deployPolicy(firewall);

      await expect(firewall.removePolicies(consumer, METHOD_SIGS, [policy, policy2])).to.be.revertedWith(reason);
    });

    it("should not revert if list of policies is empty", async () => {
      const { firewall, consumer } = await loadFixture(deployFixture);

      await expect(firewall.removePolicies(consumer, [], [])).to.not.be.reverted;
    });

    it("should revert if method sigs and policies length mismatch", async () => {
      const reason = "Firewall: Method sigs and policies length mismatch.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await expect(firewall.removePolicies(consumer, METHOD_SIGS, [policy])).to.be.revertedWith(reason);
    });
  });

  describe("#removePolicy", () => {
    const METHOD_SIG = "0x12345678";

    it("should remove policy", async () => {
      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await firewall.addPolicy(consumer, METHOD_SIG, policy);

      const tx = await firewall.removePolicy(consumer, METHOD_SIG, policy);
      await expect(tx).to.emit(firewall, "PolicyRemoved").withArgs(consumer, METHOD_SIG, policy);
      expect(firewall.subscribedPolicies(consumer, METHOD_SIG, 0)).to.be.reverted;
    });

    it("should revert if caller is not the consumer admin", async () => {
      const reason = "Firewall: Not consumer admin.";

      const { firewall, consumer, policy, NOT_OWNER } = await loadFixture(deployFixture);

      await expect(firewall.connect(NOT_OWNER).removePolicy(consumer, METHOD_SIG, policy)).to.be.revertedWith(reason);
    });

    it("should revert if policy is not subscribed", async () => {
      const reason = "Firewall: Policy not found.";

      const { firewall, consumer, policy } = await loadFixture(deployFixture);

      await expect(firewall.removePolicy(consumer, METHOD_SIG, policy)).to.be.revertedWith(reason);
    });
  });
});
