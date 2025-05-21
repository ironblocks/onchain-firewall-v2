// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IAttestationCenter} from "../dependencies/othentic/interfaces/IAttestationCenter.sol";

import {IAttestationCenterFacet} from "../interfaces/facets/IAttestationCenterFacet.sol";

contract AttestationCenterFacet is IAttestationCenterFacet {
    IAttestationCenter public immutable attestationCenter;

    constructor(address _attestationCenter) {
        attestationCenter = IAttestationCenter(_attestationCenter);
    }

    function getOperatorAddressByIds(
        uint256[] memory operatorIds
    ) external view returns (address[] memory operatorAddresses) {
        operatorAddresses = new address[](operatorIds.length);

        for (uint256 i = 0; i < operatorIds.length; i++) {
            operatorAddresses[i] = attestationCenter
                .getOperatorPaymentDetail(operatorIds[i])
                .operator;
        }
    }
}
