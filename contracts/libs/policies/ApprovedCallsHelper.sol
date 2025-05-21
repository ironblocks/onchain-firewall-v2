// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ApprovedCallsHelper
 * @notice Library for approved calls helper functions.
 */
library ApprovedCallsHelper {
    /**
     * @dev Function to get the hash of a call.
     * @param _consumer The address of the contract that is being called.
     * @param _sender The address of the account that is calling the contract.
     * @param _origin The address of the account that originated the call.
     * @param _data The data that is being sent to the contract.
     * @param _value The amount of value that is being sent to the contract.
     * @return The hash of the call.
     */
    function getCallHash(
        address _consumer,
        address _sender,
        address _origin,
        bytes memory _data,
        uint256 _value
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_consumer, _sender, _origin, _data, _value));
    }

    /**
     * @dev Function to get a signed hash of a message that has been signed with the Ethereum prefix.
     * @param _messageHash The hash of the message.
     */
    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return ECDSA.toEthSignedMessageHash(_messageHash);
    }

    /**
     * @dev Function to recover the signer of a message.
     * @param _ethSignedMessageHash The hash of the message that was signed.
     * @param _signature The signature of the message.
     * @return The address of the signer.
     */
    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes calldata _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ECDSA.recover(_ethSignedMessageHash, v, r, s);
    }

    /**
     * @dev Function to split a signature into its r, s, and v components.
     * @param _sig The signature to split.
     * @return r The r component of the signature.
     * @return s The s component of the signature.
     * @return v The v component of the signature.
     */
    function splitSignature(
        bytes memory _sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_sig.length == 65, "ApprovedCallsHelper: Invalid signature length.");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(_sig, 32))
            // second 32 bytes
            s := mload(add(_sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(_sig, 96)))
        }

        // implicitly return (r, s, v)
    }
}
