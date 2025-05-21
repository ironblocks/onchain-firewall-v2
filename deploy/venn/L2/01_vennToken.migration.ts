import { VennToken__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const startBlock = await (await deployer.getSigner()).provider.getBlockNumber();

  const vennToken = await deployer.deployERC1967Proxy(VennToken__factory);
  await vennToken.__VennToken_init(config.vennL2Config.vennTokenConfig.initialSupply);

  await writeToDeployments("L2", {
    StartBlock: startBlock,
    VennTokenL2: await vennToken.getAddress(),
  });

  Reporter.reportContracts(["VennTokenL2", await vennToken.getAddress()]);
};

// npx hardhat migrate --namespace venn/L2 --network holesky --verify --only 1
