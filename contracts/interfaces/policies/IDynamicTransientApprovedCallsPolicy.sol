// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity 0.8.25;

import {IFirewallPolicyBase} from "./IFirewallPolicyBase.sol";

/**
 * @title IDynamicTransientApprovedCallsPolicy
 * @notice Interface for the DynamicTransientApprovedCallsPolicy contract.
 */
interface IDynamicTransientApprovedCallsPolicy is IFirewallPolicyBase {
    /**
     * @dev The structure that defines an approved call.
     * @param callHash The hash of the call.
     * @param maxValues The maximum values for the call.
     * @param minValues The minimum values for the call.
     */
    struct AdvancedApprovedCall {
        bytes32 callHash;
        uint256[] maxValues;
        uint256[] minValues;
    }

    /**
     * @dev Emitted when the calls are approved.
     * @param advancedCalls The advanced approved calls.
     * @param expiration The expiration timestamp of the signature.
     * @param txOrigin The address that initiated the transaction.
     * @param nonce The nonce for the transaction.
     */
    event CallsApproved(
        AdvancedApprovedCall[] advancedCalls,
        uint256 expiration,
        address txOrigin,
        uint256 nonce
    );

    /**
     * @dev Emitted when the calls are approved via a signature.
     * @param advancedCalls The advanced approved calls.
     * @param expiration The expiration timestamp of the signature.
     * @param txOrigin The address that initiated the transaction.
     * @param nonce The nonce for the transaction.
     * @param signature The signature of the transaction.
     */
    event CallsApprovedViaSignature(
        AdvancedApprovedCall[] advancedCalls,
        uint256 expiration,
        address txOrigin,
        uint256 nonce,
        bytes signature
    );

    /**
     * @dev Emitted when the uint slice indices are set.
     * @param sigHash The sighash of the call.
     * @param uintIndices The uint slice indices.
     */
    event SighashUintIndicesSet(bytes4 indexed sigHash, uint256[] uintIndices);

    /**
     * @dev Approves a set of calls via a signature.
     * @param _advancedCalls The advanced approved calls.
     * @param _expiration The expiration timestamp of the signature.
     * @param _txOrigin The address that initiated the transaction.
     * @param _nonce The nonce for the transaction.
     */
    function approveCalls(
        AdvancedApprovedCall[] calldata _advancedCalls,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) external;

    /**
     * @dev Approves a set of calls via a signature.
     * @param _advancedCalls The advanced approved calls.
     * @param _expiration The expiration timestamp of the signature.
     * @param _txOrigin The address that initiated the transaction.
     * @param _nonce The nonce for the transaction.
     * @param _signature The signature of the transaction.
     */
    function approveCallsViaSignature(
        AdvancedApprovedCall[] calldata _advancedCalls,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    ) external;

    /**
     * @dev Sets the uint slice indices for a given sighash.
     * @param _sigHash The sighash to set the uint slice indices for.
     * @param _uintIndices The uint slice indices to set.
     */
    function setSighashUintIndices(bytes4 _sigHash, uint256[] calldata _uintIndices) external;

    /**
     * @dev The admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev The role that is allowed to approve calls.
     * @return The role that is allowed to approve calls.
     */
    function SIGNER_ROLE() external view returns (bytes32);

    /**
     * @dev The nonce for a given txOrigin.
     * @param txOrigin The address to get the nonce for.
     * @return The nonce for the given txOrigin.
     */
    function nonces(address txOrigin) external view returns (uint256);
}
