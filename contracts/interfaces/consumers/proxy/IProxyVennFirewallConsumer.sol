// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025

pragma solidity ^0.8.25;

import {IVennFirewallConsumerBase} from "../IVennFirewallConsumerBase.sol";

/**
 * @title IProxyVennFirewallConsumer
 * @notice This extension allows the Proxy Owner to initialize the Firewall Admin even if the contract was originally deployed
 * with a zero-address in the constructor or if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
 */
interface IProxyVennFirewallConsumer is IVennFirewallConsumerBase {
    /**
     * @dev Proxy Admin only function, allows the Proxy Admin to initialize the firewall admin in the following cases:
     * - If the contract was originally deployed with a zero-address in the constructor (for various reasons);
     * - Or, if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
     * @param _firewallAdmin The address of the firewall admin.
     */
    function initializeFirewallAdmin(address _firewallAdmin) external;
}
