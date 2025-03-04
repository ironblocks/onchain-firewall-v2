// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {ProxyVennFirewallConsumer} from "./ProxyVennFirewallConsumer.sol";

/**
 * @title TransparentProxyVennFirewallConsumer
 * @notice This extension allows the Transparent Proxy Admin to initialize the Firewall Admin even if the contract was originally deployed
 * with a zero-address in the constructor or if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
 */
contract TransparentProxyVennFirewallConsumer is ProxyVennFirewallConsumer {
    // This slot is used to store the proxy admin address
    bytes32 private constant PROXY_ADMIN_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);

    function initializeFirewallAdmin(
        address _firewallAdmin
    ) external isAllowedInitializer(PROXY_ADMIN_SLOT) {
        _initializeFirewallAdmin(_firewallAdmin);
    }
}
