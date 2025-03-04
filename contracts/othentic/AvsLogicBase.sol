// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IAvsLogicBase} from "../interfaces/othentic/IAvsLogicBase.sol";

abstract contract AvsLogicBase is AccessControl, IAvsLogicBase {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public attestationCenter;

    modifier onlyAttestationCenter() {
        require(
            msg.sender == attestationCenter,
            "AvsLogicBase: Only the attestation center can call this function."
        );
        _;
    }

    constructor(address _attestationCenter) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setAttestationCenter(_attestationCenter);
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
    }

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = _attestationCenter;

        emit AttestationCenterUpdated(_attestationCenter);
    }
}
