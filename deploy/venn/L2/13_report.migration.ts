import {
  AttestationCenterProxy__factory,
  FeePool__factory,
  Firewall__factory,
  OperatorRegistry__factory,
  ProtocolRegistry__factory,
  VennAvsLogic__factory,
  VennFeeCalculator__factory,
  VennToken__factory,
  VennVaultL2__factory,
  VotingPowerSyncer__factory,
} from "@/generated-types/ethers";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";

export = async (deployer: Deployer) => {
  Reporter.reportContracts(
    ["VennToken", await (await deployer.deployed(VennToken__factory)).getAddress()],
    ["VennVaultL2", await (await deployer.deployed(VennVaultL2__factory)).getAddress()],
    ["Firewall", await (await deployer.deployed(Firewall__factory)).getAddress()],
    ["ProtocolRegistry", await (await deployer.deployed(ProtocolRegistry__factory)).getAddress()],
    ["OperatorRegistry", await (await deployer.deployed(OperatorRegistry__factory)).getAddress()],
    ["VennFeeCalculator", await (await deployer.deployed(VennFeeCalculator__factory)).getAddress()],
    ["FeePool", await (await deployer.deployed(FeePool__factory)).getAddress()],
    ["VennAvsLogic", await (await deployer.deployed(VennAvsLogic__factory)).getAddress()],
    ["AttestationCenterProxy", await (await deployer.deployed(AttestationCenterProxy__factory)).getAddress()],
    ["VotingPowerSyncer", await (await deployer.deployed(VotingPowerSyncer__factory)).getAddress()],
  );
};
