# Transient

## Overview

#### License: UNLICENSED

```solidity
library Transient
```

Library for transient storage.
## Functions info

### getValueBySlot

```solidity
function getValueBySlot(bytes32 _slot) internal view returns (bytes32 _value)
```

Returns the value stored at the given slot.


Parameters:

| Name  | Type    | Description             |
| :---- | :------ | :---------------------- |
| _slot | bytes32 | The slot to read from.  |


Return values:

| Name   | Type    | Description                         |
| :----- | :------ | :---------------------------------- |
| _value | bytes32 | The value stored at the given slot. |

### setValueBySlot

```solidity
function setValueBySlot(bytes32 _slot, bytes32 _value) internal
```

Sets the value at the given slot.


Parameters:

| Name   | Type    | Description            |
| :----- | :------ | :--------------------- |
| _slot  | bytes32 | The slot to write to.  |
| _value | bytes32 | The value to write.    |

### setValueBySlot

```solidity
function setValueBySlot(bytes32 _slot, uint256 _value) internal
```

Sets the value at the given slot.


Parameters:

| Name   | Type    | Description            |
| :----- | :------ | :--------------------- |
| _slot  | bytes32 | The slot to write to.  |
| _value | uint256 | The value to write.    |

### setAddressBySlot

```solidity
function setAddressBySlot(bytes32 _slot, address _address) internal
```


### getAddressBySlot

```solidity
function getAddressBySlot(
    bytes32 _slot
) internal view returns (address _address)
```


### getUint256BySlot

```solidity
function getUint256BySlot(bytes32 _slot) internal view returns (uint256 _value)
```


### setUint256BySlot

```solidity
function setUint256BySlot(bytes32 _slot, uint256 _value) internal
```

