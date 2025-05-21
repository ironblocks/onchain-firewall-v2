import {
  FeePool__factory,
  IAttestationCenter__factory,
  ProtocolRegistry__factory,
  VennAvsLogic__factory,
} from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const feePool = await deployer.deployed(FeePool__factory);
  const protocolRegistry = await deployer.deployed(ProtocolRegistry__factory);
  const attestationCenter = await deployer.deployed(IAttestationCenter__factory, "AttestationCenter");

  const vennAvsLogic = await deployer.deploy(VennAvsLogic__factory, [
    await attestationCenter.getAddress(),
    await feePool.getAddress(),
    await protocolRegistry.getAddress(),
  ]);

  if (config.vennL2Config.vennAvsLogicConfig.admin !== ZeroAddress) {
    await vennAvsLogic.grantRole(await vennAvsLogic.ADMIN_ROLE(), config.vennL2Config.vennAvsLogicConfig.admin);
  }

  await attestationCenter.setAvsLogic(vennAvsLogic);

  await writeToDeployments("L2", {
    VennAvsLogic: await vennAvsLogic.getAddress(),
  });

  Reporter.reportContracts(["VennAvsLogic", await vennAvsLogic.getAddress()]);
};
