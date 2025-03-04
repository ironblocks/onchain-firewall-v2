// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IProtocolRegistry} from "../interfaces/IProtocolRegistry.sol";
import {IVennFeeCalculator} from "../interfaces/othentic/IVennFeeCalculator.sol";

contract VennFeeCalculator is IVennFeeCalculator, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public attestationCenter;
    address public protocolRegistry;

    constructor(address _attestationCenter, address _protocolRegistry) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setAttestationCenter(_attestationCenter);
        _setProtocolRegistry(_protocolRegistry);
    }

    function calculateBaseRewardFees(
        FeeCalculatorData calldata _feeCalculatorData
    )
        external
        view
        returns (
            uint256 baseRewardFeeForAttesters,
            uint256 baseRewardFeeForAggregator,
            uint256 baseRewardFeeForPerformer
        )
    {
        address protocolPolicy = address(bytes20(_feeCalculatorData.data.data));
        uint256 protocolFee = IProtocolRegistry(protocolRegistry).getProtocolFee(protocolPolicy);

        uint256 divisor = _feeCalculatorData.attestersIds.length + 1;
        uint256 baseRewardFee = protocolFee / divisor;

        baseRewardFeeForAttesters = baseRewardFee;
        baseRewardFeeForAggregator = baseRewardFee;
        baseRewardFeeForPerformer = 0;
    }

    function calculateFeesPerId(
        FeeCalculatorData calldata _feeCalculatorData
    ) external returns (FeePerId[] memory feesPerId) {}

    function isBaseRewardFee() external pure returns (bool) {
        return true;
    }

    function setProtocolRegistry(address _protocolRegistry) external onlyRole(ADMIN_ROLE) {
        _setProtocolRegistry(_protocolRegistry);
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
    }

    function _setProtocolRegistry(address _protocolRegistry) internal {
        protocolRegistry = _protocolRegistry;

        emit ProtocolRegistryUpdated(_protocolRegistry);
    }

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = _attestationCenter;

        emit AttestationCenterUpdated(_attestationCenter);
    }
}
