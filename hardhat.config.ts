import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";

import "@typechain/hardhat";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import "solidity-coverage";

import "tsconfig-paths/register";

import "hardhat-tracer";

import { HardhatUserConfig } from "hardhat/config";

import * as dotenv from "dotenv";
dotenv.config();

function privateKey() {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      initialDate: "1970-01-01T00:00:00Z",
      gas: "auto",
      forking: {
        url: "https://few-burned-road.ethereum-holesky.quiknode.pro/80134d1a1a41951a3093b4d4f60d6c0bd5451871",
        blockNumber: 3008000,
      },
      chainId: 17000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      initialDate: "1970-01-01T00:00:00Z",
      gasMultiplier: 1.2,
      timeout: 1000000000000000,
    },
    polygonAmoy: {
      url: `https://polygon-amoy.blockpi.network/v1/rpc/public`,
      accounts: privateKey(),
      gasMultiplier: 1.1,
    },
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    holesky: {
      url: `https://holesky.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    polygon: {
      url: `https://matic-mainnet.chainstacklabs.com`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    arbitrumSepolia: {
      url: `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.25",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
          evmVersion: "cancun",
          viaIR: true,
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      mainnet: `${process.env.ETHERSCAN_KEY}`,
      polygonAmoy: `${process.env.POLYGONSCAN_KEY}`,
      polygon: `${process.env.POLYGONSCAN_KEY}`,
      arbitrumOne: `${process.env.ARBITRUM_KEY}`,
      arbitrum_sepolia: `${process.env.ARBITRUM_KEY}`,
    },
  },
  mocha: {
    timeout: 1000000,
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 50,
    enabled: false,
    coinmarketcap: `${process.env.COINMARKETCAP_KEY}`,
  },
  typechain: {
    outDir: "generated-types/ethers",
    target: "ethers-v6",
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
    externalArtifacts: ["externalArtifacts/**/*.json"],
  },
};

export default config;
