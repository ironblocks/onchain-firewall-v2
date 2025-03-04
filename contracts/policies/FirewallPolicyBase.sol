// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IFirewallPolicyBase} from "../interfaces/policies/IFirewallPolicyBase.sol";

abstract contract FirewallPolicyBase is IFirewallPolicyBase {
    bytes32 public constant POLICY_ADMIN_ROLE = keccak256("POLICY_ADMIN_ROLE");

    mapping(address executor => bool authorized) public authorizedExecutors;
    mapping(address consumer => bool approved) public approvedConsumer;

    /**
     * @dev Modifier to check if the consumer is authorized to execute the function.
     */
    modifier isAuthorized(address _consumer) {
        require(authorizedExecutors[msg.sender], "FirewallPolicyBase: Only authorized executor.");
        require(approvedConsumer[_consumer], "FirewallPolicyBase: Only approved consumers.");
        _;
    }

    function _setConsumersStatuses(
        address[] calldata _consumers,
        bool[] calldata _statuses
    ) internal {
        for (uint256 i = 0; i < _consumers.length; i++) {
            approvedConsumer[_consumers[i]] = _statuses[i];

            emit ConsumerStatusSet(_consumers[i], _statuses[i]);
        }
    }
    function _setExecutorStatus(address _caller, bool _status) internal {
        authorizedExecutors[_caller] = _status;

        emit ExecutorStatusSet(_caller, _status);
    }
}
