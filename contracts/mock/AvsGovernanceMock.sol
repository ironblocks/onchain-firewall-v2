// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAvsGovernance} from "../dependencies/othentic/interfaces/IAvsGovernance.sol";

contract AvsGovernanceMock {
    function votingPower(address operatorId) external pure returns (uint256) {
        return uint160(operatorId);
    }
}
