import { createOMCL, OMCL } from "@ironblocks/omcl";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Addressable, MaxUint256, ZeroAddress } from "ethers";
import { ethers } from "hardhat";

import GnosisSafeJson from "@/externalArtifacts/gnosis-safe/GnosisSafe.json";
import {
  AttestationCenterProxy,
  Firewall,
  FirewallModule,
  GnosisSafe,
  IAccessControl__factory,
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
  L1AvsFactory,
  L1AvsFactory__factory,
  L2AvsFactory,
  L2AvsFactory__factory,
  GnosisSafe__factory,
  Ownable__factory,
  TransientApprovedCallsPolicy__factory,
  VennAvsLogic,
  VennToken,
} from "@/generated-types/ethers";
import { getAddresses, isChainSupported } from "@/scripts/addresses";
import {
  deployAttestationCenterProxy,
  deployFeePool,
  deployFirewall,
  deployFirewallModule,
  deployGnosisSafe,
  deployMulticallVennConsumer,
  deployOperatorRegistry,
  deployPolicyDeployer,
  deployProtocolRegistry,
  deploySampleVennConsumer,
  deployTransientApprovedCallsPolicyFactory,
  deployVennAvsLogic,
  deployVennFeeCalculator,
  deployVennToken,
  deployVennVaultL2,
} from "@/test/fixtures";
import { getWallets, impersonateAccounts } from "@/test/helpers";
import { defaultProtocolRegistryInitData } from "@/test/unit/ProtocolRegisrty.test";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BaseWallet } from "ethers";
import { execSafeTx } from "../../scripts/gnosis";

export async function deployBaseFixture() {
  const amounts = [ethers.parseEther("250"), ethers.parseEther("100"), ethers.parseEther("150")];
  const operators = await getWallets(3);

  const deployedContracts = await deployBaseContracts(operators, amounts);
  return {
    ...deployedContracts,
    operators,
    amounts,
  };
}

export async function deployLargeOperatorAmountFixture() {
  const operators = await getWallets(50);
  const amounts = [...Array(50).keys()].map(() => ethers.parseEther("100"));

  const deployedContracts = await deployBaseContracts(operators, amounts);
  return {
    ...deployedContracts,
    amounts,
    operators,
  };
}

export async function deployMulticallFixture() {
  const baseFixture = await loadFixture(deployBaseFixture);
  const { firewall, firewallModule, vennAvsLogic, attestationCenterProxy, gnosisSafe, deployer } = baseFixture;
  const { multicallVennConsumer, approvedCallsPolicy: approvedCallsPolicy2 } = await setupMulticallVennConsumer(
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

export async function deployBaseContracts(operators: BaseWallet[], operatorWeights: bigint[]) {
  const omcl = await createOMCL();

  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  if (!(await isChainSupported(chainId.toString()))) {
    throw new Error(`This script is only supported on current chain ${chainId}.\nHolesky is recommended.`);
  }

  const deployer = (await ethers.getSigners())[0];

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
    operatorRegistry,
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
  await avsGovernance.connect(avsGovernanceMultisig).setSupportedStakingContracts([
    {
      stakingContract: vennStakingStrategyAddress,
      sharedSecurityProvider: 0,
    },
  ]);
  console.log("Set supported strategies in avs governance");

  const attestationCenter = IAttestationCenter__factory.connect(attestationCenterAddress, deployer);
  const batchPaymentRequestFlow = ethers.keccak256(ethers.toUtf8Bytes("BATCH_PAYMENT_REQUEST_FLOW")).substring(0, 10);
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

  await IOBLS__factory.connect(attestationCenterAddress, deployer).setOblsSharesSyncer(deployer);
  console.log("Set obls shares syncer");

  for (let i = 0; i < operators.length; i++) {
    console.log(`Registering operator ${i + 1} of ${operators.length}`);
    await registerOperator(operators[i], deployer, avsGovernance, attestationCenter, chainId, omcl);
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
    operatorRegistry,
    obls: IOBLS__factory.connect(oblsAddress, deployer),
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

export async function setupGnosisSafe(deployer: SignerWithAddress, firewall: Firewall) {
  console.log("Deploying GnosisSafe");
  const { gnosisSafe } = await deployGnosisSafe(deployer);
  console.log(" -> GnosisSafe deployed at: ", await gnosisSafe.getAddress());

  console.log("Deploying FirewallModule");
  const { firewallModule } = await deployFirewallModule(gnosisSafe);
  console.log(" -> FirewallModule deployed at: ", await firewallModule.getAddress());

  await execSafeTx(gnosisSafe, {
    to: firewallModule,
    data: firewallModule.interface.encodeFunctionData("setFirewallsStatus", [[await firewall.getAddress()], true]),
  });

  return { gnosisSafe, firewallModule };
}

export async function deployVennBaseContracts(deployer: SignerWithAddress, attestationCenterAddress: string) {
  const MAX_SUBSCRIBED_OPERATORS_COUNT = 10;

  const attestationCenter = IAttestationCenter__factory.connect(attestationCenterAddress, deployer);

  console.log(`Deploying Firewall`);
  const { firewall } = await deployFirewall();
  console.log(` -> Firewall deployed at: ${await firewall.getAddress()}`);

  console.log(`Deploying ProtocolRegistry`);
  const { protocolRegistry } = await deployProtocolRegistry(
    deployer,
    defaultProtocolRegistryInitData(attestationCenter, deployer),
  );
  console.log(` -> ProtocolRegistry deployed at: ${await protocolRegistry.getAddress()}`);

  console.log(`Deploying OperatorRegistry`);
  const { operatorRegistry } = await deployOperatorRegistry(
    attestationCenter,
    MAX_SUBSCRIBED_OPERATORS_COUNT,
    deployer,
  );
  console.log(` -> OperatorRegistry deployed at: ${await operatorRegistry.getAddress()}`);

  console.log(`Deploying VennFeeCalculator`);
  const { vennFeeCalculator } = await deployVennFeeCalculator(operatorRegistry, deployer);
  console.log(` -> VennFeeCalculator deployed at: ${await vennFeeCalculator.getAddress()}`);

  await vennFeeCalculator.setTaskDefinitionFee(0, ethers.parseEther("0.01"));
  console.log(`Set task definition fee for id 0 to 0.01 ETH`);

  console.log(`Deploying FeePool`);
  const { feePool } = await deployFeePool(protocolRegistry, vennFeeCalculator, deployer);
  console.log(` -> FeePool deployed at: ${await feePool.getAddress()}`);

  console.log(`Deploying VennAvsLogic`);
  const { vennAvsLogic } = await deployVennAvsLogic(attestationCenter, feePool, protocolRegistry, deployer);
  console.log(` -> VennAvsLogic deployed at: ${await vennAvsLogic.getAddress()}`);

  console.log(`Deploying AttestationCenterProxy`);
  const { attestationCenterProxy } = await deployAttestationCenterProxy(feePool, attestationCenter, deployer);
  console.log(` -> AttestationCenterProxy deployed at: ${await attestationCenterProxy.getAddress()}`);

  await vennFeeCalculator.grantRole(await vennFeeCalculator.FEE_POOL_ROLE(), feePool);

  await attestationCenter.setAvsLogic(vennAvsLogic);

  await feePool.grantRole(ethers.keccak256(ethers.toUtf8Bytes("FEE_CLAIMER_ROLE")), vennAvsLogic);
  await feePool.grantRole(ethers.keccak256(ethers.toUtf8Bytes("SIGNER_ROLE")), vennAvsLogic);

  const { gnosisSafe, firewallModule } = await setupGnosisSafe(deployer, firewall);

  await firewall.transferOwnership(gnosisSafe);
  await execSafeTx(gnosisSafe, {
    to: firewall,
    data: firewall.interface.encodeFunctionData("acceptOwnership"),
  });
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
    operatorRegistry,
  };
}

export async function deployVennTokenBase(deployer: SignerWithAddress) {
  console.log(`Deploying VennToken`);
  const { vennToken } = await deployVennToken(ethers.parseEther("1000000000"));
  console.log(` -> VennToken deployed at: ${await vennToken.getAddress()}`);

  console.log(`Deploying VennVaultL2`);
  const { vennVaultL2 } = await deployVennVaultL2(vennToken, ZeroAddress, ZeroAddress, true, deployer);
  console.log(` -> VennVaultL2 deployed at: ${await vennVaultL2.getAddress()}`);

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
  const { transientApprovedCallsPolicyFactory } = await deployTransientApprovedCallsPolicyFactory();
  console.log(
    ` -> TransientApprovedCallsPolicyFactory deployed at: ${await transientApprovedCallsPolicyFactory.getAddress()}`,
  );

  console.log(`Deploying PolicyDeployer`);
  const { policyDeployer } = await deployPolicyDeployer(firewallModule, deployer);
  console.log(` -> PolicyDeployer deployed at: ${await policyDeployer.getAddress()}`);

  await policyDeployer.setFactoryStatuses([transientApprovedCallsPolicyFactory], [true]);
  await execSafeTx(gnosisSafe, {
    to: firewallModule,
    data: firewallModule.interface.encodeFunctionData("setDeployersStatus", [
      [await policyDeployer.getAddress()],
      true,
    ]),
  });

  console.log(`Deploying TransientApprovedCallsPolicy`);
  const [approvedCallsPolicyAddress] = await policyDeployer.deployPolicies.staticCall(
    firewall,
    [transientApprovedCallsPolicyFactory],
    [
      ethers.AbiCoder.defaultAbiCoder().encode(
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
      ethers.AbiCoder.defaultAbiCoder().encode(
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

export async function setupSampleVennConsumer(
  deployer: SignerWithAddress,
  firewall: Firewall,
  gnosisSafe: GnosisSafe,
  firewallModule: FirewallModule,
  vennAvsLogic: VennAvsLogic,
  attestationCenterProxy: AttestationCenterProxy,
) {
  console.log(`Deploying SampleVennConsumer`);
  const { sampleVennConsumer } = await deploySampleVennConsumer(firewall);
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
  await sampleVennConsumer.setAllowNonZeroUserNativeFee(true);

  await firewall.addGlobalPolicy(sampleVennConsumer, approvedCallsPolicy);

  return {
    sampleVennConsumer,
    approvedCallsPolicy,
  };
}

export async function setupMulticallVennConsumer(
  deployer: SignerWithAddress,
  firewall: Firewall,
  gnosisSafe: GnosisSafe,
  firewallModule: FirewallModule,
  vennAvsLogic: VennAvsLogic,
  attestationCenterProxy: AttestationCenterProxy,
) {
  console.log(`Deploying MulticallVennConsumer`);
  const { multicallVennConsumer } = await deployMulticallVennConsumer(firewall);
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
  await multicallVennConsumer.setAllowNonZeroUserNativeFee(true);

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
    operatorRegistry,
  } = await deployVennBaseContracts(deployer, attestationCenterAddress);

  const { sampleVennConsumer, approvedCallsPolicy } = await setupSampleVennConsumer(
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
    operatorRegistry,
  };
}

export async function deployOthentic(deployer: SignerWithAddress, rewardTokenAddress: string, rewardsOnL2: boolean) {
  const chainId = (await ethers.provider.getNetwork()).chainId;

  const l1Factory = new ethers.Contract(
    (await getAddresses()).othenticL1FactoryAddress,
    L1AvsFactory__factory.abi,
    deployer,
  ) as any as L1AvsFactory;

  const { avsGovernance: avsGovernanceAddress } = await l1Factory.deploy.staticCall(
    {
      avsName: "test-avs-on-fork-venn",
      avsGovernanceMultisigOwner: deployer,
      erc20Token: rewardTokenAddress,
      l2ChainIds: [chainId],
    },
    { value: ethers.parseEther("10") },
  );
  await l1Factory.deploy(
    {
      avsName: "test-avs-on-fork-venn",
      avsGovernanceMultisigOwner: deployer,
      erc20Token: rewardTokenAddress,
      l2ChainIds: [chainId],
    },
    { value: ethers.parseEther("10") },
  );

  const l2Factory = new ethers.Contract(
    (await getAddresses()).othenticL2FactoryAddress,
    L2AvsFactory__factory.abi,
    deployer,
  ) as any as L2AvsFactory;

  const { obls: oblsAddress, attestationCenter: attestationCenterAddress } = await l2Factory[
    "deploy((string,address,address,bool,uint64))"
  ].staticCall(
    {
      avsName: "test-avs-on-fork-venn",
      avsGovernanceMultisigOwner: deployer,
      erc20Token: rewardTokenAddress,
      isRewardsOnL2: rewardsOnL2,
      l1ChainId: chainId,
    },
    { value: ethers.parseEther("10") },
  );
  const tx = await l2Factory["deploy((string,address,address,bool,uint64))"](
    {
      avsName: "test-avs-on-fork-venn",
      avsGovernanceMultisigOwner: deployer,
      erc20Token: rewardTokenAddress,
      isRewardsOnL2: rewardsOnL2,
      l1ChainId: chainId,
    },
    { value: ethers.parseEther("10") },
  );

  const operationsMultisigRole = ethers.keccak256(ethers.toUtf8Bytes("OPERATIONS_MULTISIG")).substring(0, 10);
  const operationsMultisigEvent = (await tx.wait())!.logs.find(
    (event) =>
      event.address.toLowerCase() === attestationCenterAddress.toLowerCase() &&
      event.topics[0].toLowerCase() === IAccessControl__factory.createInterface().getEvent("RoleGranted").topicHash &&
      event.topics[1].substring(0, 10).toLowerCase() === operationsMultisigRole,
  )!;
  const operationsMultisigAddress = `0x${operationsMultisigEvent.topics[2].substring(26, 66)}`;

  return {
    avsGovernanceAddress,
    attestationCenterAddress,
    oblsAddress,
    operationsMultisigAddress,
    avsGovernanceMultisigAddress: await deployer.getAddress(),
  };
}

export async function syncWeights(
  syncer: SignerWithAddress,
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
  messageHandler: SignerWithAddress,
  avsGovernance: IAvsGovernance,
  attestationCenter: IAttestationCenter,
  chainId: number,
  omcl: OMCL,
) {
  // register on eigen
  const eigenDelegationManager = IDelegationManager__factory.connect(
    (await getAddresses()).eigenDelegationManagerAddress,
    operator,
  );
  await eigenDelegationManager.registerAsOperator(ethers.ZeroAddress, 0, "");
  console.log(`Registered operator ${await operator.getAddress()} on eigen`);

  // register on avs
  const secret = omcl.parseFr(operator.privateKey);
  const message = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256"],
    [await operator.getAddress(), await avsGovernance.getAddress(), chainId],
  );
  const messageHash = ethers.keccak256(message);
  const domainBytes = ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes("OthenticBLSAuth")));
  const { signature: signatureMcl } = omcl.sign(messageHash, secret, domainBytes);

  const blsSignature = omcl.g1ToHex(signatureMcl);
  const blsPublicKey = omcl.g2ToHex(omcl.getPubkey(secret));

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

  await avsGovernance.connect(operator).registerOperatorToEigenLayer(
    {
      signature: packedSig,
      salt: salt,
      expiry: MaxUint256,
    },
    "0x",
  );

  await avsGovernance.connect(operator).registerAsOperator({
    blsKey: blsPublicKey,
    rewardsReceiver: operator,
    blsRegistrationSignature: { signature: blsSignature },
    authToken: "0x",
  });

  const operatorWeight = await avsGovernance.connect(operator).votingPower(operator);

  await attestationCenter.connect(messageHandler).registerToNetwork(operator, operatorWeight, blsPublicKey, operator);

  console.log(`Registered operator ${await operator.getAddress()} on avs`);
}

export async function deployGnosisSafeViaFactory(
  owner: SignerWithAddress,
  factoryAddress?: string,
  singletonAddress?: string,
) {
  factoryAddress = factoryAddress ?? (await getAddresses()).gnosisSafeFactoryAddress;
  singletonAddress = singletonAddress ?? (await getAddresses()).gnosisSafeSingletonAddress;
  const gnosisSafeInterface = new ethers.Interface(GnosisSafeJson.abi);
  const gnosisSafeFactoryInterface = new ethers.Interface([
    "function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (address proxy)",
  ]);
  const setupData = gnosisSafeInterface.encodeFunctionData("setup", [
    [await owner.getAddress()],
    1,
    ZeroAddress,
    "0x",
    ZeroAddress,
    ZeroAddress,
    0,
    ZeroAddress,
  ]);
  const nonce = await ethers.provider.getTransactionCount(await owner.getAddress());
  const deployData = gnosisSafeFactoryInterface.encodeFunctionData("createProxyWithNonce", [
    singletonAddress,
    setupData,
    nonce,
  ]);
  const deployTx = { to: factoryAddress, data: deployData, from: await owner.getAddress() };
  const expectedGnosisSafeAddress = `0x${(await ethers.provider.call(deployTx)).slice(26)}`;
  await (await owner.sendTransaction(deployTx)).wait();
  const gnosisSafe = GnosisSafe__factory.connect(expectedGnosisSafeAddress, owner);

  return { gnosisSafe };
}
