import { createOMCL, OMCL } from "@ironblocks/omcl";
import { impersonateAccount, loadFixture, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { Addressable, AddressLike, BigNumberish, MaxUint256, resolveAddress, ZeroAddress } from "ethers";
import { ethers, upgrades } from "hardhat";

import {
  AttestationCenterProxy,
  AttestationCenterProxy__factory,
  FeePool__factory,
  Firewall,
  FirewallModule,
  GnosisSafe,
  GnosisSafe__factory,
  GnosisSafeProxy__factory,
  IAttestationCenter,
  IAttestationCenter__factory,
  IAVSDirectory__factory,
  IAvsGovernance,
  IAvsGovernance__factory,
  IAvsTreasury__factory,
  IDelegationManager__factory,
  IOBLS__factory,
  IStrategyFactory__factory,
  IStrategyManager__factory,
  IVennFirewallConsumerBase,
  Ownable__factory,
  ProtocolRegistry__factory,
  SampleVennBeaconConsumer,
  SampleVennUpgradeableConsumer,
  TransientApprovedCallsPolicy,
  TransientApprovedCallsPolicy__factory,
  VennAvsLogic,
  VennFirewallConsumerBase,
  VennToken,
  VennVaultL2__factory,
} from "@/generated-types/ethers";
import { BaseWallet, Signer } from "ethers";

import GnosisSafeJson from "@/externalArtifacts/gnosis-safe/GnosisSafe.json";
import GnosisSafeProxyJson from "@/externalArtifacts/gnosis-safe/GnosisSafeProxy.json";
import { MulticallVennConsumerInterface } from "@/generated-types/ethers/artifacts/contracts/samples/MulticallVennConsumer";
import {
  SampleVennConsumer,
  SampleVennConsumerInterface,
} from "@/generated-types/ethers/artifacts/contracts/samples/SampleVennConsumer";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { getAddresses } from "./adresses";
import { execSafeTx } from "./gnosis";

const abiEncoder = new ethers.AbiCoder();

export async function isUserAccount(account: string): Promise<boolean> {
  return (await ethers.provider.getCode(account)) === "0x";
}

export async function buildAndCreateDepositCallHash(
  sampleVennConsumer: SampleVennConsumer | SampleVennUpgradeableConsumer | SampleVennBeaconConsumer,
  depositAmount: bigint,
  sender: Addressable,
  origin: Addressable,
  approvedCallsPolicy: TransientApprovedCallsPolicy,
  nonce?: BigNumberish,
) {
  const depositCallHash = await createDepositCallHash(
    sampleVennConsumer.interface,
    sampleVennConsumer,
    sender,
    origin,
    depositAmount,
  );

  const encodedData = await encodeApprovedCalls(approvedCallsPolicy, depositCallHash, origin, nonce);

  return encodedData;
}

export async function encodeApprovedCalls(
  approvedCallsPolicy: TransientApprovedCallsPolicy,
  depositCallHash: string,
  txOrigin: AddressLike,
  nonce?: BigNumberish,
) {
  if (!nonce) {
    nonce = await approvedCallsPolicy.nonces(txOrigin);
  }

  const encodedApprovedCalls = approvedCallsPolicy.interface.encodeFunctionData("approveCalls", [
    [depositCallHash],
    MaxUint256,
    await resolveAddress(txOrigin),
    nonce,
  ]);
  const encodedData = `${await approvedCallsPolicy.getAddress()}${encodedApprovedCalls.substring(2)}`;

  return encodedData;
}

export async function deployBaseFixture() {
  // this base below breaks the bls signing for some reason... likely bug in our signing code
  // const randomBase = "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";
  const randomBase = "0x1a871d0198f97d19848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";

  const randomKeys = [
    (BigInt(randomBase) + 1n).toString(16),
    (BigInt(randomBase) + 2n).toString(16),
    (BigInt(randomBase) + 3n).toString(16),
  ];
  const amounts = [ethers.parseEther("250"), ethers.parseEther("100"), ethers.parseEther("150")];
  const deployedContracts = await deployBaseContractsHolesky(randomKeys, amounts);
  return {
    ...deployedContracts,
    operatorKeys: randomKeys,
    amounts,
  };
}

export async function deployLargeOperatorAmountFixture() {
  // this base below breaks the bls signing for some reason... likely bug in our signing code
  // const randomBase = "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";
  const randomBase = "0x1a871d0198f97d19848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";

  const randomKeys = [...Array(50).keys()].map((i) => (BigInt(randomBase) + BigInt(i)).toString(16));
  const amounts = randomKeys.map(() => ethers.parseEther("100"));
  const deployedContracts = await deployBaseContractsHolesky(randomKeys, amounts);
  return {
    ...deployedContracts,
    operatorKeys: randomKeys,
    amounts,
  };
}

export async function deployMulticallFixture() {
  const baseFixture = await loadFixture(deployBaseFixture);
  const { firewall, firewallModule, vennAvsLogic, attestationCenterProxy, gnosisSafe, deployer } = baseFixture;
  const { multicallVennConsumer, approvedCallsPolicy: approvedCallsPolicy2 } = await deployMulticallVennConsumer(
    deployer,
    firewall,
    gnosisSafe,
    firewallModule,
    vennAvsLogic,
    attestationCenterProxy,
  );
  return {
    ...baseFixture,
    multicallVennConsumer,
    approvedCallsPolicy2,
  };
}

export async function deployBaseContractsHolesky(operatorPrivateKeys: string[], operatorWeights: bigint[]) {
  const operatorBalance = ethers.parseEther("1000000");
  const omcl = await createOMCL();

  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== 17000n) {
    throw new Error("This script is only supported on holesky");
  }

  const deployer = (await ethers.getSigners())[0];

  const operators: BaseWallet[] = [];
  for (const key of operatorPrivateKeys) {
    const operator = new ethers.Wallet(key, ethers.provider);
    await setBalance(await operator.getAddress(), operatorBalance);
    operators.push(operator);
  }

  const { vennToken, vennVaultL2 } = await deployVennTokenBase(deployer);

  const {
    avsGovernanceAddress,
    attestationCenterAddress,
    oblsAddress,
    operationsMultisigAddress,
    avsGovernanceMultisigAddress,
  } = await deployOthentic(deployer, await vennVaultL2.getAddress(), true);

  const {
    attestationCenterProxy,
    sampleVennConsumer,
    firewall,
    protocolRegistry,
    feePool,
    vennAvsLogic,
    approvedCallsPolicy,
    vennFeeCalculator,
    gnosisSafe,
    firewallModule,
  } = await deployVenn(deployer, attestationCenterAddress);

  const strategyFactory = IStrategyFactory__factory.connect((await getAddresses()).strategyFactoryAddress, deployer);
  const strategyFactoryOwnerAddress = await Ownable__factory.connect(
    (await getAddresses()).strategyFactoryAddress,
    deployer,
  ).owner();
  console.log(`StrategyFactory owner address: ${strategyFactoryOwnerAddress}`);

  const [avsGovernanceMultisig, operationsMultisig] = await impersonateAccounts([
    avsGovernanceMultisigAddress,
    operationsMultisigAddress,
  ]);

  const vennStakingStrategyAddress = await strategyFactory.deployNewStrategy.staticCall(vennToken);
  await strategyFactory.deployNewStrategy(vennToken);

  const avsGovernance = IAvsGovernance__factory.connect(avsGovernanceAddress, deployer);
  // TODO: consider supporting multiple strategies, e.g steth
  await avsGovernance.connect(avsGovernanceMultisig).setSupportedStrategies([vennStakingStrategyAddress]);
  console.log("Set supported strategies in avs governance");

  // await avsGovernance.connect(avsGovernanceMultisig).setNumOfOperatorsLimit(100);
  // console.log("Set num of operators limit in avs governance");

  const attestationCenter = IAttestationCenter__factory.connect(attestationCenterAddress, deployer);
  const paymentRequestFlow = ethers.keccak256(ethers.toUtf8Bytes("PAYMENT_REQUST_FLOW")).substring(0, 10);
  const batchPaymentRequestFlow = ethers.keccak256(ethers.toUtf8Bytes("BATCH_PAYMENT_REQUEST_FLOW")).substring(0, 10);
  await attestationCenter.unpause(paymentRequestFlow);
  await attestationCenter.unpause(batchPaymentRequestFlow);

  const l2AvsTreasuryAddress = await attestationCenter.avsTreasury();
  const l2AvsTreasury = IAvsTreasury__factory.connect(l2AvsTreasuryAddress, deployer);
  console.log(`L2 Avs Treasury: ${l2AvsTreasuryAddress}`);

  await vennVaultL2.setAttestationCenter(attestationCenterAddress);
  await vennVaultL2.setL2AvsTreasury(l2AvsTreasuryAddress);
  console.log("Set attestation center and l2 avs treasury on venn vault l2");

  await attestationCenter.setIsOpenAggregator(true);
  console.log("Set is open aggregator = true on attestation center");

  await attestationCenter.setFeeCalculator(vennFeeCalculator);
  console.log("Set fee calculator on attestation center");

  await attestationCenter.connect(operationsMultisig).transferMessageHandler(deployer);
  console.log("Transferred message handler on attestation center");

  await attestationCenter.setBeforePaymentsLogic(vennVaultL2);
  console.log("Set before payments logic on attestation center");

  await IOBLS__factory.connect(attestationCenterAddress, deployer).setOblsSharesSyncer(deployer);
  console.log("Set obls shares syncer");

  for (let i = 0; i < operators.length; i++) {
    console.log(`registering operator ${i + 1} of ${operators.length}`);
    await registerOperator(
      operators[i],
      deployer,
      operatorPrivateKeys[i],
      avsGovernance,
      attestationCenter,
      chainId,
      omcl,
    );
  }

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];
    const operatorWeight = operatorWeights[i];

    console.log(`Staking VENN as operator ${await operator.getAddress()}`);
    await stakeVennAsOperator(operator, vennToken, vennStakingStrategyAddress, operatorWeight);
    console.log(`Staked as operator ${await operator.getAddress()}`);
  }

  await syncWeights(deployer, attestationCenterAddress, avsGovernanceAddress, oblsAddress);

  console.log("ALL DONE");

  return {
    vennToken,
    vennStakingStrategyAddress,
    vennVaultL2,
    avsGovernance,
    attestationCenter,
    sampleVennConsumer,
    firewall,
    protocolRegistry,
    feePool,
    vennAvsLogic,
    approvedCallsPolicy,
    avsGovernanceMultisig,
    operationsMultisig,
    vennFeeCalculator,
    attestationCenterProxy,
    l2AvsTreasury,
    gnosisSafe,
    firewallModule,
    deployer,
  };
}

export async function stakeVennAsOperator(
  operator: BaseWallet,
  vennToken: VennToken,
  vennStakingStrategyAddress: string,
  operatorWeight: bigint,
) {
  const strategyManager = IStrategyManager__factory.connect((await getAddresses()).strategyManagerAddress, operator);
  await vennToken.transfer(operator, operatorWeight);
  await vennToken.connect(operator).approve(strategyManager, operatorWeight);
  await strategyManager.depositIntoStrategy(vennStakingStrategyAddress, vennToken, operatorWeight);
}

export async function impersonateAccounts(accounts: string[]) {
  const accountBalance = ethers.parseEther("1000000");

  const signerAccounts: Signer[] = [];
  for (const account of accounts) {
    await impersonateAccount(account);
    await setBalance(account, accountBalance);
    signerAccounts.push(await ethers.getSigner(account));
  }

  return signerAccounts;
}

export async function deployGnosisSafe(deployer: SignerWithAddress, firewall: Firewall) {
  console.log("Deploying GnosisSafe");
  const GnosisSafeImplementationFactory = (await ethers.getContractFactoryFromArtifact(
    GnosisSafeJson,
    deployer,
  )) as any as GnosisSafe__factory;
  const gnosisSafeImplementation = await GnosisSafeImplementationFactory.deploy();

  const GnosisSafeProxyFactory = (await ethers.getContractFactoryFromArtifact(
    GnosisSafeProxyJson,
    deployer,
  )) as any as GnosisSafeProxy__factory;
  const gnosisSafeProxy = await GnosisSafeProxyFactory.deploy(gnosisSafeImplementation);

  const gnosisSafe = GnosisSafe__factory.connect(await gnosisSafeProxy.getAddress(), deployer);
  console.log(" -> GnosisSafe deployed at: ", await gnosisSafe.getAddress());

  await gnosisSafe.setup([deployer], 1, ZeroAddress, "0x", ZeroAddress, ZeroAddress, 0, ZeroAddress);

  console.log("Deploying FirewallModule");
  const FirewallModuleFactory = await ethers.getContractFactory("FirewallModule", deployer);
  const firewallModule = await FirewallModuleFactory.deploy(gnosisSafe);
  console.log(" -> FirewallModule deployed at: ", await firewallModule.getAddress());

  await execSafeTx(
    gnosisSafe,
    {
      to: gnosisSafe,
      data: gnosisSafe.interface.encodeFunctionData("enableModule", [await firewallModule.getAddress()]),
    },
    [deployer],
  );

  await execSafeTx(
    gnosisSafe,
    {
      to: firewallModule,
      data: firewallModule.interface.encodeFunctionData("setFirewallsStatus", [[await firewall.getAddress()], true]),
    },
    [deployer],
  );

  return { gnosisSafe, firewallModule };
}

export async function deployVennBaseContracts(deployer: SignerWithAddress, attestationCenterAddress: string) {
  const attestationCenter = IAttestationCenter__factory.connect(attestationCenterAddress, deployer);

  console.log(`Deploying Firewall`);
  const FirewallFactory = await ethers.getContractFactory("Firewall", deployer);
  const firewall = await upgrades.deployProxy(FirewallFactory, [], { kind: "uups", initializer: "__Firewall_init" });
  console.log(` -> Firewall deployed at: ${await firewall.getAddress()}`);

  console.log(`Deploying ProtocolRegistry`);
  const ProtocolRegistryFactory = await ethers.getContractFactory("ProtocolRegistry", deployer);
  const protocolRegistryProxy = await upgrades.deployProxy(
    ProtocolRegistryFactory,
    [
      await attestationCenter.getAddress(),
      await deployer.getAddress(), // VENN_FEE_RECIPIENT_ADDRESS
      ZeroAddress,
      ethers.parseEther("1"), // MAX_TASK_DEFINITION_ID_FEE
      0, // VENN_DETECTION_FEE
      0, // VENN_PROTOCOL_FEE
    ],
    { kind: "uups", initializer: "__ProtocolRegistry_init" },
  );
  const protocolRegistry = ProtocolRegistry__factory.connect(await protocolRegistryProxy.getAddress(), deployer);
  console.log(` -> ProtocolRegistry deployed at: ${await protocolRegistry.getAddress()}`);

  await protocolRegistry.grantRole(await protocolRegistry.ADMIN_ROLE(), deployer);

  await protocolRegistry.setTaskDefinitionFee(0, ethers.parseEther("0.01"));
  console.log(`Set task definition fee for id 0 to 0.01 ETH`);

  console.log(`Deploying VennFeeCalculator`);
  const VennFeeCalculatorFactory = await ethers.getContractFactory("VennFeeCalculator", deployer);
  const vennFeeCalculator = await VennFeeCalculatorFactory.deploy(
    attestationCenterAddress,
    await protocolRegistry.getAddress(),
  );
  console.log(` -> VennFeeCalculator deployed at: ${await vennFeeCalculator.getAddress()}`);

  console.log(`Deploying FeePool`);
  const FeePoolFactory = await ethers.getContractFactory("FeePool", deployer);
  const feePoolProxy = await upgrades.deployProxy(FeePoolFactory, [await protocolRegistry.getAddress()], {
    kind: "uups",
    initializer: "__FeePool_init",
  });
  const feePool = FeePool__factory.connect(await feePoolProxy.getAddress(), deployer);
  console.log(` -> FeePool deployed at: ${await feePool.getAddress()}`);

  console.log(`Deploying VennAvsLogic`);
  const VennAvsLogicFactory = await ethers.getContractFactory("VennAvsLogic", deployer);
  const vennAvsLogic = await VennAvsLogicFactory.deploy(
    attestationCenterAddress,
    await feePool.getAddress(),
    await protocolRegistry.getAddress(),
  );
  console.log(` -> VennAvsLogic deployed at: ${await vennAvsLogic.getAddress()}`);

  console.log(`Deploying AttestationCenterProxy`);
  const AttestationCenterProxyFactory = await ethers.getContractFactory("AttestationCenterProxy", deployer);
  const attestationCenterProxyProxy = await upgrades.deployProxy(
    AttestationCenterProxyFactory,
    [await feePool.getAddress(), await attestationCenter.getAddress()],
    { kind: "uups", initializer: "__AttestationCenterProxy_init" },
  );
  const attestationCenterProxy = AttestationCenterProxy__factory.connect(
    await attestationCenterProxyProxy.getAddress(),
    deployer,
  );
  console.log(` -> AttestationCenterProxy deployed at: ${await attestationCenterProxy.getAddress()}`);

  await attestationCenter.setAvsLogic(vennAvsLogic);

  await feePool.grantRole(ethers.keccak256(ethers.toUtf8Bytes("FEE_CLAIMER_ROLE")), vennAvsLogic);
  await feePool.grantRole(ethers.keccak256(ethers.toUtf8Bytes("SIGNER_ROLE")), vennAvsLogic);

  const { gnosisSafe, firewallModule } = await deployGnosisSafe(deployer, firewall);

  console.log(await firewall.owner());
  console.log(await deployer.getAddress());
  await firewall.transferOwnership(gnosisSafe);
  await execSafeTx(
    gnosisSafe,
    {
      to: firewall,
      data: firewall.interface.encodeFunctionData("acceptOwnership"),
    },
    [deployer],
  );
  console.log(` -> Firewall owner at: ${await gnosisSafe.getAddress()}`);

  return {
    firewall,
    protocolRegistry,
    feePool,
    vennAvsLogic,
    attestationCenterProxy,
    vennFeeCalculator,
    gnosisSafe,
    firewallModule,
  };
}

export async function deployVennTokenBase(deployer: Signer) {
  console.log(`Deploying VennToken`);
  const vennTokenFactory = await ethers.getContractFactory("VennToken", deployer);
  const vennToken = await upgrades.deployProxy(vennTokenFactory, [ethers.parseEther("1000000000")], {
    kind: "uups",
    initializer: "__VennToken_init",
  });
  console.log(` -> VennToken deployed at: ${await vennToken.getAddress()}`);

  console.log(`Deploying VennVaultL2`);
  const vennVaultL2Factory = await ethers.getContractFactory("VennVaultL2", deployer);
  const vennVaultL2Proxy = await upgrades.deployProxy(
    vennVaultL2Factory,
    [await vennToken.getAddress(), ZeroAddress, ZeroAddress, true],
    { kind: "uups", initializer: "__VennVaultL2_init" },
  );
  const vennVaultL2 = VennVaultL2__factory.connect(await vennVaultL2Proxy.getAddress(), deployer);
  console.log(` -> VennVaultL2 deployed at: ${await vennVaultL2.getAddress()}`);

  await vennVaultL2.grantRole(await vennVaultL2.ADMIN_ROLE(), deployer);

  return {
    vennToken,
    vennVaultL2,
  };
}

export async function deployApprovedCallsPolicy(
  deployer: SignerWithAddress,
  firewall: Firewall,
  gnosisSafe: GnosisSafe,
  firewallModule: FirewallModule,
  consumer: Addressable,
  vennAvsLogic: VennAvsLogic,
) {
  console.log(`Deploying TransientApprovedCallsPolicyFactory`);
  const TransientApprovedCallsPolicyFactoryFactory = await ethers.getContractFactory(
    "TransientApprovedCallsPolicyFactory",
    deployer,
  );
  const transientApprovedCallsPolicyFactory = await TransientApprovedCallsPolicyFactoryFactory.deploy();
  console.log(
    ` -> TransientApprovedCallsPolicyFactory deployed at: ${await transientApprovedCallsPolicyFactory.getAddress()}`,
  );

  console.log(`Deploying PolicyDeployer`);
  const PolicyDeployerFactory = await ethers.getContractFactory("PolicyDeployer", deployer);
  const policyDeployer = await PolicyDeployerFactory.deploy(await firewallModule.getAddress());
  console.log(` -> PolicyDeployer deployed at: ${await policyDeployer.getAddress()}`);

  await policyDeployer.grantRole(await policyDeployer.ADMIN_ROLE(), deployer);

  await policyDeployer.setFactoryStatuses([transientApprovedCallsPolicyFactory], [true]);
  await execSafeTx(
    gnosisSafe,
    {
      to: firewallModule,
      data: firewallModule.interface.encodeFunctionData("setDeployersStatus", [
        [await policyDeployer.getAddress()],
        true,
      ]),
    },
    [deployer],
  );

  console.log(`Deploying TransientApprovedCallsPolicy`);
  const [approvedCallsPolicyAddress] = await policyDeployer.deployPolicies.staticCall(
    firewall,
    [transientApprovedCallsPolicyFactory],
    [
      abiEncoder.encode(
        ["address", "address", "address", "address[]", "address[]", "bool[]"],
        [
          await firewall.getAddress(),
          await deployer.getAddress(),
          await deployer.getAddress(),
          [await vennAvsLogic.getAddress()],
          [await consumer.getAddress()],
          [true],
        ],
      ),
    ],
  );
  await policyDeployer.deployPolicies(
    firewall,
    [transientApprovedCallsPolicyFactory],
    [
      abiEncoder.encode(
        ["address", "address", "address", "address[]", "address[]", "bool[]"],
        [
          await firewall.getAddress(),
          await deployer.getAddress(),
          await deployer.getAddress(),
          [await vennAvsLogic.getAddress()],
          [await consumer.getAddress()],
          [true],
        ],
      ),
    ],
  );
  const approvedCallsPolicy = TransientApprovedCallsPolicy__factory.connect(approvedCallsPolicyAddress, deployer);
  console.log(` -> TransientApprovedCallsPolicy deployed at: ${approvedCallsPolicyAddress}`);

  return {
    approvedCallsPolicy,
  };
}

export async function deploySampleVennConsumer(
  deployer: SignerWithAddress,
  firewall: Firewall,
  gnosisSafe: GnosisSafe,
  firewallModule: FirewallModule,
  vennAvsLogic: VennAvsLogic,
  attestationCenterProxy: AttestationCenterProxy,
) {
  console.log(`Deploying SampleVennConsumer`);
  const SampleVennConsumerFactory = await ethers.getContractFactory("SampleVennConsumer", deployer);
  const sampleVennConsumer = await SampleVennConsumerFactory.deploy(firewall);
  console.log(` -> SampleVennConsumer deployed at: ${await sampleVennConsumer.getAddress()}`);

  const { approvedCallsPolicy } = await deployApprovedCallsPolicy(
    deployer,
    firewall,
    gnosisSafe,
    firewallModule,
    sampleVennConsumer,
    vennAvsLogic,
  );

  await sampleVennConsumer.setAttestationCenterProxy(attestationCenterProxy);

  await firewall.addGlobalPolicy(sampleVennConsumer, approvedCallsPolicy);

  return {
    sampleVennConsumer,
    approvedCallsPolicy,
  };
}

export async function deployMulticallVennConsumer(
  deployer: SignerWithAddress,
  firewall: Firewall,
  gnosisSafe: GnosisSafe,
  firewallModule: FirewallModule,
  vennAvsLogic: VennAvsLogic,
  attestationCenterProxy: AttestationCenterProxy,
) {
  console.log(`Deploying MulticallVennConsumer`);
  const MulticallVennConsumerFactory = await ethers.getContractFactory("MulticallVennConsumer", deployer);
  const multicallVennConsumer = await MulticallVennConsumerFactory.deploy(firewall);
  console.log(` -> MulticallVennConsumer deployed at: ${await multicallVennConsumer.getAddress()}`);

  const { approvedCallsPolicy } = await deployApprovedCallsPolicy(
    deployer,
    firewall,
    gnosisSafe,
    firewallModule,
    multicallVennConsumer,
    vennAvsLogic,
  );

  await multicallVennConsumer.setAttestationCenterProxy(attestationCenterProxy);

  await firewall.addGlobalPolicy(multicallVennConsumer, approvedCallsPolicy);
  return {
    multicallVennConsumer,
    approvedCallsPolicy,
  };
}

export async function deployVenn(deployer: SignerWithAddress, attestationCenterAddress: string) {
  const {
    firewall,
    gnosisSafe,
    firewallModule,
    protocolRegistry,
    feePool,
    vennAvsLogic,
    attestationCenterProxy,
    vennFeeCalculator,
  } = await deployVennBaseContracts(deployer, attestationCenterAddress);

  const { sampleVennConsumer, approvedCallsPolicy } = await deploySampleVennConsumer(
    deployer,
    firewall,
    gnosisSafe,
    firewallModule,
    vennAvsLogic,
    attestationCenterProxy,
  );

  return {
    firewall,
    protocolRegistry,
    feePool,
    vennAvsLogic,
    attestationCenterProxy,
    sampleVennConsumer,
    approvedCallsPolicy,
    vennFeeCalculator,
    gnosisSafe,
    firewallModule,
  };
}

export async function deployOthentic(deployer: Signer, rewardTokenAddress: string, rewardsOnL2: boolean) {
  const operationsMultisigRole = ethers.keccak256(ethers.toUtf8Bytes("OPERATIONS_MULTISIG")).substring(0, 10);

  const chainId = (await ethers.provider.getNetwork()).chainId;

  const deployL1Calldata = abiEncoder.encode(
    ["(string,uint256,address,uint256)"],
    [[`test-avs-on-fork-venn`, 0, rewardTokenAddress, chainId]],
  );
  const encodedL1Calldata = `0x14d6ec60${deployL1Calldata.slice(2)}`;

  const deployL1Tx = await deployer.sendTransaction({
    to: (await getAddresses()).othenticL1FactoryAddress,
    data: encodedL1Calldata,
    value: ethers.parseEther("10"),
  });

  const deployL1TxReceipt = (await deployL1Tx.wait())!;
  const avsGovernanceEvent = deployL1TxReceipt.logs.find(
    (event) => event.topics[0].toLowerCase() === "0x2006239d40860e48989b35994c91d32a2585bf13018e81a0ac29f226b31cf092",
  )!;
  const avsGovernanceAddress = `0x${avsGovernanceEvent.data.substring(26, 66)}`;
  console.log(`avsGovernanceAddress: ${avsGovernanceAddress}`);

  const avsGovernanceMultisigEvent = deployL1TxReceipt.logs.find(
    (event) =>
      event.address.toLowerCase() === avsGovernanceAddress &&
      event.topics[0].toLowerCase() === "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d" &&
      event.topics[1].substring(0, 10).toLowerCase() === "0xf1688026",
  )!;
  const avsGovernanceMultisigAddress = `0x${avsGovernanceMultisigEvent.topics[2].substring(26, 66)}`;
  console.log(`avsGovernanceMultisigAddress: ${avsGovernanceMultisigAddress}`);

  const deployL2Calldata = abiEncoder.encode(
    ["(string,uint256,address,uint256,uint256)"],
    [[`test-avs-on-fork-venn`, 0, rewardTokenAddress, rewardsOnL2 ? 1 : 0, chainId]],
  );
  const encodedL2Calldata = `0x8a64a2e0${deployL2Calldata.slice(2)}`;
  const deployL2Tx = await deployer.sendTransaction({
    to: (await getAddresses()).othenticL2FactoryAddress,
    data: encodedL2Calldata,
    value: ethers.parseEther("10"),
  });
  const deployL2TxReceipt = (await deployL2Tx.wait())!;
  const attestationCenterEvent = deployL2TxReceipt.logs.find(
    (event) => event.topics[0].toLowerCase() === "0x9ff0203b38b66950dfbb1e5be0fc2dda3dd1386f9edb238b860c0496cddc4b6b",
  )!;
  const attestationCenterAddress = `0x${attestationCenterEvent.data.substring(26, 66)}`;
  console.log(`attestationCenterAddress: ${attestationCenterAddress}`);
  const operationsMultisigEvent = deployL2TxReceipt.logs.find(
    (event) =>
      event.address.toLowerCase() === attestationCenterAddress &&
      event.topics[0].toLowerCase() === "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d" &&
      event.topics[1].substring(0, 10).toLowerCase() === operationsMultisigRole,
  )!;
  const operationsMultisigAddress = `0x${operationsMultisigEvent.topics[2].substring(26, 66)}`;
  console.log(`operationsMultisigAddress: ${operationsMultisigAddress}`);
  const oblsEvent = deployL2TxReceipt.logs.find(
    (event) => event.topics[0].toLowerCase() === "0xff7dfc53b4a07266bc3bbaabbdb9992fc67be75384df0de05509a5cfdae75101",
  )!;
  const oblsAddress = oblsEvent.address;
  console.log(`oblsAddress: ${oblsAddress}`);
  const avsGovernanceAttestationCenterEvent = deployL2TxReceipt.logs.find(
    (event) =>
      event.address.toLowerCase() === attestationCenterAddress &&
      event.topics[0].toLowerCase() === "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d" &&
      event.topics[1].substring(0, 10).toLowerCase() === "0xf1688026",
  )!;
  const avsGovernanceMultisigL2Address = `0x${avsGovernanceAttestationCenterEvent.topics[2].substring(26, 66)}`;
  console.log(`avsGovernanceMultisigL2Address: ${avsGovernanceMultisigL2Address}`);
  console.log(`Deployer address: ${await deployer.getAddress()}`);

  return {
    avsGovernanceAddress,
    attestationCenterAddress,
    oblsAddress,
    operationsMultisigAddress,
    avsGovernanceMultisigAddress,
  };
}

export async function syncWeights(
  syncer: Signer,
  attestationCenterAddress: string,
  avsGovernanceAddress: string,
  oblsAddress: string,
) {
  console.log("Syncing weights");
  const avsGovernance = IAvsGovernance__factory.connect(avsGovernanceAddress, syncer);
  const attestationCenter = IAttestationCenter__factory.connect(attestationCenterAddress, syncer);
  const obls = IOBLS__factory.connect(oblsAddress, syncer);

  const numOfActiveOperators = await avsGovernance.numOfActiveOperators();
  console.log(`Number of active operators: ${numOfActiveOperators}`);

  const increaseVotingPowers = [];
  const decreaseVotingPowers = [];
  for (let i = 1; i <= numOfActiveOperators; i++) {
    if (!(await obls.isActive(i))) {
      console.log(`Operator ${i} is not active`);
      continue;
    }

    const { operator: operatorAddress } = await attestationCenter.getOperatorPaymentDetail(i);
    const l1VotingPower = await avsGovernance.votingPower(operatorAddress);
    const l2VotingPower = await obls.votingPower(i);

    if (l1VotingPower > l2VotingPower) {
      increaseVotingPowers.push({ operatorId: i, votingPower: l1VotingPower - l2VotingPower });
    } else if (l2VotingPower > l1VotingPower) {
      decreaseVotingPowers.push({ operatorId: i, votingPower: l2VotingPower - l1VotingPower });
    }

    console.log(`Operator ${operatorAddress} has voting power: ${l1VotingPower} on L1 and ${l2VotingPower} on L2`);
  }

  if (increaseVotingPowers.length > 0) {
    console.log(
      `Increase voting powers: ${JSON.stringify(increaseVotingPowers, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`,
    );
    await obls.increaseBatchOperatorVotingPower(increaseVotingPowers);
  }
  if (decreaseVotingPowers.length > 0) {
    console.log(
      `Decrease voting powers: ${JSON.stringify(decreaseVotingPowers, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`,
    );
    await obls.decreaseBatchOperatorVotingPower(decreaseVotingPowers);
  }
}

export async function registerOperator(
  operator: BaseWallet,
  messageHandler: Signer,
  operatorPrivateKey: string,
  avsGovernance: IAvsGovernance,
  attestationCenter: IAttestationCenter,
  chainId: bigint,
  omcl: OMCL,
) {
  // register on eigen
  const eigenDelegationManager = IDelegationManager__factory.connect(
    (await getAddresses()).eigenDelegationManagerAddress,
    operator,
  );
  await eigenDelegationManager.registerAsOperator(operator, 0, "");
  console.log(`Registered operator ${await operator.getAddress()} on eigen`);

  // register on avs
  const formattedPrivateKey = operatorPrivateKey.startsWith("0x") ? operatorPrivateKey : `0x${operatorPrivateKey}`;
  const secret = omcl.parseFr(formattedPrivateKey);
  const message = abiEncoder.encode(
    ["address", "address", "uint256"],
    [await operator.getAddress(), await avsGovernance.getAddress(), chainId],
  );
  const messageHash = ethers.keccak256(message);
  const packedKeccak = ethers.keccak256(ethers.toUtf8Bytes("OthenticBLSAuth"));
  const domainBytes = ethers.getBytes(packedKeccak);
  const { signature: signatureMcl } = omcl.sign(messageHash, secret, domainBytes);
  const blsSignature = omcl.g1ToHex(signatureMcl);
  const blsPublicKey = omcl.g2ToHex(omcl.getPubkey(omcl.parseFr(formattedPrivateKey)));
  const eigenManager = IAVSDirectory__factory.connect((await getAddresses()).avsDirectoryAddress, operator);
  const salt = "0x" + Buffer.from(ethers.randomBytes(32)).toString("hex");
  const digestHashArray = await eigenManager.calculateOperatorAVSRegistrationDigestHash(
    operator,
    avsGovernance,
    salt,
    MaxUint256,
  );
  const signature = operator.signingKey.sign(ethers.getBytes(digestHashArray));
  const packedSig = ethers.solidityPacked(["bytes", "bytes", "uint8"], [signature.r, signature.s, signature.v]);
  await avsGovernance.connect(operator).registerAsOperator({
    blsKey: blsPublicKey,
    rewardsReceiver: operator,
    blsRegistrationSignature: { signature: blsSignature },
    authToken: packedSig,
  });
  const operatorWeight = await avsGovernance.connect(operator).votingPower(operator);
  await attestationCenter.connect(messageHandler).registerToNetwork(operator, operatorWeight, blsPublicKey, operator);
  console.log(`Registered operator ${await operator.getAddress()} on avs`);
}

export async function sign(
  signatureRequest: any,
  attestationCenter: string,
  taskPerformerPrivateKey: string,
  operatorPrivateKeys: string[],
) {
  const omcl = await createOMCL();
  const mcls = await Promise.all(
    operatorPrivateKeys.map(async (operatorPrivateKey) => {
      return await getTaskAttestorSignature(signatureRequest, attestationCenter, operatorPrivateKey, omcl);
    }),
  );
  const ecdsa = await getTaskPerformerSignature(signatureRequest, taskPerformerPrivateKey);
  const aggregated = await aggregate(mcls, omcl);

  return {
    mcl: aggregated,
    ecdsa,
  };
}

export async function aggregate(
  signatures: {
    x: bigint;
    y: bigint;
  }[],
  omcl: OMCL,
) {
  const parsedSignatures = signatures.map((sig) => omcl.parseG1([sig.x.toString(16), sig.y.toString(16)]));
  const [x, y] = omcl.g1ToHex(omcl.aggregateRaw(parsedSignatures));
  return { x, y };
}

async function getTaskPerformerSignature(signatureRequest: any, privateKey: string) {
  const wallet = new ethers.Wallet(privateKey);

  const encodedTaskInfo = abiEncoder.encode(
    ["string", "bytes", "address", "uint16"],
    [
      signatureRequest.proofOfTask,
      signatureRequest.data,
      signatureRequest.performerAddress,
      signatureRequest.taskDefinitionId,
    ],
  );

  const hashedTaskInfo = ethers.keccak256(encodedTaskInfo);

  const signedDigest = wallet.signingKey.sign(ethers.getBytes(hashedTaskInfo));
  const packedSig = ethers.solidityPacked(
    ["bytes", "bytes", "uint8"],
    [signedDigest.r, signedDigest.s, signedDigest.v],
  );
  return packedSig;
}

export async function getTaskAttestorSignature(
  signatureRequest: any,
  attestationCenter: string,
  privateKey: string,
  omcl: any,
) {
  const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const secret = omcl.parseFr(formattedPrivateKey);
  const vote = abiEncoder.encode(
    ["string", "bytes", "address", "uint16", "address", "uint256", "bool"],
    [
      signatureRequest.proofOfTask,
      signatureRequest.data,
      signatureRequest.performerAddress,
      signatureRequest.taskDefinitionId,
      attestationCenter,
      signatureRequest.chainId,
      signatureRequest.isApproved,
    ],
  );

  const voteHash = ethers.keccak256(vote);
  const packedKeccak = ethers.keccak256(ethers.toUtf8Bytes("TasksManager"));
  const domainBytes = ethers.getBytes(packedKeccak);
  const { signature: signature } = omcl.sign(voteHash, secret, domainBytes);

  const [x, y] = omcl.g1ToHex(signature);
  return { x: BigInt(x), y: BigInt(y) };
}

export async function createDepositCallHash(
  iface: SampleVennConsumerInterface,
  consumer: Addressable,
  sender: Addressable,
  origin: Addressable,
  value: bigint,
) {
  const depositPayload = iface.encodeFunctionData("deposit()");
  const depositCallHash = ethers.solidityPackedKeccak256(
    ["address", "address", "address", "bytes", "uint256"],
    [await consumer.getAddress(), await sender.getAddress(), await origin.getAddress(), depositPayload, value],
  );
  return depositCallHash;
}

export async function createMulticallCallHash(
  iface: MulticallVennConsumerInterface,
  consumer: Addressable,
  sender: Addressable,
  origin: Addressable,
  value: bigint,
  targets: Addressable[],
  data: string[],
  values: bigint[],
) {
  const resolvedTargets = await Promise.all(targets.map(async (target) => await resolveAddress(target)));
  const multicallPayload = iface.encodeFunctionData("multicall", [resolvedTargets, data, values]);
  const multicallCallHash = ethers.solidityPackedKeccak256(
    ["address", "address", "address", "bytes", "uint256"],
    [await consumer.getAddress(), await sender.getAddress(), await origin.getAddress(), multicallPayload, value],
  );
  return multicallCallHash;
}

// This is important for the task submission to be deterministic
export async function getProofOfTask(txOrigin: SignerWithAddress, policy: Addressable) {
  const txOriginNonce = await txOrigin.provider.getTransactionCount(txOrigin);
  return `${await txOrigin.getAddress()}:${await policy.getAddress()}:${txOriginNonce}`;
}

export async function getSubmitTaskData(
  operatorKeys: string[],
  taskPerformerPrivateKey: string,
  attestationCenter: IAttestationCenter,
  proofOfTask: string,
  data: string,
  taskDefinitionId: number,
  chainId: bigint,
  isApproved: boolean,
) {
  const taskPerformerAddress = await new ethers.Wallet(taskPerformerPrivateKey).getAddress();
  const taskInfo = {
    proofOfTask,
    data,
    taskPerformer: taskPerformerAddress,
    taskDefinitionId,
  };
  const signatureRequest = {
    ...taskInfo,
    performerAddress: taskPerformerAddress,
    chainId,
    isApproved,
  };
  const { mcl, ecdsa } = await sign(
    signatureRequest,
    await attestationCenter.getAddress(),
    taskPerformerPrivateKey,
    operatorKeys,
  );
  const indexes: bigint[] = [];
  for (const key of operatorKeys) {
    const operatorAddress = new ethers.Wallet(key).address;
    indexes.push(await attestationCenter.operatorsIdsByAddress(operatorAddress));
  }
  indexes.sort((a, b) => Number(a - b));
  const taskSubmissionDetails = {
    isApproved: true,
    tpSignature: ecdsa,
    taSignature: [mcl.x, mcl.y] as [bigint, bigint],
    attestersIds: indexes,
  };
  const submitTaskData = attestationCenter.interface.encodeFunctionData(
    "submitTask((string,bytes,address,uint16),(bool,bytes,uint256[2],uint256[]))",
    [taskInfo, taskSubmissionDetails],
  );
  return submitTaskData;
}

export async function getSubmitTasksData(
  operatorKeys: string[],
  taskPerformerPrivateKey: string,
  attestationCenter: IAttestationCenter,
  proofOfTasks: string[],
  data: string[],
  taskDefinitionIds: number[],
  chainId: bigint,
  isApproved: boolean[],
) {
  if (proofOfTasks.length !== data.length || proofOfTasks.length !== taskDefinitionIds.length) {
    throw new Error("Invalid input length");
  }

  const taskPerformerAddress = await new ethers.Wallet(taskPerformerPrivateKey).getAddress();
  const taskInfos = proofOfTasks.map((proofOfTask, index) => ({
    proofOfTask,
    data: data[index],
    taskPerformer: taskPerformerAddress,
    taskDefinitionId: taskDefinitionIds[index],
  }));
  const taskSubmissionDetails = [];
  for (let index = 0; index < taskInfos.length; index++) {
    const taskInfo = taskInfos[index];
    const signatureRequest = {
      ...taskInfo,
      performerAddress: taskPerformerAddress,
      chainId,
      isApproved: isApproved[index],
    };
    const { mcl, ecdsa } = await sign(
      signatureRequest,
      await attestationCenter.getAddress(),
      taskPerformerPrivateKey,
      operatorKeys,
    );
    const indexes: bigint[] = [];
    for (const key of operatorKeys) {
      const operatorAddress = new ethers.Wallet(key).address;
      indexes.push(await attestationCenter.operatorsIdsByAddress(operatorAddress));
    }
    indexes.sort((a, b) => Number(a - b));

    taskSubmissionDetails.push({
      isApproved: isApproved[index],
      tpSignature: ecdsa,
      taSignature: [mcl.x, mcl.y] as [bigint, bigint],
      attestersIds: indexes,
    });
  }
  const submitTasksData = AttestationCenterProxy__factory.createInterface().encodeFunctionData("submitTasks", [
    taskInfos,
    taskSubmissionDetails,
  ]);

  return submitTasksData;
}

export function getErrorBytes(error: string) {
  return "0x08c379a0" + abiEncoder.encode(["string"], [error]).slice(2);
}

export async function getOperatorPaymentDetails(attestationCenter: IAttestationCenter, operatorKeys: string[]) {
  const details = [];
  for (const key of operatorKeys) {
    const operatorWallet = new ethers.Wallet(key, ethers.provider);
    const operatorAddress = await operatorWallet.getAddress();
    const operatorId = await attestationCenter.operatorsIdsByAddress(operatorAddress);
    const paymentDetail = await attestationCenter.getOperatorPaymentDetail(operatorId);
    details.push({
      operatorAddress,
      operatorWallet,
      operatorId,
      paymentDetail,
    });
  }
  return details;
}
