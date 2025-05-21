import { IApprovedCallsPolicy__factory, IERC165__factory } from "@/generated-types/ethers";
import { deploySupportsSafeFunctionCallsMock } from "@/test/fixtures";
import { getInterfaceId } from "@/test/helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

async function deployFixture() {
  const { supportsSafeFunctionCallsMock } = await loadFixture(deploySupportsSafeFunctionCallsMock);

  return { supportsSafeFunctionCallsMock };
}

describe("SupportsSafeFunctionCalls", () => {
  it("should return true for the IApprovedCallsPolicy", async () => {
    const { supportsSafeFunctionCallsMock } = await loadFixture(deployFixture);

    const IApprovedCallsPolicyInterfaceId = getInterfaceId(IApprovedCallsPolicy__factory.createInterface());

    expect(await supportsSafeFunctionCallsMock.supportsInterface(IApprovedCallsPolicyInterfaceId)).to.be.true;
  });

  it("should return false for the incorrect interface id", async () => {
    const { supportsSafeFunctionCallsMock } = await loadFixture(deployFixture);

    const IERC165InterfaceId = getInterfaceId(IERC165__factory.createInterface());
    expect(await supportsSafeFunctionCallsMock.supportsInterface(IERC165InterfaceId)).to.be.false;
  });
});
