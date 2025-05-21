// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IProtocolRegistry} from "../IProtocolRegistry.sol";

/**
 * @title IFeePool
 * @notice Interface for the FeePool contract.
 */
interface IFeePool {
    /**
     * @dev Emitted when the protocol registry is set.
     * @param protocolRegistry The address of the protocol registry.
     */
    event ProtocolRegistrySet(address protocolRegistry);

    /**
     * @dev Emitted when the venn fee calculator is set.
     * @param vennFeeCalculator The address of the venn fee calculator.
     */
    event VennFeeCalculatorSet(address vennFeeCalculator);

    /**
     * @dev Emitted when native fees are deposited for a policy.
     * @param _policy The address of the policy.
     * @param _amount The amount of fees deposited.
     */
    event NativeFeesDeposited(address _policy, uint256 _amount);

    /**
     * @dev Emitted when rescued fees are deposited.
     * @param _amount The amount of fees deposited.
     */
    event RescuedFeesDeposited(uint256 _amount);

    /**
     * @dev Emitted when rescued fees are withdrawn.
     * @param _recipient The address of the recipient.
     * @param _amount The amount of fees withdrawn.
     */
    event RescuedFeesWithdrawn(address _recipient, uint256 _amount);

    /**
     * @dev Emitted when fees are withdrawn.
     * @param _recipient The address of the recipient.
     * @param _amount The amount of fees withdrawn.
     */
    event FeesWithdrawn(address _recipient, uint256 _amount);

    /**
     * @dev Emitted when native fees are claimed from a policy.
     * @param _policy The address of the policy.
     * @param _amount The amount of fees claimed.
     */
    event NativeFeeClaimed(address _policy, uint256 _amount);

    /**
     * @dev Emitted when the policy native fee amount is set.
     * @param _policy The address of the policy.
     * @param _amount The amount of fees to set.
     */
    event PolicyNativeFeeAmountSet(address _policy, uint256 _amount);

    /**
     * @dev Withdraw fees from the fee pool.
     * @param _recipient The address to receive the fees.
     * @param _amount The amount of fees to withdraw.
     */
    function withdrawFees(address payable _recipient, uint256 _amount) external;

    /**
     * @dev Withdraw rescued fees from the fee pool.
     * @param _recipient The address to receive the fees.
     * @param _amount The amount of fees to withdraw.
     */
    function withdrawRescuedFees(address payable _recipient, uint256 _amount) external;

    /**
     * @dev Deposit rescued fees into the fee pool.
     */
    function depositRescuedFees() external payable;

    /**
     * @dev Deposit native fees for a policy.
     * @param _policy The address of the policy.
     */
    function depositNativeForPolicy(address _policy) external payable;

    /**
     * @dev Claim native fees from a policy.
     * @param _policy The address of the policy.
     * @param _taskDefinitionId The ID of the task definition for the policy.
     */
    function claimNativeFeeFromPolicy(address _policy, uint16 _taskDefinitionId) external;

    /**
     * @dev Set the protocol registry.
     * @param _protocolRegistry The address of the protocol registry.
     */
    function setProtocolRegistry(address _protocolRegistry) external;

    /**
     * @dev Set the venn fee calculator.
     * @param _vennFeeCalculator The address of the venn fee calculator.
     */
    function setVennFeeCalculator(address _vennFeeCalculator) external;

    /**
     * @dev Get the required native amount for a policy.
     * @param _policy The address of the policy.
     * @param _taskDefinitionId The ID of the task definition for the policy.
     * @return The required native amount.
     */
    function getRequiredNativeAmountForPolicy(
        address _policy,
        uint16 _taskDefinitionId
    ) external view returns (uint256);

    /**
     * @dev Get the total required native amount for a list of policies.
     * @param _policies The list of policy addresses.
     * @param _taskDefinitionIds The list of task definition IDs.
     * @return The total required native amount.
     */
    function getTotalRequiredNativeAmountForPolicies(
        address[] calldata _policies,
        uint16[] calldata _taskDefinitionIds
    ) external view returns (uint256);

    /**
     * @dev Get the admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the fee claimer role.
     * @return The fee claimer role.
     */
    function FEE_CLAIMER_ROLE() external view returns (bytes32);

    /**
     * @dev Get the fee withdrawer role.
     * @return The fee withdrawer role.
     */
    function FEE_WITHDRAWER_ROLE() external view returns (bytes32);

    /**
     * @dev Get the protocol registry address.
     * @return The address of the protocol registry.
     */
    function protocolRegistry() external view returns (IProtocolRegistry);

    /**
     * @dev Get the collected native fees.
     * @return The collected native fees.
     */
    function collectedNativeFees() external view returns (uint256);

    /**
     * @dev Get the collected rescued fees.
     * @return The collected rescued fees.
     */
    function collectedRescuedFees() external view returns (uint256);

    /**
     * @dev Get the policy balance.
     * @param _policy The address of the policy.
     * @return The policy balance.
     */
    function policyBalance(address _policy) external view returns (uint256);

    /**
     * @dev Get the version of the fee pool.
     * @return The version of the fee pool.
     */
    function version() external view returns (uint256);
}
