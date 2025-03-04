// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {ProxyVennFirewallConsumer} from "./ProxyVennFirewallConsumer.sol";

/**
 * @title BeaconProxyVennFirewallConsumer
 * @notice This extension allows the Beacon Proxy Owner to initialize the Firewall Admin even if the contract was originally deployed
 * with a zero-address in the constructor or if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
 */
contract BeaconProxyVennFirewallConsumer is ProxyVennFirewallConsumer {
    // This slot is used to store the beacon address
    bytes32 private constant BEACON_SLOT = bytes32(uint256(keccak256("eip1967.proxy.beacon")) - 1);

    function initializeFirewallAdmin(
        address _firewallAdmin
    ) external isAllowedInitializer(BEACON_SLOT) {
        _initializeFirewallAdmin(_firewallAdmin);
    }
}
