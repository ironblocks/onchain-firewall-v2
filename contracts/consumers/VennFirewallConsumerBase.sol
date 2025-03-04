// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import {IFirewall} from "../interfaces/IFirewall.sol";
import {IApprovedCallsPolicy} from "../interfaces/policies/IApprovedCallsPolicy.sol";
import {IVennFirewallConsumerBase} from "../interfaces/consumers/IVennFirewallConsumerBase.sol";

/**
 * @title VennFirewallConsumerBase
 * @author David Benchimol @ Ironblocks
 * @dev This contract is a parent contract that can be used to add firewall protection to any contract.
 *
 * The contract must define a firewall contract which will manage the policies that are applied to the contract.
 * It also must define a firewall admin which will be able to add and remove policies.
 */
abstract contract VennFirewallConsumerBase is IVennFirewallConsumerBase {
    using ERC165Checker for address;

    // This is the interface ID for the ApprovedCallsPolicy interface
    bytes4 internal constant SUPPORTS_APPROVE_VIA_SIGNATURE_INTERFACE_ID =
        IApprovedCallsPolicy.approveCallsViaSignature.selector;

    // This slot is used to store the firewall address
    bytes32 internal constant FIREWALL_STORAGE_SLOT =
        bytes32(uint256(keccak256("eip1967.firewall")) - 1);

    // This slot is used to store the firewall admin address
    bytes32 internal constant FIREWALL_ADMIN_STORAGE_SLOT =
        bytes32(uint256(keccak256("eip1967.firewall.admin")) - 1);

    // This slot is used to store the new firewall admin address (when changing admin)
    bytes32 internal constant NEW_FIREWALL_ADMIN_STORAGE_SLOT =
        bytes32(uint256(keccak256("eip1967.new.firewall.admin")) - 1);

    // This slot is used to store the attestation center proxy address
    bytes32 internal constant ATTESTATION_CENTER_PROXY_SLOT =
        bytes32(uint256(keccak256("eip1967.attestation.center.proxy")) - 1);

    // This slot is used to store the user paid fee
    bytes32 internal constant USER_PAID_FEE_SLOT =
        bytes32(uint256(keccak256("eip1967.user.paid.fee")) - 1);

    // This slot is used to store the safe function caller address
    bytes32 internal constant SAFE_FUNCTION_CALLER_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.caller")) - 1);

    // This slot is used to store the safe function call flag
    bytes32 internal constant SAFE_FUNCTION_CALL_FLAG_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.call.flag")) - 1);

    // This is the value for the safe function call flag when the function is not active
    uint256 internal constant INACTIVE = 1;

    // This is the value for the safe function call flag when the function is active
    uint256 internal constant ACTIVE = 2;

    // This is the value for the safe function call flag when the caller is not set
    address internal constant CALLER_NOT_SET = address(1);

    /**
     * @dev Modifier that will run the preExecution and postExecution hooks of the firewall, applying each of
     * the subscribed policies.
     *
     * NOTE: Applying this modifier on functions that exit execution flow by an inline assmebly "return" call will
     * prevent the postExecution hook from running - breaking the protection provided by the firewall.
     * If you have any questions, please refer to the Firewall's documentation and/or contact our support.
     */
    modifier firewallProtected() {
        address firewall = _getAddressBySlot(FIREWALL_STORAGE_SLOT);
        if (firewall == address(0)) {
            _;
            return;
        }

        uint256 value = _msgValue();

        IFirewall(firewall).preExecution(msg.sender, msg.data, value);
        _;
        IFirewall(firewall).postExecution(msg.sender, msg.data, value);
    }

    /**
     * @dev Modifier similar to onlyOwner, but for the firewall admin.
     */
    modifier onlyFirewallAdmin() {
        if (msg.sender != _getAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT)) {
            revert NotFirewallAdmin();
        }
        _;
    }

    function safeFunctionCall(
        uint256 _userNativeFee,
        bytes calldata _proxyPayload,
        bytes calldata _data
    ) external payable {
        if (msg.value < _userNativeFee) {
            revert NotEnoughFee();
        }

        _initSafeFunctionCallFlags(_userNativeFee);

        address attestationCenterProxy = _getAddressBySlot(ATTESTATION_CENTER_PROXY_SLOT);

        (bool success, bytes memory returnData) = attestationCenterProxy.call{
            value: _userNativeFee
        }(_proxyPayload);
        if (!success) {
            revert ProxyCallFailed(returnData);
        }

        Address.functionDelegateCall(address(this), _data);

        _deInitSafeFunctionCallFlags();
    }

    /**
     * @dev Internal function to initialize the safe function call flags.
     * @param _userNativeFee The user native fee.
     */
    function _initSafeFunctionCallFlags(uint256 _userNativeFee) internal {
        _setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, msg.sender);
        _setValueBySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, ACTIVE);
        _setValueBySlot(USER_PAID_FEE_SLOT, _userNativeFee);
    }

    /**
     * @dev Internal function to deinitialize the safe function call flags.
     */
    function _deInitSafeFunctionCallFlags() internal {
        _setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, CALLER_NOT_SET);
        _setValueBySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, INACTIVE);
        _setValueBySlot(USER_PAID_FEE_SLOT, 0);
    }

    function setAttestationCenterProxy(
        address _attestationCenterProxy
    ) external onlyFirewallAdmin {
        if (_attestationCenterProxy != address(0)) {
            require(
                _attestationCenterProxy.supportsERC165InterfaceUnchecked(
                    SUPPORTS_APPROVE_VIA_SIGNATURE_INTERFACE_ID
                )
            );
        }

        _setAddressBySlot(ATTESTATION_CENTER_PROXY_SLOT, _attestationCenterProxy);

        emit AttestationCenterProxyUpdated(_attestationCenterProxy);
    }

    function firewallAdmin() external view returns (address) {
        return _getAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT);
    }

    function setFirewall(address _firewall) external onlyFirewallAdmin {
        _setAddressBySlot(FIREWALL_STORAGE_SLOT, _firewall);

        emit FirewallUpdated(_firewall);
    }

    function setFirewallAdmin(address _firewallAdmin) external onlyFirewallAdmin {
        _setAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT, _firewallAdmin);

        emit FirewallAdminProposed(_firewallAdmin);
    }

    function acceptFirewallAdmin() external {
        if (msg.sender != _getAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT)) {
            revert NotNewFirewallAdmin();
        }

        _setAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT, msg.sender);

        emit FirewallAdminUpdated(msg.sender);
    }

    /**
     * @dev Internal helper function to get the msg.value.
     * @return value The value of the msg.value
     */
    function _msgValue() internal view returns (uint256 value) {
        // We do this because msg.value can only be accessed in payable functions.
        assembly {
            value := callvalue()
        }

        if (_getValueBySlot(SAFE_FUNCTION_CALL_FLAG_SLOT) == ACTIVE) {
            if (msg.sender == _getAddressBySlot(SAFE_FUNCTION_CALLER_SLOT)) {
                uint256 fee = _getValueBySlot(USER_PAID_FEE_SLOT);

                value = value - fee;
            }
        }
    }

    /**
     * @dev Internal helper function to set an address in a storage slot.
     * @param _slot The storage slot.
     * @param _address The address to be set.
     */
    function _setAddressBySlot(bytes32 _slot, address _address) internal {
        assembly {
            sstore(_slot, _address)
        }
    }

    /**
     * @dev Internal helper function to get an address from a storage slot.
     * @param _slot The storage slot.
     * @return _address The address from the storage slot.
     */
    function _getAddressBySlot(bytes32 _slot) internal view returns (address _address) {
        assembly {
            _address := sload(_slot)
        }
    }

    /**
     * @dev Internal helper function to set a value in a storage slot.
     * @param _slot The storage slot.
     * @param _value The value to be set.
     */
    function _setValueBySlot(bytes32 _slot, uint256 _value) internal {
        assembly {
            sstore(_slot, _value)
        }
    }

    /**
     * @dev Internal helper function to get a value from a storage slot.
     * @param _slot The storage slot.
     * @return _value The value from the storage slot.
     */
    function _getValueBySlot(bytes32 _slot) internal view returns (uint256 _value) {
        assembly {
            _value := sload(_slot)
        }
    }
}
