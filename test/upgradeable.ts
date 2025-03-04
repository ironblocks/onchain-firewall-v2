import {
  AttestationCenterProxy,
  FeePool,
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
  VennToken,
  VennVaultL2,
} from "@/generated-types/ethers";
import {
  buildAndCreateDepositCallHash,
  deployApprovedCallsPolicy,
  deployBaseFixture,
  getProofOfTask,
  getSubmitTaskData,
} from "@/scripts/utils";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BaseContract, BytesLike, ContractFactory, Signer, ZeroAddress } from "ethers";
import { ethers, upgrades } from "hardhat";

describe("Upgradeable", () => {
  let deployer: SignerWithAddress;

  before("setup", async () => {
    [deployer] = await ethers.getSigners();
  });

  describe("deployUUPSUpgradeableProxy", () => {
    async function deployUUPSUpgradeableProxy<I extends BaseContract>(
      implementationFactory: ContractFactory,
      data: BytesLike = "0x",
    ): Promise<I> {
      const implementation = await implementationFactory.deploy();

      const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
      const proxy = await proxyFactory.deploy(await implementation.getAddress(), data);

      const proxyContract = implementationFactory.attach(await proxy.getAddress()) as unknown as I;

      return proxyContract;
    }

    it("Firewall", async () => {
      const FirewallFactory = await ethers.getContractFactory("Firewall");
      const firewall = await deployUUPSUpgradeableProxy<Firewall>(FirewallFactory);

      await firewall.__Firewall_init();

      // Check that the proxy is initialized
      expect(await firewall.owner()).to.equal(deployer);
      expect(await firewall.version()).to.equal(1);

      const newFirewallAddress = await (await ethers.deployContract("ContractV20")).getAddress();
      await firewall.upgradeTo(newFirewallAddress);

      // Check that the proxy is upgraded
      expect(await firewall.version()).to.equal(20);
    });

    it("ProtocolRegistry", async () => {
      const ProtocolRegistryFactory = await ethers.getContractFactory("ProtocolRegistry");
      const protocolRegistry = await deployUUPSUpgradeableProxy<ProtocolRegistry>(ProtocolRegistryFactory);

      await protocolRegistry.__ProtocolRegistry_init(deployer, deployer, deployer, 0, 0, 0);
      await protocolRegistry.grantRole(await protocolRegistry.ADMIN_ROLE(), deployer);

      // Check that the proxy is initialized
      expect(await protocolRegistry.vennFeeRecipient()).to.equal(deployer);
      expect(await protocolRegistry.version()).to.equal(1);

      const newProtocolRegistryAddress = await (await ethers.deployContract("ContractV20")).getAddress();
      await protocolRegistry.upgradeTo(newProtocolRegistryAddress);

      // Check that the proxy is upgraded
      expect(await protocolRegistry.version()).to.equal(20);
    });

    it("VennToken", async () => {
      const VennTokenFactory = await ethers.getContractFactory("VennToken");
      const vennToken = await deployUUPSUpgradeableProxy<VennToken>(VennTokenFactory);

      await vennToken.__VennToken_init(1000000);

      expect(await vennToken.owner()).to.equal(deployer);
      expect(await vennToken.version()).to.equal(1);

      const newVennTokenAddress = await (await ethers.deployContract("ContractV20")).getAddress();
      await vennToken.upgradeTo(newVennTokenAddress);

      // Check that the proxy is upgraded
      expect(await vennToken.version()).to.equal(20);
    });

    it("AttestationCenterProxy", async () => {
      const AttestationCenterProxyFactory = await ethers.getContractFactory("AttestationCenterProxy");
      const attestationCenterProxy =
        await deployUUPSUpgradeableProxy<AttestationCenterProxy>(AttestationCenterProxyFactory);

      await attestationCenterProxy.__AttestationCenterProxy_init(deployer, deployer);

      expect(await attestationCenterProxy.version()).to.equal(1);

      await attestationCenterProxy.grantRole(await attestationCenterProxy.ADMIN_ROLE(), deployer);

      const newAttestationCenterProxyAddress = await (await ethers.deployContract("ContractV20")).getAddress();
      await attestationCenterProxy.upgradeTo(newAttestationCenterProxyAddress);

      // Check that the proxy is upgraded
      expect(await attestationCenterProxy.version()).to.equal(20);
    });

    it("FeePool", async () => {
      const FeePoolFactory = await ethers.getContractFactory("FeePool");
      const feePool = await deployUUPSUpgradeableProxy<FeePool>(FeePoolFactory);

      await feePool.__FeePool_init(deployer);

      expect(await feePool.version()).to.equal(1);

      await feePool.grantRole(await feePool.ADMIN_ROLE(), deployer);

      const newFeePoolAddress = await (await ethers.deployContract("ContractV20")).getAddress();
      await feePool.upgradeTo(newFeePoolAddress);

      // Check that the proxy is upgraded
      expect(await feePool.version()).to.equal(20);
    });

    it("VennVaultL2", async () => {
      const VennVaultL2Factory = await ethers.getContractFactory("VennVaultL2");
      const vennVaultL2 = await deployUUPSUpgradeableProxy<VennVaultL2>(VennVaultL2Factory);

      await vennVaultL2.__VennVaultL2_init(deployer, deployer, deployer, false);

      expect(await vennVaultL2.version()).to.equal(1);

      await vennVaultL2.grantRole(await vennVaultL2.ADMIN_ROLE(), deployer);

      const newVennVaultL2Address = await (await ethers.deployContract("ContractV20")).getAddress();
      await vennVaultL2.upgradeTo(newVennVaultL2Address);

      // Check that the proxy is upgraded
      expect(await vennVaultL2.version()).to.equal(20);
    });
  });

  describe("NonVenn into Venn", () => {
    const metadataURI = "https://example.com/metadata";
    const depositAmount = ethers.parseEther("0.01");
    const depositData = SampleVennUpgradeableConsumer__factory.createInterface().encodeFunctionData("deposit");

    let user1: SignerWithAddress;
    let chainId: bigint;

    let firewall: Firewall;
    let gnosisSafe: GnosisSafe;
    let firewallModule: FirewallModule;
    let vennAvsLogic: VennAvsLogic;
    let attestationCenterProxy: AttestationCenterProxy;
    let protocolRegistry: ProtocolRegistry;
    let feePool: FeePool;
    let operatorKeys: string[];
    let attestationCenter: IAttestationCenter;
    let avsGovernanceMultisig: Signer;

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
      await protocolRegistry.registerProtocol(approvedCallsPolicy, [], newTaskDefinitionId, metadataURI);
      await protocolRegistry.setTaskDefinitionFee(newTaskDefinitionId, feeAmount);

      const taskPerformerPrivateKey = operatorKeys[0];

      const encodedData = await buildAndCreateDepositCallHash(
        consumer,
        depositAmount,
        user1,
        user1,
        approvedCallsPolicy,
      );
      const proofOfTask = await getProofOfTask(user1, approvedCallsPolicy);
      const submitTaskData = await getSubmitTaskData(
        operatorKeys,
        taskPerformerPrivateKey,
        attestationCenter,
        proofOfTask,
        encodedData,
        Number(newTaskDefinitionId),
        chainId,
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
      chainId = (await ethers.provider.getNetwork()).chainId;

      ({
        firewall,
        gnosisSafe,
        firewallModule,
        vennAvsLogic,
        attestationCenterProxy,
        protocolRegistry,
        feePool,
        operatorKeys,
        attestationCenter,
        avsGovernanceMultisig,
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
