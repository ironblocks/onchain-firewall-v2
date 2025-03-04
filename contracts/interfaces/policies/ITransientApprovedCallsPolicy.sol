// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IFirewallPolicyBase} from "./IFirewallPolicyBase.sol";

/**
 * @title ITransientApprovedCallsPolicy
 * @notice Interface for the TransientApprovedCallsPolicy contract.
 */
interface ITransientApprovedCallsPolicy is IFirewallPolicyBase {
    /**
     * @dev Emitted when the calls are approved.
     * @param callHashes The call hashes that were approved.
     * @param expiration The expiration timestamp of the signature.
     * @param txOrigin The address that initiated the transaction.
     */
    event CallsApproved(bytes32[] callHashes, uint256 expiration, address txOrigin);

    /**
     * @dev Emitted when the calls are approved via a signature.
     * @param callHashes The call hashes that were approved.
     * @param expiration The expiration timestamp of the signature.
     * @param txOrigin The address that initiated the transaction.
     * @param nonce The nonce for the transaction.
     * @param signature The signature of the signer with the above parameters.
     */
    event CallsApprovedViaSignature(
        bytes32[] callHashes,
        uint256 expiration,
        address txOrigin,
        uint256 nonce,
        bytes signature
    );

    /**
     * @dev Allows anyone to approve a call with a signers signature.
     * @param _callHashes The call hashes to approve.
     * @param _expiration The expiration time of these approved calls
     * @param _txOrigin The transaction origin of the approved hashes.
     * @param _nonce Used to prevent replay attacks.
     * @param _signature The signature of the signer with the above parameters.
     */
    function approveCallsViaSignature(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes memory _signature
    ) external;

    /**
     * @dev Allows a signer to approve a call.
     * @param _callHashes The call hashes to approve.
     * @param _expiration The expiration time of these approved calls
     * @param _txOrigin The transaction origin of the approved hashes.
     * @param _nonce The nonce for the transaction.
     */
    function approveCalls(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) external;

    /**
     * @dev The admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev The signer role.
     * @return The signer role.
     */
    function SIGNER_ROLE() external view returns (bytes32);

    /**
     * @dev The nonce for a given txOrigin.
     * @param txOrigin The transaction origin.
     * @return The nonce.
     */
    function nonces(address txOrigin) external view returns (uint256);
}
