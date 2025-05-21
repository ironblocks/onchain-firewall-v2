import GnosisSafeJson from "@/externalArtifacts/gnosis-safe/GnosisSafe.json";
import GnosisSafeProxyJson from "@/externalArtifacts/gnosis-safe/GnosisSafeProxy.json";
import {
  AttestationCenterProxy,
  BeaconProxyVennFirewallConsumer,
  DynamicTransientApprovedCallsPolicy,
  FeePool,
  Firewall,
  FirewallModule,
  GnosisSafe,
  GnosisSafe__factory,
  GnosisSafeProxy__factory,
  OperatorRegistry,
  ProtocolRegistry,
  TransientApprovedCallsPolicy,
  TransparentProxyVennFirewallConsumer,
  VennFeeCalculator,
  VennToken,
  VennVaultL2,
} from "@/generated-types/ethers";
import { execSafeTx } from "@/scripts/gnosis";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Addressable, AddressLike, BigNumberish, ZeroAddress } from "ethers";
import { ethers } from "hardhat";
import { defaultProtocolRegistryInitData } from "./unit/ProtocolRegisrty.test";

export async function deployOBLS() {
  const oblsFactory = await ethers.getContractFactory("OBLSMock");
  const obls = await oblsFactory.deploy();

  return { obls };
}

export async function deployAttestationCenter(obls: Addressable) {
  const attestationCenterFactory = await ethers.getContractFactory("AttestationCenterMock");
  const attestationCenter = await attestationCenterFactory.deploy(obls);

  return { attestationCenter };
}

export async function deployProtocolRegistry(
  owner: Addressable,
  initData: ReturnType<typeof defaultProtocolRegistryInitData>,
) {
  const protocolRegistryFactory = await ethers.getContractFactory("ProtocolRegistry");
  const protocolRegistryImplementation = await protocolRegistryFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const protocolRegistryProxy = await proxyFactory.deploy(protocolRegistryImplementation.getAddress(), "0x");

  const protocolRegistry = protocolRegistryFactory.attach(await protocolRegistryProxy.getAddress()) as ProtocolRegistry;

  await protocolRegistry.__ProtocolRegistry_init(
    initData.attestationCenter,
    initData.vennFeeRecipient,
    initData.vennDetectionFee,
    initData.vennProtocolFee,
  );

  await protocolRegistry.grantRole(await protocolRegistry.ADMIN_ROLE(), owner);

  return { protocolRegistryImplementation, protocolRegistry };
}

export async function deployProtocolRegistryV20() {
  const protocolRegistryV20Factory = await ethers.getContractFactory("ContractV20");
  const protocolRegistryV20Implementation = await protocolRegistryV20Factory.deploy();

  return { protocolRegistryV20Implementation };
}

export async function deployVennToken(initialSupply: BigNumberish) {
  const vennTokenFactory = await ethers.getContractFactory("VennToken");
  const vennTokenImplementation = await vennTokenFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const vennTokenProxy = await proxyFactory.deploy(await vennTokenImplementation.getAddress(), "0x");

  const vennToken = vennTokenFactory.attach(await vennTokenProxy.getAddress()) as VennToken;

  await vennToken.__VennToken_init(initialSupply);

  return { vennTokenImplementation, vennToken };
}

export async function deployVennTokenV20() {
  const vennTokenV20Factory = await ethers.getContractFactory("ContractV20");
  const vennTokenV20Implementation = await vennTokenV20Factory.deploy();

  return { vennTokenV20Implementation };
}

export async function deployDetectionEscrow(
  protocolRegistry: ProtocolRegistry,
  protocolAdmin: SignerWithAddress,
  operator: SignerWithAddress,
) {
  const detectionEscrowFactory = await ethers.getContractFactory("DetectionEscrow");
  const detectionEscrow = await detectionEscrowFactory.deploy(protocolRegistry, protocolAdmin, operator);

  return { detectionEscrow };
}

export async function deployFirewall() {
  const firewallFactory = await ethers.getContractFactory("Firewall");
  const firewallImplementation = await firewallFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const firewallProxy = await proxyFactory.deploy(await firewallImplementation.getAddress(), "0x");

  const firewall = firewallFactory.attach(await firewallProxy.getAddress()) as Firewall;

  await firewall.__Firewall_init();

  return { firewallImplementation, firewall };
}

export async function deployFirewallV20() {
  const firewallV20Factory = await ethers.getContractFactory("ContractV20");
  const firewallV20Implementation = await firewallV20Factory.deploy();

  return { firewallV20Implementation };
}

export async function deployConsumer(firewall: Firewall) {
  const consumerFactory = await ethers.getContractFactory("ConsumerMock");
  const consumer = await consumerFactory.deploy(await firewall.getAddress());

  return { consumer };
}

export async function deployPolicy(firewall?: Firewall) {
  const policyFactory = await ethers.getContractFactory("PolicyMock");
  const policy = await policyFactory.deploy();

  if (firewall) {
    await firewall.setPolicyStatus(policy, true);
  }

  return { policy };
}

export async function deployFirewallPolicyBase() {
  const firewallPolicyBaseFactory = await ethers.getContractFactory("FirewallPolicyBaseMock");
  const firewallPolicyBase = await firewallPolicyBaseFactory.deploy();

  return { firewallPolicyBase };
}

export async function deployTransientApprovedCallsPolicyFactory() {
  const transientApprovedCallsPolicyFactoryFactory = await ethers.getContractFactory(
    "TransientApprovedCallsPolicyFactory",
  );
  const transientApprovedCallsPolicyFactory = await transientApprovedCallsPolicyFactoryFactory.deploy();

  return { transientApprovedCallsPolicyFactory };
}

export async function deployGnosisSafe(owner: SignerWithAddress) {
  const GnosisSafeImplementationFactory = (await ethers.getContractFactoryFromArtifact(
    GnosisSafeJson,
  )) as any as GnosisSafe__factory;
  const gnosisSafeImplementation = await GnosisSafeImplementationFactory.deploy();

  const GnosisSafeProxyFactory = (await ethers.getContractFactoryFromArtifact(
    GnosisSafeProxyJson,
  )) as any as GnosisSafeProxy__factory;
  const gnosisSafeProxy = await GnosisSafeProxyFactory.deploy(await gnosisSafeImplementation.getAddress());

  const gnosisSafe = GnosisSafe__factory.connect(await gnosisSafeProxy.getAddress(), owner);

  await gnosisSafe.setup([owner], 1, ZeroAddress, "0x", ZeroAddress, ZeroAddress, 0, ZeroAddress);

  return { gnosisSafe };
}

export async function deployFirewallModule(gnosisSafe: GnosisSafe) {
  const firewallModuleFactory = await ethers.getContractFactory("FirewallModule");
  const firewallModule = await firewallModuleFactory.deploy(gnosisSafe);

  await execSafeTx(gnosisSafe, {
    to: await gnosisSafe.getAddress(),
    data: gnosisSafe.interface.encodeFunctionData("enableModule", [await firewallModule.getAddress()]),
  });

  return { firewallModule };
}

export async function deployPolicyDeployer(firewallModule: FirewallModule, owner: SignerWithAddress) {
  const policyDeployerFactory = await ethers.getContractFactory("PolicyDeployer");
  const policyDeployer = await policyDeployerFactory.deploy(firewallModule);

  await policyDeployer.grantRole(await policyDeployer.ADMIN_ROLE(), owner);

  return { policyDeployer };
}

export async function deployTransientApprovedCallsPolicy(firewall: Firewall, owner: SignerWithAddress) {
  const transientApprovedCallsPolicyFactory = await ethers.getContractFactory("TransientApprovedCallsPolicy");
  const transientApprovedCallsPolicy = await transientApprovedCallsPolicyFactory.deploy(firewall);

  await transientApprovedCallsPolicy.grantRole(await transientApprovedCallsPolicy.ADMIN_ROLE(), owner);

  return { transientApprovedCallsPolicy };
}

export async function deployTransientApprovedCallsPolicyMock(
  transientApprovedCallsPolicy: TransientApprovedCallsPolicy,
) {
  const transientApprovedCallsPolicyMockFactory = await ethers.getContractFactory("TransientApprovedCallsPolicyMock");
  const transientApprovedCallsPolicyMock = await transientApprovedCallsPolicyMockFactory.deploy(
    await transientApprovedCallsPolicy.getAddress(),
  );

  return { transientApprovedCallsPolicyMock };
}

export async function deployDynamicTransientApprovedCallsPolicy(firewall: Firewall, owner: SignerWithAddress) {
  const dynamicTransientApprovedCallsPolicyFactory = await ethers.getContractFactory(
    "DynamicTransientApprovedCallsPolicy",
  );
  const dynamicTransientApprovedCallsPolicy = await dynamicTransientApprovedCallsPolicyFactory.deploy(firewall);

  await dynamicTransientApprovedCallsPolicy.grantRole(await dynamicTransientApprovedCallsPolicy.ADMIN_ROLE(), owner);

  return { dynamicTransientApprovedCallsPolicy };
}

export async function deployDynamicTransientApprovedCallsPolicyMock(
  dynamicTransientApprovedCallsPolicy: DynamicTransientApprovedCallsPolicy,
) {
  const dynamicTransientApprovedCallsPolicyMockFactory = await ethers.getContractFactory(
    "DynamicTransientApprovedCallsPolicyMock",
  );
  const dynamicTransientApprovedCallsPolicyMock = await dynamicTransientApprovedCallsPolicyMockFactory.deploy(
    await dynamicTransientApprovedCallsPolicy.getAddress(),
  );

  return { dynamicTransientApprovedCallsPolicyMock };
}

export async function deploySupportsSafeFunctionCallsMock() {
  const supportsSafeFunctionCallsMockFactory = await ethers.getContractFactory("SupportsSafeFunctionCallsMock");
  const supportsSafeFunctionCallsMock = await supportsSafeFunctionCallsMockFactory.deploy();

  return { supportsSafeFunctionCallsMock };
}

export async function deployArrayHelpersMock() {
  const arrayHelpersMockFactory = await ethers.getContractFactory("ArrayHelpersMock");
  const arrayHelpersMock = await arrayHelpersMockFactory.deploy();

  return { arrayHelpersMock };
}

export async function deployAttestationCenterProxy(
  feePool: Addressable,
  attestationCenter: Addressable,
  owner: SignerWithAddress,
) {
  const attestationCenterProxyFactory = await ethers.getContractFactory("AttestationCenterProxy");
  const attestationCenterProxyImplementation = await attestationCenterProxyFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const attestationCenterProxyProxy = await proxyFactory.deploy(
    await attestationCenterProxyImplementation.getAddress(),
    "0x",
  );

  const attestationCenterProxy = attestationCenterProxyFactory.attach(
    await attestationCenterProxyProxy.getAddress(),
  ) as AttestationCenterProxy;

  await attestationCenterProxy.__AttestationCenterProxy_init(feePool, attestationCenter);
  await attestationCenterProxy.grantRole(await attestationCenterProxy.ADMIN_ROLE(), owner);

  return { attestationCenterProxy };
}

export async function deployFeePool(
  protocolRegistry: AddressLike,
  feeDistributor: AddressLike,
  owner: SignerWithAddress,
) {
  const feePoolFactory = await ethers.getContractFactory("FeePool");
  const feePoolImplementation = await feePoolFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const feePoolProxy = await proxyFactory.deploy(await feePoolImplementation.getAddress(), "0x");

  const feePool = feePoolFactory.attach(await feePoolProxy.getAddress()) as FeePool;

  await feePool.__FeePool_init(protocolRegistry, feeDistributor);
  await feePool.grantRole(await feePool.ADMIN_ROLE(), owner);

  return { feePool };
}

export async function deployFeePoolV20() {
  const feePoolV20Factory = await ethers.getContractFactory("ContractV20");
  const feePoolV20Implementation = await feePoolV20Factory.deploy();

  return { feePoolV20Implementation };
}

export async function deployAttestationCenterProxyV20() {
  const attestationCenterProxyV20Factory = await ethers.getContractFactory("ContractV20");
  const attestationCenterProxyV20Implementation = await attestationCenterProxyV20Factory.deploy();

  return { attestationCenterProxyV20Implementation };
}

export async function deployAvsLogicBase(attestationCenter: Addressable, owner: SignerWithAddress) {
  const avsLogicBaseFactory = await ethers.getContractFactory("AvsLogicBaseMock");
  const avsLogicBase = await avsLogicBaseFactory.deploy(attestationCenter);

  await avsLogicBase.grantRole(await avsLogicBase.ADMIN_ROLE(), owner);

  return { avsLogicBase };
}

export async function deployVennAvsLogic(
  attestationCenter: Addressable,
  feePool: FeePool,
  protocolRegistry: ProtocolRegistry,
  owner: SignerWithAddress,
) {
  const vennAvsLogicFactory = await ethers.getContractFactory("VennAvsLogic");
  const vennAvsLogic = await vennAvsLogicFactory.deploy(attestationCenter, feePool, protocolRegistry);

  await vennAvsLogic.grantRole(await vennAvsLogic.ADMIN_ROLE(), owner);

  return { vennAvsLogic };
}

export async function deployVennFeeCalculator(operatorRegistry: AddressLike, admin: SignerWithAddress) {
  const vennFeeCalculatorFactory = await ethers.getContractFactory("VennFeeCalculator");
  const vennFeeCalculatorImplementation = await vennFeeCalculatorFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const vennFeeCalculatorProxy = await proxyFactory.deploy(await vennFeeCalculatorImplementation.getAddress(), "0x");

  const vennFeeCalculator = vennFeeCalculatorFactory.attach(
    await vennFeeCalculatorProxy.getAddress(),
  ) as VennFeeCalculator;

  await vennFeeCalculator.__VennFeeCalculator_init(operatorRegistry);

  await vennFeeCalculator.grantRole(await vennFeeCalculator.ADMIN_ROLE(), admin);

  return { vennFeeCalculatorImplementation, vennFeeCalculator };
}

export async function deployVennFeeCalculatorV20() {
  const vennFeeCalculatorV20Factory = await ethers.getContractFactory("ContractV20");
  const vennFeeCalculatorV20Implementation = await vennFeeCalculatorV20Factory.deploy();

  return { vennFeeCalculatorV20Implementation };
}

export async function deployVennVaultL2(
  asset: Addressable,
  attestationCenter: AddressLike,
  l2AvsTreasury: AddressLike,
  allowOperatorClaim: boolean,
  admin: SignerWithAddress,
) {
  const vennVaultL2Factory = await ethers.getContractFactory("VennVaultL2");
  const vennVaultL2Implementation = await vennVaultL2Factory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const vennVaultL2Proxy = await proxyFactory.deploy(await vennVaultL2Implementation.getAddress(), "0x");

  const vennVaultL2 = vennVaultL2Factory.attach(await vennVaultL2Proxy.getAddress()) as VennVaultL2;

  await vennVaultL2.__VennVaultL2_init(asset, attestationCenter, l2AvsTreasury, allowOperatorClaim);

  await vennVaultL2.grantRole(await vennVaultL2.ADMIN_ROLE(), admin);

  return { vennVaultL2 };
}

export async function deployVennVaultL2V20() {
  const vennVaultL2V20Factory = await ethers.getContractFactory("ContractV20");
  const vennVaultL2V20Implementation = await vennVaultL2V20Factory.deploy();

  return { vennVaultL2V20Implementation };
}

export async function deployL2AvsTreasuryMock() {
  const l2AvsTreasuryMockFactory = await ethers.getContractFactory("L2AvsTreasuryMock");
  const l2AvsTreasuryMock = await l2AvsTreasuryMockFactory.deploy();

  return { l2AvsTreasuryMock };
}

export async function deployVennFirewallConsumerBaseMock() {
  const vennFirewallConsumerBaseMockFactory = await ethers.getContractFactory("VennFirewallConsumerBaseMock");
  const vennFirewallConsumerBaseMock = await vennFirewallConsumerBaseMockFactory.deploy();

  return { vennFirewallConsumerBaseMock };
}

export async function deployFirewallMock() {
  const firewallMockFactory = await ethers.getContractFactory("FirewallMock");
  const firewallMock = await firewallMockFactory.deploy();

  return { firewallMock };
}

export async function deployVennFirewallConsumerMock(firewall: Addressable, firewallAdmin: Addressable) {
  const vennFirewallConsumerMockFactory = await ethers.getContractFactory("VennFirewallConsumerMock");
  const vennFirewallConsumerMock = await vennFirewallConsumerMockFactory.deploy(firewall, firewallAdmin);

  return { vennFirewallConsumerMock };
}

export async function deployProxyVennFirewallConsumerMock() {
  const proxyVennFirewallConsumerMockFactory = await ethers.getContractFactory("ProxyVennFirewallConsumerMock");
  const proxyVennFirewallConsumerMock = await proxyVennFirewallConsumerMockFactory.deploy();

  return { proxyVennFirewallConsumerMock };
}

export async function deployBeaconProxyVennFirewallConsumer() {
  const beaconProxyVennFirewallConsumerFactory = await ethers.getContractFactory("BeaconProxyVennFirewallConsumer");
  const beaconProxyVennFirewallConsumerImplementation = await beaconProxyVennFirewallConsumerFactory.deploy();

  const beaconFactory = await ethers.getContractFactory("UpgradeableBeacon");
  const beacon = await beaconFactory.deploy(await beaconProxyVennFirewallConsumerImplementation.getAddress());

  const proxyFactory = await ethers.getContractFactory("BeaconProxy");
  const beaconProxyVennFirewallConsumerProxy = await proxyFactory.deploy(await beacon.getAddress(), "0x");

  const beaconProxyVennFirewallConsumer = beaconProxyVennFirewallConsumerFactory.attach(
    await beaconProxyVennFirewallConsumerProxy.getAddress(),
  ) as BeaconProxyVennFirewallConsumer;

  return { beaconProxyVennFirewallConsumer };
}

export async function deployTransparentProxyVennFirewallConsumer() {
  const transparentProxyVennFirewallConsumerFactory = await ethers.getContractFactory(
    "TransparentProxyVennFirewallConsumer",
  );
  const transparentProxyVennFirewallConsumerImplementation = await transparentProxyVennFirewallConsumerFactory.deploy();

  const proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdmin = await proxyAdminFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const transparentProxyVennFirewallConsumerProxy = await proxyFactory.deploy(
    await transparentProxyVennFirewallConsumerImplementation.getAddress(),
    await proxyAdmin.getAddress(),
    "0x",
  );

  const transparentProxyVennFirewallConsumer = transparentProxyVennFirewallConsumerFactory.attach(
    await transparentProxyVennFirewallConsumerProxy.getAddress(),
  ) as TransparentProxyVennFirewallConsumer;

  return { transparentProxyVennFirewallConsumer, proxyAdmin };
}

export async function deploySampleVennConsumer(firewall: Firewall) {
  const sampleVennConsumerFactory = await ethers.getContractFactory("SampleVennConsumer");
  const sampleVennConsumer = await sampleVennConsumerFactory.deploy(firewall);

  return { sampleVennConsumer };
}

export async function deployMulticallVennConsumer(firewall: Firewall) {
  const multicallVennConsumerFactory = await ethers.getContractFactory("MulticallVennConsumer");
  const multicallVennConsumer = await multicallVennConsumerFactory.deploy(firewall);

  return { multicallVennConsumer };
}

export async function deployOperatorRegistry(
  attestationCenter: Addressable,
  maxSubscribedOperatorsCount: BigNumberish,
  owner: SignerWithAddress,
) {
  const operatorRegistryFactory = await ethers.getContractFactory("OperatorRegistry");
  const operatorRegistryImplementation = await operatorRegistryFactory.deploy();

  const proxyFactory = await ethers.getContractFactory("ERC1967Proxy");
  const operatorRegistryProxy = await proxyFactory.deploy(await operatorRegistryImplementation.getAddress(), "0x");

  const operatorRegistry = operatorRegistryFactory.attach(await operatorRegistryProxy.getAddress()) as OperatorRegistry;

  await operatorRegistry.__OperatorRegistry_init(attestationCenter, maxSubscribedOperatorsCount);

  await operatorRegistry.grantRole(await operatorRegistry.ADMIN_ROLE(), owner);

  return { operatorRegistryImplementation, operatorRegistry };
}

export async function deployOperatorRegistryV20() {
  const operatorRegistryV20Factory = await ethers.getContractFactory("ContractV20");
  const operatorRegistryV20Implementation = await operatorRegistryV20Factory.deploy();

  return { operatorRegistryV20Implementation };
}

export async function deployAttestationCenterFacet(attestationCenter: Addressable) {
  const attestationCenterFacetFactory = await ethers.getContractFactory("AttestationCenterFacet");
  const attestationCenterFacet = await attestationCenterFacetFactory.deploy(attestationCenter);

  return { attestationCenterFacet };
}

export async function deployVotingPowerSyncer(obls: Addressable, syncer: SignerWithAddress) {
  const votingPowerSyncerFactory = await ethers.getContractFactory("VotingPowerSyncer");
  const votingPowerSyncer = await votingPowerSyncerFactory.deploy(obls, syncer);

  return { votingPowerSyncer };
}

export async function deployAvsGovernance() {
  const avsGovernanceFactory = await ethers.getContractFactory("AvsGovernanceMock");
  const avsGovernance = await avsGovernanceFactory.deploy();

  return { avsGovernance };
}

export async function deployAvsGovernanceFacet(avsGovernance: Addressable) {
  const avsGovernanceFacetFactory = await ethers.getContractFactory("AvsGovernanceFacet");
  const avsGovernanceFacet = await avsGovernanceFacetFactory.deploy(avsGovernance);

  return { avsGovernanceFacet };
}
