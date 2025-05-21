import { IAvsGovernance__factory, IStrategyFactory__factory, VennToken__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ethers } from "hardhat";
import { getVennL1Config, writeToDeployments } from "../../data/utils";
import { getDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL1Config();
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const eigenLayerConfig = config.eigenLayerL1Config[chainId];

  const vennToken = await deployer.deployERC1967Proxy(VennToken__factory);
  await vennToken.__VennToken_init(config.vennL1Config.vennTokenConfig.initialSupply);

  const strategyFactory = await deployer.deployed(IStrategyFactory__factory, eigenLayerConfig.strategyFactoryAddress);
  await strategyFactory.deployNewStrategy(vennToken);
  const vennStakingStrategyAddress = await strategyFactory.deployedStrategies(vennToken);

  const avsGovernance = await deployer.deployed(IAvsGovernance__factory, (await getDeployments()).L1.AvsGovernance);
  await avsGovernance.setSupportedStakingContracts([
    {
      stakingContract: vennStakingStrategyAddress,
      sharedSecurityProvider: 0,
    },
  ]);

  await writeToDeployments("L1", {
    VennTokenL1: await vennToken.getAddress(),
    VennStakingStrategy: vennStakingStrategyAddress,
  });

  Reporter.reportContracts(
    ["VennTokenL1", await vennToken.getAddress()],
    ["VennStakingStrategy", vennStakingStrategyAddress],
  );
};

// npx hardhat migrate --namespace venn/L1 --network holesky --verify --only 1
