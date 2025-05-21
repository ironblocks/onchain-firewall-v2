// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAttestationCenter} from "../dependencies/othentic/interfaces/IAttestationCenter.sol";

contract AttestationCenterMock {
    event TaskSubmitted(
        IAttestationCenter.TaskInfo _taskInfo,
        IAttestationCenter.TaskSubmissionDetails _taskSubmissionDetails
    );

    address public obls;

    uint16 public numOfTaskDefinitions;

    mapping(uint16 => uint256[]) public taskDefinitionRestrictedOperators;

    constructor(address _obls) {
        obls = _obls;
    }

    function operatorsIdsByAddress(address _operator) external pure returns (uint256) {
        return uint256(uint160(_operator));
    }

    function setTaskDefinitionRestrictedOperators(
        uint16 _taskDefinitionId,
        uint256[] calldata _operatorIds
    ) external {
        taskDefinitionRestrictedOperators[_taskDefinitionId] = _operatorIds;
    }

    function getTaskDefinitionRestrictedOperators(
        uint16 _taskDefinitionId
    ) external view returns (uint256[] memory) {
        return taskDefinitionRestrictedOperators[_taskDefinitionId];
    }

    function submitTask(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        IAttestationCenter.TaskSubmissionDetails calldata _taskSubmissionDetails
    ) external payable {
        emit TaskSubmitted(_taskInfo, _taskSubmissionDetails);
    }

    function setNumOfTaskDefinitions(uint16 _numOfTaskDefinitions) external {
        numOfTaskDefinitions = _numOfTaskDefinitions;
    }

    function getOperatorPaymentDetail(
        uint256 _operatorId
    ) external pure returns (IAttestationCenter.PaymentDetails memory _operator) {
        if (_operatorId > 1000) {
            return _operator;
        }

        _operator = IAttestationCenter.PaymentDetails({
            operator: address(uint160(_operatorId)),
            lastPaidTaskNumber: 0,
            feeToClaim: 0,
            paymentStatus: IAttestationCenter.PaymentStatus.COMMITTED
        });
    }
}
