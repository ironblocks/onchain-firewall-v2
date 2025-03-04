// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IFirewallModule
 * @notice Interface for the Firewall Module.
 */
interface IFirewallModule {
    /**
     * @dev Emitted when a deployer is approved.
     * @param deployer The address of the deployer.
     * @param status The status of the deployer.
     */
    event DeployerStatusSet(address indexed deployer, bool status);

    /**
     * @dev Emitted when a firewall is approved.
     * @param firewall The address of the firewall.
     * @param status The status of the firewall.
     */
    event FirewallStatusSet(address indexed firewall, bool status);

    /**
     * @dev Approve a policy to be used by a firewall.
     * @param _policy The policy to approve.
     * @param _firewall The firewall to approve.
     */
    function approvePolicy(address _policy, address _firewall) external;

    /**
     * @dev Set the status of a list of deployers.
     * @param _deployers The list of deployers to set the status of.
     * @param _status The status to set.
     */
    function setDeployersStatus(address[] calldata _deployers, bool _status) external;

    /**
     * @dev Set the status of a list of firewalls.
     * @param _firewalls The list of firewalls to set the status of.
     * @param _status The status to set.
     */
    function setFirewallsStatus(address[] calldata _firewalls, bool _status) external;

    /**
     * @dev Get the gnosis safe address.
     * @return The gnosis safe address.
     */
    function gnosisSafe() external view returns (address);

    /**
     * @dev Get the status of a deployer.
     * @param _deployer The deployer to get the status of.
     * @return The status of the deployer.
     */
    function approvedDeployers(address _deployer) external view returns (bool);

    /**
     * @dev Get the status of a firewall.
     * @param _firewall The firewall to get the status of.
     * @return The status of the firewall.
     */
    function approvedFirewalls(address _firewall) external view returns (bool);
}
