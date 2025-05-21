# DynamicTransientApprovedCallsPolicyMock

## Overview

#### License: UNLICENSED

```solidity
contract DynamicTransientApprovedCallsPolicyMock
```


## State variables info

### policy (0x0505c8c9)

```solidity
contract IDynamicTransientApprovedCallsPolicy policy
```


## Functions info

### constructor

```solidity
constructor(address dynamicTransientApprovedCallsPolicy)
```


### approveCallsAndReturnStorage (0xf94bf018)

```solidity
function approveCallsAndReturnStorage(
    IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
        calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce
)
    external
    returns (
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
            memory approvedCalls
    )
```


### approveCallsViaSignatureAndReturnStorage (0xda69b565)

```solidity
function approveCallsViaSignatureAndReturnStorage(
    IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
        calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    bytes calldata _signature
)
    external
    returns (
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
            memory approvedCalls
    )
```


### approveCallsAndPreExecutionAndReturnStorage (0x2bde189d)

```solidity
function approveCallsAndPreExecutionAndReturnStorage(
    IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
        calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    address _consumer,
    address _sender,
    bytes calldata _data,
    uint256 _value
)
    external
    returns (
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[]
            memory approvedCalls
    )
```

