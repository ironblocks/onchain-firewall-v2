// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IFirewallPolicyBase
 * @notice Interface for the FirewallPolicyBase contract.
 */
import {IFirewallPolicy} from "./IFirewallPolicy.sol";

interface IFirewallPolicyBase is IFirewallPolicy {
    /**
     * @dev The event emitted when the consumer status is set.
     * @param consumer The address of the consumer.
     * @param status The status of the consumer.
     */
    event ConsumerStatusSet(address consumer, bool status);

    /**
     * @dev The event emitted when the executor status is set.
     * @param executor The address of the executor.
     * @param status The status of the executor.
     */
    event ExecutorStatusSet(address executor, bool status);

    /**
     * @dev Sets approval status of multiple consumers.
     * This is useful for adding a large amount of consumers to the allowlist in a single transaction.
     * @param _consumers The consumers to set the approval status for.
     * @param _statuses The approval status to set.
     */
    function setConsumersStatuses(
        address[] calldata _consumers,
        bool[] calldata _statuses
    ) external;

    /**
     * @dev Sets the executor status.
     *
     * @param _caller The address of the executor.
     * @param _status The executor status to set.
     */
    function setExecutorStatus(address _caller, bool _status) external;

    /**
     * @dev The authorized executors.
     * @param _caller The address of the executor.
     * @return The authorized status of the executor.
     */
    function authorizedExecutors(address _caller) external view returns (bool);

    /**
     * @dev The approved consumers.
     * @param _consumer The address of the consumer.
     * @return The approved status of the consumer.
     */
    function approvedConsumer(address _consumer) external view returns (bool);
}
