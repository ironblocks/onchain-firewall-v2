// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IBeforePaymentsLogic} from "../../dependencies/othentic/interfaces/IBeforePaymentsLogic.sol";

/**
 * @title IVennVaultL2
 * @notice Interface for the VennVaultL2 contract.
 */
interface IVennVaultL2 is IBeforePaymentsLogic {
    /**
     * @dev Emitted when the allow operator claim is updated.
     * @param newAllowOperatorClaim The new allow operator claim.
     */
    event AllowOperatorClaimUpdated(bool newAllowOperatorClaim);

    /**
     * @dev Emitted when the attestation center is updated.
     * @param newAttestationCenter The new attestation center.
     */
    event AttestationCenterUpdated(address newAttestationCenter);

    /**
     * @dev Emitted when the L2 Avs treasury is updated.
     * @param newL2AvsTreasury The new L2 Avs treasury.
     */
    event L2AvsTreasuryUpdated(address newL2AvsTreasury);

    /**
     * @dev Owner mint function
     * @param _to The address to mint to.
     * @param _amount The amount to mint.
     */
    function ownerMint(address _to, uint256 _amount) external;

    /**
     * @dev Set the allow operator claim.
     * @param _allowOperatorClaim The allow operator claim.
     */
    function setAllowOperatorClaim(bool _allowOperatorClaim) external;

    /**
     * @dev Set the attestation center address.
     * @param _attestationCenter The address of the attestation center.
     */
    function setAttestationCenter(address _attestationCenter) external;

    /**
     * @dev Set the L2 Avs treasury address.
     * @param _l2AvsTreasury The address of the L2 Avs treasury.
     */
    function setL2AvsTreasury(address _l2AvsTreasury) external;

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
     * @dev Get the L2 Avs treasury address.
     * @return The address of the L2 Avs treasury.
     */
    function l2AvsTreasury() external view returns (address);

    /**
     * @dev Get the allow operator claim.
     * @return The allow operator claim.
     */
    function allowOperatorClaim() external view returns (bool);

    /**
     * @dev Get the version of the VennVaultL2.
     * @return The version of the VennVaultL2.
     */
    function version() external view returns (uint256);
}
