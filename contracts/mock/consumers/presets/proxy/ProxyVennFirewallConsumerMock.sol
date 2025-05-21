// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {ProxyVennFirewallConsumer, Storage} from "../../../../consumers/presets/proxy/ProxyVennFirewallConsumer.sol";

contract ProxyVennFirewallConsumerMock is ProxyVennFirewallConsumer {
    address public initializerAddress;

    function initializeFirewallAdmin(address _firewallAdmin) external override {
        _initializeFirewallAdmin(_firewallAdmin);
    }

    function getNewFirewallAdmin() external view returns (address) {
        return Storage.getAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT);
    }

    function setInitializerAddress(address _initializerAddress) external {
        initializerAddress = _initializerAddress;
    }

    function isAllowedInitializerFunction(
        bytes32 _adminMemorySlot
    ) external view isAllowedInitializer(_adminMemorySlot) {}
}
