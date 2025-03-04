// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title ArrayHelpers
 * @notice Library for array operations.
 */
library ArrayHelpers {
    /**
     * @dev Verifies if an array is sorted in ascending order.
     * @param _arr The array to check for sorted order.
     * @return True if the array is sorted, false otherwise.
     */
    function isSorted(uint256[] memory _arr) internal pure returns (bool) {
        uint256 len = _arr.length;

        if (len <= 1) return true;

        unchecked {
            for (uint256 i = 0; i < len - 1; i++) {
                if (_arr[i] >= _arr[i + 1]) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @dev Verifies if all elements of first array are present in second array.
     * @param _arr1 The first array to check for subset.
     * @param _arr2 The second array to check against.
     * @return The first missing element in first array if not a subset, otherwise 0.
     */
    function verifyArraySubset(
        uint256[] memory _arr1,
        uint256[] memory _arr2
    ) internal pure returns (uint256) {
        uint256 i = 0;
        uint256 j = 0;

        while (i < _arr1.length && j < _arr2.length) {
            if (_arr1[i] == _arr2[j]) {
                i++;
                j++;
            } else if (_arr1[i] > _arr2[j]) {
                j++;
            } else {
                return _arr1[i];
            }
        }

        if (i == _arr1.length) {
            return 0;
        } else {
            return _arr1[i];
        }
    }
}
