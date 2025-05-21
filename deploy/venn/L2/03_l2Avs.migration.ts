import { getOthenticL2Config, writeToDeployments } from "@/deploy/data/utils";
import { AttestationCenterFacet__factory, L2AvsFactory__factory, VennVaultL2__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";

export = async (deployer: Deployer) => {
  const l2Config = await getOthenticL2Config();

  const deployerAddress = await (await deployer.getSigner()).getAddress();
  const vennVaultL2 = await deployer.deployed(VennVaultL2__factory);

  const l2AvsFactoryAddress = l2Config.avsFactory;

  const l2AvsFactory = await deployer.deployed(L2AvsFactory__factory, l2AvsFactoryAddress);

  const l2AvsArgs = {
    avsName: l2Config.avsName,
    avsGovernanceMultisigOwner: deployerAddress,
    erc20Token: await vennVaultL2.getAddress(),
    isRewardsOnL2: true,
    l1ChainId: l2Config.l1ChainId,
  };

  const l2AvsContracts = await l2AvsFactory.deploy.staticCall(l2AvsArgs, { value: l2Config.initialDeposit });
  await l2AvsFactory.deploy(l2AvsArgs, { value: l2Config.initialDeposit });

  const attestationCenterFacet = await deployer.deploy(AttestationCenterFacet__factory, [
    l2AvsContracts.attestationCenter,
  ]);

  await deployer.save("AttestationCenter", l2AvsContracts.attestationCenter);

  await writeToDeployments("L2", {
    OBLS: l2AvsContracts.obls,
    L2MessageHandler: l2AvsContracts.l2MessageHandler,
    AttestationCenter: l2AvsContracts.attestationCenter,
    L2AvsTreasury: l2AvsContracts.avsTreasury,
    InternalTaskHandler: l2AvsContracts.internalTaskHandler,
  });

  Reporter.reportContracts(
    ["L2AvsFactory", await l2AvsFactory.getAddress()],
    ["Obls", l2AvsContracts.obls],
    ["L2MessageHandler", l2AvsContracts.l2MessageHandler],
    ["AttestationCenter", l2AvsContracts.attestationCenter],
    ["RemoteMessageHandler", l2AvsContracts.remoteMessageHandler],
    ["AvsTreasury", l2AvsContracts.avsTreasury],
    ["InternalTaskHandler", l2AvsContracts.internalTaskHandler],
    ["AttestationCenterFacet", await attestationCenterFacet.getAddress()],
  );
};
