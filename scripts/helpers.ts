import { BigNumberish, formatUnits, parseUnits } from "ethers";

export function getFeePercentage(percentage: BigNumberish) {
  return parseUnits(percentage.toString(), 6 - 2);
}

export function getFeeValue(value: BigNumberish) {
  return formatUnits(value.toString(), 6);
}

export enum OperatorType {
  ATTESTER = 0,
  AGGREGATOR = 1,
  PERFORMER = 2,
}
