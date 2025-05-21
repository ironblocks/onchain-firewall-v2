# AttestationCenterFacet

## Overview

#### License: UNLICENSED

```solidity
contract AttestationCenterFacet is IAttestationCenterFacet
```


## State variables info

### attestationCenter (0xd92807a2)

```solidity
contract IAttestationCenter immutable attestationCenter
```

Get the attestation center


Return values:

| Name | Type                        | Description                 |
| :--- | :-------------------------- | :-------------------------- |
| [0]  | contract IAttestationCenter | attestation center contract |

## Functions info

### constructor

```solidity
constructor(address _attestationCenter)
```


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
