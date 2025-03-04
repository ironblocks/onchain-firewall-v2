import { ethers } from "hardhat";

const ADDRESSES: Record<
  string,
  {
    eigenDelegationManagerAddress: string;
    avsDirectoryAddress: string;
    othenticL1FactoryAddress: string;
    othenticL2FactoryAddress: string;
    strategyFactoryAddress: string;
    strategyManagerAddress: string;
  }
> = {
  "17000": {
    eigenDelegationManagerAddress: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    avsDirectoryAddress: "0x055733000064333CaDDbC92763c58BF0192fFeBf",
    othenticL1FactoryAddress: "0xf053F341C021F57f4a17C25476DF4761b0728D53",
    othenticL2FactoryAddress: "0xb2d2648F02b633491d16C69A99CcF05cdaC9d36d",
    strategyFactoryAddress: "0x9c01252B580efD11a05C00Aa42Dd3ac1Ec52DF6d",
    strategyManagerAddress: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
  },
};

export async function getAddresses() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  if (!ADDRESSES[chainId]) {
    throw new Error(`Addresses for chainId ${chainId} not found`);
  }

  return ADDRESSES[chainId];
}
