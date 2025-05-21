// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {FirewallPolicyBase} from "../../policies/FirewallPolicyBase.sol";

contract FirewallPolicyBaseMock is FirewallPolicyBase {
    function setConsumersStatuses(
        address[] calldata _consumers,
        bool[] calldata _statuses
    ) external override {
        _setConsumersStatuses(_consumers, _statuses);
    }

    function setExecutorStatus(address _caller, bool _status) external override {
        _setExecutorStatus(_caller, _status);
    }

    function preExecution(address, address, bytes memory, uint256) external override {}

    function postExecution(address, address, bytes memory, uint256) external override {}

    function onlyAuthorized(address _consumer) external view isAuthorized(_consumer) {}
}
