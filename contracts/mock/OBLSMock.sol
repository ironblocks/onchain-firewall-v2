// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

contract OBLSMock {
    mapping(uint256 => uint256) internal _votingPowers;

    function isActive(uint256 _index) external pure returns (bool) {
        if (_index == 0) {
            return false;
        }

        return true;
    }

    function increaseOperatorVotingPower(uint256 _index, uint256 _votingPower) external {
        _votingPowers[_index] += _votingPower;
    }

    function decreaseOperatorVotingPower(uint256 _index, uint256 _votingPower) external {
        _votingPowers[_index] -= _votingPower;
    }

    function setTotalVotingPowerPerRestrictedTaskDefinition(
        uint16 _taskDefinitionId,
        uint256 _minimumVotingPower,
        uint256[] calldata _restrictedAttesterIds
    ) external {
        // Do nothing
    }

    function setTotalVotingPowerPerTaskDefinition(
        uint16 _taskDefinitionId,
        uint256 _numOfTotalOperators,
        uint256 _minimumVotingPower
    ) external {
        // Do nothing
    }

    function votingPower(uint256 _operatorId) external view returns (uint256) {
        return _votingPowers[_operatorId];
    }
}
