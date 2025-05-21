import { getFeePercentage } from "@/scripts/helpers";
import {
  deployAttestationCenter,
  deployFeePool,
  deployOBLS,
  deployOperatorRegistry,
  deployPolicy,
  deployProtocolRegistry,
  deployVennFeeCalculator,
  deployVennFeeCalculatorV20,
} from "@/test/fixtures";
import { defaultProtocolRegistryInitData } from "@/test/unit/ProtocolRegisrty.test";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther, ZeroAddress, zeroPadValue } from "ethers";
import { ethers } from "hardhat";

export enum OperatorType {
  ATTESTER = 0,
  AGGREGATOR = 1,
  PERFORMER = 2,
}

const TASK_DEFINITION_ID = 1;

const TOTAL_FEE = parseEther("1");
const OPERATORS_SHARE = getFeePercentage("50");
const ATTESTERS_SHARE = getFeePercentage("50");
const AGGREGATOR_SHARE = getFeePercentage("40");
const PERFORMER_SHARE = getFeePercentage("10");

const OPERATORS_FEE = TOTAL_FEE / 2n;
const ATTESTERS_FEE = OPERATORS_FEE / 2n;
const AGGREGATOR_FEE = (OPERATORS_FEE * 40n) / 100n;
const PERFORMER_FEE = OPERATORS_FEE / 10n;

async function deployFixture() {
  const [
    ADMIN,
    NON_ADMIN,
    VENN_FEE_RECIPIENT,
    FEE_POOL,
    TREASURY_1,
    TREASURY_2,
    TREASURY_3,
    ATTESTER_1,
    ATTESTER_2,
    ATTESTER_3,
    ATTESTER_4,
    ATTESTER_5,
  ] = await ethers.getSigners();

  const TREASURY_1_RECIPIENT = zeroPadValue(await TREASURY_1.getAddress(), 32);
  const TREASURY_2_RECIPIENT = zeroPadValue(await TREASURY_2.getAddress(), 32);
  const TREASURY_3_RECIPIENT = zeroPadValue(await TREASURY_3.getAddress(), 32);
  const ATTESTER_1_ID = zeroPadValue(await ATTESTER_1.getAddress(), 32);
  const ATTESTER_2_ID = zeroPadValue(await ATTESTER_2.getAddress(), 32);
  const ATTESTER_3_ID = zeroPadValue(await ATTESTER_3.getAddress(), 32);
  const ATTESTER_4_ID = zeroPadValue(await ATTESTER_4.getAddress(), 32);
  const ATTESTER_5_ID = zeroPadValue(await ATTESTER_5.getAddress(), 32);

  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);
  const { protocolRegistry } = await deployProtocolRegistry(
    ADMIN,
    defaultProtocolRegistryInitData(attestationCenter, VENN_FEE_RECIPIENT),
  );
  const { operatorRegistry } = await deployOperatorRegistry(attestationCenter, 100, ADMIN);
  const { vennFeeCalculatorImplementation, vennFeeCalculator } = await deployVennFeeCalculator(operatorRegistry, ADMIN);
  const { vennFeeCalculatorV20Implementation } = await deployVennFeeCalculatorV20();
  const { policy } = await deployPolicy();

  await vennFeeCalculator.grantRole(await vennFeeCalculator.FEE_POOL_ROLE(), FEE_POOL);
  await attestationCenter.setNumOfTaskDefinitions(TASK_DEFINITION_ID + 1);
  await protocolRegistry.registerProtocol(policy, "");
  await protocolRegistry.subscribeSubnet(policy, TASK_DEFINITION_ID, []);
  return {
    vennFeeCalculator,
    vennFeeCalculatorImplementation,
    vennFeeCalculatorV20Implementation,
    protocolRegistry,
    policy,
    operatorRegistry,
    ADMIN,
    NON_ADMIN,
    FEE_POOL,
    attestationCenter,
    VENN_FEE_RECIPIENT,
    ATTESTER_1,
    ATTESTER_2,
    ATTESTER_3,
    ATTESTER_4,
    ATTESTER_5,
    ATTESTER_1_ID,
    ATTESTER_2_ID,
    ATTESTER_3_ID,
    ATTESTER_4_ID,
    ATTESTER_5_ID,
    TREASURY_1,
    TREASURY_2,
    TREASURY_3,
    TREASURY_1_RECIPIENT,
    TREASURY_2_RECIPIENT,
    TREASURY_3_RECIPIENT,
  };
}

describe("VennFeeCalculator", () => {
  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { vennFeeCalculatorImplementation } = await loadFixture(deployFixture);

        await expect(vennFeeCalculatorImplementation.__VennFeeCalculator_init(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#__VennFeeCalculator_init", () => {
      it("should set correct data after creation", async () => {
        const { vennFeeCalculator, ADMIN } = await loadFixture(deployFixture);

        expect(await vennFeeCalculator.hasRole(await vennFeeCalculator.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { vennFeeCalculator } = await loadFixture(deployFixture);

        await expect(vennFeeCalculator.__VennFeeCalculator_init(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { vennFeeCalculator, vennFeeCalculatorV20Implementation } = await loadFixture(deployFixture);

        await vennFeeCalculator.upgradeTo(await vennFeeCalculatorV20Implementation.getAddress());

        expect(await vennFeeCalculator.version()).to.eq(20);
      });

      it("should revert if caller is not the owner", async () => {
        const { vennFeeCalculator, NON_ADMIN } = await loadFixture(deployFixture);

        const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.ADMIN_ROLE()}`;

        await expect(vennFeeCalculator.connect(NON_ADMIN).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { vennFeeCalculator } = await loadFixture(deployFixture);

        expect(await vennFeeCalculator.version()).to.eq(1);
      });
    });
  });

  describe("#calculateBaseRewardFees", () => {
    it("should return zeroes ", async () => {
      const { vennFeeCalculator, policy } = await loadFixture(deployFixture);

      const protocolFees = [parseEther("0.001"), parseEther("0.002"), parseEther("0.003"), parseEther("1")];
      const attestersIdss = [[0], [0, 1], [0, 1, 2], [0, 1, 2, 3]];

      for (let i = 0; i < protocolFees.length; i++) {
        const protocolFee = protocolFees[i];
        const attestersIds = attestersIdss[i];

        await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, protocolFee);

        const rewards = await vennFeeCalculator.calculateBaseRewardFees({
          data: {
            proofOfTask: "",
            data: await policy.getAddress(),
            taskPerformer: ZeroAddress,
            taskDefinitionId: TASK_DEFINITION_ID,
          },
          aggregatorId: 0,
          performerId: 0,
          attestersIds: attestersIds,
          isApproved: true,
        });

        expect(rewards.baseRewardFeeForAttesters).to.eq(0);
        expect(rewards.baseRewardFeeForAggregator).to.eq(0);
        expect(rewards.baseRewardFeeForPerformer).to.eq(0);
      }
    });
  });

  describe("#calculateFeesPerId", () => {
    it("should return rewards array with fully distributed fee", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, FEE_POOL } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        TASK_DEFINITION_ID,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
        [getFeePercentage("40"), getFeePercentage("10")],
      );
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        TASK_DEFINITION_ID,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);

      const feesPerId = await vennFeeCalculator.calculateFeesPerId.staticCall({
        data: {
          proofOfTask: "",
          data: "0x",
          taskPerformer: ZeroAddress,
          taskDefinitionId: TASK_DEFINITION_ID,
        },
        aggregatorId: 0,
        performerId: 1,
        attestersIds: [2, 3, 4, 5],
        isApproved: true,
      });

      expect(feesPerId.length).to.eq(6);

      const totalFee = feesPerId.reduce((acc, fee) => acc + fee.fee, 0n);

      expect(totalFee).to.eq(OPERATORS_FEE);
    });

    it("should return correct value for aggregator", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, FEE_POOL } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        TASK_DEFINITION_ID,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
        [getFeePercentage("40"), getFeePercentage("10")],
      );
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        TASK_DEFINITION_ID,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);

      const aggregatorIndex = 0n;

      const feesPerId = await vennFeeCalculator.calculateFeesPerId.staticCall({
        data: {
          proofOfTask: "",
          data: "0x",
          taskPerformer: ZeroAddress,
          taskDefinitionId: TASK_DEFINITION_ID,
        },
        aggregatorId: aggregatorIndex,
        performerId: 1,
        attestersIds: [2, 3, 4, 5],
        isApproved: true,
      });

      const aggregatorFee = feesPerId.find((fee) => fee.index === aggregatorIndex)?.fee;

      expect(aggregatorFee).to.eq(AGGREGATOR_FEE);
    });

    it("should return correct value for performer", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, FEE_POOL } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        TASK_DEFINITION_ID,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
        [getFeePercentage("40"), getFeePercentage("10")],
      );
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        TASK_DEFINITION_ID,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);

      const performerIndex = 2n;

      const feesPerId = await vennFeeCalculator.calculateFeesPerId.staticCall({
        data: {
          proofOfTask: "",
          data: "0x",
          taskPerformer: ZeroAddress,
          taskDefinitionId: TASK_DEFINITION_ID,
        },
        aggregatorId: 0,
        performerId: performerIndex,
        attestersIds: [2, 3, 4, 5],
        isApproved: true,
      });

      const performerFee = feesPerId.find((fee) => fee.index === performerIndex)?.fee;

      expect(performerFee).to.eq(PERFORMER_FEE);
    });

    it("should uniformly distribute the fee to the attesters without subscribed operators", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, FEE_POOL } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        TASK_DEFINITION_ID,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
        [getFeePercentage("40"), getFeePercentage("10")],
      );
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        TASK_DEFINITION_ID,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);

      const attestersIds = [2n, 3n, 4n, 5n];

      const feesPerId = await vennFeeCalculator.calculateFeesPerId.staticCall({
        data: {
          proofOfTask: "",
          data: "0x",
          taskPerformer: ZeroAddress,
          taskDefinitionId: TASK_DEFINITION_ID,
        },
        aggregatorId: 0,
        performerId: 1,
        attestersIds: attestersIds,
        isApproved: true,
      });

      const attestersFees = feesPerId.filter((fee) => attestersIds.includes(fee.index));
      expect(attestersFees.length).to.eq(attestersIds.length);

      const totalAttestersFee = attestersFees.reduce((acc, fee) => acc + fee.fee, 0n);
      expect(totalAttestersFee).to.eq(ATTESTERS_FEE);

      const feePerAttester = BigInt(Number(ATTESTERS_FEE) / attestersIds.length);

      for (const fee of attestersFees) {
        expect(fee.fee).to.eq(feePerAttester);
      }
    });

    it("should uniformly distribute the fee to the attesters with subscribed operators", async () => {
      const {
        vennFeeCalculator,
        operatorRegistry,
        ATTESTER_1,
        ATTESTER_2,
        ATTESTER_3,
        ATTESTER_4,
        ATTESTER_5,
        ATTESTER_1_ID,
        ATTESTER_2_ID,
        ATTESTER_3_ID,
        ATTESTER_4_ID,
        ATTESTER_5_ID,
        TREASURY_1_RECIPIENT,
        TREASURY_2_RECIPIENT,
        FEE_POOL,
      } = await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        TASK_DEFINITION_ID,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
        [getFeePercentage("40"), getFeePercentage("10")],
      );
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        TASK_DEFINITION_ID,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);

      const attestersIds = [ATTESTER_1_ID, ATTESTER_2_ID, ATTESTER_3_ID];

      await operatorRegistry.registerOperator(ATTESTER_1, "");
      await operatorRegistry.registerOperator(ATTESTER_2, "");
      await operatorRegistry.registerOperator(ATTESTER_3, "");
      await operatorRegistry.registerOperator(ATTESTER_4, "");
      await operatorRegistry.registerOperator(ATTESTER_5, "");

      await operatorRegistry
        .connect(ATTESTER_1)
        .subscribeOperators(
          TASK_DEFINITION_ID,
          [ATTESTER_2, ATTESTER_3],
          [getFeePercentage("10"), getFeePercentage("20")],
        );
      await operatorRegistry
        .connect(ATTESTER_3)
        .subscribeOperators(
          TASK_DEFINITION_ID,
          [ATTESTER_4, ATTESTER_5],
          [getFeePercentage("30"), getFeePercentage("40")],
        );

      const feesPerId = await vennFeeCalculator.calculateFeesPerId.staticCall({
        data: {
          proofOfTask: "",
          data: "0x",
          taskPerformer: ZeroAddress,
          taskDefinitionId: TASK_DEFINITION_ID,
        },
        aggregatorId: 0,
        performerId: 1,
        attestersIds: attestersIds,
        isApproved: true,
      });

      expect(feesPerId.length).to.eq(7 + 2);

      const totalOperatorsFee = feesPerId.reduce((acc, fee) => acc + fee.fee, 0n);
      expect(totalOperatorsFee).to.closeTo(OPERATORS_FEE, 1);

      const attestersFees = feesPerId.slice(2);
      const totalAttestersFee = attestersFees.reduce((acc, fee) => acc + fee.fee, 0n);
      expect(totalAttestersFee).to.closeTo(ATTESTERS_FEE, 1);

      const feesPerAttester = Number(ATTESTERS_FEE) / attestersIds.length;

      const attestersFeesMap = attestersFees.reduce(
        (acc, fee) => {
          acc[zeroPadValue("0x" + fee.index.toString(16), 32)] =
            (acc[zeroPadValue("0x" + fee.index.toString(16), 32)] || 0) + Number(fee.fee);
          return acc;
        },
        {} as Record<string, number>,
      );

      expect(attestersFeesMap[ATTESTER_1_ID]).to.closeTo(feesPerAttester * 0.7, 100);
      expect(attestersFeesMap[ATTESTER_2_ID]).to.closeTo(feesPerAttester * 1.1, 100);
      expect(attestersFeesMap[ATTESTER_3_ID]).to.closeTo(feesPerAttester * 0.3 + feesPerAttester * 0.2, 100);
      expect(attestersFeesMap[ATTESTER_4_ID]).to.closeTo(feesPerAttester * 0.3, 100);
      expect(attestersFeesMap[ATTESTER_5_ID]).to.closeTo(feesPerAttester * 0.4, 100);
    });

    it("should distribute fee to the performer only if attestersIds is empty", async () => {
      const { vennFeeCalculator, FEE_POOL, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        TASK_DEFINITION_ID,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
        [getFeePercentage("40"), getFeePercentage("10")],
      );
      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        TASK_DEFINITION_ID,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);

      const feesPerId = await vennFeeCalculator.calculateFeesPerId.staticCall({
        data: {
          proofOfTask: "",
          data: "0x",
          taskPerformer: ZeroAddress,
          taskDefinitionId: TASK_DEFINITION_ID,
        },
        aggregatorId: 0,
        performerId: 1,
        attestersIds: [],
        isApproved: true,
      });

      expect(feesPerId.length).to.eq(1);

      expect(feesPerId[0].index).to.eq(1);
      expect(feesPerId[0].fee).to.eq(OPERATORS_FEE);
    });
  });

  describe("#isBaseRewardFee", () => {
    it("should return false ", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      expect(await vennFeeCalculator.isBaseRewardFee()).to.be.false;
    });
  });

  describe("#setOperatorRegistry", () => {
    it("should set the operator registry", async () => {
      const { vennFeeCalculator, ADMIN } = await loadFixture(deployFixture);

      const tx = await vennFeeCalculator.setOperatorRegistry(ADMIN);
      await expect(tx).to.emit(vennFeeCalculator, "OperatorRegistryUpdated").withArgs(ADMIN);

      expect(await vennFeeCalculator.operatorRegistry()).to.eq(ADMIN);
    });

    it("should revert if the caller is not the admin", async () => {
      const { vennFeeCalculator, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.ADMIN_ROLE()}`;

      await expect(vennFeeCalculator.connect(NON_ADMIN).setOperatorRegistry(NON_ADMIN)).to.be.revertedWith(reason);
    });
  });

  describe("#setTaskDefinitionFee", () => {
    const taskDefinitionId = 1;

    it("should set task definition fee", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      let fee = 10;
      let tx = await vennFeeCalculator.setTaskDefinitionFee(taskDefinitionId, fee);
      await expect(tx).to.emit(vennFeeCalculator, "TaskDefinitionFeeSet").withArgs(taskDefinitionId, fee);
      expect(await vennFeeCalculator.taskDefinitionIdTotalFees(taskDefinitionId)).to.eq(fee);

      fee = 12321312;
      tx = await vennFeeCalculator.setTaskDefinitionFee(taskDefinitionId, fee);
      await expect(tx).to.emit(vennFeeCalculator, "TaskDefinitionFeeSet").withArgs(taskDefinitionId, fee);
      expect(await vennFeeCalculator.taskDefinitionIdTotalFees(taskDefinitionId)).to.eq(fee);
    });

    it("should revert if caller is not the admin", async () => {
      const { vennFeeCalculator, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.ADMIN_ROLE()}`;

      await expect(vennFeeCalculator.connect(NON_ADMIN).setTaskDefinitionFee(taskDefinitionId, 0)).to.be.revertedWith(
        reason,
      );
    });
  });

  describe("#setTaskDefinitionFeeRecipients", () => {
    const taskDefinitionId = 1;

    it("should set task definition fee recipients", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT } =
        await loadFixture(deployFixture);

      const recipients = [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT];
      const feeShares = [getFeePercentage("10"), getFeePercentage("20"), getFeePercentage("40")];

      const tx = await vennFeeCalculator.setTaskDefinitionFeeRecipients(taskDefinitionId, recipients, feeShares);

      await expect(tx)
        .to.emit(vennFeeCalculator, "TaskDefinitionFeeRecipientsSet")
        .withArgs(taskDefinitionId, recipients, feeShares);

      const taskDefinitionIdFeeRecipients = await vennFeeCalculator.getTaskDefinitionIdFeeRecipients(taskDefinitionId);
      expect(taskDefinitionIdFeeRecipients.recipients).to.deep.eq(recipients);
      expect(taskDefinitionIdFeeRecipients.feeShares).to.deep.eq(feeShares);
    });

    it("should modify existing recipients", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT } =
        await loadFixture(deployFixture);

      const recipients = [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT];
      let feeShares = [getFeePercentage("10"), getFeePercentage("20"), getFeePercentage("40")];

      await vennFeeCalculator.setTaskDefinitionFeeRecipients(taskDefinitionId, recipients, feeShares);

      feeShares = [getFeePercentage("0"), getFeePercentage("25"), getFeePercentage("45")];

      const tx = await vennFeeCalculator.setTaskDefinitionFeeRecipients(taskDefinitionId, recipients, feeShares);
      await expect(tx)
        .to.emit(vennFeeCalculator, "TaskDefinitionFeeRecipientsSet")
        .withArgs(taskDefinitionId, recipients, feeShares);

      const taskDefinitionIdFeeRecipients = await vennFeeCalculator.getTaskDefinitionIdFeeRecipients(taskDefinitionId);
      expect(taskDefinitionIdFeeRecipients.recipients).to.deep.eq([TREASURY_3_RECIPIENT, TREASURY_2_RECIPIENT]);
      expect(taskDefinitionIdFeeRecipients.feeShares).to.deep.eq([getFeePercentage("45"), getFeePercentage("25")]);
    });

    it("should revert if caller is not the admin", async () => {
      const { vennFeeCalculator, NON_ADMIN } = await loadFixture(deployFixture);

      await expect(
        vennFeeCalculator.connect(NON_ADMIN).setTaskDefinitionFeeRecipients(taskDefinitionId, [], []),
      ).to.be.revertedWith(
        `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.ADMIN_ROLE()}`,
      );
    });

    it("should not revert if task definition id is invalid", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      await expect(vennFeeCalculator.setTaskDefinitionFeeRecipients(10, [], [])).to.not.be.reverted;
    });

    it("should revert if recipients and fee shares length mismatch", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      await expect(vennFeeCalculator.setTaskDefinitionFeeRecipients(1, [], [1])).to.be.revertedWith(
        "VennFeeCalculator: Recipients and shares length mismatch",
      );
    });

    it("should revert if total fee shares >= 100", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT } = await loadFixture(deployFixture);

      await expect(
        vennFeeCalculator.setTaskDefinitionFeeRecipients(1, [TREASURY_1_RECIPIENT], [getFeePercentage("100")]),
      ).to.be.revertedWith("VennFeeCalculator: Total fee share must be less than 100%");
    });
  });

  describe("#getTaskDefinitionIdFeeRecipients", () => {
    const taskDefinitionId = 1;

    it("should return correct data", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT } =
        await loadFixture(deployFixture);

      let taskDefinitionIdFeeRecipients = await vennFeeCalculator.getTaskDefinitionIdFeeRecipients(taskDefinitionId);
      expect(taskDefinitionIdFeeRecipients.recipients).to.deep.eq([]);
      expect(taskDefinitionIdFeeRecipients.feeShares).to.deep.eq([]);

      const recipients = [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT];
      const feeShares = [getFeePercentage("10"), getFeePercentage("20"), getFeePercentage("40")];

      await vennFeeCalculator.setTaskDefinitionFeeRecipients(taskDefinitionId, recipients, feeShares);

      taskDefinitionIdFeeRecipients = await vennFeeCalculator.getTaskDefinitionIdFeeRecipients(taskDefinitionId);
      expect(taskDefinitionIdFeeRecipients.recipients).to.deep.eq(recipients);
      expect(taskDefinitionIdFeeRecipients.feeShares).to.deep.eq(feeShares);
    });

    it("should return empty data if task definition id is invalid", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      let taskDefinitionIdFeeRecipients = await vennFeeCalculator.getTaskDefinitionIdFeeRecipients(10);
      expect(taskDefinitionIdFeeRecipients.recipients).to.deep.eq([]);
      expect(taskDefinitionIdFeeRecipients.feeShares).to.deep.eq([]);
    });
  });

  describe("#setTaskDefinitionIdOperatorFees", () => {
    const taskDefinitionId = 1;

    it("should set task definition id operator fees", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      const operatorTypes = [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER];
      const operatorFees = [getFeePercentage("30"), getFeePercentage("20"), getFeePercentage("50")];

      const tx = await vennFeeCalculator.setTaskDefinitionIdOperatorFees(taskDefinitionId, operatorTypes, operatorFees);
      await expect(tx)
        .to.emit(vennFeeCalculator, "TaskDefinitionIdOperatorFeesSet")
        .withArgs(taskDefinitionId, operatorTypes, operatorFees);

      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.ATTESTER)).to.eq(
        getFeePercentage("30"),
      );
      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.AGGREGATOR)).to.eq(
        getFeePercentage("20"),
      );
      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.PERFORMER)).to.eq(
        getFeePercentage("50"),
      );
    });

    it("should revert if caller is not the admin", async () => {
      const { vennFeeCalculator, NON_ADMIN } = await loadFixture(deployFixture);

      await expect(
        vennFeeCalculator.connect(NON_ADMIN).setTaskDefinitionIdOperatorFees(taskDefinitionId, [], []),
      ).to.be.revertedWith(
        `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.ADMIN_ROLE()}`,
      );
    });

    it("should revert if operator types and fees length mismatch", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      await expect(vennFeeCalculator.setTaskDefinitionIdOperatorFees(1, [], [1])).to.be.revertedWith(
        "VennFeeCalculator: Operator types and fees length mismatch",
      );
    });

    it("should revert if total fee shares is not 100", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      await expect(
        vennFeeCalculator.setTaskDefinitionIdOperatorFees(
          1,
          [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
          [getFeePercentage("1"), getFeePercentage("1"), getFeePercentage("1")],
        ),
      ).to.be.revertedWith("VennFeeCalculator: Total fee share must be 100%");

      await expect(
        vennFeeCalculator.setTaskDefinitionIdOperatorFees(
          1,
          [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
          [getFeePercentage("1"), getFeePercentage("1"), getFeePercentage("99")],
        ),
      ).to.be.revertedWith("VennFeeCalculator: Total fee share must be 100%");
    });
  });

  describe("#distributeFee", () => {
    const taskDefinitionId = 1;

    it("should distribute fee", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT, FEE_POOL } =
        await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(taskDefinitionId, 100);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        taskDefinitionId,
        [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT, TREASURY_3_RECIPIENT],
        [getFeePercentage("20"), getFeePercentage("20"), getFeePercentage("40")],
      );

      const tx = await vennFeeCalculator.connect(FEE_POOL).distributeFee(taskDefinitionId);
      await expect(tx)
        .to.emit(vennFeeCalculator, "FeeDistributed")
        .withArgs(taskDefinitionId, TREASURY_1_RECIPIENT, 20);
      await expect(tx)
        .to.emit(vennFeeCalculator, "FeeDistributed")
        .withArgs(taskDefinitionId, TREASURY_2_RECIPIENT, 20);
      await expect(tx)
        .to.emit(vennFeeCalculator, "FeeDistributed")
        .withArgs(taskDefinitionId, TREASURY_3_RECIPIENT, 40);

      expect(await vennFeeCalculator.distributedFees(TREASURY_1_RECIPIENT)).to.eq(20);
      expect(await vennFeeCalculator.distributedFees(TREASURY_2_RECIPIENT)).to.eq(20);
      expect(await vennFeeCalculator.distributedFees(TREASURY_3_RECIPIENT)).to.eq(40);

      expect(await vennFeeCalculator.operatorFees(taskDefinitionId)).to.eq(20);
    });

    it("should revert if caller is not the fee pool", async () => {
      const { vennFeeCalculator, ADMIN } = await loadFixture(deployFixture);

      await expect(vennFeeCalculator.connect(ADMIN).distributeFee(1)).to.be.revertedWith(
        `AccessControl: account ${(await ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.FEE_POOL_ROLE()}`,
      );
    });
  });

  describe("#withdrawFee", () => {
    const taskDefinitionId = 1;

    it("should withdraw fee", async () => {
      const { vennFeeCalculator, TREASURY_1_RECIPIENT, FEE_POOL } = await loadFixture(deployFixture);

      await vennFeeCalculator.setTaskDefinitionFee(taskDefinitionId, 100);
      await vennFeeCalculator.setTaskDefinitionFeeRecipients(
        taskDefinitionId,
        [TREASURY_1_RECIPIENT],
        [getFeePercentage("80")],
      );

      await vennFeeCalculator.connect(FEE_POOL).distributeFee(taskDefinitionId);

      const tx = await vennFeeCalculator.withdrawFee(taskDefinitionId, TREASURY_1_RECIPIENT);
      await expect(tx).to.emit(vennFeeCalculator, "FeeWithdrawn").withArgs(taskDefinitionId, TREASURY_1_RECIPIENT, 80);

      expect(await vennFeeCalculator.distributedFees(TREASURY_1_RECIPIENT)).to.eq(0);
    });

    it("should revert if caller is not the admin", async () => {
      const { vennFeeCalculator, NON_ADMIN, TREASURY_1_RECIPIENT } = await loadFixture(deployFixture);

      await expect(vennFeeCalculator.connect(NON_ADMIN).withdrawFee(1, TREASURY_1_RECIPIENT)).to.be.revertedWith(
        `AccessControl: account ${(await NON_ADMIN.getAddress()).toLowerCase()} is missing role ${await vennFeeCalculator.ADMIN_ROLE()}`,
      );
    });
  });

  describe("#taskDefinitionIdOperatorFees", () => {
    const taskDefinitionId = 1;

    it("should return correct data", async () => {
      const { vennFeeCalculator } = await loadFixture(deployFixture);

      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.ATTESTER)).to.eq(0);
      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.AGGREGATOR)).to.eq(0);
      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.PERFORMER)).to.eq(0);

      await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
        taskDefinitionId,
        [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
        [getFeePercentage("10"), getFeePercentage("20"), getFeePercentage("70")],
      );

      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.ATTESTER)).to.eq(
        getFeePercentage("10"),
      );
      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.AGGREGATOR)).to.eq(
        getFeePercentage("20"),
      );
      expect(await vennFeeCalculator.taskDefinitionIdOperatorFees(taskDefinitionId, OperatorType.PERFORMER)).to.eq(
        getFeePercentage("70"),
      );
    });
  });
});

// await vennFeeCalculator.setTaskDefinitionFee(TASK_DEFINITION_ID, TOTAL_FEE);
// await vennFeeCalculator.setTaskDefinitionFeeRecipients(
//   TASK_DEFINITION_ID,
//   [TREASURY_1_RECIPIENT, TREASURY_2_RECIPIENT],
//   [getFeePercentage("40"), getFeePercentage("10")],
// );
// await vennFeeCalculator.setTaskDefinitionIdOperatorFees(
//   TASK_DEFINITION_ID,
//   [OperatorType.ATTESTER, OperatorType.AGGREGATOR, OperatorType.PERFORMER],
//   [ATTESTERS_SHARE, AGGREGATOR_SHARE, PERFORMER_SHARE],
// );

// await vennFeeCalculator.connect(FEE_POOL).distributeFee(TASK_DEFINITION_ID);
