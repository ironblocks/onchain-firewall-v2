// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title ITransientApprovedCallsPolicyFactory
 * @notice Interface for the TransientApprovedCallsPolicyFactory contract.
 */
interface ITransientApprovedCallsPolicyFactory {
    /**
     * @dev Emitted when a policy is created.
     * @param policy The address of the policy.
     */
    event PolicyCreated(address indexed policy);

    /**
     * @dev Create a new policy.
     * @param _data The data to create the policy with.
     * @return The address of the new policy.
     */
    function create(bytes calldata _data) external returns (address);
}
