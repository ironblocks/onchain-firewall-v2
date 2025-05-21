# ITransientApprovedCallsPolicy

## Overview

#### License: UNLICENSED

```solidity
interface ITransientApprovedCallsPolicy is IFirewallPolicyBase
```

Interface for the TransientApprovedCallsPolicy contract.
## Events info

### CallsApproved

```solidity
event CallsApproved(bytes32[] callHashes, uint256 expiration, address txOrigin, uint256 nonce)
```

Emitted when the calls are approved.


Parameters:

| Name       | Type      | Description                                  |
| :--------- | :-------- | :------------------------------------------- |
| callHashes | bytes32[] | The call hashes that were approved.          |
| expiration | uint256   | The expiration timestamp of the signature.   |
| txOrigin   | address   | The address that initiated the transaction.  |
| nonce      | uint256   | The nonce for the transaction.               |

### CallsApprovedViaSignature

```solidity
event CallsApprovedViaSignature(bytes32[] callHashes, uint256 expiration, address txOrigin, uint256 nonce, bytes signature)
```

Emitted when the calls are approved via a signature.


Parameters:

| Name       | Type      | Description                                            |
| :--------- | :-------- | :----------------------------------------------------- |
| callHashes | bytes32[] | The call hashes that were approved.                    |
| expiration | uint256   | The expiration timestamp of the signature.             |
| txOrigin   | address   | The address that initiated the transaction.            |
| nonce      | uint256   | The nonce for the transaction.                         |
| signature  | bytes     | The signature of the signer with the above parameters. |

## Functions info

### approveCallsViaSignature (0x0c908cff)

```solidity
function approveCallsViaSignature(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    bytes calldata _signature
) external
```

Allows anyone to approve a call with a signers signature.


Parameters:

| Name        | Type      | Description                                            |
| :---------- | :-------- | :----------------------------------------------------- |
| _callHashes | bytes32[] | The call hashes to approve.                            |
| _expiration | uint256   | The expiration time of these approved calls            |
| _txOrigin   | address   | The transaction origin of the approved hashes.         |
| _nonce      | uint256   | Used to prevent replay attacks.                        |
| _signature  | bytes     | The signature of the signer with the above parameters. |

### approveCalls (0xee309b1e)

```solidity
function approveCalls(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce
) external
```

Allows a signer to approve a call.


Parameters:

| Name        | Type      | Description                                     |
| :---------- | :-------- | :---------------------------------------------- |
| _callHashes | bytes32[] | The call hashes to approve.                     |
| _expiration | uint256   | The expiration time of these approved calls     |
| _txOrigin   | address   | The transaction origin of the approved hashes.  |
| _nonce      | uint256   | The nonce for the transaction.                  |

### getCurrentApprovedCalls (0x7c671968)

```solidity
function getCurrentApprovedCalls()
    external
    view
    returns (bytes32[] memory approvedCalls)
```

Returns the current approved calls.


Return values:

| Name          | Type      | Description                 |
| :------------ | :-------- | :-------------------------- |
| approvedCalls | bytes32[] | The current approved calls. |

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

### SIGNER_ROLE (0xa1ebf35d)

```solidity
function SIGNER_ROLE() external view returns (bytes32)
```

The signer role.


Return values:

| Name | Type    | Description      |
| :--- | :------ | :--------------- |
| [0]  | bytes32 | The signer role. |

### nonces (0x7ecebe00)

```solidity
function nonces(address txOrigin) external view returns (uint256)
```

The nonce for a given txOrigin.


Parameters:

| Name     | Type    | Description              |
| :------- | :------ | :----------------------- |
| txOrigin | address | The transaction origin.  |


Return values:

| Name | Type    | Description |
| :--- | :------ | :---------- |
| [0]  | uint256 | The nonce.  |
