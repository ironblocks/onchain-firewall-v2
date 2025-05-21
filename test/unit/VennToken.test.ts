import { deployVennToken, deployVennTokenV20 } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { parseEther, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

const INITIAL_SUPPLY = parseEther("1000000");

async function deployFixture() {
  const [OWNER, NOT_OWNER] = await ethers.getSigners();
  const { vennTokenImplementation, vennToken } = await deployVennToken(INITIAL_SUPPLY);
  const { vennTokenV20Implementation } = await deployVennTokenV20();

  return { OWNER, NOT_OWNER, vennTokenImplementation, vennToken, vennTokenV20Implementation };
}

describe("VennToken", () => {
  describe("UUPS proxy functionality", () => {
    describe("#constructor", () => {
      it("should disable initialize function", async () => {
        const reason = "Initializable: contract is already initialized";

        const { vennTokenImplementation } = await loadFixture(deployFixture);

        await expect(vennTokenImplementation.__VennToken_init(INITIAL_SUPPLY)).to.be.revertedWith(reason);
      });
    });

    describe("#__VennToken_init", () => {
      it("should set correct data after creation", async () => {
        const { vennToken, OWNER } = await loadFixture(deployFixture);

        expect(await vennToken.owner()).to.eq(await OWNER.getAddress());
        expect(await vennToken.totalSupply()).to.eq(INITIAL_SUPPLY);
        expect(await vennToken.balanceOf(await OWNER.getAddress())).to.eq(INITIAL_SUPPLY);
        expect(await vennToken.name()).to.eq("Venn network");
        expect(await vennToken.symbol()).to.eq("VENN");
      });

      it("should revert if try to call init function twice", async () => {
        const reason = "Initializable: contract is already initialized";

        const { vennToken } = await loadFixture(deployFixture);

        await expect(vennToken.__VennToken_init(INITIAL_SUPPLY)).to.be.revertedWith(reason);
      });
    });

    describe("#_authorizeUpgrade", () => {
      it("should correctly upgrade", async () => {
        const { vennToken, vennTokenV20Implementation } = await loadFixture(deployFixture);

        await vennToken.upgradeTo(await vennTokenV20Implementation.getAddress());

        expect(await vennToken.version()).to.eq(20);
      });
      it("should revert if caller is not the owner", async () => {
        const reason = "Ownable: caller is not the owner";

        const { vennToken, NOT_OWNER } = await loadFixture(deployFixture);

        await expect(vennToken.connect(NOT_OWNER).upgradeTo(ZeroAddress)).to.be.revertedWith(reason);
      });
    });

    describe("#version", () => {
      it("should return the correct version", async () => {
        const { vennToken } = await loadFixture(deployFixture);

        expect(await vennToken.version()).to.eq(1);
      });
    });
  });
});
