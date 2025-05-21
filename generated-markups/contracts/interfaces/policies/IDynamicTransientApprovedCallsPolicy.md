# IDynamicTransientApprovedCallsPolicy

## Overview

#### License: UNLICENSED

```solidity
interface IDynamicTransientApprovedCallsPolicy is IFirewallPolicyBase
```

Interface for the DynamicTransientApprovedCallsPolicy contract.
## Structs info

### AdvancedApprovedCall

```solidity
struct AdvancedApprovedCall {
	bytes32 callHash;
	uint256[] maxValues;
	uint256[] minValues;
}
```

The structure that defines an approved call.


Parameters:

| Name      | Type      | Description                       |
| :-------- | :-------- | :-------------------------------- |
| callHash  | bytes32   | The hash of the call.             |
| maxValues | uint256[] | The maximum values for the call.  |
| minValues | uint256[] | The minimum values for the call.  |

## Events info

### CallsApproved

```solidity
event CallsApproved(IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] advancedCalls, uint256 expiration, address txOrigin, uint256 nonce)
```

Emitted when the calls are approved.


Parameters:

| Name          | Type                                                               | Description                                  |
| :------------ | :----------------------------------------------------------------- | :------------------------------------------- |
| advancedCalls | struct IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] | The advanced approved calls.                 |
| expiration    | uint256                                                            | The expiration timestamp of the signature.   |
| txOrigin      | address                                                            | The address that initiated the transaction.  |
| nonce         | uint256                                                            | The nonce for the transaction.               |

### CallsApprovedViaSignature

```solidity
event CallsApprovedViaSignature(IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] advancedCalls, uint256 expiration, address txOrigin, uint256 nonce, bytes signature)
```

Emitted when the calls are approved via a signature.


Parameters:

| Name          | Type                                                               | Description                                  |
| :------------ | :----------------------------------------------------------------- | :------------------------------------------- |
| advancedCalls | struct IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] | The advanced approved calls.                 |
| expiration    | uint256                                                            | The expiration timestamp of the signature.   |
| txOrigin      | address                                                            | The address that initiated the transaction.  |
| nonce         | uint256                                                            | The nonce for the transaction.               |
| signature     | bytes                                                              | The signature of the transaction.            |

### SighashUintIndicesSet

```solidity
event SighashUintIndicesSet(bytes4 indexed sigHash, uint256[] uintIndices)
```

Emitted when the uint slice indices are set.


Parameters:

| Name        | Type      | Description               |
| :---------- | :-------- | :------------------------ |
| sigHash     | bytes4    | The sighash of the call.  |
| uintIndices | uint256[] | The uint slice indices.   |

## Functions info

### approveCalls (0x517ac66b)

```solidity
function approveCalls(
    IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
        calldata _advancedCalls,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce
) external
```

Approves a set of calls via a signature.


Parameters:

| Name           | Type                                                               | Description                                  |
| :------------- | :----------------------------------------------------------------- | :------------------------------------------- |
| _advancedCalls | struct IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] | The advanced approved calls.                 |
| _expiration    | uint256                                                            | The expiration timestamp of the signature.   |
| _txOrigin      | address                                                            | The address that initiated the transaction.  |
| _nonce         | uint256                                                            | The nonce for the transaction.               |

### approveCallsViaSignature (0xdefe60bd)

```solidity
function approveCallsViaSignature(
    IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
        calldata _advancedCalls,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    bytes calldata _signature
) external
```

Approves a set of calls via a signature.


Parameters:

| Name           | Type                                                               | Description                                  |
| :------------- | :----------------------------------------------------------------- | :------------------------------------------- |
| _advancedCalls | struct IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] | The advanced approved calls.                 |
| _expiration    | uint256                                                            | The expiration timestamp of the signature.   |
| _txOrigin      | address                                                            | The address that initiated the transaction.  |
| _nonce         | uint256                                                            | The nonce for the transaction.               |
| _signature     | bytes                                                              | The signature of the transaction.            |

### setSighashUintIndices (0x6fe5d307)

```solidity
function setSighashUintIndices(
    bytes4 _sigHash,
    uint256[] calldata _uintIndices
) external
```

Sets the uint slice indices for a given sighash.


Parameters:

| Name         | Type      | Description                                     |
| :----------- | :-------- | :---------------------------------------------- |
| _sigHash     | bytes4    | The sighash to set the uint slice indices for.  |
| _uintIndices | uint256[] | The uint slice indices to set.                  |

### getCurrentApprovedCalls (0x7c671968)

```solidity
function getCurrentApprovedCalls()
    external
    view
    returns (
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
            memory advancedApprovedCalls
    )
```

Returns the current approved calls.


Return values:

| Name                  | Type                                                               | Description                 |
| :-------------------- | :----------------------------------------------------------------- | :-------------------------- |
| advancedApprovedCalls | struct IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] | The current approved calls. |

### getCallHash (0x5e044b41)

```solidity
function getCallHash(
    address _consumer,
    address _sender,
    address _origin,
    bytes calldata _data,
    uint256 _value
) external view returns (bytes32)
```

Returns the call hash for a given call.


Parameters:

| Name      | Type    | Description                |
| :-------- | :------ | :------------------------- |
| _consumer | address | The consumer of the call.  |
| _sender   | address | The sender of the call.    |
| _origin   | address | The origin of the call.    |
| _data     | bytes   | The data of the call.      |
| _value    | uint256 | The value of the call.     |


Return values:

| Name | Type    | Description    |
| :--- | :------ | :------------- |
| [0]  | bytes32 | The call hash. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

The admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### SIGNER_ROLE (0xa1ebf35d)

```solidity
function SIGNER_ROLE() external view returns (bytes32)
```

The role that is allowed to approve calls.


Return values:

| Name | Type    | Description                                |
| :--- | :------ | :----------------------------------------- |
| [0]  | bytes32 | The role that is allowed to approve calls. |

### nonces (0x7ecebe00)

```solidity
function nonces(address txOrigin) external view returns (uint256)
```

The nonce for a given txOrigin.


Parameters:

| Name     | Type    | Description                        |
| :------- | :------ | :--------------------------------- |
| txOrigin | address | The address to get the nonce for.  |


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | The nonce for the given txOrigin. |
