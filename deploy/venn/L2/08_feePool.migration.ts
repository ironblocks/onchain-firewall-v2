import { FeePool__factory, ProtocolRegistry__factory, VennFeeCalculator__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const protocolRegistry = await deployer.deployed(ProtocolRegistry__factory);
  const vennFeeCalculator = await deployer.deployed(VennFeeCalculator__factory);

  const feePool = await deployer.deployERC1967Proxy(FeePool__factory);
  await feePool.__FeePool_init(protocolRegistry, vennFeeCalculator);

  if (config.vennL2Config.feePoolConfig.admin !== ZeroAddress) {
    await feePool.grantRole(await feePool.ADMIN_ROLE(), config.vennL2Config.feePoolConfig.admin);
  }

  await writeToDeployments("L2", {
    FeePool: await feePool.getAddress(),
  });

  Reporter.reportContracts(["FeePool", await feePool.getAddress()]);
};
