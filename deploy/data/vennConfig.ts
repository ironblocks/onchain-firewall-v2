import { ethers } from "ethers";

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set");
}
const adminAddress = new ethers.Wallet(process.env.PRIVATE_KEY).address;

export const vennL1Config = {
  vennTokenConfig: {
    initialSupply: ethers.parseEther("1000000000"),
  },
};

export const vennL2Config = {
  vennTokenConfig: {
    initialSupply: ethers.parseEther("1000000000"),
  },

  vennVaultL2Config: {
    admin: adminAddress,
  },

  protocolRegistryConfig: {
    vennFeeRecipient: adminAddress,
    vennDetectionFee: 100_000,
    vennProtocolFee: 150_000,
    admin: adminAddress,
  },

  operatorRegistryConfig: {
    maxSubscribedOperatorsCount: 10,
    admin: adminAddress,
  },

  vennFeeCalculatorConfig: {
    admin: adminAddress,
  },

  feePoolConfig: {
    admin: adminAddress,
  },

  vennAvsLogicConfig: {
    admin: adminAddress,
  },

  attestationCenterProxyConfig: {
    admin: adminAddress,
  },

  votingPowerSyncerConfig: {
    syncer: adminAddress,
    admin: adminAddress,
  },
};

export const eigenLayerL1Config: Record<
  string,
  {
    eigenDelegationManagerAddress: string;
    avsDirectoryAddress: string;
    strategyFactoryAddress: string;
    strategyManagerAddress: string;
  }
> = {
  "17000": {
    eigenDelegationManagerAddress: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    avsDirectoryAddress: "0x055733000064333CaDDbC92763c58BF0192fFeBf",
    strategyFactoryAddress: "0x9c01252B580efD11a05C00Aa42Dd3ac1Ec52DF6d",
    strategyManagerAddress: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
  },
  "1": {
    eigenDelegationManagerAddress: "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A",
    avsDirectoryAddress: "0x135dda560e946695d6f155dacafc6f1f25c1f5af",
    strategyFactoryAddress: "0x5e4c39ad7a3e881585e383db9827eb4811f6f647",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
  },
};
