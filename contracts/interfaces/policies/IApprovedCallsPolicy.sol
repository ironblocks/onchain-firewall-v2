// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IApprovedCallsPolicy
 */
interface IApprovedCallsPolicy {
    /**
     * @dev Approves a set of calls via a signature.
     * @param _callHashes The hashes of the calls to approve.
     * @param _expiration The expiration timestamp of the signature.
     * @param _txOrigin The address that initiated the transaction.
     * @param _nonce The nonce for the transaction.
     * @param _signature The signature of the transaction.
     */
    function approveCallsViaSignature(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes memory _signature
    ) external;
}
