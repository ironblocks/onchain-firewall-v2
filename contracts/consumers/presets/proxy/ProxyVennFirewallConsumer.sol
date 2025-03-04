// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025

pragma solidity ^0.8.25;

import {VennFirewallConsumerBase} from "../../VennFirewallConsumerBase.sol";

import {IOwnable} from "../../../interfaces/IOwnable.sol";
import {IProxyVennFirewallConsumer} from "../../../interfaces/consumers/proxy/IProxyVennFirewallConsumer.sol";

/**
 * @title ProxyVennFirewallConsumer
 * @notice This extension allows the Proxy Owner to initialize the Firewall Admin even if the contract was originally deployed
 * with a zero-address in the constructor or if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
 */
abstract contract ProxyVennFirewallConsumer is
    IProxyVennFirewallConsumer,
    VennFirewallConsumerBase
{
    modifier isAllowedInitializer(bytes32 _adminMemorySlot) {
        address initializerAddress = _getAddressBySlot(_adminMemorySlot);
        address initializerOwner = IOwnable(initializerAddress).owner();
        require(
            msg.sender == initializerOwner,
            "ProxyFirewallConsumerBase: Sender is not allowed."
        );

        _;
    }

    /**
     * @dev Beacon Proxy Owner only function, allows the Beacon Proxy Owner to initialize the firewall admin in the following cases:
     * - If the contract was originally deployed with a zero-address in the constructor (for various reasons);
     * - Or, if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
     * @param _firewallAdmin The address of the firewall admin.
     */
    function _initializeFirewallAdmin(address _firewallAdmin) internal {
        require(_firewallAdmin != address(0), "ProxyFirewallConsumerBase: Zero address.");
        require(
            _getAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT) == address(0),
            "ProxyFirewallConsumerBase: Admin already set."
        );

        _setAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT, _firewallAdmin);
    }
}
