// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAttestationCenter} from "../../dependencies/othentic/interfaces/IAttestationCenter.sol";

interface IAttestationCenterFacet {
    /**
     * @notice Get the operator address by IDs
     * @param operatorIds The operator IDs to get the address of
     * @return operatorAddresses The addresses of the operators
     */
    function getOperatorAddressByIds(
        uint256[] memory operatorIds
    ) external view returns (address[] memory operatorAddresses);

    /**
     * @notice Get the attestation center
     * @return attestation center contract
     */
    function attestationCenter() external view returns (IAttestationCenter);
}
