import {
  IAttestationCenter__factory,
  OperatorRegistry__factory,
  VennFeeCalculator__factory,
} from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const operatorRegistry = await deployer.deployed(OperatorRegistry__factory);
  const attestationCenter = await deployer.deployed(IAttestationCenter__factory, "AttestationCenter");

  const vennFeeCalculator = await deployer.deployERC1967Proxy(VennFeeCalculator__factory);
  await vennFeeCalculator.__VennFeeCalculator_init(operatorRegistry);

  if (config.vennL2Config.vennFeeCalculatorConfig.admin !== ZeroAddress) {
    await vennFeeCalculator.grantRole(
      await vennFeeCalculator.ADMIN_ROLE(),
      config.vennL2Config.vennFeeCalculatorConfig.admin,
    );
  }

  await attestationCenter.setFeeCalculator(vennFeeCalculator);

  await writeToDeployments("L2", {
    VennFeeCalculator: await vennFeeCalculator.getAddress(),
  });

  Reporter.reportContracts(["VennFeeCalculator", await vennFeeCalculator.getAddress()]);
};
