// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {ITransientApprovedCallsPolicy} from "../../interfaces/policies/ITransientApprovedCallsPolicy.sol";

contract TransientApprovedCallsPolicyMock {
    ITransientApprovedCallsPolicy public policy;

    constructor(address transientApprovedCallsPolicy) {
        policy = ITransientApprovedCallsPolicy(transientApprovedCallsPolicy);
    }

    function approveCallsAndReturnStorage(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) external returns (bytes32[] memory approvedCalls) {
        policy.approveCalls(_callHashes, _expiration, _txOrigin, _nonce);
        approvedCalls = policy.getCurrentApprovedCalls();
    }

    function approveCallsViaSignatureAndReturnStorage(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    ) external returns (bytes32[] memory approvedCalls) {
        policy.approveCallsViaSignature(_callHashes, _expiration, _txOrigin, _nonce, _signature);
        approvedCalls = policy.getCurrentApprovedCalls();
    }

    function approveCallsAndPreExecutionAndReturnStorage(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        address _consumer,
        address _sender,
        bytes calldata _data,
        uint256 _value
    ) external returns (bytes32[] memory approvedCalls) {
        policy.approveCalls(_callHashes, _expiration, _txOrigin, _nonce);
        policy.preExecution(_consumer, _sender, _data, _value);
        approvedCalls = policy.getCurrentApprovedCalls();
    }
}
