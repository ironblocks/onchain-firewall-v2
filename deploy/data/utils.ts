import { l2Configs, l1Configs } from "./othenticConfig";
import { ethers } from "hardhat";
import path from "path";
import fs from "fs";

export async function getL2Deployments() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const l2Config = l2Configs[chainId];
  if (!l2Config) {
    throw new Error(`L2 config for chainId ${chainId} not found when getting deployments`);
  }
  const filename = l2Config.isTestnet ? "testnet.json" : "mainnet.json";
  const deploymentsFile = path.join(__dirname, "deployments", filename);
  const currentDeployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
  return currentDeployments[`L2_CHAIN_ID_${chainId}`] || {};
}

export async function getDeployments() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const l2Config = l2Configs[chainId];
  if (!l2Config) {
    throw new Error(`L2 config for chainId ${chainId} not found when getting deployments`);
  }
  const filename = l2Config.isTestnet ? "testnet.json" : "mainnet.json";
  const deploymentsFile = path.join(__dirname, "deployments", filename);
  const currentDeployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
  return currentDeployments;
}

export async function writeToDeployments(deploymentName: string, deployments: any) {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const l2Config = l2Configs[chainId];
  if (!l2Config) {
    throw new Error(`L2 config for chainId ${chainId} not found when writing to deployments`);
  }
  const filename = l2Config.isTestnet ? "testnet.json" : "mainnet.json";
  const deploymentsFile = path.join(__dirname, "deployments", filename);
  const currentDeployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
  if (deploymentName === "L2") {
    deploymentName = `L2_CHAIN_ID_${chainId}`;
  }
  if (currentDeployments[deploymentName]) {
    currentDeployments[deploymentName] = {
      ...currentDeployments[deploymentName],
      ...deployments,
    };
  } else {
    currentDeployments[deploymentName] = deployments;
  }
  fs.writeFileSync(deploymentsFile, JSON.stringify(currentDeployments, null, 2));
}

export async function getVennL1Config() {
  const config = await import("./vennConfig");

  return config;
}

export async function getVennL2Config() {
  const config = await import("./vennConfig");

  return config;
}

export async function getOthenticL1Config() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const l1Config = l1Configs[chainId];

  if (!l1Config) {
    throw new Error(`L1 config for chainId ${chainId} not found`);
  }

  return l1Config;
}

export async function getOthenticL2Config() {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const l2Config = l2Configs[chainId];

  if (!l2Config) {
    throw new Error(`L2 config for chainId ${chainId} not found`);
  }

  return l2Config;
}
