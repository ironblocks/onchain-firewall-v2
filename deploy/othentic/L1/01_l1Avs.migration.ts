import { L1AvsFactory__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { getOthenticL1Config, writeToDeployments } from "../../data/utils";
import { ZeroAddress } from "ethers";

export = async (deployer: Deployer) => {
  const config = await getOthenticL1Config();

  const startBlock = await (await deployer.getSigner()).provider.getBlockNumber();
  const deployerAddress = await (await deployer.getSigner()).getAddress();

  const l1AvsFactoryAddress = config.avsFactory;

  const l1AvsFactory = await deployer.deployed(L1AvsFactory__factory, l1AvsFactoryAddress);

  const l1AvsContracts = await l1AvsFactory.deploy.staticCall(
    {
      avsName: config.avsName,
      avsGovernanceMultisigOwner: deployerAddress,
      erc20Token: ZeroAddress,
      l2ChainIds: config.l2ChainIds,
    },
    { value: config.initialDeposit },
  );
  await l1AvsFactory.deploy(
    {
      avsName: config.avsName,
      avsGovernanceMultisigOwner: deployerAddress,
      erc20Token: ZeroAddress,
      l2ChainIds: config.l2ChainIds,
    },
    { value: config.initialDeposit },
  );

  await deployer.save("AvsGovernance", l1AvsContracts.avsGovernance);

  const remoteMessageHandlersByChainId: [name: string, address: string][] = l1AvsContracts.remoteMessageHandlers.map(
    (remoteMessageHandler) => [
      `RemoteMessageHandler_${remoteMessageHandler.remoteChainId}`,
      remoteMessageHandler.remoteMessageHandler,
    ],
  );

  await writeToDeployments("L1", {
    StartBlock: startBlock,
    L1MessageHandler: l1AvsContracts.l1MessageHandler,
    AvsTreasury: l1AvsContracts.avsTreasury,
    AvsGovernance: l1AvsContracts.avsGovernance,
  });

  Reporter.reportContracts(
    ["L1AvsFactory", await l1AvsFactory.getAddress()],
    ["L1MessageHandler", l1AvsContracts.l1MessageHandler],
    ["AvsTreasury", l1AvsContracts.avsTreasury],
    ["AvsGovernance", l1AvsContracts.avsGovernance],
    ...remoteMessageHandlersByChainId,
  );
};

// npx hardhat migrate --namespace othentic/L1 --network holesky --verify --only 1
