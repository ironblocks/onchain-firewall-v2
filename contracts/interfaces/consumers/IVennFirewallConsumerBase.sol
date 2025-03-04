// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IFirewallConsumer} from "./IFirewallConsumer.sol";

/**
 * @title IVennFirewallConsumerBase
 * @notice Interface for the Venn Firewall Consumer Base contract.
 */
interface IVennFirewallConsumerBase is IFirewallConsumer {
    /**
     * @dev Emitted when the attestation center proxy is updated.
     * @param newAttestationCenterProxy The new attestation center proxy.
     */
    event AttestationCenterProxyUpdated(address newAttestationCenterProxy);

    /**
     * @dev Emitted when the new firewall admin is proposed.
     * @param newAdmin The new firewall admin.
     */
    event FirewallAdminProposed(address newAdmin);

    /**
     * @dev Event emitted when the firewall admin is updated.
     * @param newAdmin The address of the new firewall admin.
     */
    event FirewallAdminUpdated(address newAdmin);

    /**
     * @dev Event emitted when the firewall is updated.
     * @param newFirewall The address of the new firewall.
     */
    event FirewallUpdated(address newFirewall);

    /**
     * @dev Error emitted when the caller is not the firewall admin.
     */
    error NotFirewallAdmin();

    /**
     * @dev Error emitted when the user does not have enough fee
     */
    error NotEnoughFee();

    /**
     * @dev Error emitted when the proxy call fails.
     * @param returnData The bytes of the return data from the proxy call.
     */
    error ProxyCallFailed(bytes returnData);

    /**
     * @dev Error emitted when the new firewall admin is not the caller.
     */
    error NotNewFirewallAdmin();

    /**
     * @dev Function to perform a safe function call. This function will call the attestation center proxy and then call the data.
     * @param _userNativeFee The user's native fee.
     * @param _proxyPayload The proxy payload to call the attestation center proxy.
     * @param _data The data to call.
     */
    function safeFunctionCall(
        uint256 _userNativeFee,
        bytes calldata _proxyPayload,
        bytes calldata _data
    ) external payable;

    /**
     * @dev Admin only function to set the attestation center proxy.
     * @param _attestationCenterProxy The address of the attestation center proxy.
     */
    function setAttestationCenterProxy(address _attestationCenterProxy) external;

    /**
     * @dev Admin only function allowing the consumers admin to set the firewall address.
     * @param _firewall The address of the firewall.
     */
    function setFirewall(address _firewall) external;

    /**
     * @dev Admin only function, sets new firewall admin. New admin must accept.
     * @param _firewallAdmin The address of the new firewall admin.
     */
    function setFirewallAdmin(address _firewallAdmin) external;

    /**
     * @dev Accept the role as firewall admin.
     */
    function acceptFirewallAdmin() external;
}
