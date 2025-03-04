// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {AvsLogicBase} from "./AvsLogicBase.sol";

import {ArrayHelpers} from "../libs/ArrayHelpers.sol";

import {IFeePool} from "../interfaces/othentic/IFeePool.sol";
import {IProtocolRegistry} from "../interfaces/IProtocolRegistry.sol";
import {IVennAvsLogic} from "../interfaces/othentic/IVennAvsLogic.sol";

import {IAttestationCenter} from "../dependencies/othentic/interfaces/IAttestationCenter.sol";

contract VennAvsLogic is AvsLogicBase, IVennAvsLogic {
    using ArrayHelpers for uint256[];

    address public feePool;
    address public protocolRegistry;

    constructor(
        address _attestationCenter,
        address _feePool,
        address _protocolRegistry
    ) AvsLogicBase(_attestationCenter) {
        _setFeePool(_feePool);
        _setProtocolRegistry(_protocolRegistry);
    }

    function beforeTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool,
        bytes calldata,
        uint256[2] calldata,
        uint256[] calldata _attestersIds
    ) external onlyAttestationCenter {
        address policyAddress = _extractPolicyAddress(_taskInfo.data);

        uint16 taskDefinitionId = IProtocolRegistry(protocolRegistry).getProtocolTaskDefinitionId(
            policyAddress
        );
        require(
            _taskInfo.taskDefinitionId == taskDefinitionId,
            "VennAvsLogic: Task definition id mismatch."
        );

        uint256[] memory requiredOperatorIds = IProtocolRegistry(protocolRegistry)
            .getRequiredOperatorIds(policyAddress);
        if (requiredOperatorIds.length > 0) {
            uint256 missingOperatorId = requiredOperatorIds.verifyArraySubset(_attestersIds);
            require(missingOperatorId == 0, "VennAvsLogic: Missing operator id.");
        }

        IFeePool(feePool).claimNativeFeeFromPolicy(policyAddress);
    }

    function afterTaskSubmission(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata,
        uint256[2] calldata,
        uint256[] calldata
    ) external onlyAttestationCenter {
        if (!_isApproved) {
            // If not approved we don't approve the calls. Gotta see exactly what to do here
            return;
        }

        address policyAddress = _extractPolicyAddress(_taskInfo.data);

        bytes memory data = _taskInfo.data[20:];

        (bool success, ) = policyAddress.call(data);
        require(success, "VennAvsLogic: Call to policy failed.");
    }

    function setFeePool(address _feePool) external onlyRole(ADMIN_ROLE) {
        _setFeePool(_feePool);
    }

    function setProtocolRegistry(address _protocolRegistry) external onlyRole(ADMIN_ROLE) {
        _setProtocolRegistry(_protocolRegistry);
    }

    function _setFeePool(address _feePool) internal {
        feePool = _feePool;

        emit FeePoolUpdated(_feePool);
    }

    function _setProtocolRegistry(address _protocolRegistry) internal {
        protocolRegistry = _protocolRegistry;

        emit ProtocolRegistryUpdated(_protocolRegistry);
    }

    function _extractPolicyAddress(bytes calldata _data) internal pure returns (address) {
        return address(bytes20(_data));
    }

    receive() external payable {}
}
