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
    gnosisSafeFactoryAddress: string;
    gnosisSafeSingletonAddress: string;
    multisendCallOnlyAddress: string;
  }
> = {
  "17000": {
    eigenDelegationManagerAddress: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    avsDirectoryAddress: "0x055733000064333CaDDbC92763c58BF0192fFeBf",
    othenticL1FactoryAddress: "0xf053F341C021F57f4a17C25476DF4761b0728D53",
    othenticL2FactoryAddress: "0xb2d2648F02b633491d16C69A99CcF05cdaC9d36d",
    strategyFactoryAddress: "0x9c01252B580efD11a05C00Aa42Dd3ac1Ec52DF6d",
    strategyManagerAddress: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    gnosisSafeFactoryAddress: "0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67",
    gnosisSafeSingletonAddress: "0x29fcb43b46531bca003ddc8fcb67ffe91900c762",
    multisendCallOnlyAddress: "0x998739BFdAAdde7C933B942a68053933098f9EDa",
  },
  "1": {
    eigenDelegationManagerAddress: "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A",
    avsDirectoryAddress: "0x135dda560e946695d6f155dacafc6f1f25c1f5af",
    othenticL1FactoryAddress: "0x64EA2F2DEE9eED5439468e92cf8Af8cD9ea0A994",
    othenticL2FactoryAddress: "0xf8492808e30AC993Aa9Bd2FFF77E4dC8aC80B6cB",
    strategyFactoryAddress: "0x5e4c39ad7a3e881585e383db9827eb4811f6f647",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    gnosisSafeFactoryAddress: "0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67",
    gnosisSafeSingletonAddress: "0x29fcb43b46531bca003ddc8fcb67ffe91900c762",
    multisendCallOnlyAddress: "0x998739BFdAAdde7C933B942a68053933098f9EDa",
  },
};

export async function isChainSupported(chainId: string) {
  return ADDRESSES[chainId] !== undefined;
}

export async function getAddresses() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();

  if (!ADDRESSES[chainId]) {
    throw new Error(`Addresses for chainId ${chainId} not found`);
  }

  return ADDRESSES[chainId];
}
