# EnumerableSet

## Overview

#### License: MIT

```solidity
library EnumerableSet
```

Library for managing
https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
types.

Sets have the following properties:

- Elements are added, removed, and checked for existence in constant time
(O(1)).
- Elements are enumerated in O(n). No guarantees are made on the ordering.

```solidity
contract Example {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private mySet;
}
```

As of v3.3.0, sets of type `bytes32` (`Bytes32Set`), `address` (`AddressSet`)
and `uint256` (`UintSet`) are supported.

[WARNING]
====
Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
unusable.
See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.

In order to clean an EnumerableSet, you can either remove all elements one by one or create a fresh instance using an
array of EnumerableSet.
====
## Structs info

### Set

```solidity
struct Set {
	bytes32[] _values;
	mapping(bytes32 => uint256) _indexes;
}
```


### Bytes32Set

```solidity
struct Bytes32Set {
	EnumerableSet.Set _inner;
}
```


### AddressSet

```solidity
struct AddressSet {
	EnumerableSet.Set _inner;
}
```


### UintSet

```solidity
struct UintSet {
	EnumerableSet.Set _inner;
}
```


## Functions info

### add

```solidity
function add(
    EnumerableSet.Bytes32Set storage set,
    bytes32 value
) internal returns (bool)
```

Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableSet.Bytes32Set storage set,
    bytes32 value
) internal returns (bool)
```

Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present.
### contains

```solidity
function contains(
    EnumerableSet.Bytes32Set storage set,
    bytes32 value
) internal view returns (bool)
```

Returns true if the value is in the set. O(1).
### length

```solidity
function length(
    EnumerableSet.Bytes32Set storage set
) internal view returns (uint256)
```

Returns the number of values in the set. O(1).
### at

```solidity
function at(
    EnumerableSet.Bytes32Set storage set,
    uint256 index
) internal view returns (bytes32)
```

Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### values

```solidity
function values(
    EnumerableSet.Bytes32Set storage set
) internal view returns (bytes32[] memory)
```

Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
### add

```solidity
function add(
    EnumerableSet.AddressSet storage set,
    address value
) internal returns (bool)
```

Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableSet.AddressSet storage set,
    address value
) internal returns (bool)
```

Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present.
### contains

```solidity
function contains(
    EnumerableSet.AddressSet storage set,
    address value
) internal view returns (bool)
```

Returns true if the value is in the set. O(1).
### length

```solidity
function length(
    EnumerableSet.AddressSet storage set
) internal view returns (uint256)
```

Returns the number of values in the set. O(1).
### at

```solidity
function at(
    EnumerableSet.AddressSet storage set,
    uint256 index
) internal view returns (address)
```

Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### values

```solidity
function values(
    EnumerableSet.AddressSet storage set
) internal view returns (address[] memory)
```

Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
### add

```solidity
function add(
    EnumerableSet.UintSet storage set,
    uint256 value
) internal returns (bool)
```

Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present.
### remove

```solidity
function remove(
    EnumerableSet.UintSet storage set,
    uint256 value
) internal returns (bool)
```

Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present.
### contains

```solidity
function contains(
    EnumerableSet.UintSet storage set,
    uint256 value
) internal view returns (bool)
```

Returns true if the value is in the set. O(1).
### length

```solidity
function length(
    EnumerableSet.UintSet storage set
) internal view returns (uint256)
```

Returns the number of values in the set. O(1).
### at

```solidity
function at(
    EnumerableSet.UintSet storage set,
    uint256 index
) internal view returns (uint256)
```

Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}.
### values

```solidity
function values(
    EnumerableSet.UintSet storage set
) internal view returns (uint256[] memory)
```

Return the entire set in an array

WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
this function has an unbounded cost, and using it as part of a state-changing function may render the function
uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.