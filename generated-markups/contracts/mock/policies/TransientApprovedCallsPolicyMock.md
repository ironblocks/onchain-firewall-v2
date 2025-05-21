# TransientApprovedCallsPolicyMock

## Overview

#### License: UNLICENSED

```solidity
contract TransientApprovedCallsPolicyMock
```


## State variables info

### policy (0x0505c8c9)

```solidity
contract ITransientApprovedCallsPolicy policy
```


## Functions info

### constructor

```solidity
constructor(address transientApprovedCallsPolicy)
```


### approveCallsAndReturnStorage (0xfc9bec8d)

```solidity
function approveCallsAndReturnStorage(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce
) external returns (bytes32[] memory approvedCalls)
```


### approveCallsViaSignatureAndReturnStorage (0x0af624f6)

```solidity
function approveCallsViaSignatureAndReturnStorage(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    bytes calldata _signature
) external returns (bytes32[] memory approvedCalls)
```


### approveCallsAndPreExecutionAndReturnStorage (0x672e5504)

```solidity
function approveCallsAndPreExecutionAndReturnStorage(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    address _consumer,
    address _sender,
    bytes calldata _data,
    uint256 _value
) external returns (bytes32[] memory approvedCalls)
```

