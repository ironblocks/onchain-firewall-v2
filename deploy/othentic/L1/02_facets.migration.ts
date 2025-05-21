import { writeToDeployments } from "@/deploy/data/utils";
import { AvsGovernanceFacet__factory, IAvsGovernance__factory, L1AvsFactory__factory } from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";

export = async (deployer: Deployer) => {
  const avsGovernance = await deployer.deployed(IAvsGovernance__factory, "AvsGovernance");

  const avsGovernanceFacet = await deployer.deploy(AvsGovernanceFacet__factory, [await avsGovernance.getAddress()]);

  await writeToDeployments("L1", {
    AvsGovernanceFacet: await avsGovernanceFacet.getAddress(),
  });

  Reporter.reportContracts(["AvsGovernanceFacet", await avsGovernanceFacet.getAddress()]);
};

// npx hardhat migrate --namespace othentic/L1 --network holesky --verify --only 2
