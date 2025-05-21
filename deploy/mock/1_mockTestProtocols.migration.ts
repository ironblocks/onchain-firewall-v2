import {
  Firewall__factory,
  ProtocolRegistry__factory,
  SampleVennConsumer__factory,
  TransientApprovedCallsPolicy__factory,
} from "@/generated-types/ethers";
import { getL2Deployments, writeToDeployments } from "../data/utils";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";

export = async (deployer: Deployer) => {
  const l2Deployments = await getL2Deployments();
  const deployerAddress = await (await deployer.getSigner()).getAddress();
  const firewall = await deployer.deployed(Firewall__factory, l2Deployments.Firewall);
  const protocolRegistry = await deployer.deployed(ProtocolRegistry__factory, l2Deployments.ProtocolRegistry);

  const sampleVennPolicy = await deployer.deploy(TransientApprovedCallsPolicy__factory, [l2Deployments.Firewall], {
    name: "SampleVennPolicy",
  });
  await sampleVennPolicy.grantRole(await sampleVennPolicy.ADMIN_ROLE(), deployerAddress);
  await sampleVennPolicy.grantRole(await sampleVennPolicy.SIGNER_ROLE(), l2Deployments.VennAvsLogic);
  await firewall.setPolicyStatus(sampleVennPolicy, true);
  const sampleVennConsumer = await deployer.deploy(SampleVennConsumer__factory, [l2Deployments.Firewall]);
  await sampleVennConsumer.setAttestationCenterProxy(l2Deployments.AttestationCenterProxy);
  await sampleVennConsumer.setAllowNonZeroUserNativeFee(true);
  await sampleVennPolicy.setConsumersStatuses([sampleVennConsumer], [true]);
  await firewall.addGlobalPolicy(sampleVennConsumer, sampleVennPolicy);
  await protocolRegistry.registerProtocol(
    sampleVennPolicy,
    `https://venn-protocol.com/${await sampleVennConsumer.getAddress()}`,
  );

  await writeToDeployments("L2", {
    SampleVennPolicy: await sampleVennPolicy.getAddress(),
    SampleVennConsumer: await sampleVennConsumer.getAddress(),
  });

  Reporter.reportContracts(
    ["SampleVennPolicy", await sampleVennPolicy.getAddress()],
    ["SampleVennConsumer", await sampleVennConsumer.getAddress()],
  );
};

// npx hardhat migrate --namespace mock --network holesky --verify --only 1
