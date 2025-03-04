// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IPolicyDeployer
 * @notice Interface for the PolicyDeployer contract.
 */
interface IPolicyDeployer {
    /**
     * @dev Emitted when a policy is created.
     * @param factory The factory that created the policy.
     * @param policy The policy that was created.
     */
    event PolicyCreated(address indexed factory, address policy);

    /**
     * @dev Emitted when the factory status is set.
     * @param factory The factory that had its status set.
     * @param status The status that was set.
     */
    event FactoryStatusSet(address indexed factory, bool status);

    /**
     * @dev Emitted when the firewall module is set.
     * @param firewallModule The firewall module that was set.
     */
    event FirewallModuleSet(address indexed firewallModule);

    /**
     * @dev Deploy policies.
     * @param _firewall The firewall to approve the policies with.
     * @param _factories The factories to create the policies with.
     * @param _createData The data to create the policies with.
     * @return policies The addresses of the new policies.
     */
    function deployPolicies(
        address _firewall,
        address[] calldata _factories,
        bytes[] calldata _createData
    ) external returns (address[] memory policies);

    /**
     * @dev Set the statuses of the factories.
     * @param _factories The factories to set the statuses of.
     * @param _statuses The statuses to set.
     */
    function setFactoryStatuses(address[] calldata _factories, bool[] calldata _statuses) external;

    /**
     * @dev Set the firewall module.
     * @param _firewallModule The firewall module to set.
     */
    function setFirewallModule(address _firewallModule) external;

    /**
     * @dev Get the admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the status of a factory.
     * @param _factory The factory to get the status of.
     * @return The status of the factory.
     */
    function approvedFactories(address _factory) external view returns (bool);

    /**
     * @dev Get the firewall module.
     * @return The firewall module.
     */
    function firewallModule() external view returns (address);
}
