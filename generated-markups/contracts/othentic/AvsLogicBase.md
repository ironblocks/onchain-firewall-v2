# AvsLogicBase

## Overview

#### License: UNLICENSED

```solidity
abstract contract AvsLogicBase is AccessControl, IAvsLogicBase
```


## Constants info

### ADMIN_ROLE (0x75b238fc)

```solidity
bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE")
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

## State variables info

### attestationCenter (0xd92807a2)

```solidity
address attestationCenter
```

Get the attestation center address.


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | address | The address of the attestation center. |

## Modifiers info

### onlyAttestationCenter

```solidity
modifier onlyAttestationCenter()
```


## Functions info

### setAttestationCenter (0x11c69311)

```solidity
function setAttestationCenter(
    address _attestationCenter
) external onlyRole(ADMIN_ROLE)
```

Set the attestation center address.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |
