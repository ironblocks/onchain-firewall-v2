// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IFirewallPolicy
 * @notice Interface for the FirewallPolicy contract.
 */
interface IFirewallPolicy {
    /**
     * @dev Pre-execution hook for the firewall policy.
     * @param _consumer The address of the consumer.
     * @param _sender The address of the sender.
     * @param _data The data of the call.
     * @param _value The value of the call.
     */
    function preExecution(
        address _consumer,
        address _sender,
        bytes memory _data,
        uint256 _value
    ) external;

    /**
     * @dev Post-execution hook for the firewall policy.
     * @param _consumer The address of the consumer.
     * @param _sender The address of the sender.
     * @param _data The data of the call.
     * @param _value The value of the call.
     */
    function postExecution(
        address _consumer,
        address _sender,
        bytes memory _data,
        uint256 _value
    ) external;
}
