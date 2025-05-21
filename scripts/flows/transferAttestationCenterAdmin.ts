import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

const currentAdminAddress = "0x111116b5d68eAE0E5558a66966dE33A538Ed4987";
const newAdminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

async function main() {
  console.log("Transferring admin role");
  const currentAdmin = await ethers.getImpersonatedSigner(currentAdminAddress);

  const l2Deployment = await getL2Deployments();
  const attestationCenter = await ethers.getContractAt("IAttestationCenter", l2Deployment.AttestationCenter);

  await attestationCenter.connect(currentAdmin).transferAvsGovernanceMultisig(newAdminAddress);

  console.log("Admin role transferred");
}

main().catch(console.error);

// npx hardhat run scripts/flows/transferAttestationCenterAdmin.ts --network localhost
