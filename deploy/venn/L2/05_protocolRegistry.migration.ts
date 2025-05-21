import { ProtocolRegistry__factory, IAttestationCenter__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const attestationCenter = await deployer.deployed(IAttestationCenter__factory, "AttestationCenter");
  const protocolRegistry = await deployer.deployERC1967Proxy(ProtocolRegistry__factory);
  await protocolRegistry.__ProtocolRegistry_init(
    await attestationCenter.getAddress(),
    config.vennL2Config.protocolRegistryConfig.vennFeeRecipient,
    config.vennL2Config.protocolRegistryConfig.vennDetectionFee,
    config.vennL2Config.protocolRegistryConfig.vennProtocolFee,
  );

  if (config.vennL2Config.protocolRegistryConfig.admin !== ZeroAddress) {
    await protocolRegistry.grantRole(
      await protocolRegistry.ADMIN_ROLE(),
      config.vennL2Config.protocolRegistryConfig.admin,
    );
  }

  await writeToDeployments("L2", {
    ProtocolRegistry: await protocolRegistry.getAddress(),
  });

  Reporter.reportContracts(["ProtocolRegistry", await protocolRegistry.getAddress()]);
};
