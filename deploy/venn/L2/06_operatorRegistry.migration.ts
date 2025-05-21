import { OperatorRegistry__factory, IAttestationCenter__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const attestationCenter = await deployer.deployed(IAttestationCenter__factory, "AttestationCenter");
  const operatorRegistry = await deployer.deployERC1967Proxy(OperatorRegistry__factory);
  await operatorRegistry.__OperatorRegistry_init(
    await attestationCenter.getAddress(),
    config.vennL2Config.operatorRegistryConfig.maxSubscribedOperatorsCount,
  );

  if (config.vennL2Config.operatorRegistryConfig.admin !== ZeroAddress) {
    await operatorRegistry.grantRole(
      await operatorRegistry.ADMIN_ROLE(),
      config.vennL2Config.operatorRegistryConfig.admin,
    );
  }

  await writeToDeployments("L2", {
    OperatorRegistry: await operatorRegistry.getAddress(),
  });

  Reporter.reportContracts(["OperatorRegistry", await operatorRegistry.getAddress()]);
};
