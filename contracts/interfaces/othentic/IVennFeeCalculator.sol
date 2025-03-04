// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IFeeCalculator} from "../../dependencies/othentic/interfaces/IFeeCalculator.sol";

/**
 * @title IVennFeeCalculator
 * @notice Interface for the VennFeeCalculator contract.
 */
interface IVennFeeCalculator is IFeeCalculator {
    /**
     * @dev Emitted when the protocol registry is updated.
     * @param newProtocolRegistry The new protocol registry.
     */
    event ProtocolRegistryUpdated(address newProtocolRegistry);

    /**
     * @dev Emitted when the attestation center is updated.
     * @param newAttestationCenter The new attestation center.
     */
    event AttestationCenterUpdated(address newAttestationCenter);

    /**
     * @dev Set the protocol registry address.
     * @param _protocolRegistry The address of the protocol registry.
     */
    function setProtocolRegistry(address _protocolRegistry) external;

    /**
     * @dev Set the attestation center address.
     * @param _attestationCenter The address of the attestation center.
     */
    function setAttestationCenter(address _attestationCenter) external;

    /**
     * @dev Get the admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the attestation center address.
     * @return The address of the attestation center.
     */
    function attestationCenter() external view returns (address);

    /**
     * @dev Get the protocol registry address.
     * @return The address of the protocol registry.
     */
    function protocolRegistry() external view returns (address);
}
