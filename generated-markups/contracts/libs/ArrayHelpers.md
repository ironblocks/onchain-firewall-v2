# ArrayHelpers

## Overview

#### License: UNLICENSED

```solidity
library ArrayHelpers
```

Library for array operations.
## Functions info

### isSortedAndUnique

```solidity
function isSortedAndUnique(uint256[] memory _arr) internal pure returns (bool)
```

Verifies if an array is sorted in ascending order and contains unique elements.


Parameters:

| Name | Type      | Description                           |
| :--- | :-------- | :------------------------------------ |
| _arr | uint256[] | The array to check for sorted order.  |


Return values:

| Name | Type | Description                                                                |
| :--- | :--- | :------------------------------------------------------------------------- |
| [0]  | bool | True if the array is sorted and contains unique elements, false otherwise. |

### verifyArraySubset

```solidity
function verifyArraySubset(
    uint256[] memory _arr1,
    uint256[] memory _arr2
) internal pure returns (uint256)
```

Verifies if all elements of first array are present in second array.


Parameters:

| Name  | Type      | Description                           |
| :---- | :-------- | :------------------------------------ |
| _arr1 | uint256[] | The first array to check for subset.  |
| _arr2 | uint256[] | The second array to check against.    |


Return values:

| Name | Type    | Description                                                            |
| :--- | :------ | :--------------------------------------------------------------------- |
| [0]  | uint256 | The first missing element in first array if not a subset, otherwise 0. |
