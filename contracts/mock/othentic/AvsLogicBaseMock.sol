// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AvsLogicBase} from "../../othentic/AvsLogicBase.sol";
import {IAttestationCenter} from "../../dependencies/othentic/interfaces/IAttestationCenter.sol";

contract AvsLogicBaseMock is AvsLogicBase {
    constructor(address _attestationCenter) AvsLogicBase(_attestationCenter) {}

    function afterTaskSubmission(
        IAttestationCenter.TaskInfo calldata,
        bool,
        bytes calldata,
        uint256[2] calldata,
        uint256[] calldata
    ) external {}

    function beforeTaskSubmission(
        IAttestationCenter.TaskInfo calldata,
        bool,
        bytes calldata,
        uint256[2] calldata,
        uint256[] calldata
    ) external {}
}
