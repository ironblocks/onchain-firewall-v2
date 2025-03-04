// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IFirewall
 * @notice Interface for the Firewall contract.
 */
interface IFirewall {
    /**
     * @dev Emitted when a policy is approved or disapproved by the owner.
     * @param policy The address of the policy contract.
     * @param status The status of the policy.
     */
    event PolicyStatusUpdate(address policy, bool status);

    /**
     * @dev Emitted when a consumer's dry-run mode is enabled or disabled.
     * @param consumer The address of the consumer contract.
     * @param status The status of the dry-run mode.
     */
    event ConsumerDryrunStatusUpdate(address consumer, bool status);

    /**
     * @dev Emitted when a policy is globally added or to a consumer.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     */
    event GlobalPolicyAdded(address indexed consumer, address policy);

    /**
     * @dev Emitted when a policy is globally removed or from a consumer.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     */
    event GlobalPolicyRemoved(address indexed consumer, address policy);

    /**
     * @dev Emitted when a policy is added to a consumer.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     */
    event PolicyAdded(address indexed consumer, bytes4 methodSig, address policy);

    /**
     * @dev Emitted when a policy is removed from a consumer.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     */
    event PolicyRemoved(address indexed consumer, bytes4 methodSig, address policy);

    /**
     * @dev Emitted when a policy's pre-execution hook was successfully executed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     */
    event DryrunPolicyPreSuccess(address indexed consumer, bytes4 methodSig, address policy);

    /**
     * @dev Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     */
    event GlobalDryrunPolicyPreSuccess(address indexed consumer, address policy);

    /**
     * @dev Emitted when a policy's post-execution hook was successfully executed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     */
    event DryrunPolicyPostSuccess(address indexed consumer, bytes4 methodSig, address policy);

    /**
     * @dev Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     */
    event GlobalDryrunPolicyPostSuccess(address indexed consumer, address policy);

    /**
     * @dev Emitted when a policy's pre-execution hook failed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     * @param error The error message.
     */
    event DryrunPolicyPreError(
        address indexed consumer,
        bytes4 methodSig,
        address policy,
        bytes error
    );

    /**
     * @dev Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     * @param error The error message.
     */
    event GlobalDryrunPolicyPreError(address indexed consumer, address policy, bytes error);

    /**
     * @dev Emitted when a policy's post-execution hook failed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     * @param error The error message.
     */
    event DryrunPolicyPostError(
        address indexed consumer,
        bytes4 methodSig,
        address policy,
        bytes error
    );

    /**
     * @dev Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     * @param error The error message.
     */
    event GlobalDryrunPolicyPostError(address indexed consumer, address policy, bytes error);

    /**
     * @dev Emitted when a policy's pre-execution hook was successfully executed.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     */
    event PolicyPreSuccess(address indexed consumer, bytes4 methodSig, address policy);

    /**
     * @dev Emitted when a global policy's pre-execution hook was successfully executed.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     */
    event GlobalPolicyPreSuccess(address indexed consumer, address policy);

    /**
     * @dev Emitted when a policy's post-execution hook was successfully executed.
     * @param consumer The address of the consumer contract.
     * @param methodSig The method signature of the consumer contract to which the policy applies.
     * @param policy The address of the policy contract.
     */
    event PolicyPostSuccess(address indexed consumer, bytes4 methodSig, address policy);

    /**
     * @dev Emitted when a global policy's post-execution hook was successfully executed.
     * @param consumer The address of the consumer contract.
     * @param policy The address of the policy contract.
     */
    event GlobalPolicyPostSuccess(address indexed consumer, address policy);

    /**
     * @dev Runs the preExecution hook of all subscribed policies.
     * @param _sender The address of the caller.
     * @param _data The calldata of the call (some firewall modifiers may pass custom data based on the use case).
     * @param _value The value of the call.
     */
    function preExecution(address _sender, bytes calldata _data, uint256 _value) external;

    /**
     * @dev Runs the postExecution hook of all subscribed policies.
     * @param _sender The address of the caller.
     * @param _data The calldata of the call (some firewall modifiers may pass custom data based on the use case).
     * @param _value The value of the call.
     */
    function postExecution(address _sender, bytes calldata _data, uint256 _value) external;

    /**
     * @dev Owner only function allowing the owner to approve or remove a policy contract. This allows the policy
     * to be subscribed to by consumers, or conversely no longer be allowed.
     * @param _policy The address of the policy contract.
     * @param _status The status of the policy.
     */
    function setPolicyStatus(address _policy, bool _status) external;

    /**
     * @dev Admin only function allowing the consumers admin enable/disable dry run mode.
     * @param _consumer The address of the consumer contract.
     * @param _status The status of the dry run mode.
     */
    function setConsumerDryrunStatus(address _consumer, bool _status) external;

    /**
     * @dev Admin only function allowing the consumers admin to add a policy to the consumers subscribed policies.
     * @param _consumer The address of the consumer contract.
     * @param _policy The address of the policy contract.
     *
     * NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded
     * version of the policy in the future, and / or a new vulnerability may be found in a policy at some
     * future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future,
     * preventing consumers from being able to subscribe to it in the future.
     *
     * While doesn't block already-subscribed consumers from using the policy, it is highly recommended
     * to have periodical reviews of the policies you are subscribed to and to make any required changes
     * accordingly.
     */
    function addGlobalPolicy(address _consumer, address _policy) external;

    /**
     * @dev Admin only function allowing the consumers admin to remove a policy from the consumers subscribed policies.
     * @param _consumer The address of the consumer contract.
     * @param _policy The address of the policy contract.
     */
    function removeGlobalPolicy(address _consumer, address _policy) external;

    /**
     * @dev Admin only function allowing the consumers admin to add a single policy to multiple consumers.
     * Note that the consumer admin needs to be the same for all consumers.
     *
     * @param _consumers The addresses of the consumer contracts.
     * @param _policy The address of the policy contract.
     * NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded
     * version of the policy in the future, and / or a new vulnerability may be found in a policy at some
     * future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future,
     * preventing consumers from being able to subscribe to it in the future.
     *
     * While doesn't block already-subscribed consumers from using the policy, it is highly recommended
     * to have periodical reviews of the policies you are subscribed to and to make any required changes
     * accordingly.
     */
    function addGlobalPolicyForConsumers(address[] calldata _consumers, address _policy) external;

    /**
     * @dev Admin only function allowing the consumers admin to remove a single policy from multiple consumers.
     * Note that the consumer admin needs to be the same for all consumers.
     *
     * @param _consumers The addresses of the consumer contracts.
     * @param _policy The address of the policy contract.
     */
    function removeGlobalPolicyForConsumers(
        address[] calldata _consumers,
        address _policy
    ) external;

    /**
     * @dev Admin only function allowing the consumers admin to add multiple policies to the consumers subscribed policies.
     * @param _consumer The address of the consumer contract.
     * @param _methodSigs The method signatures of the consumer contract to which the policies apply.
     * @param _policies The addresses of the policy contracts.
     *
     * NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded
     * version of the policy in the future, and / or a new vulnerability may be found in a policy at some
     * future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future,
     * preventing consumers from being able to subscribe to it in the future.
     *
     * While doesn't block already-subscribed consumers from using the policy, it is highly recommended
     * to have periodical reviews of the policies you are subscribed to and to make any required changes
     * accordingly.
     */
    function addPolicies(
        address _consumer,
        bytes4[] calldata _methodSigs,
        address[] calldata _policies
    ) external;

    /**
     * @dev Admin only function allowing the consumers admin to add a policy to the consumers subscribed policies.
     * @param _consumer The address of the consumer contract.
     * @param _methodSig The method signature of the consumer contract to which the policy applies.
     * @param _policy The address of the policy contract.
     *
     * NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded
     * version of the policy in the future, and / or a new vulnerability may be found in a policy at some
     * future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future,
     * preventing consumers from being able to subscribe to it in the future.
     *
     * While doesn't block already-subscribed consumers from using the policy, it is highly recommended
     * to have periodical reviews of the policies you are subscribed to and to make any required changes
     * accordingly.
     */
    function addPolicy(address _consumer, bytes4 _methodSig, address _policy) external;

    /**
     * @dev Admin only function allowing the consumers admin to remove multiple policies from the consumers subscribed policies.
     * @param _consumer The address of the consumer contract.
     * @param _methodSigs The method signatures of the consumer contract to which the policies apply.
     * @param _policies The addresses of the policy contracts.
     */
    function removePolicies(
        address _consumer,
        bytes4[] calldata _methodSigs,
        address[] calldata _policies
    ) external;

    /**
     * @dev Admin only function allowing the consumers admin to remove a policy from the consumers subscribed policies.
     * @param _consumer The address of the consumer contract.
     * @param _methodSig The method signature of the consumer contract to which the policy applies.
     * @param _policy The address of the policy contract.
     */
    function removePolicy(address _consumer, bytes4 _methodSig, address _policy) external;

    /**
     * @dev View function for retrieving a policy's approval status.
     * @param _policy The address of the policy contract.
     * @return status The approval status of the policy.
     */
    function approvedPolicies(address _policy) external view returns (bool);

    /**
     * @dev View function for retrieving a consumers dry-run mode status.
     * @param _consumer The address of the consumer contract.
     * @return status The dry-run mode status of the consumer.
     */
    function dryrunEnabled(address _consumer) external view returns (bool);

    /**
     * @dev View function for retrieving the version of the firewall contract.
     * @return version The version of the firewall contract.
     */
    function version() external view returns (uint256);
}
