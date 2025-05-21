import { IAttestationCenter__factory, VotingPowerSyncer__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const attestationCenter = await deployer.deployed(IAttestationCenter__factory, "AttestationCenter");
  const oblsAddress = await attestationCenter.obls();

  const votingPowerSyncer = await deployer.deploy(VotingPowerSyncer__factory, [
    oblsAddress,
    config.vennL2Config.votingPowerSyncerConfig.syncer,
  ]);

  const deployerAddress = await (await deployer.getSigner()).getAddress();
  if (
    config.vennL2Config.votingPowerSyncerConfig.admin !== ZeroAddress &&
    config.vennL2Config.votingPowerSyncerConfig.admin !== deployerAddress
  ) {
    await votingPowerSyncer.transferOwnership(config.vennL2Config.votingPowerSyncerConfig.admin);
  }

  await attestationCenter.setOblsSharesSyncer(votingPowerSyncer);

  await writeToDeployments("L2", {
    VotingPowerSyncer: await votingPowerSyncer.getAddress(),
  });

  Reporter.reportContracts(["VotingPowerSyncer", await votingPowerSyncer.getAddress()]);
};

// npx hardhat migrate --namespace venn/L2 --network holesky --verify --only 12
