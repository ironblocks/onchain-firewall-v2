import { deployTransientApprovedCallsPolicyFactory } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AbiCoder, AddressLike, resolveAddress } from "ethers";
import { ethers } from "hardhat";

export async function encodeCreatePolicyData(
  firewall: AddressLike,
  defaultAdmin: AddressLike,
  policyAdmin: AddressLike,
  signers: AddressLike[],
  consumers: AddressLike[],
  consumerStatuses: boolean[],
) {
  const firewallAddress = await resolveAddress(firewall);
  const defaultAdminAddress = await resolveAddress(defaultAdmin);
  const policyAdminAddress = await resolveAddress(policyAdmin);
  const signersAddresses = await Promise.all(signers.map((signer) => resolveAddress(signer)));
  const consumersAddresses = await Promise.all(consumers.map((consumer) => resolveAddress(consumer)));

  return AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address", "address[]", "address[]", "bool[]"],
    [firewallAddress, defaultAdminAddress, policyAdminAddress, signersAddresses, consumersAddresses, consumerStatuses],
  );
}

async function deployFixture() {
  const [FIREWALL, DEFAULT_ADMIN, POLICY_ADMIN, SIGNER_1, SIGNER_2, CONSUMER_1, CONSUMER_2] = await ethers.getSigners();
  const { transientApprovedCallsPolicyFactory } = await loadFixture(deployTransientApprovedCallsPolicyFactory);

  return {
    transientApprovedCallsPolicyFactory,
    FIREWALL,
    DEFAULT_ADMIN,
    POLICY_ADMIN,
    SIGNER_1,
    SIGNER_2,
    CONSUMER_1,
    CONSUMER_2,
  };
}

describe("TransientApprovedCallsPolicyFactory", () => {
  describe("#create", () => {
    it("should create a policy", async () => {
      const {
        transientApprovedCallsPolicyFactory,
        FIREWALL,
        DEFAULT_ADMIN,
        POLICY_ADMIN,
        SIGNER_1,
        SIGNER_2,
        CONSUMER_1,
        CONSUMER_2,
      } = await loadFixture(deployFixture);

      const data = await encodeCreatePolicyData(
        FIREWALL,
        DEFAULT_ADMIN,
        POLICY_ADMIN,
        [SIGNER_1, SIGNER_2],
        [CONSUMER_1, CONSUMER_2],
        [true, false],
      );

      const policy = await transientApprovedCallsPolicyFactory.create.staticCall(data);
      const tx = await transientApprovedCallsPolicyFactory.create(data);
      await expect(tx).to.emit(transientApprovedCallsPolicyFactory, "PolicyCreated").withArgs(policy);
    });

    it("should setup the policy", async () => {
      const {
        transientApprovedCallsPolicyFactory,
        FIREWALL,
        DEFAULT_ADMIN,
        POLICY_ADMIN,
        SIGNER_1,
        SIGNER_2,
        CONSUMER_1,
        CONSUMER_2,
      } = await loadFixture(deployFixture);

      const data = await encodeCreatePolicyData(
        FIREWALL,
        DEFAULT_ADMIN,
        POLICY_ADMIN,
        [SIGNER_1, SIGNER_2],
        [CONSUMER_1, CONSUMER_2],
        [true, false],
      );

      const policyAddress = await transientApprovedCallsPolicyFactory.create.staticCall(data);
      await transientApprovedCallsPolicyFactory.create(data);

      const policy = await ethers.getContractAt("TransientApprovedCallsPolicy", policyAddress);

      expect(await policy.authorizedExecutors(FIREWALL)).to.be.true;

      expect(await policy.hasRole(await policy.DEFAULT_ADMIN_ROLE(), DEFAULT_ADMIN)).to.be.true;
      expect(await policy.hasRole(await policy.ADMIN_ROLE(), POLICY_ADMIN)).to.be.true;

      expect(await policy.hasRole(await policy.SIGNER_ROLE(), SIGNER_1)).to.be.true;
      expect(await policy.hasRole(await policy.SIGNER_ROLE(), SIGNER_2)).to.be.true;

      expect(await policy.approvedConsumer(CONSUMER_1)).to.be.true;
      expect(await policy.approvedConsumer(CONSUMER_2)).to.be.false;

      expect(await policy.hasRole(await policy.ADMIN_ROLE(), policyAddress)).to.be.false;
      expect(await policy.hasRole(await policy.DEFAULT_ADMIN_ROLE(), policyAddress)).to.be.false;
    });
  });
});
