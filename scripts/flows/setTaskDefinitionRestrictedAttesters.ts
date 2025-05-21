import { ethers } from "hardhat";
import { getL2Deployments } from "../../deploy/data/utils";

const CONFIRMATION_BLOCKS = 1;

const taskDefinitionRestrictedAttesters = [
  {
    taskDefinitionId: 1,
    restrictedAttesters: ["1"],
  },
];

async function main() {
  const l2Deployment = await getL2Deployments();
  const attestationCenter = await ethers.getContractAt("IAttestationCenter", l2Deployment.AttestationCenter);

  for (const restrictedAttester of taskDefinitionRestrictedAttesters) {
    console.log(
      `Setting task definition ${restrictedAttester.taskDefinitionId} restricted attesters ${restrictedAttester.restrictedAttesters}`,
    );
    let tx = await attestationCenter.setTaskDefinitionRestrictedAttesters(
      restrictedAttester.taskDefinitionId,
      restrictedAttester.restrictedAttesters,
    );
    await tx.wait(CONFIRMATION_BLOCKS);
  }

  console.log(`Task definition restricted attesters set`);
}

main().catch(console.error);

// npx hardhat run scripts/flows/setTaskDefinitionRestrictedAttesters.ts --network localhost
