// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAttestationCenter} from "../../dependencies/othentic/interfaces/IAttestationCenter.sol";

/**
 * @title IAttestationCenterProxy
 * @notice Interface for the AttestationCenterProxy contract.
 */
interface IAttestationCenterProxy {
    /**
     * @dev Emitted when the attestation center is updated.
     * @param newAttestationCenter The new attestation center.
     */
    event AttestationCenterUpdated(address newAttestationCenter);

    /**
     * @dev Emitted when the fee pool is updated.
     * @param newFeePool The new fee pool.
     */
    event FeePoolUpdated(address newFeePool);

    /**
     * @dev Submit a single task to the attestation center.
     * @param _taskInfo The task information.
     * @param _taskSubmissionDetails The task submission details.
     */
    function submitTask(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        IAttestationCenter.TaskSubmissionDetails calldata _taskSubmissionDetails
    ) external payable;

    /**
     * @dev Submit multiple tasks to the attestation center.
     * @param _taskInfo The task information.
     * @param _taskSubmissionDetails The task submission details.
     */
    function submitTasks(
        IAttestationCenter.TaskInfo[] calldata _taskInfo,
        IAttestationCenter.TaskSubmissionDetails[] calldata _taskSubmissionDetails
    ) external payable;

    /**
     * @dev Set the attestation center address.
     * @param _attestationCenter The address of the attestation center.
     */
    function setAttestationCenter(address _attestationCenter) external;

    /**
     * @dev Set the fee pool address.
     * @param _feePool The address of the fee pool.
     */
    function setFeePool(address _feePool) external;

    /**
     * @dev Get the admin role.
     * Admins can approve calls and change the address of the attestation center.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the fee pool address.
     * @return The address of the fee pool.
     */
    function feePool() external view returns (address);

    /**
     * @dev Get the attestation center address.
     * @return The address of the attestation center.
     */
    function attestationCenter() external view returns (address);

    /**
     * @dev Get the version of the attestation center proxy.
     * @return The version of the attestation center proxy.
     */
    function version() external view returns (uint256);
}
