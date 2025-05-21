// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IFirewallConsumer} from "../interfaces/consumers/IFirewallConsumer.sol";
import {IFirewall} from "../interfaces/IFirewall.sol";

contract ConsumerMock is IFirewallConsumer {
    address public firewallAdmin;
    address public firewall;

    constructor(address _firewall) {
        firewall = _firewall;

        firewallAdmin = msg.sender;
    }

    function setFirewall(address _firewall) external {
        firewall = _firewall;
    }

    function setFirewallAdmin(address _firewallAdmin) external {
        firewallAdmin = _firewallAdmin;
    }

    function preExecution(address _sender, bytes calldata _data, uint256 _value) external {
        IFirewall(firewall).preExecution(_sender, _data, _value);
    }

    function postExecution(address _sender, bytes calldata _data, uint256 _value) external {
        IFirewall(firewall).postExecution(_sender, _data, _value);
    }
}
