# ApprovedCallsHelper

## Overview

#### License: UNLICENSED

```solidity
library ApprovedCallsHelper
```

Library for approved calls helper functions.
## Functions info

### getCallHash

```solidity
function getCallHash(
    address _consumer,
    address _sender,
    address _origin,
    bytes memory _data,
    uint256 _value
) internal pure returns (bytes32)
```

Function to get the hash of a call.


Parameters:

| Name      | Type    | Description                                               |
| :-------- | :------ | :-------------------------------------------------------- |
| _consumer | address | The address of the contract that is being called.         |
| _sender   | address | The address of the account that is calling the contract.  |
| _origin   | address | The address of the account that originated the call.      |
| _data     | bytes   | The data that is being sent to the contract.              |
| _value    | uint256 | The amount of value that is being sent to the contract.   |


Return values:

| Name | Type    | Description           |
| :--- | :------ | :-------------------- |
| [0]  | bytes32 | The hash of the call. |

### getEthSignedMessageHash

```solidity
function getEthSignedMessageHash(
    bytes32 _messageHash
) internal pure returns (bytes32)
```

Function to get a signed hash of a message that has been signed with the Ethereum prefix.


Parameters:

| Name         | Type    | Description              |
| :----------- | :------ | :----------------------- |
| _messageHash | bytes32 | The hash of the message. |

### recoverSigner

```solidity
function recoverSigner(
    bytes32 _ethSignedMessageHash,
    bytes calldata _signature
) internal pure returns (address)
```

Function to recover the signer of a message.


Parameters:

| Name                  | Type    | Description                               |
| :-------------------- | :------ | :---------------------------------------- |
| _ethSignedMessageHash | bytes32 | The hash of the message that was signed.  |
| _signature            | bytes   | The signature of the message.             |


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | address | The address of the signer. |

### splitSignature

```solidity
function splitSignature(
    bytes memory _sig
) internal pure returns (bytes32 r, bytes32 s, uint8 v)
```

Function to split a signature into its r, s, and v components.


Parameters:

| Name | Type  | Description              |
| :--- | :---- | :----------------------- |
| _sig | bytes | The signature to split.  |


Return values:

| Name | Type    | Description                        |
| :--- | :------ | :--------------------------------- |
| r    | bytes32 | The r component of the signature.  |
| s    | bytes32 | The s component of the signature.  |
| v    | uint8   | The v component of the signature.  |
