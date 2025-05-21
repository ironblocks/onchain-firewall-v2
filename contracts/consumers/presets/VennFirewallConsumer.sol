// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {VennFirewallConsumerBase, Storage} from "../VennFirewallConsumerBase.sol";

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
        Storage.setAddressBySlot(FIREWALL_STORAGE_SLOT, _firewall);
        Storage.setAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT, _firewallAdmin);
    }
}
