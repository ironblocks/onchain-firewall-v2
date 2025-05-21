// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IFirewallPolicy} from "../../interfaces/policies/IFirewallPolicy.sol";

contract PolicyMock is IFirewallPolicy, AccessControlUpgradeable {
    event PreExecutionMock(address consumer, address sender, bytes data, uint256 value);
    event PostExecutionMock(address consumer, address sender, bytes data, uint256 value);

    event TaskPerformed(address sender, bytes data);

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    bool public preAlwaysFails;
    bool public postAlwaysFails;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function setPreAlwaysFails(bool _alwaysFails) external {
        preAlwaysFails = _alwaysFails;
    }

    function setPostAlwaysFails(bool _alwaysFails) external {
        postAlwaysFails = _alwaysFails;
    }

    function preExecution(
        address _consumer,
        address _sender,
        bytes calldata _data,
        uint256 _value
    ) external {
        if (preAlwaysFails) {
            revert("ConsumerMock: Pre always fails");
        }

        emit PreExecutionMock(_consumer, _sender, _data, _value);
    }

    function postExecution(
        address _consumer,
        address _sender,
        bytes calldata _data,
        uint256 _value
    ) external {
        if (postAlwaysFails) {
            revert("ConsumerMock: Post always fails");
        }

        emit PostExecutionMock(_consumer, _sender, _data, _value);
    }

    function performTask(bytes calldata _data) external {
        emit TaskPerformed(msg.sender, _data);
    }
}
