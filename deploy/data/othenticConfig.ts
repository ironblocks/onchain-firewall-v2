import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

const avsName = process.env.AVS_NAME;
if (!avsName) {
  throw new Error("AVS_NAME is not set");
}

export const l1Configs: Record<
  string,
  {
    network: string;
    avsName: string;
    avsFactory: string;
    l2ChainIds: string[];
    initialDeposit: bigint;
  }
> = {
  "1": {
    network: "mainnet",
    avsName,
    avsFactory: "0x64EA2F2DEE9eED5439468e92cf8Af8cD9ea0A994",
    l2ChainIds: ["1"],
    initialDeposit: ethers.parseEther("0.05"),
  },
  "17000": {
    network: "holesky",
    avsName,
    avsFactory: "0xf053F341C021F57f4a17C25476DF4761b0728D53",
    l2ChainIds: ["17000"],
    initialDeposit: ethers.parseEther("0.05"),
  },
};

export const l2Configs: Record<
  string,
  {
    network: string;
    avsName: string;
    avsFactory: string;
    l1ChainId: string;
    initialDeposit: bigint;
    isTestnet: boolean;
  }
> = {
  "1": {
    network: "mainnet-l2",
    avsName,
    avsFactory: "0xf8492808e30AC993Aa9Bd2FFF77E4dC8aC80B6cB",
    l1ChainId: "1",
    initialDeposit: ethers.parseEther("0.05"),
    isTestnet: false,
  },
  "17000": {
    network: "holesky-l2",
    avsName,
    avsFactory: "0xb2d2648F02b633491d16C69A99CcF05cdaC9d36d",
    l1ChainId: "17000",
    initialDeposit: ethers.parseEther("0.05"),
    isTestnet: true,
  },
};

// export const supportedL1Networks = ["mainnet", "mainnet:prod", "holesky", "holesky:staging", "holesky:nightly"];

// export const othenticContracts: Record<
//   string,
//   {
//     avsFactory: string;
//     chainId: string;
//   }
// > = {
//   "anvil-l2": {
//     chainId: "31337",
//     avsFactory: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
//   },
//   mainnet: {
//     chainId: "1",
//     avsFactory: "0x64EA2F2DEE9eED5439468e92cf8Af8cD9ea0A994",
//   },
//   "mainnet:prod": {
//     chainId: "1",
//     avsFactory: "0x64EA2F2DEE9eED5439468e92cf8Af8cD9ea0A994",
//   },
//   "mainnet-l2": {
//     chainId: "1",
//     avsFactory: "0xf8492808e30AC993Aa9Bd2FFF77E4dC8aC80B6cB",
//   },
//   "mainnet-l2:prod": {
//     chainId: "1",
//     avsFactory: "0xf8492808e30AC993Aa9Bd2FFF77E4dC8aC80B6cB",
//   },
//   polygon: {
//     chainId: "137",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "polygon:prod": {
//     chainId: "137",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   base: {
//     chainId: "8453",
//     avsFactory: "0x750e442F3C5b897F5518e50Eb8aBB8644340B42b",
//   },
//   "base:prod": {
//     chainId: "8453",
//     avsFactory: "0x750e442F3C5b897F5518e50Eb8aBB8644340B42b",
//   },
//   holesky: {
//     chainId: "17000",
//     avsFactory: "0xf053F341C021F57f4a17C25476DF4761b0728D53",
//   },
//   "holesky-l2": {
//     chainId: "17000",
//     avsFactory: "0xb2d2648F02b633491d16C69A99CcF05cdaC9d36d",
//   },
//   "holesky:staging": {
//     chainId: "17000",
//     avsFactory: "0xf053F341C021F57f4a17C25476DF4761b0728D53",
//   },
//   "holesky-l2:staging": {
//     chainId: "17000",
//     avsFactory: "0xb2d2648F02b633491d16C69A99CcF05cdaC9d36d",
//   },
//   amoy: {
//     chainId: "80002",
//     avsFactory: "0xc2a881Dd3e6a9C21C18A998E47f90120BC9D87Aa",
//   },
//   "amoy:staging": {
//     chainId: "80002",
//     avsFactory: "0xc2a881Dd3e6a9C21C18A998E47f90120BC9D87Aa",
//   },
//   "base-sepolia": {
//     chainId: "84532",
//     avsFactory: "0xC9D62Af2d0Dd94bDdFEb54fd2c4Cf3B860cEDf1a",
//   },
//   "base-sepolia:staging": {
//     chainId: "84532",
//     avsFactory: "0xC9D62Af2d0Dd94bDdFEb54fd2c4Cf3B860cEDf1a",
//   },
//   "holesky:nightly": {
//     chainId: "17000",
//     avsFactory: "0x545fb8EE4FD2F6Dd102C7Aa79846a5b23b71Eb9C",
//   },
//   "holesky-l2:nightly": {
//     chainId: "17000",
//     avsFactory: "0x8629b76bCC82e8C6FbF71effE4E63d7946832425",
//   },
//   "amoy:nightly": {
//     chainId: "80002",
//     avsFactory: "0x10030AD20b98EFA80ff80985149D1B0388b12540",
//   },
//   "base-sepolia:nightly": {
//     chainId: "84532",
//     avsFactory: "0xD63728099eAbE2bf2DE400E930277DA066a63bE6",
//   },
//   mantle: {
//     chainId: "5000",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "mantle:prod": {
//     chainId: "5000",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "mantle-sepolia": {
//     chainId: "5003",
//     avsFactory: "0x91Acfd45ebf3d6659114e44aFC271877Fb19f905",
//   },
//   "mantle-sepolia:staging": {
//     chainId: "5003",
//     avsFactory: "0x91Acfd45ebf3d6659114e44aFC271877Fb19f905",
//   },
//   "mantle-sepolia:nightly": {
//     chainId: "5003",
//     avsFactory: "0x06A0ECa10B0463dbf84d8e91C8ecbf6D6e1Af86F",
//   },
//   manta: {
//     chainId: "169",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "manta:prod": {
//     chainId: "169",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "manta-sepolia": {
//     chainId: "3441006",
//     avsFactory: "0x1cF5750a9FaEfd2bc45621c9FF776c6e02928EDC",
//   },
//   "manta-sepolia:staging": {
//     chainId: "3441006",
//     avsFactory: "0x1cF5750a9FaEfd2bc45621c9FF776c6e02928EDC",
//   },
//   "manta-sepolia:nightly": {
//     chainId: "3441006",
//     avsFactory: "0x9C4238F9173CD7861049c10240ADEC310D0751Bd",
//   },
//   mode: {
//     chainId: "34443",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "mode:prod": {
//     chainId: "34443",
//     avsFactory: "0x28e06CE6B25529e736D45Aff7c82Ef4Fc6F710bE",
//   },
//   "mode-sepolia": {
//     chainId: "919",
//     avsFactory: "0x9CBA6B009B357EBe181963a032d70aC47EE7F1c6",
//   },
//   "mode-sepolia:staging": {
//     chainId: "919",
//     avsFactory: "0x9CBA6B009B357EBe181963a032d70aC47EE7F1c6",
//   },
//   "mode-sepolia:nightly": {
//     chainId: "919",
//     avsFactory: "0x645cD77c24476dBE6Ca4C68F48197A1dFA0C84bD",
//   },
//   arbitrum: {
//     chainId: "42161",
//     avsFactory: "0xB9ac7e784b8aE6754FCe47653f5F8F53f5a838D8",
//   },
//   "arbitrum:prod": {
//     chainId: "42161",
//     avsFactory: "0xB9ac7e784b8aE6754FCe47653f5F8F53f5a838D8",
//   },
//   "arbitrum-one:prod": {
//     chainId: "42161",
//     avsFactory: "0xB9ac7e784b8aE6754FCe47653f5F8F53f5a838D8",
//   },
//   "arbitrum-one": {
//     chainId: "42161",
//     avsFactory: "0xB9ac7e784b8aE6754FCe47653f5F8F53f5a838D8",
//   },
//   "arbitrum-one-sepolia": {
//     chainId: "421614",
//     avsFactory: "0x390c4f2047250C8494963A6d2f1faE7935866D23",
//   },
//   "arbitrum-one-sepolia:staging": {
//     chainId: "421614",
//     avsFactory: "0x390c4f2047250C8494963A6d2f1faE7935866D23",
//   },
//   "arbitrum-one-sepolia:nightly": {
//     chainId: "421614",
//     avsFactory: "0xCD1B601Cb11802bB005782BcdB451b730aD5B2eA",
//   },
//   "arbitrum-sepolia": {
//     chainId: "421614",
//     avsFactory: "0x390c4f2047250C8494963A6d2f1faE7935866D23",
//   },
//   "arbitrum-sepolia:staging": {
//     chainId: "421614",
//     avsFactory: "0x390c4f2047250C8494963A6d2f1faE7935866D23",
//   },
//   "arbitrum-sepolia:nightly": {
//     chainId: "421614",
//     avsFactory: "0xCD1B601Cb11802bB005782BcdB451b730aD5B2eA",
//   },
//   "beam-testnet": {
//     chainId: "13337",
//     avsFactory: "0xB74E650BbE764E3B2CE0f61D4b82bF3deB0fFB27",
//   },
//   "beam-testnet:staging": {
//     chainId: "13337",
//     avsFactory: "0xB74E650BbE764E3B2CE0f61D4b82bF3deB0fFB27",
//   },
//   "beam-testnet:nightly": {
//     chainId: "13337",
//     avsFactory: "0x969C151A6e358d925c685941D60F0eF1D6f6B478",
//   },
// };

export const eigenLayerContracts: Record<
  string,
  { delegationManager: string; strategyManager: string; avsDirectory: string; stETHStrategy: string }
> = {
  "1": {
    delegationManager: "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A",
    strategyManager: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    avsDirectory: "0x135dda560e946695d6f155dacafc6f1f25c1f5af",
    stETHStrategy: "0x93c4b944D05dfe6df7645A86cd2206016c51564D",
  },
  "17000": {
    delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    avsDirectory: "0x055733000064333CaDDbC92763c58BF0192fFeBf",
    stETHStrategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
  },
};
