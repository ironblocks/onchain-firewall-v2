# EnumerableMap

## Overview

#### License: MIT

```solidity
library EnumerableMap
```

Library for managing an enumerable variant of Solidity's
https://solidity.readthedocs.io/en/latest/types.html#mapping-types[`mapping`]
type.

Maps have the following properties:

- Entries are added, removed, and checked for existence in constant time
(O(1)).
- Entries are enumerated in O(n). No guarantees are made on the ordering.

```solidity
contract Example {
    // Add the library methods
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Declare a set state variable
    EnumerableMap.UintToAddressMap private myMap;
}
```

The following map types are supported:

- `uint256 -> address` (`UintToAddressMap`) since v3.0.0
- `address -> uint256` (`AddressToUintMap`) since v4.6.0
- `bytes32 -> bytes32` (`Bytes32ToBytes32Map`) since v4.6.0
- `uint256 -> uint256` (`UintToUintMap`) since v4.7.0
- `bytes32 -> uint256` (`Bytes32ToUintMap`) since v4.7.0

[WARNING]
====
Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
unusable.
See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.

In order to clean an EnumerableMap, you can either remove all elements one by one or create a fresh instance using an
array of EnumerableMap.
====
## Structs info

### Bytes32ToBytes32Map

```solidity
struct Bytes32ToBytes32Map {
	EnumerableSet.Bytes32Set _keys;
	mapping(bytes32 => bytes32) _values;
}
```


### UintToUintMap

```solidity
struct UintToUintMap {
	EnumerableMap.Bytes32ToBytes32Map _inner;
}
```


### UintToAddressMap

```solidity
struct UintToAddressMap {
	EnumerableMap.Bytes32ToBytes32Map _inner;
}
```


### AddressToUintMap

```solidity
struct AddressToUintMap {
	EnumerableMap.Bytes32ToBytes32Map _inner;
}
```


### Bytes32ToUintMap

```solidity
struct Bytes32ToUintMap {
	EnumerableMap.Bytes32ToBytes32Map _inner;
}
```


## Functions info

### set

```solidity
function set(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    bytes32 key,
    bytes32 value
) internal returns (bool)
```

Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    bytes32 key
) internal returns (bool)
```

Removes a key-value pair from a map. O(1).

Returns true if the key was removed from the map, that is if it was present.
### contains

```solidity
function contains(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    bytes32 key
) internal view returns (bool)
```

Returns true if the key is in the map. O(1).
### length

```solidity
function length(
    EnumerableMap.Bytes32ToBytes32Map storage map
) internal view returns (uint256)
```

Returns the number of key-value pairs in the map. O(1).
### at

```solidity
function at(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    uint256 index
) internal view returns (bytes32, bytes32)
```

Returns the key-value pair stored at position `index` in the map. O(1).

Note that there are no guarantees on the ordering of entries inside the
array, and it may change when more entries are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### tryGet

```solidity
function tryGet(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    bytes32 key
) internal view returns (bool, bytes32)
```

Tries to returns the value associated with `key`. O(1).
Does not revert if `key` is not in the map.
### get

```solidity
function get(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    bytes32 key
) internal view returns (bytes32)
```

Returns the value associated with `key`. O(1).

Requirements:

- `key` must be in the map.
### get

```solidity
function get(
    EnumerableMap.Bytes32ToBytes32Map storage map,
    bytes32 key,
    string memory errorMessage
) internal view returns (bytes32)
```

Same as {get}, with a custom error message when `key` is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}.
### keys

```solidity
function keys(
    EnumerableMap.Bytes32ToBytes32Map storage map
) internal view returns (bytes32[] memory)
```

Return the an array containing all the keys

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
### set

```solidity
function set(
    EnumerableMap.UintToUintMap storage map,
    uint256 key,
    uint256 value
) internal returns (bool)
```

Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableMap.UintToUintMap storage map,
    uint256 key
) internal returns (bool)
```

Removes a value from a map. O(1).

Returns true if the key was removed from the map, that is if it was present.
### contains

```solidity
function contains(
    EnumerableMap.UintToUintMap storage map,
    uint256 key
) internal view returns (bool)
```

Returns true if the key is in the map. O(1).
### length

```solidity
function length(
    EnumerableMap.UintToUintMap storage map
) internal view returns (uint256)
```

Returns the number of elements in the map. O(1).
### at

```solidity
function at(
    EnumerableMap.UintToUintMap storage map,
    uint256 index
) internal view returns (uint256, uint256)
```

Returns the element stored at position `index` in the map. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### tryGet

```solidity
function tryGet(
    EnumerableMap.UintToUintMap storage map,
    uint256 key
) internal view returns (bool, uint256)
```

Tries to returns the value associated with `key`. O(1).
Does not revert if `key` is not in the map.
### get

```solidity
function get(
    EnumerableMap.UintToUintMap storage map,
    uint256 key
) internal view returns (uint256)
```

Returns the value associated with `key`. O(1).

Requirements:

- `key` must be in the map.
### get

```solidity
function get(
    EnumerableMap.UintToUintMap storage map,
    uint256 key,
    string memory errorMessage
) internal view returns (uint256)
```

Same as {get}, with a custom error message when `key` is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}.
### keys

```solidity
function keys(
    EnumerableMap.UintToUintMap storage map
) internal view returns (uint256[] memory)
```

Return the an array containing all the keys

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
### set

```solidity
function set(
    EnumerableMap.UintToAddressMap storage map,
    uint256 key,
    address value
) internal returns (bool)
```

Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableMap.UintToAddressMap storage map,
    uint256 key
) internal returns (bool)
```

Removes a value from a map. O(1).

Returns true if the key was removed from the map, that is if it was present.
### contains

```solidity
function contains(
    EnumerableMap.UintToAddressMap storage map,
    uint256 key
) internal view returns (bool)
```

Returns true if the key is in the map. O(1).
### length

```solidity
function length(
    EnumerableMap.UintToAddressMap storage map
) internal view returns (uint256)
```

Returns the number of elements in the map. O(1).
### at

```solidity
function at(
    EnumerableMap.UintToAddressMap storage map,
    uint256 index
) internal view returns (uint256, address)
```

Returns the element stored at position `index` in the map. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### tryGet

```solidity
function tryGet(
    EnumerableMap.UintToAddressMap storage map,
    uint256 key
) internal view returns (bool, address)
```

Tries to returns the value associated with `key`. O(1).
Does not revert if `key` is not in the map.
### get

```solidity
function get(
    EnumerableMap.UintToAddressMap storage map,
    uint256 key
) internal view returns (address)
```

Returns the value associated with `key`. O(1).

Requirements:

- `key` must be in the map.
### get

```solidity
function get(
    EnumerableMap.UintToAddressMap storage map,
    uint256 key,
    string memory errorMessage
) internal view returns (address)
```

Same as {get}, with a custom error message when `key` is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}.
### keys

```solidity
function keys(
    EnumerableMap.UintToAddressMap storage map
) internal view returns (uint256[] memory)
```

Return the an array containing all the keys

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
### set

```solidity
function set(
    EnumerableMap.AddressToUintMap storage map,
    address key,
    uint256 value
) internal returns (bool)
```

Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableMap.AddressToUintMap storage map,
    address key
) internal returns (bool)
```

Removes a value from a map. O(1).

Returns true if the key was removed from the map, that is if it was present.
### contains

```solidity
function contains(
    EnumerableMap.AddressToUintMap storage map,
    address key
) internal view returns (bool)
```

Returns true if the key is in the map. O(1).
### length

```solidity
function length(
    EnumerableMap.AddressToUintMap storage map
) internal view returns (uint256)
```

Returns the number of elements in the map. O(1).
### at

```solidity
function at(
    EnumerableMap.AddressToUintMap storage map,
    uint256 index
) internal view returns (address, uint256)
```

Returns the element stored at position `index` in the map. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### tryGet

```solidity
function tryGet(
    EnumerableMap.AddressToUintMap storage map,
    address key
) internal view returns (bool, uint256)
```

Tries to returns the value associated with `key`. O(1).
Does not revert if `key` is not in the map.
### get

```solidity
function get(
    EnumerableMap.AddressToUintMap storage map,
    address key
) internal view returns (uint256)
```

Returns the value associated with `key`. O(1).

Requirements:

- `key` must be in the map.
### get

```solidity
function get(
    EnumerableMap.AddressToUintMap storage map,
    address key,
    string memory errorMessage
) internal view returns (uint256)
```

Same as {get}, with a custom error message when `key` is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}.
### keys

```solidity
function keys(
    EnumerableMap.AddressToUintMap storage map
) internal view returns (address[] memory)
```

Return the an array containing all the keys

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
### set

```solidity
function set(
    EnumerableMap.Bytes32ToUintMap storage map,
    bytes32 key,
    uint256 value
) internal returns (bool)
```

Adds a key-value pair to a map, or updates the value for an existing
key. O(1).

Returns true if the key was added to the map, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableMap.Bytes32ToUintMap storage map,
    bytes32 key
) internal returns (bool)
```

Removes a value from a map. O(1).

Returns true if the key was removed from the map, that is if it was present.
### contains

```solidity
function contains(
    EnumerableMap.Bytes32ToUintMap storage map,
    bytes32 key
) internal view returns (bool)
```

Returns true if the key is in the map. O(1).
### length

```solidity
function length(
    EnumerableMap.Bytes32ToUintMap storage map
) internal view returns (uint256)
```

Returns the number of elements in the map. O(1).
### at

```solidity
function at(
    EnumerableMap.Bytes32ToUintMap storage map,
    uint256 index
) internal view returns (bytes32, uint256)
```

Returns the element stored at position `index` in the map. O(1).
Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### tryGet

```solidity
function tryGet(
    EnumerableMap.Bytes32ToUintMap storage map,
    bytes32 key
) internal view returns (bool, uint256)
```

Tries to returns the value associated with `key`. O(1).
Does not revert if `key` is not in the map.
### get

```solidity
function get(
    EnumerableMap.Bytes32ToUintMap storage map,
    bytes32 key
) internal view returns (uint256)
```

Returns the value associated with `key`. O(1).

Requirements:

- `key` must be in the map.
### get

```solidity
function get(
    EnumerableMap.Bytes32ToUintMap storage map,
    bytes32 key,
    string memory errorMessage
) internal view returns (uint256)
```

Same as {get}, with a custom error message when `key` is not in the map.

CAUTION: This function is deprecated because it requires allocating memory for the error
message unnecessarily. For custom revert reasons use {tryGet}.
### keys

```solidity
function keys(
    EnumerableMap.Bytes32ToUintMap storage map
) internal view returns (bytes32[] memory)
```

Return the an array containing all the keys

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.