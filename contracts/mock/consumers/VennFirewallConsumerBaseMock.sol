// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {VennFirewallConsumerBase, Storage, Transient} from "../../consumers/VennFirewallConsumerBase.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract VennFirewallConsumerBaseMock is VennFirewallConsumerBase {
    bytes32 private constant ATTESTATION_CENTER_PROXY_SLOT =
        bytes32(uint256(keccak256("eip1967.attestation.center.proxy")) - 1);

    bytes32 private constant USER_PAID_FEE_SLOT =
        bytes32(uint256(keccak256("eip1967.user.paid.fee")) - 1);

    bytes32 private constant SAFE_FUNCTION_CALLER_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.caller")) - 1);

    bytes32 private constant SAFE_FUNCTION_CALL_FLAG_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.call.flag")) - 1);

    event ArbitraryCall(bytes data);

    // @dev This is used to test the storage slots
    uint256 public firstSlot = 234554321;

    address public safeFunctionCaller;
    uint256 public safeFunctionCallFlag;
    uint256 public userPaidFee;

    function attestationCenter() external view returns (address) {
        return Storage.getAddressBySlot(ATTESTATION_CENTER_PROXY_SLOT);
    }

    function firewall() external view returns (address) {
        return Storage.getAddressBySlot(FIREWALL_STORAGE_SLOT);
    }

    function newFirewallAdmin() external view returns (address) {
        return Storage.getAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT);
    }

    function setFirewallAdminMock(address _newFirewallAdmin) external {
        Storage.setAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT, _newFirewallAdmin);
    }

    function arbitraryCall(bytes calldata _data) external {
        emit ArbitraryCall(_data);
    }

    function saveSafeFunctionCallFlag() external payable {
        safeFunctionCaller = Transient.getAddressBySlot(SAFE_FUNCTION_CALLER_SLOT);
        safeFunctionCallFlag = Transient.getUint256BySlot(SAFE_FUNCTION_CALL_FLAG_SLOT);
        userPaidFee = Transient.getUint256BySlot(USER_PAID_FEE_SLOT);
    }

    function setSafeFunctionCallFlagAndReturnMsgValue(
        address _safeFunctionCaller,
        uint256 _safeFunctionCallFlag,
        uint256 _userPaidFee
    ) external payable returns (uint256) {
        Transient.setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, _safeFunctionCaller);
        Transient.setUint256BySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, _safeFunctionCallFlag);
        Transient.setUint256BySlot(USER_PAID_FEE_SLOT, _userPaidFee);

        return _msgValue();
    }

    function setSafeFunctionCallFlagAndCallFunction(
        address _safeFunctionCaller,
        uint256 _safeFunctionCallFlag,
        uint256 _userPaidFee,
        bytes calldata _data
    ) external payable {
        Transient.setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, _safeFunctionCaller);
        Transient.setUint256BySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, _safeFunctionCallFlag);
        Transient.setUint256BySlot(USER_PAID_FEE_SLOT, _userPaidFee);

        Address.functionDelegateCall(address(this), _data);
    }

    function firewallProtectedFunction() external payable firewallProtected {
        emit ArbitraryCall("");
    }
}
