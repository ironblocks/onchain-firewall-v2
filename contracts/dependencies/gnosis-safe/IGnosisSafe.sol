// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;
interface IGnosisSafe {
    enum Operation {
        Call,
        DelegateCall
    }
    /// @dev Allows a Module to execute a Safe transaction without any further confirmations.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation
    ) external returns (bool success);
    function nonce() external view returns (uint);
    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external view returns (bytes32 txHash);
    function checkSignatures(
        address executor,
        bytes32 dataHash,
        bytes memory signatures
    ) external view;
    function checkSignatures(
        bytes32 dataHash,
        bytes calldata data,
        bytes memory signatures
    ) external view;
    function domainSeparator() external view returns (bytes32);
}
