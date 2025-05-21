# StorageSlotUpgradeable

## Overview

#### License: MIT

```solidity
library StorageSlotUpgradeable
```

Library for reading and writing primitive types to specific storage slots.

Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
This library helps with reading and writing to such slots without the need for inline assembly.

The functions in this library return Slot structs that contain a `value` member that can be used to read or write.

Example usage to set ERC1967 implementation slot:
```solidity
contract ERC1967 {
    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function _getImplementation() internal view returns (address) {
        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    function _setImplementation(address newImplementation) internal {
        require(Address.isContract(newImplementation), "ERC1967: new implementation is not a contract");
        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }
}
```

_Available since v4.1 for `address`, `bool`, `bytes32`, `uint256`._
_Available since v4.9 for `string`, `bytes`._
## Structs info

### AddressSlot

```solidity
struct AddressSlot {
	address value;
}
```


### BooleanSlot

```solidity
struct BooleanSlot {
	bool value;
}
```


### Bytes32Slot

```solidity
struct Bytes32Slot {
	bytes32 value;
}
```


### Uint256Slot

```solidity
struct Uint256Slot {
	uint256 value;
}
```


### StringSlot

```solidity
struct StringSlot {
	string value;
}
```


### BytesSlot

```solidity
struct BytesSlot {
	bytes value;
}
```


## Functions info

### getAddressSlot

```solidity
function getAddressSlot(
    bytes32 slot
) internal pure returns (StorageSlotUpgradeable.AddressSlot storage r)
```

Returns an `AddressSlot` with member `value` located at `slot`.
### getBooleanSlot

```solidity
function getBooleanSlot(
    bytes32 slot
) internal pure returns (StorageSlotUpgradeable.BooleanSlot storage r)
```

Returns an `BooleanSlot` with member `value` located at `slot`.
### getBytes32Slot

```solidity
function getBytes32Slot(
    bytes32 slot
) internal pure returns (StorageSlotUpgradeable.Bytes32Slot storage r)
```

Returns an `Bytes32Slot` with member `value` located at `slot`.
### getUint256Slot

```solidity
function getUint256Slot(
    bytes32 slot
) internal pure returns (StorageSlotUpgradeable.Uint256Slot storage r)
```

Returns an `Uint256Slot` with member `value` located at `slot`.
### getStringSlot

```solidity
function getStringSlot(
    bytes32 slot
) internal pure returns (StorageSlotUpgradeable.StringSlot storage r)
```

Returns an `StringSlot` with member `value` located at `slot`.
### getStringSlot

```solidity
function getStringSlot(
    string storage store
) internal pure returns (StorageSlotUpgradeable.StringSlot storage r)
```

Returns an `StringSlot` representation of the string storage pointer `store`.
### getBytesSlot

```solidity
function getBytesSlot(
    bytes32 slot
) internal pure returns (StorageSlotUpgradeable.BytesSlot storage r)
```

Returns an `BytesSlot` with member `value` located at `slot`.
### getBytesSlot

```solidity
function getBytesSlot(
    bytes storage store
) internal pure returns (StorageSlotUpgradeable.BytesSlot storage r)
```

Returns an `BytesSlot` representation of the bytes storage pointer `store`.