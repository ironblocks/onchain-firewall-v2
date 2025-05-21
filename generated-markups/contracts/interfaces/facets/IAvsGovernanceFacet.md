# IAvsGovernanceFacet

## Overview

#### License: UNLICENSED

```solidity
interface IAvsGovernanceFacet
```


## Functions info

### votingPowers (0x1152cd65)

```solidity
function votingPowers(
    address[] memory operatorIds
) external view returns (uint256[] memory _votingPowers)
```

Get the voting power of the operators


Parameters:

| Name        | Type      | Description                                  |
| :---------- | :-------- | :------------------------------------------- |
| operatorIds | address[] | The operator IDs to get the voting power of  |


Return values:

| Name          | Type      | Description                        |
| :------------ | :-------- | :--------------------------------- |
| _votingPowers | uint256[] | The voting powers of the operators |

### avsGovernance (0x8d98e579)

```solidity
function avsGovernance() external view returns (IAvsGovernance)
```

Get the avs governance


Return values:

| Name | Type                    | Description             |
| :--- | :---------------------- | :---------------------- |
| [0]  | contract IAvsGovernance | avs governance contract |
