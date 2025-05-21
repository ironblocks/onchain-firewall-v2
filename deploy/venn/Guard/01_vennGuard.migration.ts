import { FeePool__factory, ProtocolRegistry__factory, VennGuard__factory } from "@/generated-types/ethers";
import { getL2Deployments } from "../../data/utils";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { parseEther, formatEther } from "ethers";

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const MULTISEND_ADDRESS = process.env.MULTISEND_ADDRESS;
if (!MULTISEND_ADDRESS) {
  throw new Error("MULTISEND_ADDRESS is not set");
}
if (!SAFE_ADDRESS) {
  throw new Error("SAFE_ADDRESS is not set");
}

const BYPASS_GUARD_WAIT_TIME = Number(process.env.BYPASS_GUARD_WAIT_TIME) || 60 * 60 * 24;
const PREPAID_FUND_AMOUNT_ETH = parseEther(process.env.PREPAID_FUND_AMOUNT_ETH || "0");

export = async (deployer: Deployer) => {
  const l2Deployments = await getL2Deployments();
  const deployerAddress = await (await deployer.getSigner()).getAddress();

  const protocolRegistry = await deployer.deployed(ProtocolRegistry__factory, l2Deployments.ProtocolRegistry);
  const feePool = await deployer.deployed(FeePool__factory, l2Deployments.FeePool);

  const vennGuard = await deployer.deploy(VennGuard__factory, [
    l2Deployments.AttestationCenterProxy,
    MULTISEND_ADDRESS,
    SAFE_ADDRESS,
    BYPASS_GUARD_WAIT_TIME,
  ]);
  console.log("VennGuard deployed with args:");
  console.log(`attestationCenterProxy: ${l2Deployments.AttestationCenterProxy}`);
  console.log(`multisendContract: ${MULTISEND_ADDRESS}`);
  console.log(`safe: ${SAFE_ADDRESS}`);
  console.log(`bypassGuardWaitTime: ${BYPASS_GUARD_WAIT_TIME}`);

  await vennGuard.grantRole(await vennGuard.ADMIN_ROLE(), deployerAddress);
  await vennGuard.grantRole(await vennGuard.SIGNER_ROLE(), l2Deployments.VennAvsLogic);
  console.log("VennGuard roles granted:");
  console.log(`ADMIN_ROLE: ${deployerAddress}`);
  console.log(`SIGNER_ROLE: ${l2Deployments.VennAvsLogic}`);

  await protocolRegistry.registerProtocol(vennGuard, `https://venn-protocol.com/${await vennGuard.getAddress()}`);
  console.log("VennGuard protocol registered");
  await protocolRegistry.subscribeSubnet(vennGuard, 1, []);
  console.log("VennGuard subscribed to subnet 1");

  if (PREPAID_FUND_AMOUNT_ETH !== BigInt(0)) {
    await feePool.depositNativeForPolicy(vennGuard, { value: PREPAID_FUND_AMOUNT_ETH });
    console.log(`VennGuard funded with ${formatEther(PREPAID_FUND_AMOUNT_ETH)} ETH`);
  }

  Reporter.reportContracts(["VennGuard", await vennGuard.getAddress()]);
};

// npx hardhat migrate --namespace "venn/Guard" --network holesky --verify --only 1
