import { IAccessControl__factory, IApprovedCallsPolicy__factory, IFirewall__factory } from "@/generated-types/ethers";
import {
  deployFirewall,
  deployTransientApprovedCallsPolicy,
  deployTransientApprovedCallsPolicyMock,
} from "@/test/fixtures";
import { createCallHash, createCallsApprovedSignature, getCurrentBlockTime, getInterfaceId } from "@/test/helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, EXECUTOR_1, EXECUTOR_2, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2] =
    await ethers.getSigners();

  const { firewall } = await deployFirewall();
  const { transientApprovedCallsPolicy } = await deployTransientApprovedCallsPolicy(firewall, ADMIN);

  const { transientApprovedCallsPolicyMock } =
    await deployTransientApprovedCallsPolicyMock(transientApprovedCallsPolicy);

  await transientApprovedCallsPolicy.grantRole(
    await transientApprovedCallsPolicy.SIGNER_ROLE(),
    transientApprovedCallsPolicyMock,
  );

  await transientApprovedCallsPolicy.setExecutorStatus(transientApprovedCallsPolicyMock, true);
  await transientApprovedCallsPolicy.setConsumersStatuses([CONSUMER_1, CONSUMER_2], [true, true]);

  return {
    policy: transientApprovedCallsPolicy,
    transientApprovedCallsPolicyMock,
    firewall,
    ADMIN,
    NON_ADMIN,
    EXECUTOR_1,
    EXECUTOR_2,
    CONSUMER_1,
    CONSUMER_2,
    SENDER_1,
    SENDER_2,
  };
}

describe("TransientApprovedCallsPolicy", () => {
  describe("#constructor", () => {
    it("should set the correct data after creation", async () => {
      const { policy, firewall, ADMIN } = await loadFixture(deployFixture);

      expect(await policy.hasRole(await policy.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
      expect(await policy.authorizedExecutors(firewall)).to.be.true;
    });
  });

  describe("#preExecution", () => {
    it("should not revert if the call hash is the next hash", async () => {
      const { transientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const data = "0x1234";
      const callHashes = [
        await createCallHash(CONSUMER_1, transientApprovedCallsPolicyMock, ADMIN, data, value),
        await createCallHash(CONSUMER_1, transientApprovedCallsPolicyMock, ADMIN, data, value + 1),
      ];

      const approvedCalls =
        await transientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage.staticCall(
          callHashes,
          expiration,
          ADMIN,
          0,
          CONSUMER_1,
          transientApprovedCallsPolicyMock,
          data,
          value + 1,
        );
      await transientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        transientApprovedCallsPolicyMock,
        data,
        value + 1,
      );

      expect(approvedCalls.length).to.be.equal(callHashes.length - 1);

      for (let i = approvedCalls.length - 1; i >= 0; i--) {
        expect(approvedCalls[i]).to.be.equal(callHashes[i]);
      }
    });

    it("should revert if the call hash is not the next hash", async () => {
      const { transientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const data = "0x1234";
      const callHashes = [
        await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value),
        await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value + 1),
      ];

      const tx = transientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        transientApprovedCallsPolicyMock,
        data,
        value,
      );
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Invalid call hash.");
    });

    it("should revert if the caller is not the executor", async () => {
      const { policy, transientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      await policy.setExecutorStatus(transientApprovedCallsPolicyMock, false);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const data = "0x1234";
      const callHashes = [
        await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value),
        await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value + 1),
      ];

      const tx = transientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        transientApprovedCallsPolicyMock,
        data,
        value,
      );
      await expect(tx).to.be.revertedWith("FirewallPolicyBase: Only authorized executor.");
    });

    it("should revert if there is no next hash", async () => {
      const { policy, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      await policy.setExecutorStatus(ADMIN, true);

      const tx = policy.preExecution(CONSUMER_1, ADMIN, "0x", 0);
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Call hashes empty.");
    });
  });

  describe("#postExecution", () => {
    it("should do nothing", async () => {
      const { policy } = await loadFixture(deployFixture);

      const tx = await policy.postExecution(ZeroAddress, ZeroAddress, "0x", 0);
      await expect(tx).to.not.be.reverted;
    });
  });

  describe("#approveCalls", async () => {
    it("should approve the calls", async () => {
      const { policy, transientApprovedCallsPolicyMock, ADMIN, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2 } =
        await loadFixture(deployFixture);

      const callHashes = [
        await createCallHash(
          CONSUMER_1,
          transientApprovedCallsPolicyMock,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
        await createCallHash(
          CONSUMER_2,
          transientApprovedCallsPolicyMock,
          ADMIN,
          policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
          123,
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const approvedCalls = await transientApprovedCallsPolicyMock.approveCallsAndReturnStorage.staticCall(
        callHashes,
        expiration,
        ADMIN,
        0,
      );
      const tx = await transientApprovedCallsPolicyMock.approveCallsAndReturnStorage(callHashes, expiration, ADMIN, 0);
      await expect(tx).to.emit(policy, "CallsApproved").withArgs(callHashes, expiration, ADMIN, 0);

      expect(approvedCalls.length).to.be.equal(callHashes.length);

      for (let i = 0; i < callHashes.length; i++) {
        expect(approvedCalls[i]).to.be.equal(callHashes[i]);
      }

      expect(await policy.getCurrentApprovedCalls()).to.be.deep.equal([]);

      expect(await policy.nonces(ADMIN)).to.be.equal(1);
    });

    it("should revert if the caller is not the signer", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      const tx = policy.approveCalls([], 0, ADMIN, 0);
      await expect(tx).to.be.revertedWith(
        `AccessControl: account ${(await ADMIN.getAddress()).toLowerCase()} is missing role ${await policy.SIGNER_ROLE()}`,
      );
    });

    it("should revert if the calls are empty", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const tx = policy.approveCalls([], 0, ADMIN, 0);
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Calls empty.");
    });

    it("should revert if the nonce is not the current nonce", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const callHashes = [
        await createCallHash(
          ADMIN,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
      ];

      const tx = policy.approveCalls(callHashes, 0, ADMIN, 1);
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Invalid nonce.");
    });

    it("should revert if the expiration is in the past", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const callHashes = [
        await createCallHash(
          ADMIN,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
      ];

      const tx = policy.approveCalls(callHashes, 0, ADMIN, 0);
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Expired.");
    });

    it("should revert if the txOrigin is not the caller", async () => {
      const { policy, ADMIN, NON_ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const expiration = (await getCurrentBlockTime()) + 2;

      const callHashes = [
        await createCallHash(
          ADMIN,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
      ];

      const tx = policy.approveCalls(callHashes, expiration, NON_ADMIN, 0);
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Invalid txOrigin.");
    });
  });

  describe("#approveCallsViaSignature", () => {
    it("should approve the calls", async () => {
      const { policy, transientApprovedCallsPolicyMock, ADMIN, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2 } =
        await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const callHashes = [
        await createCallHash(
          CONSUMER_1,
          transientApprovedCallsPolicyMock,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
        await createCallHash(
          CONSUMER_2,
          transientApprovedCallsPolicyMock,
          ADMIN,
          policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
          123,
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const signature = await createCallsApprovedSignature(ADMIN, callHashes, expiration, ADMIN, 0, policy);

      const approvedCalls = await transientApprovedCallsPolicyMock.approveCallsViaSignatureAndReturnStorage.staticCall(
        callHashes,
        expiration,
        ADMIN,
        0,
        signature,
      );
      const tx = await transientApprovedCallsPolicyMock.approveCallsViaSignatureAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        signature,
      );
      await expect(tx)
        .to.emit(policy, "CallsApprovedViaSignature")
        .withArgs(callHashes, expiration, ADMIN, 0, signature);

      expect(approvedCalls.length).to.be.equal(callHashes.length);

      for (let i = 0; i < callHashes.length; i++) {
        expect(approvedCalls[i]).to.be.equal(callHashes[i]);
      }

      expect(await policy.getCurrentApprovedCalls()).to.be.deep.equal([]);

      expect(await policy.nonces(ADMIN)).to.be.equal(1);
    });

    it("should revert if the signature owner is not the signer", async () => {
      const { policy, ADMIN, CONSUMER_1, CONSUMER_2 } = await loadFixture(deployFixture);

      const callHashes = [
        await createCallHash(
          CONSUMER_1,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
        await createCallHash(
          CONSUMER_2,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
          123,
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const signature = await createCallsApprovedSignature(ADMIN, callHashes, expiration, ADMIN, 0, policy);

      const tx = policy.approveCallsViaSignature(callHashes, expiration, ADMIN, 0, signature);

      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Invalid signer.");
    });

    it("should revert if the signature is invalid", async () => {
      const { policy, ADMIN, CONSUMER_1, CONSUMER_2 } = await loadFixture(deployFixture);

      const callHashes = [
        await createCallHash(
          CONSUMER_1,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
        await createCallHash(
          CONSUMER_2,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
          123,
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const signature = (await createCallsApprovedSignature(ADMIN, callHashes, expiration, ADMIN, 0, policy)) + "00";

      const tx = policy.approveCallsViaSignature(callHashes, expiration, ADMIN, 0, signature);

      await expect(tx).to.be.revertedWith("ApprovedCallsHelper: Invalid signature length.");
    });

    it("should revert if the calls are empty", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const tx = policy.approveCallsViaSignature([], 0, ADMIN, 0, "0x");
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Calls empty.");
    });

    it("should revert if the nonce is not the current nonce", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const callHashes = [
        await createCallHash(
          ADMIN,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
      ];

      const tx = policy.approveCallsViaSignature(callHashes, 0, ADMIN, 1, "0x");
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Invalid nonce.");
    });

    it("should revert if the expiration is in the past", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const callHashes = [
        await createCallHash(
          ADMIN,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
      ];

      const tx = policy.approveCallsViaSignature(callHashes, 0, ADMIN, 0, "0x");
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Expired.");
    });

    it("should revert if the txOrigin is not the caller", async () => {
      const { policy, ADMIN, NON_ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const expiration = (await getCurrentBlockTime()) + 2;

      const callHashes = [
        await createCallHash(
          ADMIN,
          ADMIN,
          ADMIN,
          policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
          0,
        ),
      ];

      const tx = policy.approveCallsViaSignature(callHashes, expiration, NON_ADMIN, 0, "0x");
      await expect(tx).to.be.revertedWith("TransientApprovedCallsPolicy: Invalid txOrigin.");
    });
  });

  describe("#setExecutorStatus", () => {
    it("should set the executor status", async () => {
      const { policy, EXECUTOR_1 } = await loadFixture(deployFixture);

      const tx = await policy.setExecutorStatus(EXECUTOR_1, true);
      await expect(tx).to.emit(policy, "ExecutorStatusSet").withArgs(EXECUTOR_1, true);

      expect(await policy.authorizedExecutors(EXECUTOR_1)).to.be.true;
    });

    it("should revert if the caller is not the admin", async () => {
      const { policy, NON_ADMIN, EXECUTOR_1 } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await policy.ADMIN_ROLE()}`;

      const tx = policy.connect(NON_ADMIN).setExecutorStatus(EXECUTOR_1, true);
      await expect(tx).to.be.revertedWith(reason);
    });
  });

  describe("#setConsumersStatuses", () => {
    it("should set the consumers statuses", async () => {
      const { policy, CONSUMER_1, CONSUMER_2 } = await loadFixture(deployFixture);

      const tx = await policy.setConsumersStatuses([CONSUMER_1, CONSUMER_2], [true, false]);
      await expect(tx).to.emit(policy, "ConsumerStatusSet").withArgs(CONSUMER_1, true);
      await expect(tx).to.emit(policy, "ConsumerStatusSet").withArgs(CONSUMER_2, false);

      expect(await policy.approvedConsumer(CONSUMER_1)).to.be.true;
      expect(await policy.approvedConsumer(CONSUMER_2)).to.be.false;
    });

    it("should revert if the caller is not the admin", async () => {
      const { policy, NON_ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await policy.ADMIN_ROLE()}`;

      const tx = policy.connect(NON_ADMIN).setConsumersStatuses([CONSUMER_1], [true]);
      await expect(tx).to.be.revertedWith(reason);
    });
  });

  describe("#getCallHash", () => {
    it("should return the call hash", async () => {
      const { policy, CONSUMER_1, EXECUTOR_1, ADMIN } = await loadFixture(deployFixture);

      const data = "0x";
      const value = 123;

      const callHash = await policy.getCallHash(CONSUMER_1, EXECUTOR_1, ADMIN, data, value);
      expect(callHash).to.be.equal(await createCallHash(CONSUMER_1, EXECUTOR_1, ADMIN, data, value));
    });
  });

  describe("supportsInterface", () => {
    it("should return true for the IApprovedCallsPolicy", async () => {
      const { policy } = await loadFixture(deployFixture);

      const IApprovedCallsPolicyInterfaceId = getInterfaceId(IApprovedCallsPolicy__factory.createInterface());
      expect(await policy.supportsInterface(IApprovedCallsPolicyInterfaceId)).to.be.true;
    });

    it("should return true for the IAccessControl", async () => {
      const { policy } = await loadFixture(deployFixture);

      const IAccessControlInterfaceId = getInterfaceId(IAccessControl__factory.createInterface());
      expect(await policy.supportsInterface(IAccessControlInterfaceId)).to.be.true;
    });

    it("should return false for the incorrect interface id", async () => {
      const { policy } = await loadFixture(deployFixture);

      const IFirewallInterfaceId = getInterfaceId(IFirewall__factory.createInterface());
      expect(await policy.supportsInterface(IFirewallInterfaceId)).to.be.false;
    });
  });
});
