// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IOperatorRegistry} from "../interfaces/IOperatorRegistry.sol";

import {IVennFeeCalculator} from "../interfaces/othentic/IVennFeeCalculator.sol";

import {FEE_SCALE} from "../helpers/Constants.sol";

contract VennFeeCalculator is IVennFeeCalculator, AccessControlUpgradeable, UUPSUpgradeable {
    using EnumerableMap for EnumerableMap.Bytes32ToUintMap;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FEE_POOL_ROLE = keccak256("FEE_POOL_ROLE");

    IOperatorRegistry public operatorRegistry;

    mapping(uint16 => uint256) public taskDefinitionIdTotalFees;
    mapping(bytes32 => uint256) public distributedFees;
    mapping(uint16 => mapping(OperatorType => uint256)) public taskDefinitionIdOperatorFees;

    mapping(uint16 => uint256) public operatorFees;

    mapping(uint16 => EnumerableMap.Bytes32ToUintMap) internal taskDefinitionIdFeeRecipients;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __VennFeeCalculator_init(address _operatorRegistry) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setOperatorRegistry(_operatorRegistry);
    }

    function isBaseRewardFee() external pure returns (bool) {
        return false;
    }

    function calculateBaseRewardFees(
        FeeCalculatorData calldata _feeCalculatorData
    )
        external
        pure
        returns (
            uint256 baseRewardFeeForAttesters,
            uint256 baseRewardFeeForAggregator,
            uint256 baseRewardFeeForPerformer
        )
    {}

    function calculateFeesPerId(
        FeeCalculatorData calldata _feeCalculatorData
    ) external returns (FeePerId[] memory feesPerId) {
        uint256 totalOperatorsFee = operatorFees[_feeCalculatorData.data.taskDefinitionId];
        delete operatorFees[_feeCalculatorData.data.taskDefinitionId];

        if (_feeCalculatorData.attestersIds.length == 0) {
            feesPerId = new FeePerId[](1);
            feesPerId[0] = FeePerId({
                index: _feeCalculatorData.performerId,
                fee: totalOperatorsFee
            });

            return feesPerId;
        }

        uint256 totalSubscribedOperatorsCount = operatorRegistry.getSubscribedOperatorTotalCount(
            _feeCalculatorData.data.taskDefinitionId,
            _feeCalculatorData.attestersIds
        );

        feesPerId = new FeePerId[](
            _feeCalculatorData.attestersIds.length + totalSubscribedOperatorsCount + 2
        );
        uint256 feePerIdIndex = 0;

        mapping(OperatorType => uint256) storage operatorFeeShares = taskDefinitionIdOperatorFees[
            _feeCalculatorData.data.taskDefinitionId
        ];

        feesPerId[feePerIdIndex++] = FeePerId({
            index: _feeCalculatorData.aggregatorId,
            fee: (totalOperatorsFee * operatorFeeShares[OperatorType.AGGREGATOR]) / FEE_SCALE
        });
        feesPerId[feePerIdIndex++] = FeePerId({
            index: _feeCalculatorData.performerId,
            fee: (totalOperatorsFee * operatorFeeShares[OperatorType.PERFORMER]) / FEE_SCALE
        });
        uint256 totalAttestersReward = (totalOperatorsFee *
            operatorFeeShares[OperatorType.ATTESTER]) / FEE_SCALE;

        uint256 rewardsPerAttester = totalAttestersReward / _feeCalculatorData.attestersIds.length;

        for (uint256 i = 0; i < _feeCalculatorData.attestersIds.length; i++) {
            (
                uint256[] memory subscribedOperatorIds,
                uint256[] memory subscribedOperatorFees
            ) = operatorRegistry.getSubscribedOperatorFees(
                    _feeCalculatorData.data.taskDefinitionId,
                    _feeCalculatorData.attestersIds[i]
                );
            uint256 distributedOperatorFee = 0;

            for (uint256 j = 0; j < subscribedOperatorIds.length; j++) {
                uint256 fee = (rewardsPerAttester * subscribedOperatorFees[j]) / FEE_SCALE;
                distributedOperatorFee += fee;

                feesPerId[feePerIdIndex++] = FeePerId({index: subscribedOperatorIds[j], fee: fee});
            }

            feesPerId[feePerIdIndex++] = FeePerId({
                index: _feeCalculatorData.attestersIds[i],
                fee: rewardsPerAttester - distributedOperatorFee
            });
        }
    }

    function setTaskDefinitionFee(
        uint16 _taskDefinitionId,
        uint256 _totalFee
    ) external onlyRole(ADMIN_ROLE) {
        taskDefinitionIdTotalFees[_taskDefinitionId] = _totalFee;

        emit TaskDefinitionFeeSet(_taskDefinitionId, _totalFee);
    }

    function setTaskDefinitionFeeRecipients(
        uint16 _taskDefinitionId,
        bytes32[] calldata _recipients,
        uint256[] calldata _feeShares
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _recipients.length == _feeShares.length,
            "VennFeeCalculator: Recipients and shares length mismatch"
        );

        EnumerableMap.Bytes32ToUintMap storage feeRecipients = taskDefinitionIdFeeRecipients[
            _taskDefinitionId
        ];

        for (uint256 i = 0; i < _recipients.length; i++) {
            if (_feeShares[i] != 0) {
                feeRecipients.set(_recipients[i], _feeShares[i]);
            } else {
                feeRecipients.remove(_recipients[i]);
            }
        }

        uint256 totalFeeShare;
        for (uint256 i = 0; i < feeRecipients.length(); i++) {
            (, uint256 feeShare) = feeRecipients.at(i);
            totalFeeShare += feeShare;
        }

        require(
            totalFeeShare < FEE_SCALE,
            "VennFeeCalculator: Total fee share must be less than 100%"
        );

        emit TaskDefinitionFeeRecipientsSet(_taskDefinitionId, _recipients, _feeShares);
    }

    function setTaskDefinitionIdOperatorFees(
        uint16 _taskDefinitionId,
        OperatorType[] calldata _operatorTypes,
        uint256[] calldata _fees
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _operatorTypes.length == _fees.length,
            "VennFeeCalculator: Operator types and fees length mismatch"
        );

        mapping(OperatorType => uint256) storage operatorFees_ = taskDefinitionIdOperatorFees[
            _taskDefinitionId
        ];

        for (uint256 i = 0; i < _operatorTypes.length; i++) {
            operatorFees_[_operatorTypes[i]] = _fees[i];
        }

        uint256 totalFee = 0;
        for (uint8 i = 0; i < uint8(type(OperatorType).max) + 1; i++) {
            totalFee += operatorFees_[OperatorType(i)];
        }
        require(totalFee == FEE_SCALE, "VennFeeCalculator: Total fee share must be 100%");

        emit TaskDefinitionIdOperatorFeesSet(_taskDefinitionId, _operatorTypes, _fees);
    }

    function distributeFee(uint16 _taskDefinitionId) external onlyRole(FEE_POOL_ROLE) {
        uint256 totalFee = taskDefinitionIdTotalFees[_taskDefinitionId];

        EnumerableMap.Bytes32ToUintMap storage feeRecipients = taskDefinitionIdFeeRecipients[
            _taskDefinitionId
        ];

        uint256 totalFeeDistributed = 0;
        for (uint256 i = 0; i < feeRecipients.length(); i++) {
            (bytes32 recipient, uint256 feeShare) = feeRecipients.at(i);

            uint256 feeAmount = (totalFee * feeShare) / FEE_SCALE;

            distributedFees[recipient] += feeAmount;
            totalFeeDistributed += feeAmount;

            emit FeeDistributed(_taskDefinitionId, recipient, feeAmount);
        }

        operatorFees[_taskDefinitionId] += totalFee - totalFeeDistributed;
    }

    function withdrawFee(
        uint16 _taskDefinitionId,
        bytes32 _recipient
    ) external onlyRole(ADMIN_ROLE) returns (uint256 feeAmount) {
        feeAmount = distributedFees[_recipient];

        distributedFees[_recipient] = 0;

        emit FeeWithdrawn(_taskDefinitionId, _recipient, feeAmount);
    }

    function getTaskDefinitionIdFeeRecipients(
        uint16 _taskDefinitionId
    ) external view returns (bytes32[] memory recipients, uint256[] memory feeShares) {
        EnumerableMap.Bytes32ToUintMap storage feeRecipients = taskDefinitionIdFeeRecipients[
            _taskDefinitionId
        ];

        recipients = feeRecipients.keys();
        feeShares = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            (, uint256 feeShare) = feeRecipients.at(i);
            feeShares[i] = feeShare;
        }
    }

    function setOperatorRegistry(address _operatorRegistry) external onlyRole(ADMIN_ROLE) {
        _setOperatorRegistry(_operatorRegistry);
    }

    function _setOperatorRegistry(address _operatorRegistry) internal {
        operatorRegistry = IOperatorRegistry(_operatorRegistry);

        emit OperatorRegistryUpdated(_operatorRegistry);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
