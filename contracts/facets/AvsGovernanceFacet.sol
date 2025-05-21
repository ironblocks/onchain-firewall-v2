// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAvsGovernance} from "../dependencies/othentic/interfaces/IAvsGovernance.sol";

import {IAvsGovernanceFacet} from "../interfaces/facets/IAvsGovernanceFacet.sol";

contract AvsGovernanceFacet is IAvsGovernanceFacet {
    IAvsGovernance public immutable avsGovernance;

    constructor(address _avsGovernance) {
        avsGovernance = IAvsGovernance(_avsGovernance);
    }

    function votingPowers(
        address[] memory operatorIds
    ) external view returns (uint256[] memory _votingPowers) {
        _votingPowers = new uint256[](operatorIds.length);

        for (uint256 i = 0; i < operatorIds.length; i++) {
            _votingPowers[i] = avsGovernance.votingPower(operatorIds[i]);
        }
    }
}
