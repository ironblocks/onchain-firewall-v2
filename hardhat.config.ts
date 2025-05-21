import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "@solarity/hardhat-markup";
import "@solarity/hardhat-migrate";

import "@typechain/hardhat";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import "solidity-coverage";

import "tsconfig-paths/register";

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
      chainId: Number(process.env.FORKING_CHAIN_ID || 17000),
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      initialDate: "1970-01-01T00:00:00Z",
      gasMultiplier: 1.3,
      timeout: 1000000000000000,
    },
    polygonAmoy: {
      url: `https://polygon-amoy.blockpi.network/v1/rpc/public`,
      accounts: privateKey(),
      gasMultiplier: 1.3,
    },
    ethereum: {
      url: process.env.MAINNET_RPC || `https://eth.merkle.io`,
      accounts: privateKey(),
      gasMultiplier: 1.3,
      chainId: 1,
    },
    holesky: {
      url: process.env.HOLESKY_RPC || `https://ethereum-holesky-rpc.publicnode.com`,
      accounts: privateKey(),
      gasMultiplier: 1.3,
      chainId: 17000,
    },
    polygon: {
      url: `https://matic-mainnet.chainstacklabs.com`,
      accounts: privateKey(),
      gasMultiplier: 1.3,
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.3,
    },
    arbitrumSepolia: {
      url: `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.3,
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
      holesky: `${process.env.ETHERSCAN_KEY}`,
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
    externalArtifacts: ["externalArtifacts/**/*.json", "externalArtifacts/**/*.abi"],
  },
  markup: {
    outdir: "./generated-markups",
    onlyFiles: [],
    skipFiles: ["contracts/dependencies"],
    noCompile: false,
    verbose: false,
  },
};

export default config;
