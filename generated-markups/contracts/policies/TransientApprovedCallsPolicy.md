# TransientApprovedCallsPolicy

## Overview

#### License: UNLICENSED

```solidity
contract TransientApprovedCallsPolicy is ITransientApprovedCallsPolicy, FirewallPolicyBase, AccessControl, SupportsSafeFunctionCalls
```

This policy requires a transaction to a consumer to be signed and approved on chain before execution.

This works by approving the ordered sequence of calls that must be made, and then asserting at each step
that the next call is as expected. Note that this doesn't assert that the entire sequence is executed.

NOTE: Misconfiguration of the approved calls may result in legitimate transactions being reverted.
For example, transactions that also include internal calls must include the internal calls in the approved calls
hash in order for the policy to work as expected.

If you have any questions on how or when to use this modifier, please refer to the Firewall's documentation
and/or contact our support.
## Constants info

### ADMIN_ROLE (0x75b238fc)

```solidity
bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE")
```


### SIGNER_ROLE (0xa1ebf35d)

```solidity
bytes32 constant SIGNER_ROLE = keccak256("SIGNER_ROLE")
```

The signer role.


Return values:

| Name | Type    | Description      |
| :--- | :------ | :--------------- |
| [0]  | bytes32 | The signer role. |

## State variables info

### nonces (0x7ecebe00)

```solidity
mapping(address => uint256) nonces
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

## Functions info

### constructor

```solidity
constructor(address _firewallAddress)
```


### preExecution (0xd9739cda)

```solidity
function preExecution(
    address _consumer,
    address _sender,
    bytes calldata _data,
    uint256 _value
) external isAuthorized(_consumer)
```

Pre-execution hook for the firewall policy.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _consumer | address | The address of the consumer.  |
| _sender   | address | The address of the sender.    |
| _data     | bytes   | The data of the call.         |
| _value    | uint256 | The value of the call.        |

### postExecution (0xc6d4328b)

```solidity
function postExecution(address, address, bytes calldata, uint256) external
```

This function is called after the execution of a transaction.
It does nothing in this policy.
### approveCalls (0xee309b1e)

```solidity
function approveCalls(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce
) external onlyRole(SIGNER_ROLE)
```

Allows a signer to approve a call.


Parameters:

| Name        | Type      | Description                                     |
| :---------- | :-------- | :---------------------------------------------- |
| _callHashes | bytes32[] | The call hashes to approve.                     |
| _expiration | uint256   | The expiration time of these approved calls     |
| _txOrigin   | address   | The transaction origin of the approved hashes.  |
| _nonce      | uint256   | The nonce for the transaction.                  |

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

### setExecutorStatus (0x62bb2f40)

```solidity
function setExecutorStatus(
    address _caller,
    bool _status
) external onlyRole(ADMIN_ROLE)
```

Sets the executor status.



Parameters:

| Name    | Type    | Description                   |
| :------ | :------ | :---------------------------- |
| _caller | address | The address of the executor.  |
| _status | bool    | The executor status to set.   |

### setConsumersStatuses (0x707aaf20)

```solidity
function setConsumersStatuses(
    address[] calldata _consumers,
    bool[] calldata _statuses
) external onlyRole(ADMIN_ROLE)
```

Sets approval status of multiple consumers.
This is useful for adding a large amount of consumers to the allowlist in a single transaction.


Parameters:

| Name       | Type      | Description                                    |
| :--------- | :-------- | :--------------------------------------------- |
| _consumers | address[] | The consumers to set the approval status for.  |
| _statuses  | bool[]    | The approval status to set.                    |

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
    bytes memory _data,
    uint256 _value
) external pure returns (bytes32)
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

### supportsInterface (0x01ffc9a7)

```solidity
function supportsInterface(
    bytes4 interfaceId
) public view override returns (bool)
```

See {IERC165-supportsInterface}.