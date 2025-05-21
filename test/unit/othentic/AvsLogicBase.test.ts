import { deployAvsLogicBase } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [ADMIN, NON_ADMIN, ATTESTATION_CENTER, ATTESTATION_CENTER_2] = await ethers.getSigners();

  const { avsLogicBase } = await deployAvsLogicBase(ATTESTATION_CENTER, ADMIN);

  return { ADMIN, NON_ADMIN, ATTESTATION_CENTER, ATTESTATION_CENTER_2, avsLogicBase };
}

describe("AvsLogicBase", () => {
  describe("#constructor", () => {
    it("should set the data", async () => {
      const { avsLogicBase, ADMIN, ATTESTATION_CENTER } = await loadFixture(deployFixture);

      expect(await avsLogicBase.attestationCenter()).to.equal(ATTESTATION_CENTER);

      expect(await avsLogicBase.hasRole(await avsLogicBase.DEFAULT_ADMIN_ROLE(), ADMIN)).to.be.true;
    });
  });

  describe("#setAttestationCenter", () => {
    it("should set the attestation center", async () => {
      const { avsLogicBase, ADMIN, ATTESTATION_CENTER_2 } = await loadFixture(deployFixture);

      const tx = await avsLogicBase.connect(ADMIN).setAttestationCenter(ATTESTATION_CENTER_2);
      await expect(tx).to.emit(avsLogicBase, "AttestationCenterUpdated").withArgs(ATTESTATION_CENTER_2);

      expect(await avsLogicBase.attestationCenter()).to.equal(ATTESTATION_CENTER_2);
    });

    it("should revert if the caller is not the admin", async () => {
      const { avsLogicBase, ATTESTATION_CENTER_2, NON_ADMIN } = await loadFixture(deployFixture);

      const reason = `AccessControl: account ${NON_ADMIN.address.toLowerCase()} is missing role ${await avsLogicBase.ADMIN_ROLE()}`;

      await expect(avsLogicBase.connect(NON_ADMIN).setAttestationCenter(ATTESTATION_CENTER_2)).to.be.revertedWith(
        reason,
      );
    });
  });
});
