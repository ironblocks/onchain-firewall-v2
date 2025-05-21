// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {VennFirewallConsumer} from "../../consumers/presets/VennFirewallConsumer.sol";

contract MulticallVennConsumer is VennFirewallConsumer {
    constructor(address _firewall) VennFirewallConsumer(_firewall, msg.sender) {}

    function multicall(
        address[] calldata _targets,
        bytes[] calldata _data,
        uint256[] calldata _values
    ) external payable firewallProtected returns (bytes[] memory results) {
        require(
            _targets.length == _data.length,
            "MulticallVennConsumer: Targets and data length mismatch."
        );
        require(
            _targets.length == _values.length,
            "MulticallVennConsumer: Targets and values length mismatch."
        );

        uint256 totalValue = 0;
        for (uint256 i = 0; i < _values.length; i++) {
            totalValue += _values[i];
        }
        require(
            totalValue == _msgValue(),
            "MulticallVennConsumer: Total value does not match msg.value."
        );

        results = new bytes[](_targets.length);
        for (uint256 i = 0; i < _targets.length; i++) {
            (bool success, bytes memory result) = _targets[i].call{value: _values[i]}(_data[i]);
            if (!success) {
                revert("MulticallVennConsumer: Call failed.");
            }

            results[i] = result;
        }
    }

    function version() external pure returns (uint256) {
        return 1;
    }
}
