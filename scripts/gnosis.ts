import { GnosisSafe } from "@/generated-types/ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { AddressLike, BigNumberish } from "ethers";
import { ethers } from "hardhat";

const EIP712_SAFE_TX_TYPE = {
  // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
  SafeTx: [
    { type: "address", name: "to" },
    { type: "uint256", name: "value" },
    { type: "bytes", name: "data" },
    { type: "uint8", name: "operation" },
    { type: "uint256", name: "safeTxGas" },
    { type: "uint256", name: "baseGas" },
    { type: "uint256", name: "gasPrice" },
    { type: "address", name: "gasToken" },
    { type: "address", name: "refundReceiver" },
    { type: "uint256", name: "nonce" },
  ],
};

interface Signature {
  signer: string;
  data: string;
  dynamic?: boolean;
}

export interface SafeTx {
  to: AddressLike;
  value?: BigNumberish;
  data: string;
  operation?: BigNumberish;
  safeTxGas?: BigNumberish;
  baseGas?: BigNumberish;
  gasPrice?: BigNumberish;
  gasToken?: string;
  refundReceiver?: string;
  nonce?: BigNumberish;
}

function buildSignatureBytes(signatures: Signature[]) {
  const SIGNATURE_LENGTH_BYTES = 65;
  signatures.sort((left, right) => left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()));

  let signatureBytes = "0x";
  let dynamicBytes = "";
  for (const sig of signatures) {
    if (sig.dynamic) {
      const dynamicPartPosition = (signatures.length * SIGNATURE_LENGTH_BYTES + dynamicBytes.length / 2)
        .toString(16)
        .padStart(64, "0");
      const dynamicPartLength = (sig.data.slice(2).length / 2).toString(16).padStart(64, "0");
      const staticSignature = `${sig.signer.slice(2).padStart(64, "0")}${dynamicPartPosition}00`;
      const dynamicPartWithLength = `${dynamicPartLength}${sig.data.slice(2)}`;

      signatureBytes += staticSignature;
      dynamicBytes += dynamicPartWithLength;
    } else {
      signatureBytes += sig.data.slice(2);
    }
  }

  return signatureBytes + dynamicBytes;
}

async function safeSignTypedData(
  signer: SignerWithAddress,
  safe: GnosisSafe,
  safeTx: SafeTx,
  chainId?: number,
): Promise<Signature> {
  if (!chainId && !signer.provider) {
    throw Error("Provider required to retrieve chainId");
  }
  const cid = chainId || (await signer.provider!.getNetwork()).chainId;
  const signerAddress = await signer.getAddress();
  return {
    signer: signerAddress,
    data: await signer.signTypedData(
      { verifyingContract: await safe.getAddress(), chainId: cid },
      EIP712_SAFE_TX_TYPE,
      safeTx,
    ),
  };
}

export async function getSafeTxSignatures(safe: GnosisSafe, tx: SafeTx, signers: SignerWithAddress[] = []) {
  if (!signers.length) {
    const signersList = await safe.getOwners();
    signers = await Promise.all(signersList.map((signer) => ethers.getSigner(signer)));
  }

  const safeTx = {
    to: await ethers.resolveAddress(tx.to),
    value: tx.value || 0,
    data: tx.data || "0x",
    operation: tx.operation || 0,
    safeTxGas: tx.safeTxGas || 0,
    baseGas: tx.baseGas || 0,
    gasPrice: tx.gasPrice || 0,
    gasToken: tx.gasToken || ethers.ZeroAddress,
    refundReceiver: tx.refundReceiver || ethers.ZeroAddress,
    nonce: tx.nonce || (await safe.nonce()),
  };
  const sigs = await Promise.all(signers.map((signer) => safeSignTypedData(signer, safe, safeTx)));
  const signatureBytes = buildSignatureBytes(sigs);
  return signatureBytes;
}

export async function execSafeTx(safe: GnosisSafe, tx: SafeTx, signers: SignerWithAddress[] = []) {
  if (!signers.length) {
    const signersList = await safe.getOwners();
    signers = await Promise.all(signersList.map((signer) => ethers.getSigner(signer)));
  }

  const safeTx = {
    to: await ethers.resolveAddress(tx.to),
    value: tx.value || 0,
    data: tx.data || "0x",
    operation: tx.operation || 0,
    safeTxGas: tx.safeTxGas || 0,
    baseGas: tx.baseGas || 0,
    gasPrice: tx.gasPrice || 0,
    gasToken: tx.gasToken || ethers.ZeroAddress,
    refundReceiver: tx.refundReceiver || ethers.ZeroAddress,
    nonce: tx.nonce || (await safe.nonce()),
  };
  const sigs = await Promise.all(signers.map((signer) => safeSignTypedData(signer, safe, safeTx)));
  const signatureBytes = buildSignatureBytes(sigs);
  return safe.execTransaction(
    safeTx.to,
    safeTx.value,
    safeTx.data,
    safeTx.operation,
    safeTx.safeTxGas,
    safeTx.baseGas,
    safeTx.gasPrice,
    safeTx.gasToken,
    safeTx.refundReceiver,
    signatureBytes,
  );
}

export async function getSafeExecTxArgs(safe: GnosisSafe, tx: SafeTx, signers: SignerWithAddress[]) {
  const safeTx = {
    to: tx.to,
    value: tx.value || 0,
    data: tx.data || "0x",
    operation: tx.operation || 0,
    safeTxGas: tx.safeTxGas || 0,
    baseGas: tx.baseGas || 0,
    gasPrice: tx.gasPrice || 0,
    gasToken: tx.gasToken || ethers.ZeroAddress,
    refundReceiver: tx.refundReceiver || ethers.ZeroAddress,
    nonce: tx.nonce || (await safe.nonce()),
  };
  const sigs = await Promise.all(signers.map((signer: any) => safeSignTypedData(signer, safe, safeTx)));
  const signatureBytes = buildSignatureBytes(sigs);
  return {
    ...safeTx,
    signatures: signatureBytes,
  };
}
