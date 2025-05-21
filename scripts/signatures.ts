import { IAttestationCenter } from "@/generated-types/ethers";
import { getWallet } from "@/test/helpers";
import { createOMCL, OMCL } from "@ironblocks/omcl";
import { AddressLike, BaseWallet, resolveAddress } from "ethers";
import { ethers } from "hardhat";

export type SignatureRequest = {
  taskInfo: IAttestationCenter.TaskInfoStruct;
  chainId: number;
  isApproved: boolean;
};

export async function sign(
  signatureRequest: SignatureRequest,
  attestationCenter: AddressLike,
  operators: BaseWallet[],
  taskPerformer?: BaseWallet,
) {
  const omcl = await createOMCL();

  const mcls = await Promise.all(
    operators.map(async (operator) => {
      return await getTaskAttestorSignature(signatureRequest, attestationCenter, operator, omcl);
    }),
  );
  const ecdsa = await getTaskPerformerSignature(signatureRequest, taskPerformer);
  const aggregated = await aggregate(mcls, omcl);

  return {
    mcl: aggregated,
    ecdsa,
  };
}

async function getTaskAttestorSignature(
  signatureRequest: SignatureRequest,
  attestationCenter: AddressLike,
  operator: BaseWallet,
  omcl: OMCL,
) {
  const secret = omcl.parseFr(operator.privateKey);
  const vote = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "bytes", "address", "uint16", "address", "uint256", "bool"],
    [
      signatureRequest.taskInfo.proofOfTask,
      signatureRequest.taskInfo.data,
      await resolveAddress(signatureRequest.taskInfo.taskPerformer),
      Number(signatureRequest.taskInfo.taskDefinitionId),
      await resolveAddress(attestationCenter),
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

async function aggregate(
  signatures: {
    x: bigint;
    y: bigint;
  }[],
  omcl: OMCL,
) {
  const parsedSignatures = signatures.map((sig) => omcl.parseG1([sig.x.toString(16), sig.y.toString(16)]));
  return omcl.g1ToHex(omcl.aggregateRaw(parsedSignatures));
}

async function getTaskPerformerSignature(signatureRequest: SignatureRequest, taskPerformer?: BaseWallet) {
  const encodedTaskInfo = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "bytes", "address", "uint16"],
    [
      signatureRequest.taskInfo.proofOfTask,
      signatureRequest.taskInfo.data,
      await resolveAddress(signatureRequest.taskInfo.taskPerformer),
      Number(signatureRequest.taskInfo.taskDefinitionId),
    ],
  );

  const hashedTaskInfo = ethers.keccak256(encodedTaskInfo);

  const signingKey = taskPerformer
    ? taskPerformer.signingKey
    : (await getWallet(signatureRequest.taskInfo.taskPerformer)).signingKey;
  const signedDigest = signingKey.sign(ethers.getBytes(hashedTaskInfo));
  const packedSig = ethers.solidityPacked(
    ["bytes", "bytes", "uint8"],
    [signedDigest.r, signedDigest.s, signedDigest.v],
  );

  return packedSig;
}
