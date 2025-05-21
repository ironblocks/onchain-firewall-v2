import {
  IAccessControl__factory,
  IApprovedCallsPolicy__factory,
  IDynamicTransientApprovedCallsPolicy,
  IFirewall__factory,
} from "@/generated-types/ethers";
import {
  deployDynamicTransientApprovedCallsPolicy,
  deployDynamicTransientApprovedCallsPolicyMock,
  deployFirewall,
} from "@/test/fixtures";
import {
  createAdvancedApprovedCall,
  createAdvancedCallsApprovedSignature,
  createCallHash,
  getCurrentBlockTime,
  getInterfaceId,
} from "@/test/helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress, zeroPadValue } from "ethers";
import { ethers } from "hardhat";

function compareAdvancedApprovedCalls(
  a: [callHash: string, maxValues: bigint[], minValues: bigint[]],
  b: IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCallStruct,
) {
  return (
    a[0] === b.callHash &&
    a[1].every((value, index) => Number(value) === Number(b.maxValues[index])) &&
    a[2].every((value, index) => Number(value) === Number(b.minValues[index]))
  );
}

function compareAdvancedApprovedCallsArray(
  a: [callHash: string, maxValues: bigint[], minValues: bigint[]][],
  b: IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCallStruct[],
) {
  return a.length === b.length && a.every((call, index) => compareAdvancedApprovedCalls(call, b[index]));
}

async function deployFixture() {
  const [ADMIN, NON_ADMIN, EXECUTOR_1, EXECUTOR_2, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2] =
    await ethers.getSigners();

  const { firewall } = await deployFirewall();
  const { dynamicTransientApprovedCallsPolicy } = await deployDynamicTransientApprovedCallsPolicy(firewall, ADMIN);

  const { dynamicTransientApprovedCallsPolicyMock } = await deployDynamicTransientApprovedCallsPolicyMock(
    dynamicTransientApprovedCallsPolicy,
  );

  await dynamicTransientApprovedCallsPolicy.grantRole(
    await dynamicTransientApprovedCallsPolicy.SIGNER_ROLE(),
    dynamicTransientApprovedCallsPolicyMock,
  );

  await dynamicTransientApprovedCallsPolicy.setExecutorStatus(dynamicTransientApprovedCallsPolicyMock, true);
  await dynamicTransientApprovedCallsPolicy.setConsumersStatuses([CONSUMER_1, CONSUMER_2], [true, true]);

  return {
    policy: dynamicTransientApprovedCallsPolicy,
    dynamicTransientApprovedCallsPolicyMock,
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

describe("DynamicTransientApprovedCallsPolicy", () => {
  describe("#constructor", () => {
    it("should set the correct data after creation", async () => {
      const { policy, firewall, ADMIN } = await loadFixture(deployFixture);

      expect(await policy.hasRole(await policy.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
      expect(await policy.authorizedExecutors(firewall)).to.be.true;
    });
  });

  describe("#preExecution", () => {
    it("should not revert if the call hash is the next hash", async () => {
      const { dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const data = "0x1234";
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, data, value),
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, data, value + 1),
        ),
      ];

      const approvedCalls =
        await dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage.staticCall(
          callHashes,
          expiration,
          ADMIN,
          0,
          CONSUMER_1,
          dynamicTransientApprovedCallsPolicyMock,
          data,
          value + 1,
        );
      await dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );

      expect(approvedCalls.length).to.be.equal(callHashes.length - 1);

      for (let i = approvedCalls.length - 1; i >= 0; i--) {
        expect(compareAdvancedApprovedCalls(approvedCalls[i], callHashes[i])).to.be.true;
      }
    });

    it("should not revert if the call is in range of the min/max values", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const selector = "0x12345678";

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      await policy.setSighashUintIndices(selector, [4, 37]);

      const data = selector + zeroPadValue("0x04", 32).slice(2) + "00" + zeroPadValue("0x05", 32).slice(2);
      const dataToSave = selector + "00";

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const minValues = [1, 2, 3];
      const maxValues = [10, 12, 14];
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value),
          maxValues,
          minValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value + 1),
          maxValues,
          minValues,
        ),
      ];

      await dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );
    });

    it("should not revert if the call is not in range of the min/max values but slice is not defined", async () => {
      const { dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const selector = "0x12345678";

      const data = selector + zeroPadValue("0x04", 32).slice(2) + "00" + zeroPadValue("0x05", 32).slice(2);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const minValues = [1, 2, 3];
      const maxValues = [10, 12, 14];
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, data, value),
          maxValues,
          minValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, data, value + 1),
          maxValues,
          minValues,
        ),
      ];

      await dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );
    });

    it("should revert if the call is not in range of the min values", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const selector = "0x12345678";

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      await policy.setSighashUintIndices(selector, [4, 37]);

      const data = selector + zeroPadValue("0x04", 32).slice(2) + "00" + zeroPadValue("0x00", 32).slice(2);
      const dataToSave = selector + "00";

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const minValues = [1, 2, 3];
      const maxValues = [10, 12, 14];
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value),
          maxValues,
          minValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value + 1),
          maxValues,
          minValues,
        ),
      ];

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Value too low.");
    });

    it("should revert if the call is not in range of the min values", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const selector = "0x12345678";

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      await policy.setSighashUintIndices(selector, [4, 37]);

      const data = selector + zeroPadValue("0x04", 32).slice(2) + "00" + zeroPadValue("0x99", 32).slice(2);
      const dataToSave = selector + "00";

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const minValues = [1, 2, 3];
      const maxValues = [10, 12, 14];
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value),
          maxValues,
          minValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value + 1),
          maxValues,
          minValues,
        ),
      ];

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Value too high.");
    });

    it("should revert if min/max values not provided", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const selector = "0x12345678";

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      await policy.setSighashUintIndices(selector, [4, 37]);

      const data = selector + zeroPadValue("0x04", 32).slice(2) + "00" + zeroPadValue("0x99", 32).slice(2);
      const dataToSave = selector + "00";

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const minValues = [0];
      const maxValues = [10];
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value),
          maxValues,
          minValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value + 1),
          maxValues,
          minValues,
        ),
      ];

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );
      await expect(tx).to.be.revertedWithPanic(0x32);
    });

    it("should revert if indices are invalid", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const selector = "0x12345678";

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      await policy.setSighashUintIndices(selector, [4, 999]);

      const data = selector + zeroPadValue("0x04", 32).slice(2) + "00" + zeroPadValue("0x99", 32).slice(2);
      const dataToSave = selector + "00";

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const minValues = [0, 0];
      const maxValues = [10, 10];
      const callHashes = [
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value),
          maxValues,
          minValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(CONSUMER_1, dynamicTransientApprovedCallsPolicyMock, ADMIN, dataToSave, value + 1),
          maxValues,
          minValues,
        ),
      ];

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value + 1,
      );
      await expect(tx).to.be.reverted;
    });

    it("should revert if the call hash is not the next hash", async () => {
      const { dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const data = "0x1234";
      const callHashes = [
        createAdvancedApprovedCall(await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value)),
        createAdvancedApprovedCall(await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value + 1)),
      ];

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value,
      );
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Invalid call hash.");
    });

    it("should revert if the caller is not the executor", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      await policy.setExecutorStatus(dynamicTransientApprovedCallsPolicyMock, false);

      const value = 123;
      const expiration = (await getCurrentBlockTime()) + 2;
      const data = "0x1234";
      const callHashes = [
        createAdvancedApprovedCall(await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value)),
        createAdvancedApprovedCall(await createCallHash(CONSUMER_1, ADMIN, ADMIN, data, value + 1)),
      ];

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndPreExecutionAndReturnStorage(
        callHashes,
        expiration,
        ADMIN,
        0,
        CONSUMER_1,
        dynamicTransientApprovedCallsPolicyMock,
        data,
        value,
      );
      await expect(tx).to.be.revertedWith("FirewallPolicyBase: Only authorized executor.");
    });

    it("should revert if there is no next hash", async () => {
      const { policy, ADMIN, CONSUMER_1 } = await loadFixture(deployFixture);

      await policy.setExecutorStatus(ADMIN, true);

      const tx = policy.preExecution(CONSUMER_1, ADMIN, "0x", 0);
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Calls empty.");
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
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2 } =
        await loadFixture(deployFixture);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_1,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_2,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
            123,
          ),
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const approvedCalls = await dynamicTransientApprovedCallsPolicyMock.approveCallsAndReturnStorage.staticCall(
        advancedCalls,
        expiration,
        ADMIN,
        0,
      );
      const tx = await dynamicTransientApprovedCallsPolicyMock.approveCallsAndReturnStorage(
        advancedCalls,
        expiration,
        ADMIN,
        0,
      );
      await expect(tx)
        .to.emit(policy, "CallsApproved")
        .withArgs(
          (x: [callHash: string, maxValues: bigint[], minValues: bigint[]][]) => {
            return compareAdvancedApprovedCallsArray(x, advancedCalls);
          },
          expiration,
          ADMIN,
          0,
        );

      expect(compareAdvancedApprovedCallsArray(approvedCalls, advancedCalls)).to.be.true;

      expect(await policy.getCurrentApprovedCalls()).to.be.deep.equal([]);

      expect(await policy.nonces(ADMIN)).to.be.equal(1);
    });

    it("should approve the calls with min/max values", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2 } =
        await loadFixture(deployFixture);

      const minValues = [0, 1, 2];
      const maxValues = [10, 12, 14];

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_1,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
          minValues,
          maxValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_2,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
            123,
          ),
          minValues,
          maxValues,
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const approvedCalls = await dynamicTransientApprovedCallsPolicyMock.approveCallsAndReturnStorage.staticCall(
        advancedCalls,
        expiration,
        ADMIN,
        0,
      );
      const tx = await dynamicTransientApprovedCallsPolicyMock.approveCallsAndReturnStorage(
        advancedCalls,
        expiration,
        ADMIN,
        0,
      );
      await expect(tx)
        .to.emit(policy, "CallsApproved")
        .withArgs(
          (x: [callHash: string, maxValues: bigint[], minValues: bigint[]][]) => {
            return compareAdvancedApprovedCallsArray(x, advancedCalls);
          },
          expiration,
          ADMIN,
          0,
        );

      expect(compareAdvancedApprovedCallsArray(approvedCalls, advancedCalls)).to.be.true;

      expect(await policy.getCurrentApprovedCalls()).to.be.deep.equal([]);

      expect(await policy.nonces(ADMIN)).to.be.equal(1);
    });

    it("should revert if the max values and min values length mismatch", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2 } =
        await loadFixture(deployFixture);

      const minValues = [0, 1, 2];
      const maxValues = [10, 12];

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_1,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
          minValues,
          maxValues,
        ),
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_2,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
            123,
          ),
          minValues,
          maxValues,
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const tx = dynamicTransientApprovedCallsPolicyMock.approveCallsAndReturnStorage(
        advancedCalls,
        expiration,
        ADMIN,
        0,
      );
      await expect(tx).to.be.revertedWith(
        "DynamicTransientApprovedCallsPolicy: Max values and min values length mismatch.",
      );
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
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Calls empty.");
    });

    it("should revert if the nonce is not the current nonce", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            ADMIN,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
      ];

      const tx = policy.approveCalls(advancedCalls, 0, ADMIN, 1);
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Invalid nonce.");
    });

    it("should revert if the expiration is in the past", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            ADMIN,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
      ];

      const tx = policy.approveCalls(advancedCalls, 0, ADMIN, 0);
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Expired.");
    });

    it("should revert if the txOrigin is not the caller", async () => {
      const { policy, ADMIN, NON_ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const expiration = (await getCurrentBlockTime()) + 2;

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            ADMIN,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
      ];

      const tx = policy.approveCalls(advancedCalls, expiration, NON_ADMIN, 0);
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Invalid txOrigin.");
    });
  });

  describe("#approveCallsViaSignature", () => {
    it("should approve the calls", async () => {
      const { policy, dynamicTransientApprovedCallsPolicyMock, ADMIN, CONSUMER_1, CONSUMER_2, SENDER_1, SENDER_2 } =
        await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_1,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_2,
            dynamicTransientApprovedCallsPolicyMock,
            ADMIN,
            policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
            123,
          ),
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const signature = await createAdvancedCallsApprovedSignature(ADMIN, advancedCalls, expiration, ADMIN, 0, policy);

      const approvedCalls =
        await dynamicTransientApprovedCallsPolicyMock.approveCallsViaSignatureAndReturnStorage.staticCall(
          advancedCalls,
          expiration,
          ADMIN,
          0,
          signature,
        );
      const tx = await dynamicTransientApprovedCallsPolicyMock.approveCallsViaSignatureAndReturnStorage(
        advancedCalls,
        expiration,
        ADMIN,
        0,
        signature,
      );
      await expect(tx)
        .to.emit(policy, "CallsApprovedViaSignature")
        .withArgs(
          (x: [callHash: string, maxValues: bigint[], minValues: bigint[]][]) => {
            return compareAdvancedApprovedCallsArray(x, advancedCalls);
          },
          expiration,
          ADMIN,
          0,
          signature,
        );

      expect(compareAdvancedApprovedCallsArray(approvedCalls, advancedCalls)).to.be.true;

      expect(await policy.getCurrentApprovedCalls()).to.be.deep.equal([]);

      expect(await policy.nonces(ADMIN)).to.be.equal(1);
    });

    it("should revert if the signature is invalid", async () => {
      const { policy, ADMIN, CONSUMER_1, CONSUMER_2 } = await loadFixture(deployFixture);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_1,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
        createAdvancedApprovedCall(
          await createCallHash(
            CONSUMER_2,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setConsumersStatuses", [[await CONSUMER_2.getAddress()], [true]]),
            123,
          ),
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const signature = await createAdvancedCallsApprovedSignature(ADMIN, advancedCalls, expiration, ADMIN, 0, policy);

      const tx = policy.approveCallsViaSignature(advancedCalls, expiration, ADMIN, 0, signature);

      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Invalid signer.");
    });

    it("should revert if the calls are empty", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const tx = policy.approveCallsViaSignature([], 0, ADMIN, 0, "0x");
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Calls empty.");
    });

    it("should revert if the nonce is not the current nonce", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            ADMIN,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
      ];

      const tx = policy.approveCallsViaSignature(advancedCalls, 0, ADMIN, 1, "0x");
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Invalid nonce.");
    });

    it("should revert if the expiration is in the past", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            ADMIN,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
      ];

      const tx = policy.approveCallsViaSignature(advancedCalls, 0, ADMIN, 0, "0x");
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Expired.");
    });

    it("should revert if the txOrigin is not the caller", async () => {
      const { policy, ADMIN, NON_ADMIN } = await loadFixture(deployFixture);

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const advancedCalls = [
        createAdvancedApprovedCall(
          await createCallHash(
            ADMIN,
            ADMIN,
            ADMIN,
            policy.interface.encodeFunctionData("setExecutorStatus", [await ADMIN.getAddress(), true]),
            0,
          ),
        ),
      ];

      const expiration = (await getCurrentBlockTime()) + 2;

      const tx = policy.approveCallsViaSignature(advancedCalls, expiration, NON_ADMIN, 0, "0x");
      await expect(tx).to.be.revertedWith("DynamicTransientApprovedCallsPolicy: Invalid txOrigin.");
    });
  });

  describe("#setSighashUintIndices", () => {
    it("should set the sighash uint indices", async () => {
      const { policy, ADMIN } = await loadFixture(deployFixture);

      const sighash = "0x12345678";
      const uintIndices = [1, 2, 3];

      await policy.grantRole(await policy.SIGNER_ROLE(), ADMIN);

      const tx = await policy.setSighashUintIndices(sighash, uintIndices);
      await expect(tx).to.emit(policy, "SighashUintIndicesSet").withArgs(sighash, uintIndices);

      expect(await policy.sighashUintIndices(sighash, 0)).to.be.equal(uintIndices[0]);
      expect(await policy.sighashUintIndices(sighash, 1)).to.be.equal(uintIndices[1]);
      expect(await policy.sighashUintIndices(sighash, 2)).to.be.equal(uintIndices[2]);
    });

    it("should revert if the caller is not the signer", async () => {
      const { policy, NON_ADMIN } = await loadFixture(deployFixture);

      const sighash = "0x12345678";
      const uintIndices = [1, 2, 3];

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await policy.SIGNER_ROLE()}`;

      const tx = policy.connect(NON_ADMIN).setSighashUintIndices(sighash, uintIndices);
      await expect(tx).to.be.revertedWith(reason);
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
