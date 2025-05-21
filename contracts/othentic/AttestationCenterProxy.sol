// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {IFeePool} from "./FeePool.sol";

import {SupportsSafeFunctionCalls} from "../policies/helpers/SupportsSafeFunctionCalls.sol";

import {IAttestationCenterProxy} from "../interfaces/othentic/IAttestationCenterProxy.sol";

import {IAttestationCenter} from "../dependencies/othentic/interfaces/IAttestationCenter.sol";

contract AttestationCenterProxy is
    IAttestationCenterProxy,
    IERC165,
    AccessControlUpgradeable,
    SupportsSafeFunctionCalls,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IFeePool public feePool;
    IAttestationCenter public attestationCenter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __AttestationCenterProxy_init(
        address _feePool,
        address _attestationCenter
    ) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setFeePool(_feePool);
        _setAttestationCenter(_attestationCenter);
    }

    function submitTask(
        IAttestationCenter.TaskInfo calldata _taskInfo,
        IAttestationCenter.TaskSubmissionDetails calldata _taskSubmissionDetails
    ) external payable {
        if (msg.value > 0) {
            address policyAddress = _extractPolicyAddress(_taskInfo.data);

            feePool.depositNativeForPolicy{value: msg.value}(policyAddress);
        }

        attestationCenter.submitTask(_taskInfo, _taskSubmissionDetails);
    }

    function submitTasks(
        IAttestationCenter.TaskInfo[] calldata _taskInfo,
        IAttestationCenter.TaskSubmissionDetails[] calldata _taskSubmissionDetails
    ) external payable {
        for (uint256 i = 0; i < _taskInfo.length; i++) {
            address policyAddress = _extractPolicyAddress(_taskInfo[i].data);

            uint256 requiredAmount = feePool.getRequiredNativeAmountForPolicy(
                policyAddress,
                _taskInfo[i].taskDefinitionId
            );
            if (requiredAmount > 0) {
                require(
                    address(this).balance >= requiredAmount,
                    "AttestationCenterProxy: Insufficient balance for fees."
                );
                feePool.depositNativeForPolicy{value: requiredAmount}(policyAddress);
            }

            attestationCenter.submitTask(_taskInfo[i], _taskSubmissionDetails[i]);
        }

        if (address(this).balance > 0) {
            // We don't necessarily know who it belongs to, so we deposit it into the fee pool
            feePool.depositRescuedFees{value: address(this).balance}();
        }
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
    }

    function setFeePool(address _feePool) external onlyRole(ADMIN_ROLE) {
        _setFeePool(_feePool);
    }

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = IAttestationCenter(_attestationCenter);

        emit AttestationCenterUpdated(_attestationCenter);
    }

    function _setFeePool(address _feePool) internal {
        feePool = IFeePool(_feePool);

        emit FeePoolUpdated(_feePool);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 _interfaceId
    )
        public
        view
        override(IERC165, AccessControlUpgradeable, SupportsSafeFunctionCalls)
        returns (bool)
    {
        return
            SupportsSafeFunctionCalls.supportsInterface(_interfaceId) ||
            AccessControlUpgradeable.supportsInterface(_interfaceId);
    }

    function _extractPolicyAddress(bytes calldata _data) internal pure returns (address) {
        require(_data.length >= 20, "AttestationCenterProxy: Invalid policy address");

        return address(bytes20(_data));
    }

    function _authorizeUpgrade(address) internal view override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
