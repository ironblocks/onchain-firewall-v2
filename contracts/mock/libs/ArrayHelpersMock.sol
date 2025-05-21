// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {ArrayHelpers} from "../../libs/ArrayHelpers.sol";

contract ArrayHelpersMock {
    function isSortedAndUnique(uint256[] memory _arr) external pure returns (bool) {
        return ArrayHelpers.isSortedAndUnique(_arr);
    }

    function verifyArraySubset(
        uint256[] memory _arr1,
        uint256[] memory _arr2
    ) external pure returns (uint256) {
        return ArrayHelpers.verifyArraySubset(_arr1, _arr2);
    }
}
