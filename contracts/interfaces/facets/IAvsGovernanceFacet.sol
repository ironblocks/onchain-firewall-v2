// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAvsGovernance} from "../../dependencies/othentic/interfaces/IAvsGovernance.sol";

interface IAvsGovernanceFacet {
    /**
     * @notice Get the voting power of the operators
     * @param operatorIds The operator IDs to get the voting power of
     * @return _votingPowers The voting powers of the operators
     */
    function votingPowers(
        address[] memory operatorIds
    ) external view returns (uint256[] memory _votingPowers);

    /**
     * @notice Get the avs governance
     * @return avs governance contract
     */
    function avsGovernance() external view returns (IAvsGovernance);
}
