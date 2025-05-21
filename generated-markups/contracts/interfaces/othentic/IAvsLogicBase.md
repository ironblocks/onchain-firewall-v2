# IAvsLogicBase

## Overview

#### License: UNLICENSED

```solidity
interface IAvsLogicBase is IAvsLogic
```

Interface for the AvsLogicBase contract.
## Events info

### AttestationCenterUpdated

```solidity
event AttestationCenterUpdated(address newAttestationCenter)
```

Emitted when the attestation center is updated.


Parameters:

| Name                 | Type    | Description                 |
| :------------------- | :------ | :-------------------------- |
| newAttestationCenter | address | The new attestation center. |

## Functions info

### setAttestationCenter (0x11c69311)

```solidity
function setAttestationCenter(address _attestationCenter) external
```

Set the attestation center address.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### attestationCenter (0xd92807a2)

```solidity
function attestationCenter() external view returns (address)
```

Get the attestation center address.


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | address | The address of the attestation center. |
