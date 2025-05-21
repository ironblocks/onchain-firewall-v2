// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IOBLS} from "../dependencies/othentic/interfaces/IOBLS.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IVotingPowerSyncer} from "../interfaces/othentic/IVotingPowerSyncer.sol";

contract VotingPowerSyncer is IVotingPowerSyncer, Ownable {
    IOBLS public immutable obls;

    address public syncer;

    uint256 public lastSyncedL1BlockNumber;

    modifier onlySyncer() {
        _onlySyncer();
        _;
    }

    constructor(address _obls, address _syncer) {
        obls = IOBLS(_obls);

        _setSyncer(_syncer);
    }

    function setSyncer(address _syncer) external onlyOwner {
        _setSyncer(_syncer);
    }

    function setOperatorVotingPower(
        uint256 _l1BlockNumber,
        NewOperatorVotingPower memory _newOperatorVotingPower
    ) external onlySyncer {
        _updateLastSyncedL1BlockNumber(_l1BlockNumber);

        _setOperatorVotingPower(_newOperatorVotingPower);

        emit OperatorVotingPowerSet(_newOperatorVotingPower);
    }

    function setBatchOperatorVotingPower(
        uint256 _l1BlockNumber,
        NewOperatorVotingPower[] memory _operatorsVotingPower
    ) external onlySyncer {
        _updateLastSyncedL1BlockNumber(_l1BlockNumber);

        for (uint256 i = 0; i < _operatorsVotingPower.length; i++) {
            _setOperatorVotingPower(_operatorsVotingPower[i]);
        }

        emit BatchOperatorVotingPowerSet(_operatorsVotingPower);
    }

    function setTotalVotingPowerPerRestrictedTaskDefinition(
        uint16 _taskDefinitionId,
        uint256 _minimumVotingPower,
        uint256[] calldata _restrictedAttesterIds
    ) external onlySyncer {
        obls.setTotalVotingPowerPerRestrictedTaskDefinition(
            _taskDefinitionId,
            _minimumVotingPower,
            _restrictedAttesterIds
        );
    }

    function setTotalVotingPowerPerTaskDefinition(
        uint16 _taskDefinitionId,
        uint256 _numOfTotalOperators,
        uint256 _minimumVotingPower
    ) external onlySyncer {
        obls.setTotalVotingPowerPerTaskDefinition(
            _taskDefinitionId,
            _numOfTotalOperators,
            _minimumVotingPower
        );
    }

    function votingPower(uint256 _operatorId) external view returns (uint256) {
        return obls.votingPower(_operatorId);
    }

    function votingPowers(
        uint256[] memory _operatorIds
    ) external view returns (uint256[] memory _votingPowers) {
        _votingPowers = new uint256[](_operatorIds.length);

        for (uint256 i = 0; i < _operatorIds.length; i++) {
            _votingPowers[i] = obls.votingPower(_operatorIds[i]);
        }
    }

    function _setOperatorVotingPower(
        NewOperatorVotingPower memory _newOperatorVotingPower
    ) internal {
        uint256 currentVotingPower = obls.votingPower(_newOperatorVotingPower.operatorId);

        if (_newOperatorVotingPower.votingPower > currentVotingPower) {
            obls.increaseOperatorVotingPower(
                _newOperatorVotingPower.operatorId,
                _newOperatorVotingPower.votingPower - currentVotingPower
            );
        } else if (_newOperatorVotingPower.votingPower < currentVotingPower) {
            obls.decreaseOperatorVotingPower(
                _newOperatorVotingPower.operatorId,
                currentVotingPower - _newOperatorVotingPower.votingPower
            );
        }
    }

    function _updateLastSyncedL1BlockNumber(uint256 _l1BlockNumber) internal {
        require(
            lastSyncedL1BlockNumber < _l1BlockNumber,
            "VPS: Operator voting power already synced"
        );

        lastSyncedL1BlockNumber = _l1BlockNumber;
    }

    function _setSyncer(address _syncer) internal {
        syncer = _syncer;

        emit SyncerSet(_syncer);
    }

    function _onlySyncer() internal view {
        require(msg.sender == syncer, "VPS: caller is not the syncer");
    }
}
