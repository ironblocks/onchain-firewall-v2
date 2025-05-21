import { deployOBLS, deployVotingPowerSyncer } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, SYNCER] = await ethers.getSigners();

  const { obls } = await deployOBLS();
  const { votingPowerSyncer } = await deployVotingPowerSyncer(obls, SYNCER);

  return {
    ADMIN,
    NON_ADMIN,
    SYNCER,
    obls,
    votingPowerSyncer,
  };
}

describe("VotingPowerSyncer", () => {
  describe("constructor", () => {
    it("should set initial data", async () => {
      const { votingPowerSyncer, obls, SYNCER } = await loadFixture(deployFixture);

      expect(await votingPowerSyncer.obls()).to.equal(await obls.getAddress());
      expect(await votingPowerSyncer.syncer()).to.equal(await SYNCER.getAddress());
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(0);
    });
  });

  describe("#setSyncer", () => {
    it("should set a new syncer", async () => {
      const { votingPowerSyncer, SYNCER, ADMIN } = await loadFixture(deployFixture);

      expect(await votingPowerSyncer.syncer()).to.equal(await SYNCER.getAddress());

      const tx = await votingPowerSyncer.setSyncer(ADMIN);
      expect(tx).to.emit(votingPowerSyncer, "SyncerSet").withArgs(ADMIN);

      expect(await votingPowerSyncer.syncer()).to.equal(await ADMIN.getAddress());
    });

    it("should revert if caller is not an owner", async () => {
      const { votingPowerSyncer, NON_ADMIN } = await loadFixture(deployFixture);

      await expect(votingPowerSyncer.connect(NON_ADMIN).setSyncer(NON_ADMIN)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("#setOperatorVotingPower", () => {
    const operatorId = 1;

    it("should update voting power", async () => {
      const { votingPowerSyncer, NON_ADMIN, SYNCER } = await loadFixture(deployFixture);

      expect(await votingPowerSyncer.votingPower(operatorId)).to.equal(0);

      let l1BlockNumber = 100;
      let operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 100,
      };
      let tx = await votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower);
      expect(tx).to.emit(votingPowerSyncer, "OperatorVotingPowerSet").withArgs(operatorVotingPower);
      expect(await votingPowerSyncer.votingPower(operatorId)).to.equal(operatorVotingPower.votingPower);
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(l1BlockNumber);

      l1BlockNumber = 101;
      operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 150,
      };
      tx = await votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower);
      expect(tx).to.emit(votingPowerSyncer, "OperatorVotingPowerSet").withArgs(operatorVotingPower);
      expect(await votingPowerSyncer.votingPower(operatorId)).to.equal(operatorVotingPower.votingPower);
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(l1BlockNumber);

      l1BlockNumber = 103;
      operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 20,
      };
      tx = await votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower);
      expect(tx).to.emit(votingPowerSyncer, "OperatorVotingPowerSet").withArgs(operatorVotingPower);
      expect(await votingPowerSyncer.votingPower(operatorId)).to.equal(operatorVotingPower.votingPower);
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(l1BlockNumber);
    });

    it("should revert if caller is not a syncer", async () => {
      const { votingPowerSyncer } = await loadFixture(deployFixture);

      const l1BlockNumber = 100;
      const operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 100,
      };

      await expect(votingPowerSyncer.setOperatorVotingPower(l1BlockNumber, operatorVotingPower)).to.be.revertedWith(
        "VPS: caller is not the syncer",
      );
    });

    it("should revert if l1BlockNumber is already used", async () => {
      const { votingPowerSyncer, SYNCER } = await loadFixture(deployFixture);

      let l1BlockNumber = 100;
      let operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 100,
      };

      await votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower);

      l1BlockNumber = 100;
      operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 100,
      };

      await expect(
        votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower),
      ).to.be.revertedWith("VPS: Operator voting power already synced");
    });

    it("should not revert if new voting power == current voting power", async () => {
      const { votingPowerSyncer, SYNCER } = await loadFixture(deployFixture);

      let l1BlockNumber = 100;
      let operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 100,
      };
      await votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower);

      l1BlockNumber = 101;
      operatorVotingPower = {
        operatorId: operatorId,
        votingPower: 100,
      };

      await expect(votingPowerSyncer.connect(SYNCER).setOperatorVotingPower(l1BlockNumber, operatorVotingPower)).to.not
        .be.reverted;
    });
  });

  describe("#setBatchOperatorVotingPower", () => {
    const operatorIds = [1, 2, 4];

    it("should update voting powers", async () => {
      const { votingPowerSyncer, NON_ADMIN, SYNCER } = await loadFixture(deployFixture);

      expect(await votingPowerSyncer.votingPower(operatorIds[0])).to.equal(0);
      expect(await votingPowerSyncer.votingPower(operatorIds[1])).to.equal(0);
      expect(await votingPowerSyncer.votingPower(operatorIds[2])).to.equal(0);

      let l1BlockNumber = 100;
      let operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 100,
        },
        {
          operatorId: operatorIds[1],
          votingPower: 200,
        },
        {
          operatorId: operatorIds[2],
          votingPower: 300,
        },
      ];
      let tx = await votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers);
      expect(tx).to.emit(votingPowerSyncer, "BatchOperatorVotingPowerSet").withArgs(operatorVotingPowers);
      expect(await votingPowerSyncer.votingPower(operatorIds[0])).to.equal(operatorVotingPowers[0].votingPower);
      expect(await votingPowerSyncer.votingPower(operatorIds[1])).to.equal(operatorVotingPowers[1].votingPower);
      expect(await votingPowerSyncer.votingPower(operatorIds[2])).to.equal(operatorVotingPowers[2].votingPower);
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(l1BlockNumber);

      l1BlockNumber = 101;
      operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 150,
        },
        {
          operatorId: operatorIds[1],
          votingPower: 100,
        },
        {
          operatorId: operatorIds[2],
          votingPower: 20,
        },
      ];
      tx = await votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers);
      expect(tx).to.emit(votingPowerSyncer, "BatchOperatorVotingPowerSet").withArgs(operatorVotingPowers);
      expect(await votingPowerSyncer.votingPower(operatorIds[0])).to.equal(operatorVotingPowers[0].votingPower);
      expect(await votingPowerSyncer.votingPower(operatorIds[1])).to.equal(operatorVotingPowers[1].votingPower);
      expect(await votingPowerSyncer.votingPower(operatorIds[2])).to.equal(operatorVotingPowers[2].votingPower);
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(l1BlockNumber);

      l1BlockNumber = 103;
      operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 1000,
        },
        {
          operatorId: operatorIds[1],
          votingPower: 0,
        },
        {
          operatorId: operatorIds[2],
          votingPower: 2,
        },
      ];
      tx = await votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers);
      expect(tx).to.emit(votingPowerSyncer, "BatchOperatorVotingPowerSet").withArgs(operatorVotingPowers);
      expect(await votingPowerSyncer.votingPower(operatorIds[0])).to.equal(operatorVotingPowers[0].votingPower);
      expect(await votingPowerSyncer.votingPower(operatorIds[1])).to.equal(operatorVotingPowers[1].votingPower);
      expect(await votingPowerSyncer.votingPower(operatorIds[2])).to.equal(operatorVotingPowers[2].votingPower);
      expect(await votingPowerSyncer.lastSyncedL1BlockNumber()).to.equal(l1BlockNumber);
    });

    it("should revert if caller is not a syncer", async () => {
      const { votingPowerSyncer } = await loadFixture(deployFixture);

      const l1BlockNumber = 100;
      const operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 100,
        },
      ];

      await expect(
        votingPowerSyncer.setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers),
      ).to.be.revertedWith("VPS: caller is not the syncer");
    });

    it("should revert if l1BlockNumber is already used", async () => {
      const { votingPowerSyncer, SYNCER } = await loadFixture(deployFixture);

      let l1BlockNumber = 100;
      let operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 100,
        },
      ];

      await votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers);

      l1BlockNumber = 100;
      operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 101,
        },
      ];

      await expect(
        votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers),
      ).to.be.revertedWith("VPS: Operator voting power already synced");
    });

    it("should not revert if new voting power == current voting power", async () => {
      const { votingPowerSyncer, SYNCER } = await loadFixture(deployFixture);

      let l1BlockNumber = 100;
      let operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 100,
        },
      ];

      await votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers);

      l1BlockNumber = 101;
      operatorVotingPowers = [
        {
          operatorId: operatorIds[0],
          votingPower: 100,
        },
      ];

      await expect(votingPowerSyncer.connect(SYNCER).setBatchOperatorVotingPower(l1BlockNumber, operatorVotingPowers))
        .to.not.be.reverted;
    });
  });

  describe("#setTotalVotingPowerPerRestrictedTaskDefinition", () => {
    it("should set the total voting power per restricted task definition", async () => {
      const { votingPowerSyncer, SYNCER } = await loadFixture(deployFixture);

      const taskDefinitionId = 1;
      const minimumVotingPower = 100;
      const restrictedAttesterIds = [2, 3];

      const tx = await votingPowerSyncer
        .connect(SYNCER)
        .setTotalVotingPowerPerRestrictedTaskDefinition(taskDefinitionId, minimumVotingPower, restrictedAttesterIds);

      expect(tx).to.not.be.reverted;
    });

    it("should revert if caller is not a syncer", async () => {
      const { votingPowerSyncer, NON_ADMIN } = await loadFixture(deployFixture);

      const taskDefinitionId = 1;
      const minimumVotingPower = 100;
      const restrictedAttesterIds = [2, 3];

      await expect(
        votingPowerSyncer
          .connect(NON_ADMIN)
          .setTotalVotingPowerPerRestrictedTaskDefinition(taskDefinitionId, minimumVotingPower, restrictedAttesterIds),
      ).to.be.revertedWith("VPS: caller is not the syncer");
    });
  });

  describe("#setTotalVotingPowerPerTaskDefinition", () => {
    it("should set the total voting power per task definition", async () => {
      const { votingPowerSyncer, SYNCER } = await loadFixture(deployFixture);

      const taskDefinitionId = 1;
      const numOfTotalOperators = 10;
      const minimumVotingPower = 100;

      const tx = await votingPowerSyncer
        .connect(SYNCER)
        .setTotalVotingPowerPerTaskDefinition(taskDefinitionId, numOfTotalOperators, minimumVotingPower);

      expect(tx).to.not.be.reverted;
    });

    it("should revert if caller is not a syncer", async () => {
      const { votingPowerSyncer, NON_ADMIN } = await loadFixture(deployFixture);

      const taskDefinitionId = 1;
      const numOfTotalOperators = 10;
      const minimumVotingPower = 100;

      await expect(
        votingPowerSyncer
          .connect(NON_ADMIN)
          .setTotalVotingPowerPerTaskDefinition(taskDefinitionId, numOfTotalOperators, minimumVotingPower),
      ).to.be.revertedWith("VPS: caller is not the syncer");
    });
  });

  describe("#votingPower", () => {
    const operatorId = 1;

    it("should return obls voting power", async () => {
      const { votingPowerSyncer, obls } = await loadFixture(deployFixture);

      expect(await votingPowerSyncer.votingPower(operatorId)).to.equal(0);

      await obls.increaseOperatorVotingPower(operatorId, 123);
      expect(await votingPowerSyncer.votingPower(operatorId)).to.equal(123);
    });
  });

  describe("#votingPowers", () => {
    const operatorIds = [1, 2, 4];

    it("should return obls voting powers", async () => {
      const { votingPowerSyncer, obls } = await loadFixture(deployFixture);

      expect(await votingPowerSyncer.votingPowers(operatorIds)).to.deep.equal([0, 0, 0]);

      await obls.increaseOperatorVotingPower(operatorIds[0], 123);
      await obls.increaseOperatorVotingPower(operatorIds[2], 456);
      expect(await votingPowerSyncer.votingPowers(operatorIds)).to.deep.equal([123, 0, 456]);
    });
  });
});
