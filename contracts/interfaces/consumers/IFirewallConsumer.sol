// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IFirewallConsumer
 * @notice Interface for the Firewall Consumer contract.
 */
interface IFirewallConsumer {
    /**
     * @notice Returns the address of the firewall admin.
     * @return address The address of the firewall admin.
     */
    function firewallAdmin() external view returns (address);
}
