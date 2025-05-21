// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC165Checker} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import {Storage} from "../libs/Storage.sol";
import {Transient} from "../libs/Transient.sol";

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
    bytes32 private constant ATTESTATION_CENTER_PROXY_SLOT =
        bytes32(uint256(keccak256("eip1967.attestation.center.proxy")) - 1);

    // This slot is used to store the allow non zero user native fee flag
    bytes32 private constant ALLOW_NON_ZERO_USERNATIVEFEE_FLAG_SLOT =
        bytes32(uint256(keccak256("eip1967.allow.non.zero.usernativefee.flag")) - 1);

    // This slot is used to store the user paid fee
    bytes32 private constant USER_PAID_FEE_SLOT =
        bytes32(uint256(keccak256("eip1967.user.paid.fee")) - 1);

    // This slot is used to store the safe function caller address
    bytes32 private constant SAFE_FUNCTION_CALLER_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.caller")) - 1);

    // This slot is used to store the safe function call flag
    bytes32 private constant SAFE_FUNCTION_CALL_FLAG_SLOT =
        bytes32(uint256(keccak256("eip1967.safe.function.call.flag")) - 1);

    // This is the value for the safe function call flag when the function is not active
    uint256 private constant INACTIVE = 0;

    // This is the value for the safe function call flag when the function is active
    uint256 private constant ACTIVE = 1;

    // This is the value for the safe function call flag when the caller is not set
    address private constant CALLER_NOT_SET = address(0);

    /**
     * @dev Modifier that will run the preExecution and postExecution hooks of the firewall, applying each of
     * the subscribed policies.
     *
     * NOTE: Applying this modifier on functions that exit execution flow by an inline assmebly "return" call will
     * prevent the postExecution hook from running - breaking the protection provided by the firewall.
     * If you have any questions, please refer to the Firewall's documentation and/or contact our support.
     */
    modifier firewallProtected() {
        address firewall = Storage.getAddressBySlot(FIREWALL_STORAGE_SLOT);
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
        if (msg.sender != Storage.getAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT)) {
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

        if (
            Storage.getValueBySlot(ALLOW_NON_ZERO_USERNATIVEFEE_FLAG_SLOT) == bytes32(0) &&
            _userNativeFee > 0
        ) {
            revert NonZeroUserNativeFee();
        }

        _initSafeFunctionCallFlags(_userNativeFee);

        address attestationCenterProxy = Storage.getAddressBySlot(ATTESTATION_CENTER_PROXY_SLOT);

        if (attestationCenterProxy == address(0) && _userNativeFee > 0) {
            revert AttestationCenterProxyNotSet();
        }

        (bool success, bytes memory returnData) = attestationCenterProxy.call{
            value: _userNativeFee
        }(_proxyPayload);
        if (!success) {
            revert ProxyCallFailed(returnData);
        }

        // @dev if the callable function is non-payable, the value will be included in msg.value anyway
        Address.functionDelegateCall(address(this), _data);

        _deInitSafeFunctionCallFlags();
    }

    /**
     * @dev Internal function to initialize the safe function call flags.
     * @param _userNativeFee The user native fee.
     */
    function _initSafeFunctionCallFlags(uint256 _userNativeFee) internal {
        Transient.setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, msg.sender);
        Transient.setValueBySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, ACTIVE);
        Transient.setValueBySlot(USER_PAID_FEE_SLOT, _userNativeFee);
    }

    /**
     * @dev Internal function to deinitialize the safe function call flags.
     */
    function _deInitSafeFunctionCallFlags() internal {
        Transient.setAddressBySlot(SAFE_FUNCTION_CALLER_SLOT, CALLER_NOT_SET);
        Transient.setValueBySlot(SAFE_FUNCTION_CALL_FLAG_SLOT, INACTIVE);
        Transient.setUint256BySlot(USER_PAID_FEE_SLOT, 0);
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

        Storage.setAddressBySlot(ATTESTATION_CENTER_PROXY_SLOT, _attestationCenterProxy);

        emit AttestationCenterProxyUpdated(_attestationCenterProxy);
    }

    function setAllowNonZeroUserNativeFee(
        bool _allowNonZeroUserNativeFee
    ) external onlyFirewallAdmin {
        Storage.setValueBySlot(
            ALLOW_NON_ZERO_USERNATIVEFEE_FLAG_SLOT,
            _allowNonZeroUserNativeFee ? bytes32(uint256(1)) : bytes32(0)
        );
    }

    function firewallAdmin() external view returns (address) {
        return Storage.getAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT);
    }

    function setFirewall(address _firewall) external onlyFirewallAdmin {
        Storage.setAddressBySlot(FIREWALL_STORAGE_SLOT, _firewall);

        emit FirewallUpdated(_firewall);
    }

    function setFirewallAdmin(address _firewallAdmin) external onlyFirewallAdmin {
        Storage.setAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT, _firewallAdmin);

        emit FirewallAdminProposed(_firewallAdmin);
    }

    function acceptFirewallAdmin() external {
        if (msg.sender != Storage.getAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT)) {
            revert NotNewFirewallAdmin();
        }

        Storage.setAddressBySlot(FIREWALL_ADMIN_STORAGE_SLOT, msg.sender);
        Storage.setAddressBySlot(NEW_FIREWALL_ADMIN_STORAGE_SLOT, address(0));

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

        if (Transient.getUint256BySlot(SAFE_FUNCTION_CALL_FLAG_SLOT) == ACTIVE) {
            if (msg.sender == Transient.getAddressBySlot(SAFE_FUNCTION_CALLER_SLOT)) {
                uint256 fee = Transient.getUint256BySlot(USER_PAID_FEE_SLOT);

                value = value - fee;
            }
        }
    }
}
