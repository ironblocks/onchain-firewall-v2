# IVennVaultL2

## Overview

#### License: UNLICENSED

```solidity
interface IVennVaultL2 is IBeforePaymentsLogic
```

Interface for the VennVaultL2 contract.
## Events info

### AllowOperatorClaimUpdated

```solidity
event AllowOperatorClaimUpdated(bool newAllowOperatorClaim)
```

Emitted when the allow operator claim is updated.


Parameters:

| Name                  | Type | Description                   |
| :-------------------- | :--- | :---------------------------- |
| newAllowOperatorClaim | bool | The new allow operator claim. |

### AttestationCenterUpdated

```solidity
event AttestationCenterUpdated(address newAttestationCenter)
```

Emitted when the attestation center is updated.


Parameters:

| Name                 | Type    | Description                 |
| :------------------- | :------ | :-------------------------- |
| newAttestationCenter | address | The new attestation center. |

### L2AvsTreasuryUpdated

```solidity
event L2AvsTreasuryUpdated(address newL2AvsTreasury)
```

Emitted when the L2 Avs treasury is updated.


Parameters:

| Name             | Type    | Description              |
| :--------------- | :------ | :----------------------- |
| newL2AvsTreasury | address | The new L2 Avs treasury. |

## Functions info

### ownerMint (0x484b973c)

```solidity
function ownerMint(address _to, uint256 _amount) external
```

Owner mint function


Parameters:

| Name    | Type    | Description              |
| :------ | :------ | :----------------------- |
| _to     | address | The address to mint to.  |
| _amount | uint256 | The amount to mint.      |

### setAllowOperatorClaim (0x9318c8ac)

```solidity
function setAllowOperatorClaim(bool _allowOperatorClaim) external
```

Set the allow operator claim.


Parameters:

| Name                | Type | Description               |
| :------------------ | :--- | :------------------------ |
| _allowOperatorClaim | bool | The allow operator claim. |

### setAttestationCenter (0x11c69311)

```solidity
function setAttestationCenter(address _attestationCenter) external
```

Set the attestation center address.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### setL2AvsTreasury (0xeab9f9ca)

```solidity
function setL2AvsTreasury(address _l2AvsTreasury) external
```

Set the L2 Avs treasury address.


Parameters:

| Name           | Type    | Description                         |
| :------------- | :------ | :---------------------------------- |
| _l2AvsTreasury | address | The address of the L2 Avs treasury. |

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

### l2AvsTreasury (0xaf2c533c)

```solidity
function l2AvsTreasury() external view returns (address)
```

Get the L2 Avs treasury address.


Return values:

| Name | Type    | Description                         |
| :--- | :------ | :---------------------------------- |
| [0]  | address | The address of the L2 Avs treasury. |

### allowOperatorClaim (0x28f4b0bf)

```solidity
function allowOperatorClaim() external view returns (bool)
```

Get the allow operator claim.


Return values:

| Name | Type | Description               |
| :--- | :--- | :------------------------ |
| [0]  | bool | The allow operator claim. |

### version (0x54fd4d50)

```solidity
function version() external view returns (uint256)
```

Get the version of the VennVaultL2.


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The version of the VennVaultL2. |
