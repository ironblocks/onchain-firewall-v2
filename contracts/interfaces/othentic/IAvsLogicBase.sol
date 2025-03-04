// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAvsLogic} from "../../dependencies/othentic/interfaces/IAvsLogic.sol";

/**
 * @title IAvsLogicBase
 * @notice Interface for the AvsLogicBase contract.
 */
interface IAvsLogicBase is IAvsLogic {
    /**
     * @dev Emitted when the attestation center is updated.
     * @param newAttestationCenter The new attestation center.
     */
    event AttestationCenterUpdated(address newAttestationCenter);

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
}
