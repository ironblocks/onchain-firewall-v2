// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

contract FirewallMock {
    event PreExecution(address _sender, bytes _data, uint256 _value);
    event PostExecution(address _sender, bytes _data, uint256 _value);

    bool public preExecutionFails;
    bool public postExecutionFails;

    function preExecution(address _sender, bytes calldata _data, uint256 _value) external {
        if (preExecutionFails) {
            revert("Pre-execution failed");
        }

        emit PreExecution(_sender, _data, _value);
    }

    function postExecution(address _sender, bytes calldata _data, uint256 _value) external {
        if (postExecutionFails) {
            revert("Post-execution failed");
        }

        emit PostExecution(_sender, _data, _value);
    }

    function setPreExecutionFails(bool _preExecutionFails) external {
        preExecutionFails = _preExecutionFails;
    }

    function setPostExecutionFails(bool _postExecutionFails) external {
        postExecutionFails = _postExecutionFails;
    }
}
