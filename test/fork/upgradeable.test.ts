import {
  AttestationCenterProxy,
  Firewall,
  FirewallModule,
  GnosisSafe,
  IAttestationCenter,
  ProtocolRegistry,
  SampleVennBeaconConsumer,
  SampleVennUpgradeableConsumer,
  SampleVennUpgradeableConsumer__factory,
  VennAvsLogic,
  VennFeeCalculator,
} from "@/generated-types/ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { clearSnapshots, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BaseWallet, Signer, ZeroAddress } from "ethers";
import { ethers, upgrades } from "hardhat";
import { buildAndCreateDepositCallHash, getProofOfTask, getSubmitTaskData, resetForking, setForking } from "../helpers";
import { deployApprovedCallsPolicy, deployBaseFixture } from "./fixtures";

describe("Upgradeable", () => {
  let deployer: SignerWithAddress;

  before("setup", async () => {
    await clearSnapshots();
    await setForking();

    [deployer] = await ethers.getSigners();
  });

  after("reset", async () => {
    await resetForking();
  });

  describe("NonVenn into Venn", () => {
    const metadataURI = "https://example.com/metadata";
    const depositAmount = ethers.parseEther("0.01");
    const depositData = SampleVennUpgradeableConsumer__factory.createInterface().encodeFunctionData("deposit");

    let user1: SignerWithAddress;

    let firewall: Firewall;
    let gnosisSafe: GnosisSafe;
    let firewallModule: FirewallModule;
    let vennAvsLogic: VennAvsLogic;
    let attestationCenterProxy: AttestationCenterProxy;
    let protocolRegistry: ProtocolRegistry;
    let operators: BaseWallet[];
    let attestationCenter: IAttestationCenter;
    let avsGovernanceMultisig: Signer;
    let vennFeeCalculator: VennFeeCalculator;

    async function testFullFlowTillSafeFunctionCall(
      consumer: SampleVennUpgradeableConsumer | SampleVennBeaconConsumer,
    ) {
      const { approvedCallsPolicy } = await deployApprovedCallsPolicy(
        deployer,
        firewall,
        gnosisSafe,
        firewallModule,
        consumer,
        vennAvsLogic,
      );

      await consumer.setAttestationCenterProxy(attestationCenterProxy);
      await consumer.setAllowNonZeroUserNativeFee(true);

      await firewall.addGlobalPolicy(consumer, approvedCallsPolicy);

      const taskDefinitionName = "subnet deposit";
      const taskDefinitionParams = {
        blockExpiry: ethers.MaxUint256,
        baseRewardFeeForAttesters: 0,
        baseRewardFeeForPerformer: 0,
        baseRewardFeeForAggregator: 0,
        disputePeriodBlocks: 0,
        minimumVotingPower: 0,
        restrictedOperatorIndexes: [],
      };

      const newTaskDefinitionId = await attestationCenter
        .connect(avsGovernanceMultisig)
        .createNewTaskDefinition.staticCall(taskDefinitionName, taskDefinitionParams);

      await attestationCenter
        .connect(avsGovernanceMultisig)
        .createNewTaskDefinition(taskDefinitionName, taskDefinitionParams);

      const feeAmount = ethers.parseEther("0.01");
      await protocolRegistry.registerProtocol(approvedCallsPolicy, metadataURI);
      await protocolRegistry.subscribeSubnet(approvedCallsPolicy, newTaskDefinitionId, []);
      await vennFeeCalculator.setTaskDefinitionFee(newTaskDefinitionId, feeAmount);

      const taskPerformer = operators[0];

      const encodedData = await buildAndCreateDepositCallHash(
        consumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operators,
        taskPerformer,
        attestationCenter,
        proofOfTask,
        encodedData,
        Number(newTaskDefinitionId),
        true,
      );

      let tx = consumer.connect(user1).safeFunctionCall(feeAmount, submitTaskData, depositData, {
        value: depositAmount + feeAmount,
        gasLimit: 10000000,
      });
      await tx;
      await expect(tx).to.not.be.reverted;
      expect(await consumer.deposits(user1)).to.equal(depositAmount);
    }

    before(async () => {
      user1 = (await ethers.getSigners())[1];

      ({
        firewall,
        gnosisSafe,
        firewallModule,
        vennAvsLogic,
        attestationCenterProxy,
        protocolRegistry,
        operators,
        attestationCenter,
        avsGovernanceMultisig,
        vennFeeCalculator,
      } = await loadFixture(deployBaseFixture));
    });

    it("should allow upgrading a transparent proxy", async () => {
      const SampleVennUpgradeableConsumer = await ethers.getContractFactory("SampleVennUpgradeableConsumer");
      const sampleVennUpgradeableConsumerImplementation = await SampleVennUpgradeableConsumer.deploy();

      const SampleNonVennUpgradeableConsumer = await ethers.getContractFactory("SampleNonVennUpgradeableConsumer");
      const sampleNonVennUpgradeableConsumer = await upgrades.deployProxy(SampleNonVennUpgradeableConsumer);

      const proxyAdmin = await ethers.getContractAt(
        "ProxyAdmin",
        await upgrades.erc1967.getAdminAddress(await sampleNonVennUpgradeableConsumer.getAddress()),
      );

      await proxyAdmin.upgradeAndCall(
        await sampleNonVennUpgradeableConsumer.getAddress(),
        await sampleVennUpgradeableConsumerImplementation.getAddress(),
        "0x",
      );

      const sampleVennUpgradeableConsumer = await ethers.getContractAt(
        "SampleVennUpgradeableConsumer",
        await sampleNonVennUpgradeableConsumer.getAddress(),
      );
      expect(await sampleVennUpgradeableConsumer.firewallAdmin()).to.equal(ZeroAddress);
      await sampleVennUpgradeableConsumer.initializeFirewallAdmin(deployer);
      expect(await sampleVennUpgradeableConsumer.firewallAdmin()).to.equal(ZeroAddress);
      await sampleVennUpgradeableConsumer.acceptFirewallAdmin();
      expect(await sampleVennUpgradeableConsumer.firewallAdmin()).to.equal(await deployer.getAddress());

      await testFullFlowTillSafeFunctionCall(sampleVennUpgradeableConsumer);
    });

    it("should allow upgrading a beacon proxy", async () => {
      const SampleVennBeaconConsumer = await ethers.getContractFactory("SampleVennBeaconConsumer");

      const SampleNonVennBeaconConsumer = await ethers.getContractFactory("SampleNonVennBeaconConsumer");
      const sampleNonVennBeaconConsumerBeacon = await upgrades.deployBeacon(SampleNonVennBeaconConsumer);

      const sampleNonVennBeaconConsumer = await upgrades.deployBeaconProxy(
        sampleNonVennBeaconConsumerBeacon,
        SampleNonVennBeaconConsumer,
      );

      await upgrades.upgradeBeacon(sampleNonVennBeaconConsumerBeacon, SampleVennBeaconConsumer, {
        unsafeAllow: ["constructor"],
      });

      const sampleVennBeaconConsumer = await ethers.getContractAt(
        "SampleVennBeaconConsumer",
        await sampleNonVennBeaconConsumer.getAddress(),
      );

      expect(await sampleVennBeaconConsumer.firewallAdmin()).to.equal(ZeroAddress);
      await sampleVennBeaconConsumer.initializeFirewallAdmin(deployer);
      expect(await sampleVennBeaconConsumer.firewallAdmin()).to.equal(ZeroAddress);
      await sampleVennBeaconConsumer.acceptFirewallAdmin();
      expect(await sampleVennBeaconConsumer.firewallAdmin()).to.equal(await deployer.getAddress());

      await testFullFlowTillSafeFunctionCall(sampleVennBeaconConsumer);
    });
  });
});
