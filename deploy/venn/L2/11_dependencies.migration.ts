import { FeePool__factory, VennAvsLogic__factory, VennFeeCalculator__factory } from "@/generated-types/ethers";
import { Deployer } from "@solarity/hardhat-migrate";

export = async (deployer: Deployer) => {
  const vennFeeCalculator = await deployer.deployed(VennFeeCalculator__factory);
  const vennAvsLogic = await deployer.deployed(VennAvsLogic__factory);
  const feePool = await deployer.deployed(FeePool__factory);

  await vennFeeCalculator.grantRole(await vennFeeCalculator.FEE_POOL_ROLE(), feePool);

  await feePool.grantRole(await feePool.FEE_CLAIMER_ROLE(), vennAvsLogic);
};
