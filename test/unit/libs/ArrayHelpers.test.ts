import { deployArrayHelpersMock } from "@/test/fixtures";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

async function deployFixture() {
  const { arrayHelpersMock } = await deployArrayHelpersMock();

  return { arrayHelpers: arrayHelpersMock };
}

describe("ArrayHelpers", () => {
  describe("#isSortedAndUnique", () => {
    it("should return true if the array is sorted", async () => {
      const { arrayHelpers } = await loadFixture(deployFixture);

      expect(await arrayHelpers.isSortedAndUnique([1, 2, 3, 4, 5])).to.be.true;
      expect(await arrayHelpers.isSortedAndUnique([1, 2, 3, 4])).to.be.true;
      expect(await arrayHelpers.isSortedAndUnique([1, 2, 3, 4, 7])).to.be.true;
      expect(await arrayHelpers.isSortedAndUnique([])).to.be.true;
      expect(await arrayHelpers.isSortedAndUnique([1])).to.be.true;
    });

    it("should return false if the array is not sorted", async () => {
      const { arrayHelpers } = await loadFixture(deployFixture);

      expect(await arrayHelpers.isSortedAndUnique([1, 3, 2, 4, 5])).to.be.false;
      expect(await arrayHelpers.isSortedAndUnique([5, 4, 3, 2, 1])).to.be.false;
      expect(await arrayHelpers.isSortedAndUnique([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0])).to.be.false;
      expect(await arrayHelpers.isSortedAndUnique([1, 1])).to.be.false;
      expect(await arrayHelpers.isSortedAndUnique([1, 2, 2])).to.be.false;
    });
  });

  describe("#verifyArraySubset", () => {
    it("should return 0 if the array is a subset", async () => {
      const { arrayHelpers } = await loadFixture(deployFixture);

      expect(await arrayHelpers.verifyArraySubset([1, 2, 3], [1, 2, 3, 4, 5])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([], [])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([], [1])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([1], [1, 2, 3])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([1], [1, 2, 3])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([1], [1])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([1, 2], [1, 2, 3])).to.be.equal(0);
      expect(await arrayHelpers.verifyArraySubset([1, 2, 3], [1, 2, 3])).to.be.equal(0);
    });

    it("should return the first missing element if the array is not a subset", async () => {
      const { arrayHelpers } = await loadFixture(deployFixture);

      expect(await arrayHelpers.verifyArraySubset([1, 2, 3], [1, 2, 4, 5])).to.be.equal(3);
      expect(await arrayHelpers.verifyArraySubset([1, 2, 3, 4], [1, 2, 3, 3])).to.be.equal(4);
      expect(await arrayHelpers.verifyArraySubset([1], [])).to.be.equal(1);
      expect(await arrayHelpers.verifyArraySubset([1], [2])).to.be.equal(1);
    });
  });
});
