// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IOperatorRegistry} from "../IOperatorRegistry.sol";

import {IFeeCalculator} from "../../dependencies/othentic/interfaces/IFeeCalculator.sol";
/**
 * @title IVennFeeCalculator
 * @notice Interface for the VennFeeCalculator contract.
 */
interface IVennFeeCalculator is IFeeCalculator {
    /**
     * @dev Enum for the operator types.
     */
    enum OperatorType {
        ATTESTER,
        AGGREGATOR,
        PERFORMER
    }

    /**
     * @dev Event for the task definition fee set.
     * @param _taskDefinitionId The task definition id.
     * @param _totalFee The total fee.
     */
    event TaskDefinitionFeeSet(uint16 indexed _taskDefinitionId, uint256 _totalFee);

    /**
     * @dev Event for the fee recipients set.
     * @param _taskDefinitionId The task definition id.
     * @param _recipients The recipients.
     * @param _feeShares The fee shares.
     */
    event TaskDefinitionFeeRecipientsSet(
        uint16 indexed _taskDefinitionId,
        bytes32[] _recipients,
        uint256[] _feeShares
    );

    /**
     * @dev Event for the task definition id operator fees set.
     * @param _taskDefinitionId The task definition id.
     * @param _operatorTypes The operator types.
     * @param _fees The fees.
     */
    event TaskDefinitionIdOperatorFeesSet(
        uint16 indexed _taskDefinitionId,
        OperatorType[] _operatorTypes,
        uint256[] _fees
    );

    /**
     * @dev Event for the fee distributed.
     * @param _taskDefinitionId The task definition id.
     * @param _recipient The recipient.
     * @param _feeAmount The fee amount.
     */
    event FeeDistributed(
        uint16 indexed _taskDefinitionId,
        bytes32 indexed _recipient,
        uint256 _feeAmount
    );

    /**
     * @dev Event for the fee withdrawn.
     * @param _taskDefinitionId The task definition id.
     * @param _recipient The recipient.
     * @param _feeAmount The fee amount.
     */
    event FeeWithdrawn(
        uint16 indexed _taskDefinitionId,
        bytes32 indexed _recipient,
        uint256 _feeAmount
    );

    /**
     * @dev Emitted when the operator registry is updated.
     * @param newOperatorRegistry The new operator registry.
     */
    event OperatorRegistryUpdated(address newOperatorRegistry);

    /**
     * @dev Set the operator registry address.
     * @param _operatorRegistry The address of the operator registry.
     */
    function setOperatorRegistry(address _operatorRegistry) external;

    /**
     * @dev Get the operator registry address.
     * @return The address of the operator registry.
     */
    function operatorRegistry() external view returns (IOperatorRegistry);
    /**
     * @dev Set the task definition id fee.
     * @param _taskDefinitionId The task definition id.
     * @param _totalFee The total fee.
     */
    function setTaskDefinitionFee(uint16 _taskDefinitionId, uint256 _totalFee) external;

    /**
     * @dev Set the task definition id fee recipients.
     * @param _taskDefinitionId The task definition id.
     * @param _recipients The recipients.
     * @param _feeShares The fee shares.
     */
    function setTaskDefinitionFeeRecipients(
        uint16 _taskDefinitionId,
        bytes32[] calldata _recipients,
        uint256[] calldata _feeShares
    ) external;

    /**
     * @dev Set the task definition id operator fees.
     * @param _taskDefinitionId The task definition id.
     * @param _operatorTypes The operator types.
     * @param _fees The fees.
     */
    function setTaskDefinitionIdOperatorFees(
        uint16 _taskDefinitionId,
        OperatorType[] calldata _operatorTypes,
        uint256[] calldata _fees
    ) external;

    /**
     * @dev Distribute the fee.
     * @param _taskDefinitionId The task definition id.
     */
    function distributeFee(uint16 _taskDefinitionId) external;

    /**
     * @dev Withdraw the fee.
     * @param _taskDefinitionId The task definition id.
     * @param _recipient The recipient.
     * @return The fee amount.
     */
    function withdrawFee(uint16 _taskDefinitionId, bytes32 _recipient) external returns (uint256);

    /**
     * @dev Get the task definition id operator fees.
     * @param _taskDefinitionId The task definition id.
     * @param _operatorType The operator type.
     * @return The operator fees.
     */
    function taskDefinitionIdOperatorFees(
        uint16 _taskDefinitionId,
        OperatorType _operatorType
    ) external view returns (uint256);

    /**
     * @dev Get the admin role.
     * Admins can approve calls and change the address of the operator registry.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the fee pool role.
     * @return The fee pool role.
     */
    function FEE_POOL_ROLE() external view returns (bytes32);

    /**
     * @dev Get the task definition id total fees.
     * @param _taskDefinitionId The task definition id.
     * @return The total fees.
     */
    function taskDefinitionIdTotalFees(uint16 _taskDefinitionId) external view returns (uint256);

    /**
     * @dev Get the distributed fees.
     * @param _recipient The recipient.
     * @return The distributed fees.
     */
    function distributedFees(bytes32 _recipient) external view returns (uint256);

    /**
     * @dev Get the version of the fee distributor.
     * @return The version of the fee distributor.
     */
    function version() external view returns (uint256);
}
