// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IDynamicTransientApprovedCallsPolicy} from "../../interfaces/policies/IDynamicTransientApprovedCallsPolicy.sol";

contract DynamicTransientApprovedCallsPolicyMock {
    IDynamicTransientApprovedCallsPolicy public policy;

    constructor(address dynamicTransientApprovedCallsPolicy) {
        policy = IDynamicTransientApprovedCallsPolicy(dynamicTransientApprovedCallsPolicy);
    }

    function approveCallsAndReturnStorage(
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    )
        external
        returns (IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] memory approvedCalls)
    {
        policy.approveCalls(_callHashes, _expiration, _txOrigin, _nonce);
        approvedCalls = policy.getCurrentApprovedCalls();
    }

    function approveCallsViaSignatureAndReturnStorage(
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    )
        external
        returns (IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] memory approvedCalls)
    {
        policy.approveCallsViaSignature(_callHashes, _expiration, _txOrigin, _nonce, _signature);
        approvedCalls = policy.getCurrentApprovedCalls();
    }

    function approveCallsAndPreExecutionAndReturnStorage(
        IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        address _consumer,
        address _sender,
        bytes calldata _data,
        uint256 _value
    )
        external
        returns (IDynamicTransientApprovedCallsPolicy.AdvancedApprovedCall[] memory approvedCalls)
    {
        policy.approveCalls(_callHashes, _expiration, _txOrigin, _nonce);
        policy.preExecution(_consumer, _sender, _data, _value);
        approvedCalls = policy.getCurrentApprovedCalls();
    }
}
