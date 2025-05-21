# TestVennGuard

## Overview

#### License: UNLICENSED

```solidity
contract TestVennGuard is VennGuard
```


## Functions info

### constructor

```solidity
constructor() VennGuard(address(0), address(0), address(0), 0)
```


### parseMultisendCall (0x25293630)

```solidity
function parseMultisendCall(
    bytes memory data
) external pure returns (address, uint256, bytes memory)
```


### packMultisendCall (0xd4f6eed1)

```solidity
function packMultisendCall(
    uint8 callType,
    address target,
    uint256 value,
    bytes memory callData
) external pure returns (bytes memory)
```


### encodeSingleMultisendCall (0x587b638e)

```solidity
function encodeSingleMultisendCall(
    uint8 callType,
    address target,
    uint256 value,
    bytes memory callData
) external pure returns (bytes memory)
```


### encodeDoubleMultisendCall (0xbbec1cd0)

```solidity
function encodeDoubleMultisendCall(
    uint8 callType1,
    address target1,
    uint256 value1,
    bytes memory callData1,
    uint8 callType2,
    address target2,
    uint256 value2,
    bytes memory callData2
) external pure returns (bytes memory)
```

