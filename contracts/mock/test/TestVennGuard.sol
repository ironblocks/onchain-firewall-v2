// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {VennGuard} from "../../gnosis-safe/VennGuard.sol";

contract TestVennGuard is VennGuard {
    constructor() VennGuard(address(0), address(0), address(0), 0) {}

    function parseMultisendCall(
        bytes memory data
    ) external pure returns (address, uint256, bytes memory) {
        return _parseMultisendCall(data);
    }

    function packMultisendCall(
        uint8 callType,
        address target,
        uint256 value,
        bytes memory callData
    ) external pure returns (bytes memory) {
        return abi.encodePacked(callType, target, value, uint256(callData.length), callData);
    }

    function encodeSingleMultisendCall(
        uint8 callType,
        address target,
        uint256 value,
        bytes memory callData
    ) external pure returns (bytes memory) {
        bytes memory txData = abi.encodePacked(
            callType,
            target,
            value,
            uint256(callData.length),
            callData
        );
        bytes memory finalData = abi.encodeWithSignature("multiSend(bytes)", txData);
        return finalData;
    }

    function encodeDoubleMultisendCall(
        uint8 callType1,
        address target1,
        uint256 value1,
        bytes memory callData1,
        uint8 callType2,
        address target2,
        uint256 value2,
        bytes memory callData2
    ) external pure returns (bytes memory) {
        bytes memory txData = abi.encodePacked(
            callType1,
            target1,
            value1,
            uint256(callData1.length),
            callData1,
            callType2,
            target2,
            value2,
            uint256(callData2.length),
            callData2
        );
        bytes memory finalData = abi.encodeWithSignature("multiSend(bytes)", txData);
        return finalData;
    }
}
