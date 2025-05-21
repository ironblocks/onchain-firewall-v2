import { Firewall__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { writeToDeployments } from "../../data/utils";

export = async (deployer: Deployer) => {
  const firewall = await deployer.deployERC1967Proxy(Firewall__factory);
  await firewall.__Firewall_init();

  await writeToDeployments("L2", {
    Firewall: await firewall.getAddress(),
  });

  Reporter.reportContracts(["Firewall", await firewall.getAddress()]);
};
