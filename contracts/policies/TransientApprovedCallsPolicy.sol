// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {FirewallPolicyBase} from "./FirewallPolicyBase.sol";

import {Transient} from "../libs/Transient.sol";
import {ApprovedCallsHelper} from "../libs/policies/ApprovedCallsHelper.sol";

import {SupportsSafeFunctionCalls} from "./helpers/SupportsSafeFunctionCalls.sol";

import {ITransientApprovedCallsPolicy} from "../interfaces/policies/ITransientApprovedCallsPolicy.sol";

/**
 * @dev This policy requires a transaction to a consumer to be signed and approved on chain before execution.
 *
 * This works by approving the ordered sequence of calls that must be made, and then asserting at each step
 * that the next call is as expected. Note that this doesn't assert that the entire sequence is executed.
 *
 * NOTE: Misconfiguration of the approved calls may result in legitimate transactions being reverted.
 * For example, transactions that also include internal calls must include the internal calls in the approved calls
 * hash in order for the policy to work as expected.
 *
 * If you have any questions on how or when to use this modifier, please refer to the Firewall's documentation
 * and/or contact our support.
 */
contract TransientApprovedCallsPolicy is
    ITransientApprovedCallsPolicy,
    FirewallPolicyBase,
    AccessControl,
    SupportsSafeFunctionCalls
{
    using Transient for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    mapping(address txOrigin => uint256 nonce) public nonces;

    constructor(address _firewallAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setExecutorStatus(_firewallAddress, true);
    }

    function preExecution(
        address _consumer,
        address _sender,
        bytes calldata _data,
        uint256 _value
    ) external isAuthorized(_consumer) {
        bytes32 nextHash = _popLatestCallHash();

        bytes32 callHash = ApprovedCallsHelper.getCallHash(
            _consumer,
            _sender,
            tx.origin,
            _data,
            _value
        );

        require(callHash == nextHash, "TransientApprovedCallsPolicy: Invalid call hash.");
    }

    /**
     * @dev This function is called after the execution of a transaction.
     * It does nothing in this policy.
     */
    function postExecution(address, address, bytes calldata, uint256) external {}

    function approveCalls(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) external onlyRole(SIGNER_ROLE) {
        _validateApprovedCalls(_callHashes, _expiration, _txOrigin, _nonce);

        _storeBytes32ArrayAtSlot(_callHashes);
        nonces[_txOrigin] = _nonce + 1;

        emit CallsApproved(_callHashes, _expiration, _txOrigin, _nonce);
    }

    function approveCallsViaSignature(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    ) external {
        _validateApprovedCalls(_callHashes, _expiration, _txOrigin, _nonce);
        _validateSignature(_callHashes, _expiration, _txOrigin, _nonce, _signature);

        _storeBytes32ArrayAtSlot(_callHashes);
        nonces[_txOrigin] = _nonce + 1;

        emit CallsApprovedViaSignature(_callHashes, _expiration, _txOrigin, _nonce, _signature);
    }

    function setExecutorStatus(address _caller, bool _status) external onlyRole(ADMIN_ROLE) {
        _setExecutorStatus(_caller, _status);
    }

    function setConsumersStatuses(
        address[] calldata _consumers,
        bool[] calldata _statuses
    ) external onlyRole(ADMIN_ROLE) {
        _setConsumersStatuses(_consumers, _statuses);
    }

    function _getCallHashesLength() internal view returns (uint256) {
        return uint256(bytes32(0).getValueBySlot());
    }

    function _validateApprovedCalls(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) internal view {
        require(_callHashes.length > 0, "TransientApprovedCallsPolicy: Calls empty.");
        require(_nonce == nonces[_txOrigin], "TransientApprovedCallsPolicy: Invalid nonce.");
        require(_expiration > block.timestamp, "TransientApprovedCallsPolicy: Expired.");
        require(tx.origin == _txOrigin, "TransientApprovedCallsPolicy: Invalid txOrigin.");
    }

    function _validateSignature(
        bytes32[] calldata _callHashes,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    ) internal view {
        // Note that we add address(this) to the message to prevent replay attacks across policies
        bytes32 messageHash = keccak256(
            abi.encode(_callHashes, _expiration, _txOrigin, _nonce, address(this), block.chainid)
        );
        bytes32 ethSignedMessageHash = ApprovedCallsHelper.getEthSignedMessageHash(messageHash);
        address signer = ApprovedCallsHelper.recoverSigner(ethSignedMessageHash, _signature);
        require(hasRole(SIGNER_ROLE, signer), "TransientApprovedCallsPolicy: Invalid signer.");
    }

    function _popLatestCallHash() internal returns (bytes32 callHash) {
        uint256 callHashesLength = _getCallHashesLength();
        require(callHashesLength > 0, "TransientApprovedCallsPolicy: Call hashes empty.");

        callHash = bytes32(callHashesLength).getValueBySlot();

        bytes32(0).setValueBySlot(bytes32(callHashesLength - 1));
    }

    function _storeBytes32ArrayAtSlot(bytes32[] memory _bytes32Array) internal {
        bytes32(0).setValueBySlot(bytes32(_bytes32Array.length));

        for (uint256 i = 0; i < _bytes32Array.length; i++) {
            bytes32(i + 1).setValueBySlot(_bytes32Array[i]);
        }
    }

    function getCurrentApprovedCalls() external view returns (bytes32[] memory approvedCalls) {
        uint256 length = uint256(bytes32(0).getValueBySlot());

        approvedCalls = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            approvedCalls[i] = bytes32(i + 1).getValueBySlot();
        }
    }

    function getCallHash(
        address _consumer,
        address _sender,
        address _origin,
        bytes memory _data,
        uint256 _value
    ) external pure returns (bytes32) {
        return ApprovedCallsHelper.getCallHash(_consumer, _sender, _origin, _data, _value);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, SupportsSafeFunctionCalls) returns (bool) {
        return
            SupportsSafeFunctionCalls.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }
}
