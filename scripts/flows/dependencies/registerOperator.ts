import dotenv from "dotenv";
import { eigenLayerContracts } from "@/deploy/data/othenticConfig";
import { IAVSDirectory__factory, IAvsGovernance, IStrategyManager } from "@/generated-types/ethers";
import { getAddresses } from "@/scripts/addresses";
import { createOMCL } from "@ironblocks/omcl";
import { Contract, MaxUint256, Wallet, ZeroAddress } from "ethers";
import { ethers } from "hardhat";
import { getDeployments } from "../../../deploy/data/utils";
dotenv.config();

const CONFIRMATION_BLOCKS = 1;

const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
if (!operatorPrivateKey) {
  throw new Error("OPERATOR_PRIVATE_KEY is not set");
}

const operator = new Wallet(operatorPrivateKey, ethers.provider);

const amountToDepositIntoEigenLayerStrategy = ethers.parseEther("1");

async function main() {
  console.log(`Operator balance: ${await ethers.provider.getBalance(operator.address)}`);

  const [deployer] = await ethers.getSigners();
  const vennToken = await ethers.getContractAt("VennToken", (await getDeployments()).L1.VennTokenL1);

  const deployerVennTokenBalance = await vennToken.balanceOf(deployer);
  console.log(`Deployer Venn token balance: ${ethers.formatEther(deployerVennTokenBalance)}`);

  const operatorVennTokenBalance = await vennToken.balanceOf(operator);

  if (
    operatorVennTokenBalance < amountToDepositIntoEigenLayerStrategy &&
    deployerVennTokenBalance > amountToDepositIntoEigenLayerStrategy
  ) {
    console.log(`Transferring ${amountToDepositIntoEigenLayerStrategy} Venn tokens to operator`);
    await (await vennToken.transfer(operator.address, amountToDepositIntoEigenLayerStrategy)).wait(CONFIRMATION_BLOCKS);
    console.log(`Operator Venn token balance: ${ethers.formatEther(await vennToken.balanceOf(operator.address))}`);
  }

  const eigenLayerConfig = await getEigenLayerConfig();

  const delegationManager = await ethers.getContractAt(
    "IDelegationManager",
    eigenLayerConfig.delegationManager,
    operator,
  );
  const strategyManager = await ethers.getContractAt("IStrategyManager", eigenLayerConfig.strategyManager, operator);
  const avsDirectory = await ethers.getContractAt("IAVSDirectory", eigenLayerConfig.avsDirectory, operator);
  const avsGovernance = await ethers.getContractAt(
    "IAvsGovernance",
    (await getDeployments()).L1.AvsGovernance,
    operator,
  );

  if (await delegationManager.isOperator(operator)) {
    console.log(`Operator ${operator.address} is already registered on EigenLayer`);
  } else {
    await registerOperatorToEigenLayer(delegationManager);
  }

  if ((await avsDirectory.avsOperatorStatus(avsGovernance, operator)) != BigInt(0)) {
    console.log(`Operator ${operator.address} is already registered on AVS on EigenLayer`);
  } else {
    await connectAvsToEigenLayer(avsGovernance);
  }

  if (amountToDepositIntoEigenLayerStrategy > 0) {
    await depositIntoEigenLayerStrategy(
      strategyManager,
      (await getDeployments()).L1.VennStakingStrategy,
      amountToDepositIntoEigenLayerStrategy,
    );
  }

  if (await avsGovernance.isOperatorRegistered(operator)) {
    console.log(`Operator ${operator.address} is already registered on AVS`);
  } else {
    await registerOperatorToAvs(avsGovernance);
  }

  await infoVotingPower(avsGovernance);

  console.log(`Operator ${operator.address} registered`);
}

async function getEigenLayerConfig() {
  const chainId = await getChainId();

  const config = eigenLayerContracts[chainId];

  if (!config) {
    throw new Error("No EigenLayer config found");
  }

  return config;
}

async function registerOperatorToEigenLayer(delegationManager: any) {
  const urlInIpfs = "";
  console.log(`Registering operator ${operator.address} to EigenLayer`);
  const tx = await delegationManager["registerAsOperator(address,uint32,string)"](ZeroAddress, 0, urlInIpfs);
  await tx.wait(CONFIRMATION_BLOCKS);
}

async function depositIntoEigenLayerStrategy(
  strategyManager: IStrategyManager,
  eigenLayerStrategyAddress: string,
  amount: bigint,
) {
  const strategy = await ethers.getContractAt("IStrategy", eigenLayerStrategyAddress, operator);
  const tokenAddress = await strategy.underlyingToken();

  console.log(`Increasing allowance for ${tokenAddress}`);
  await increaseAllowanceIfNeeded(strategyManager, tokenAddress, amount);

  console.log(`Depositing ${amount} into EigenLayer strategy`);
  const tx = await strategyManager.depositIntoStrategy(eigenLayerStrategyAddress, tokenAddress, amount);
  await tx.wait(CONFIRMATION_BLOCKS);
}

async function increaseAllowanceIfNeeded(strategyManager: IStrategyManager, tokenAddress: string, amount: bigint) {
  const token = await ethers.getContractAt("IERC20", tokenAddress, operator);

  const allowance = await token.allowance(operator, strategyManager);
  if (allowance < amount) {
    console.log(`Approving ${amount} for ${await strategyManager.getAddress()}`);
    const tx = await token.approve(strategyManager, amount);
    await tx.wait(CONFIRMATION_BLOCKS);
  }
}

async function registerOperatorToAvs(avsGovernance: IAvsGovernance) {
  await registerToAVS(avsGovernance);
}

async function registerToAVS(avsGovernance: IAvsGovernance) {
  const omcl = await createOMCL();
  const chainId = await getChainId();
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

  console.log(`Registering operator ${operator.address} to AVS`);
  const tx = await avsGovernance.registerAsOperator({
    blsKey: blsPublicKey,
    rewardsReceiver: operator,
    blsRegistrationSignature: { signature: blsSignature },
    authToken: packedSig,
  });
  await tx.wait(CONFIRMATION_BLOCKS);
}

async function connectAvsToEigenLayer(avsGovernance: IAvsGovernance) {
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

  const expiry = ethers.MaxUint256;

  console.log(`Connecting AVS to EigenLayer`);
  const tx = await avsGovernance.registerOperatorToEigenLayer(
    {
      signature: packedSig,
      salt,
      expiry,
    },
    "0x",
  );
  await tx.wait(CONFIRMATION_BLOCKS);
}

async function infoVotingPower(avsGovernance: IAvsGovernance) {
  const votingPower = await avsGovernance.votingPower(operator);
  console.log(
    `Voting power of operator ${operator.address} on AVS ${await avsGovernance.getAddress()} is ${votingPower}`,
  );
}

async function getChainId() {
  const network = await ethers.provider.getNetwork();
  let chainId = network.chainId.toString();

  return chainId;
}

main().catch(console.error);

// npx hardhat run scripts/flows/dependencies/registerOperator.ts --network localhost
