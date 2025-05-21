// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity 0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {FirewallPolicyBase} from "./FirewallPolicyBase.sol";

import {Transient} from "../libs/Transient.sol";
import {ApprovedCallsHelper} from "../libs/policies/ApprovedCallsHelper.sol";

import {SupportsSafeFunctionCalls} from "./helpers/SupportsSafeFunctionCalls.sol";

import {IDynamicTransientApprovedCallsPolicy} from "../interfaces/policies/IDynamicTransientApprovedCallsPolicy.sol";

/**
 * @dev This policy requires a transaction to a consumer to be signed and approved on chain before execution.
 * This policy allows flexibility within certain calls, allowing uint256 types values to be
 * within a range rather than being an exact value during execution.
 *
 * This contract also makes use of transient storage, leading to significant gas savings. This should be used
 * on any chain which supports transient storage opcodes.
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
contract DynamicTransientApprovedCallsPolicy is
    IDynamicTransientApprovedCallsPolicy,
    FirewallPolicyBase,
    AccessControl,
    SupportsSafeFunctionCalls
{
    using Transient for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    mapping(address txOrigin => uint256 nonce) public nonces;

    mapping(bytes4 sigHash => uint256[] uintSliceIndices) public sighashUintIndices;

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
        AdvancedApprovedCall memory advancedCall = _popAdvancedApprovedCalls();

        bytes4 sigHash = bytes4(_data);

        bytes memory slicedData;

        uint256[] memory uintIndices = sighashUintIndices[sigHash];
        uint256 uintIndicesLength = uintIndices.length;
        for (uint256 i = 0; i < uintIndicesLength; i++) {
            uint256 uintIndex = uintIndices[i];
            uint256 sliceIndex = i == 0 ? 0 : uintIndices[i - 1] + 32;

            slicedData = abi.encodePacked(slicedData, _data[sliceIndex:uintIndex]);

            uint256 uintValue = abi.decode(_data[uintIndex:uintIndex + 32], (uint256));

            require(
                uintValue >= advancedCall.minValues[i],
                "DynamicTransientApprovedCallsPolicy: Value too low."
            );
            require(
                uintValue <= advancedCall.maxValues[i],
                "DynamicTransientApprovedCallsPolicy: Value too high."
            );
        }

        slicedData = uintIndicesLength > 0
            ? abi.encodePacked(slicedData, _data[uintIndices[uintIndicesLength - 1] + 32:])
            : _data;

        bytes32 nextDynamicCallHash = ApprovedCallsHelper.getCallHash(
            _consumer,
            _sender,
            tx.origin,
            slicedData,
            _value
        );

        require(
            nextDynamicCallHash == advancedCall.callHash,
            "DynamicTransientApprovedCallsPolicy: Invalid call hash."
        );
    }

    /**
     * @dev This function is called after the execution of a transaction.
     * It does nothing in this policy.
     */
    function postExecution(address, address, bytes calldata, uint256) external {}

    function approveCalls(
        AdvancedApprovedCall[] calldata _advancedCalls,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) external onlyRole(SIGNER_ROLE) {
        _validateApprovedCalls(_advancedCalls, _expiration, _txOrigin, _nonce);

        _setAdvancedApprovedCalls(_advancedCalls);
        nonces[_txOrigin] = _nonce + 1;

        emit CallsApproved(_advancedCalls, _expiration, _txOrigin, _nonce);
    }

    function approveCallsViaSignature(
        AdvancedApprovedCall[] calldata _advancedCalls,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    ) external {
        _validateApprovedCalls(_advancedCalls, _expiration, _txOrigin, _nonce);
        _validateSignature(_advancedCalls, _expiration, _txOrigin, _nonce, _signature);

        _setAdvancedApprovedCalls(_advancedCalls);
        nonces[_txOrigin] = _nonce + 1;

        emit CallsApprovedViaSignature(_advancedCalls, _expiration, _txOrigin, _nonce, _signature);
    }

    function setSighashUintIndices(
        bytes4 _sigHash,
        uint256[] calldata _uintIndices
    ) external onlyRole(SIGNER_ROLE) {
        sighashUintIndices[_sigHash] = _uintIndices;

        emit SighashUintIndicesSet(_sigHash, _uintIndices);
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

    function _getAdvancedApprovedCallsLength() internal view returns (uint256) {
        return uint256(bytes32(0).getValueBySlot());
    }

    function _validateApprovedCalls(
        AdvancedApprovedCall[] calldata _advancedCalls,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce
    ) internal view {
        require(_advancedCalls.length > 0, "DynamicTransientApprovedCallsPolicy: Calls empty.");
        require(
            _nonce == nonces[_txOrigin],
            "DynamicTransientApprovedCallsPolicy: Invalid nonce."
        );
        require(_expiration > block.timestamp, "DynamicTransientApprovedCallsPolicy: Expired.");
        require(tx.origin == _txOrigin, "DynamicTransientApprovedCallsPolicy: Invalid txOrigin.");
    }

    function _validateSignature(
        AdvancedApprovedCall[] calldata _advancedCalls,
        uint256 _expiration,
        address _txOrigin,
        uint256 _nonce,
        bytes calldata _signature
    ) internal view {
        // Note that we add address(this) to the message to prevent replay attacks across policies
        bytes32 messageHash = keccak256(
            abi.encode(
                _advancedCalls,
                _expiration,
                _txOrigin,
                _nonce,
                address(this),
                block.chainid
            )
        );
        bytes32 ethSignedMessageHash = ApprovedCallsHelper.getEthSignedMessageHash(messageHash);
        address signer = ApprovedCallsHelper.recoverSigner(ethSignedMessageHash, _signature);
        require(
            hasRole(SIGNER_ROLE, signer),
            "DynamicTransientApprovedCallsPolicy: Invalid signer."
        );
    }

    function _popAdvancedApprovedCalls()
        internal
        returns (AdvancedApprovedCall memory advancedCall)
    {
        uint256 advancedCallsLength = _getAdvancedApprovedCallsLength();
        require(advancedCallsLength > 0, "DynamicTransientApprovedCallsPolicy: Calls empty.");

        advancedCall = _getAdvancedApprovedCall(advancedCallsLength - 1);

        bytes32(0).setValueBySlot(bytes32(advancedCallsLength - 1));
    }

    function _setAdvancedApprovedCalls(AdvancedApprovedCall[] calldata _advancedCalls) internal {
        bytes32(0).setValueBySlot(bytes32(_advancedCalls.length));

        for (uint256 i = 0; i < _advancedCalls.length; i++) {
            uint256 maxValuesLength = _advancedCalls[i].maxValues.length;
            uint256 minValuesLength = _advancedCalls[i].minValues.length;

            require(
                maxValuesLength == minValuesLength,
                "DynamicTransientApprovedCallsPolicy: Max values and min values length mismatch."
            );

            bytes32(i + 1).setValueBySlot(_advancedCalls[i].callHash);

            bytes32 maxValuesStart = bytes32(keccak256(abi.encodePacked(i, "maxValues")));
            bytes32 minValuesStart = bytes32(keccak256(abi.encodePacked(i, "minValues")));

            maxValuesStart.setValueBySlot(bytes32(maxValuesLength));
            minValuesStart.setValueBySlot(bytes32(minValuesLength));

            for (uint256 j = 0; j < maxValuesLength; j++) {
                bytes32 maxValuesSlot = bytes32(uint256(maxValuesStart) + j + 1);
                bytes32 minValuesSlot = bytes32(uint256(minValuesStart) + j + 1);

                maxValuesSlot.setValueBySlot(bytes32(_advancedCalls[i].maxValues[j]));
                minValuesSlot.setValueBySlot(bytes32(_advancedCalls[i].minValues[j]));
            }
        }
    }

    function _getAdvancedApprovedCall(
        uint256 _index
    ) internal view returns (AdvancedApprovedCall memory) {
        bytes32 callHash = bytes32(_index + 1).getValueBySlot();

        bytes32 maxValuesStart = bytes32(keccak256(abi.encodePacked(_index, "maxValues")));
        bytes32 minValuesStart = bytes32(keccak256(abi.encodePacked(_index, "minValues")));

        uint256 maxValuesLength = uint256(maxValuesStart.getValueBySlot());
        uint256 minValuesLength = uint256(minValuesStart.getValueBySlot());

        uint256[] memory maxValues = new uint256[](maxValuesLength);
        uint256[] memory minValues = new uint256[](minValuesLength);

        for (uint256 i = 0; i < maxValuesLength; i++) {
            bytes32 maxValuesSlot = bytes32(uint256(maxValuesStart) + i + 1);
            bytes32 minValuesSlot = bytes32(uint256(minValuesStart) + i + 1);

            maxValues[i] = uint256(maxValuesSlot.getValueBySlot());
            minValues[i] = uint256(minValuesSlot.getValueBySlot());
        }
        return
            AdvancedApprovedCall({callHash: callHash, maxValues: maxValues, minValues: minValues});
    }

    function getCurrentApprovedCalls()
        external
        view
        returns (AdvancedApprovedCall[] memory advancedApprovedCalls)
    {
        uint256 length = uint256(bytes32(0).getValueBySlot());

        advancedApprovedCalls = new AdvancedApprovedCall[](length);
        for (uint256 i = 0; i < length; i++) {
            advancedApprovedCalls[i] = _getAdvancedApprovedCall(i);
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
