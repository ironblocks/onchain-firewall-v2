// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IApprovedCallsPolicy} from "../../interfaces/policies/IApprovedCallsPolicy.sol";

contract SupportsSafeFunctionCalls is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 _interfaceId) public view virtual returns (bool) {
        return _interfaceId == type(IApprovedCallsPolicy).interfaceId;
    }
}
