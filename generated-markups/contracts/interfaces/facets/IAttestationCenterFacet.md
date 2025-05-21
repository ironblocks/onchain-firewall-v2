# IAttestationCenterFacet

## Overview

#### License: UNLICENSED

```solidity
interface IAttestationCenterFacet
```


## Functions info

### getOperatorAddressByIds (0xef4db95c)

```solidity
function getOperatorAddressByIds(
    uint256[] memory operatorIds
) external view returns (address[] memory operatorAddresses)
```

Get the operator address by IDs


Parameters:

| Name        | Type      | Description                             |
| :---------- | :-------- | :-------------------------------------- |
| operatorIds | uint256[] | The operator IDs to get the address of  |


Return values:

| Name              | Type      | Description                    |
| :---------------- | :-------- | :----------------------------- |
| operatorAddresses | address[] | The addresses of the operators |

### attestationCenter (0xd92807a2)

```solidity
function attestationCenter() external view returns (IAttestationCenter)
```

Get the attestation center


Return values:

| Name | Type                        | Description                 |
| :--- | :-------------------------- | :-------------------------- |
| [0]  | contract IAttestationCenter | attestation center contract |
