// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAttestationCenter} from "../dependencies/othentic/interfaces/IAttestationCenter.sol";

/**
 * @title IOperatorRegistry
 * @dev Interface for the Operator Registry contract.
 */
interface IOperatorRegistry {
    /**
     * @dev Struct for storing operator data.
     * @param operator The address of the operator.
     * @param operatorId The ID of the operator.
     * @param metadata The metadata of the operator.
     */
    struct Operator {
        address operator;
        uint256 operatorId;
        string metadata;
    }

    /**
     * @dev Event for the operator registered.
     * @param operator The address of the operator.
     * @param operatorId The ID of the operator.
     * @param metadata The metadata of the operator.
     */
    event OperatorRegistered(address operator, uint256 operatorId, string metadata);

    /**
     * @dev Event for the operator unregistered.
     * @param operator The address of the operator.
     */
    event OperatorUnregistered(address operator);

    /**
     * @dev Event for the operator subscription set.
     * @param taskDefinitionId The ID of the task definition.
     * @param operator The address of the operator.
     * @param subscribedOperators The addresses of the subscribed operators.
     * @param subscribedOperatorFeeShares The fee shares of the subscribed operators.
     */
    event OperatorSubscriptionSet(
        uint16 indexed taskDefinitionId,
        address indexed operator,
        address[] subscribedOperators,
        uint256[] subscribedOperatorFeeShares
    );

    /**
     * @dev Event for the attestation center set.
     * @param attestationCenter The address of the attestation center.
     */
    event AttestationCenterSet(address attestationCenter);

    /**
     * @dev Event for the max subscribed operators count set.
     * @param maxSubscribedOperatorsCount The max subscribed operators count.
     */
    event MaxSubscribedOperatorsCountSet(uint256 maxSubscribedOperatorsCount);

    /**
     * @dev Register an operator.
     * @param _operator The address of the operator.
     * @param _metadata The metadata of the operator.
     */
    function registerOperator(address _operator, string calldata _metadata) external;

    /**
     * @dev Unregister an operator.
     * @param _operator The address of the operator.
     */
    function unregisterOperator(address _operator) external;

    /**
     * @dev Subscribe additional operators to a task definition.
     * @param _taskDefinitionId The ID of the task definition.
     * @param _subscribedOperators The addresses of the subscribed operators.
     * @param _subscribedOperatorFeeShares The fee shares of the subscribed operators.
     */
    function subscribeOperators(
        uint16 _taskDefinitionId,
        address[] calldata _subscribedOperators,
        uint256[] calldata _subscribedOperatorFeeShares
    ) external;

    /**
     * @dev Get the subscribed operator fees.
     * @param _taskDefinitionId The ID of the task definition.
     * @param _operatorId The ID of the operator.
     * @return operatorIds The IDs of the subscribed operators.
     * @return operatorFees The fees of the subscribed operators.
     */
    function getSubscribedOperatorFees(
        uint16 _taskDefinitionId,
        uint256 _operatorId
    ) external view returns (uint256[] memory operatorIds, uint256[] memory operatorFees);

    /**
     * @dev Get the total count of subscribed operators.
     * @param _taskDefinitionId The ID of the task definition.
     * @param _operatorIds The IDs of the operators.
     * @return totalCount The total count of subscribed operators.
     */
    function getSubscribedOperatorTotalCount(
        uint16 _taskDefinitionId,
        uint256[] calldata _operatorIds
    ) external view returns (uint256 totalCount);

    /**
     * @dev Set the attestation center.
     * @param _attestationCenter The address of the attestation center.
     */
    function setAttestationCenter(address _attestationCenter) external;

    /**
     * @dev Get the admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the attestation center.
     * @return The attestation center.
     */
    function attestationCenter() external view returns (IAttestationCenter);

    /**
     * @dev Get the operator data.
     * @param _operator The address of the operator.
     * @return The operator data.
     */
    function getOperator(address _operator) external view returns (Operator memory);

    /**
     * @dev Get the version of the operator registry.
     * @return The version of the operator registry.
     */
    function version() external pure returns (uint256);
}
