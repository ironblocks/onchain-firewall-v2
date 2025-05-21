import { VennToken__factory, VennVaultL2__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const vennToken = await deployer.deployed(VennToken__factory);

  const vennVaultL2 = await deployer.deployERC1967Proxy(VennVaultL2__factory);
  await vennVaultL2.__VennVaultL2_init(await vennToken.getAddress(), ZeroAddress, ZeroAddress, false);

  if (config.vennL2Config.vennVaultL2Config.admin !== ZeroAddress) {
    await vennVaultL2.grantRole(await vennVaultL2.ADMIN_ROLE(), config.vennL2Config.vennVaultL2Config.admin);
  }

  await writeToDeployments("L2", {
    VennVaultL2: await vennVaultL2.getAddress(),
  });

  Reporter.reportContracts(["VennVaultL2", await vennVaultL2.getAddress()]);
};
