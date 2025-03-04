// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {VennFirewallConsumerBase} from "../VennFirewallConsumerBase.sol";

/**
 * @title VennFirewallConsumer
 * @author David Benchimol @ Ironblocks
 * @dev This contract is a parent contract that can be used to add firewall protection to any contract.
 *
 * The contract must define a firewall contract which will manage the policies that are applied to the contract.
 * It also must define a firewall admin which will be able to add and remove policies.
 */
contract VennFirewallConsumer is VennFirewallConsumerBase {
    constructor(address _firewall, address _firewallAdmin) {
        _setAddressBySlot(FIREWALL_STORAGE_SLOT, _firewall);
        _setAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT, _firewallAdmin);
        _setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, CALLER_NOT_SET);
        _setValueBySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, INACTIVE);
    }
}
