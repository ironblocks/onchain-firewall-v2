import { deployAvsGovernance, deployAvsGovernanceFacet } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

async function deployFixture() {
  const { avsGovernance } = await deployAvsGovernance();
  const { avsGovernanceFacet } = await deployAvsGovernanceFacet(avsGovernance);

  return { avsGovernance, avsGovernanceFacet };
}

describe("AvsGovernanceFacet", () => {
  describe("constructor", () => {
    it("should set the Avs Governance", async () => {
      const { avsGovernanceFacet, avsGovernance } = await loadFixture(deployFixture);

      expect(await avsGovernanceFacet.avsGovernance()).to.equal(await avsGovernance.getAddress());
    });
  });

  describe("#votingPowers", () => {
    it("should return the voting powers", async () => {
      const { avsGovernanceFacet } = await loadFixture(deployFixture);

      const votingPowers = await avsGovernanceFacet.votingPowers([
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x000000000000000000000000000000000000007b",
      ]);

      expect(votingPowers).to.deep.equal([
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x000000000000000000000000000000000000007b",
      ]);
    });
  });
});
