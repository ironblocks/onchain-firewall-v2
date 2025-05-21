import {
  AttestationCenterProxy__factory,
  FeePool__factory,
  IAttestationCenter__factory,
} from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { ZeroAddress } from "ethers";
import { getVennL2Config, writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const config = await getVennL2Config();

  const attestationCenter = await deployer.deployed(IAttestationCenter__factory, "AttestationCenter");
  const feePool = await deployer.deployed(FeePool__factory);

  const attestationCenterProxy = await deployer.deployERC1967Proxy(AttestationCenterProxy__factory);
  await attestationCenterProxy.__AttestationCenterProxy_init(feePool, attestationCenter);

  await attestationCenter.setIsOpenAggregator(true);

  if (config.vennL2Config.attestationCenterProxyConfig.admin !== ZeroAddress) {
    await attestationCenterProxy.grantRole(
      await attestationCenterProxy.ADMIN_ROLE(),
      config.vennL2Config.attestationCenterProxyConfig.admin,
    );
  }

  await writeToDeployments("L2", {
    AttestationCenterProxy: await attestationCenterProxy.getAddress(),
  });

  Reporter.reportContracts(["AttestationCenterProxy", await attestationCenterProxy.getAddress()]);
};
