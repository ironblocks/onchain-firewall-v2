// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {VennFirewallConsumer, Storage} from "../../../consumers/presets/VennFirewallConsumer.sol";
import {Transient} from "../../../consumers/VennFirewallConsumerBase.sol";

contract VennFirewallConsumerMock is VennFirewallConsumer {
    bytes32 private constant SAFE_FUNCTION_CALLER_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.caller")) - 1);

    bytes32 private constant SAFE_FUNCTION_CALL_FLAG_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.call.flag")) - 1);

    constructor(
        address _firewall,
        address _firewallAdmin
    ) VennFirewallConsumer(_firewall, _firewallAdmin) {}

    function getFirewall() external view returns (address) {
        return Storage.getAddressBySlot(FIREWALL_STORAGE_SLOT);
    }

    function getSafeFunctionCaller() external view returns (address) {
        return Transient.getAddressBySlot(SAFE_FUNCTION_CALLER_SLOT);
    }

    function getSafeFunctionCallFlag() external view returns (uint256) {
        return Transient.getUint256BySlot(SAFE_FUNCTION_CALL_FLAG_SLOT);
    }
}
