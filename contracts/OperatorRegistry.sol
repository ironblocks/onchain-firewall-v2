// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IAttestationCenter} from "./dependencies/othentic/interfaces/IAttestationCenter.sol";

import {IOperatorRegistry} from "./interfaces/IOperatorRegistry.sol";

import {FEE_SCALE} from "./helpers/Constants.sol";

contract OperatorRegistry is IOperatorRegistry, AccessControlUpgradeable, UUPSUpgradeable {
    using EnumerableMap for EnumerableMap.UintToUintMap;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IAttestationCenter public attestationCenter;

    uint256 public maxSubscribedOperatorsCount;

    mapping(address operator => Operator operatorData) internal operators;

    mapping(uint16 taskDefinitionId => mapping(uint256 operatorId => EnumerableMap.UintToUintMap))
        internal subscribedOperators;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __OperatorRegistry_init(
        address _attestationCenter,
        uint256 _maxSubscribedOperatorsCount
    ) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setAttestationCenter(_attestationCenter);
        _setMaxSubscribedOperatorsCount(_maxSubscribedOperatorsCount);
    }

    function registerOperator(
        address _operator,
        string calldata _metadata
    ) external onlyRole(ADMIN_ROLE) {
        require(!isOperatorRegistered(_operator), "Operator already registered");

        uint256 operatorId = attestationCenter.operatorsIdsByAddress(_operator);

        operators[_operator] = Operator({
            operator: _operator,
            operatorId: operatorId,
            metadata: _metadata
        });

        emit OperatorRegistered(_operator, operatorId, _metadata);
    }

    function unregisterOperator(address _operator) external onlyRole(ADMIN_ROLE) {
        require(isOperatorRegistered(_operator), "OperatorRegistry: Operator not registered");

        delete operators[_operator];

        emit OperatorUnregistered(_operator);
    }

    function subscribeOperators(
        uint16 _taskDefinitionId,
        address[] calldata _subscribedOperators,
        uint256[] calldata _subscribedOperatorFeeShares
    ) external {
        require(
            _subscribedOperators.length == _subscribedOperatorFeeShares.length,
            "OperatorRegistry: Subscribed operators and fee shares length mismatch"
        );
        require(isOperatorRegistered(msg.sender), "OperatorRegistry: Operator not registered");
        require(
            _taskDefinitionId == 0 ||
                _taskDefinitionId <= attestationCenter.numOfTaskDefinitions(),
            "OperatorRegistry: Invalid task definition id"
        );

        uint256 operatorId = operators[msg.sender].operatorId;

        EnumerableMap.UintToUintMap storage subscribedOperators_ = subscribedOperators[
            _taskDefinitionId
        ][operatorId];

        for (uint256 i = 0; i < _subscribedOperators.length; i++) {
            uint256 subscribedOperatorId = operators[_subscribedOperators[i]].operatorId;

            if (_subscribedOperatorFeeShares[i] != 0) {
                require(
                    isOperatorRegistered(_subscribedOperators[i]),
                    "OperatorRegistry: Subscribed operator not registered"
                );

                subscribedOperators_.set(subscribedOperatorId, _subscribedOperatorFeeShares[i]);
            } else {
                subscribedOperators_.remove(subscribedOperatorId);
            }
        }

        require(
            !subscribedOperators_.contains(operatorId),
            "OperatorRegistry: Operator has to be not subscribed to itself"
        );

        require(
            subscribedOperators_.length() <= maxSubscribedOperatorsCount,
            "OperatorRegistry: Max subscribed operators count exceeded"
        );

        uint256 totalSubscribedOperatorFeeShare = 0;
        for (uint256 i = 0; i < subscribedOperators_.length(); i++) {
            (, uint256 subscribedOperatorFeeShare) = subscribedOperators_.at(i);

            totalSubscribedOperatorFeeShare += subscribedOperatorFeeShare;
        }

        require(
            totalSubscribedOperatorFeeShare < FEE_SCALE,
            "OperatorRegistry: Total subscribed operator fee share has to be less than 100%"
        );

        emit OperatorSubscriptionSet(
            _taskDefinitionId,
            msg.sender,
            _subscribedOperators,
            _subscribedOperatorFeeShares
        );
    }

    function getSubscribedOperatorFees(
        uint16 _taskDefinitionId,
        uint256 _operatorId
    ) external view returns (uint256[] memory operatorIds, uint256[] memory operatorFees) {
        EnumerableMap.UintToUintMap storage subscribedOperators_ = subscribedOperators[
            _taskDefinitionId
        ][_operatorId];

        operatorIds = subscribedOperators_.keys();
        operatorFees = new uint256[](operatorIds.length);

        for (uint256 i = 0; i < operatorIds.length; i++) {
            operatorFees[i] = subscribedOperators_.get(operatorIds[i]);
        }
    }

    function getSubscribedOperatorTotalCount(
        uint16 _taskDefinitionId,
        uint256[] calldata _operatorIds
    ) external view returns (uint256 totalCount) {
        mapping(uint256 => EnumerableMap.UintToUintMap)
            storage subscribedOperators_ = subscribedOperators[_taskDefinitionId];

        for (uint256 i = 0; i < _operatorIds.length; i++) {
            totalCount += subscribedOperators_[_operatorIds[i]].length();
        }
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
    }

    function setMaxSubscribedOperatorsCount(
        uint256 _maxSubscribedOperatorsCount
    ) external onlyRole(ADMIN_ROLE) {
        _setMaxSubscribedOperatorsCount(_maxSubscribedOperatorsCount);
    }

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = IAttestationCenter(_attestationCenter);

        emit AttestationCenterSet(_attestationCenter);
    }

    function _setMaxSubscribedOperatorsCount(uint256 _maxSubscribedOperatorsCount) internal {
        maxSubscribedOperatorsCount = _maxSubscribedOperatorsCount;

        emit MaxSubscribedOperatorsCountSet(_maxSubscribedOperatorsCount);
    }

    function getOperator(address _operator) external view returns (Operator memory) {
        return operators[_operator];
    }

    function isOperatorRegistered(address _operator) public view returns (bool) {
        return operators[_operator].operator != address(0);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
