import { ethers } from "hardhat";
import { deployBaseContractsHolesky } from "./utils";

const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
if (!OPERATOR_PRIVATE_KEY) {
  throw new Error("OPERATOR_PRIVATE_KEY is not set");
}

async function main() {
  const randomBase = BigInt("0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6");
  // this base below breaks the bls signing for some reason... likely bug in our signing code
  // const randomBase = BigInt("0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409d1");
  const randomKeys = [
    (randomBase + BigInt(1)).toString(16),
    // (randomBase + BigInt(2)).toString(16),
    // (randomBase + BigInt(3)).toString(16),
    // (randomBase + BigInt(4)).toString(16),
  ];
  const amounts = [
    ethers.parseEther("100"),
    // ethers.parseEther("200"),
    // ethers.parseEther("300"),
    // ethers.parseEther("150"),
  ];
  // await deployBaseContractsHolesky([OPERATOR_PRIVATE_KEY], [ethers.utils.parseEther('1')]);
  await deployBaseContractsHolesky(randomKeys, amounts);
}

main().catch(console.error);
