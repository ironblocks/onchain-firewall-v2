import { deployAttestationCenter, deployAttestationCenterFacet, deployOBLS } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";

async function deployFixture() {
  const { obls } = await deployOBLS();
  const { attestationCenter } = await deployAttestationCenter(obls);
  const { attestationCenterFacet } = await deployAttestationCenterFacet(attestationCenter);

  return { attestationCenter, attestationCenterFacet };
}

describe("AttestationCenterFacet", () => {
  describe("constructor", () => {
    it("should set the attestation center", async () => {
      const { attestationCenterFacet, attestationCenter } = await loadFixture(deployFixture);

      expect(await attestationCenterFacet.attestationCenter()).to.equal(await attestationCenter.getAddress());
    });
  });

  describe("#getOperatorAddressByIds", () => {
    it("should return the operator address", async () => {
      const { attestationCenterFacet } = await loadFixture(deployFixture);

      const operatorAddresses = await attestationCenterFacet.getOperatorAddressByIds([1, 1, 123]);

      expect(operatorAddresses).to.deep.equal([
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000001",
        "0x000000000000000000000000000000000000007b",
      ]);
    });

    it("should not revert if operator is not exists", async () => {
      const { attestationCenterFacet } = await loadFixture(deployFixture);

      const operatorAddresses = await attestationCenterFacet.getOperatorAddressByIds([99999]);

      expect(operatorAddresses).to.deep.equal([ZeroAddress]);
    });
  });
});
