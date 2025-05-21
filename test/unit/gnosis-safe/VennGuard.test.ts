import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployFixture() {
  const [deployer] = await ethers.getSigners();
  const TestVennGuardFactory = await ethers.getContractFactory("TestVennGuard");
  const testVennGuard = await TestVennGuardFactory.deploy();

  return { testVennGuard, deployer };
}

describe("VennGuard", () => {
  describe("#parseMultisendCall", () => {
    it("should parse a single call", async () => {
      const { testVennGuard } = await loadFixture(deployFixture);
      const testCalldata = "0x12345678";
      const testTarget = await testVennGuard.getAddress();
      const testValue = ethers.parseEther("1");
      const data = await testVennGuard.encodeSingleMultisendCall(0, testTarget, testValue, testCalldata);
      const [target, value, remainingData] = await testVennGuard.parseMultisendCall(data);
      expect(target).to.equal(testTarget);
      expect(value).to.equal(testValue);
      expect(remainingData).to.equal("0x");
    });

    it("should parse a double call", async () => {
      const { testVennGuard, deployer } = await loadFixture(deployFixture);
      const testCalldata1 = "0x12345678";
      const testTarget1 = await deployer.getAddress();
      const testValue1 = ethers.parseEther("1");
      const testCalldata2 = "0x87654321";
      const testTarget2 = await testVennGuard.getAddress();
      const testValue2 = ethers.parseEther("2");
      const data = await testVennGuard.encodeDoubleMultisendCall(
        0,
        testTarget1,
        testValue1,
        testCalldata1,
        0,
        testTarget2,
        testValue2,
        testCalldata2,
      );
      const expectedRemainingData = await testVennGuard.packMultisendCall(0, testTarget2, testValue2, testCalldata2);
      const [target, value, remainingData] = await testVennGuard.parseMultisendCall(data);
      expect(target).to.equal(testTarget1);
      expect(value).to.equal(testValue1);
      expect(remainingData).to.equal(expectedRemainingData);
    });
  });
});
