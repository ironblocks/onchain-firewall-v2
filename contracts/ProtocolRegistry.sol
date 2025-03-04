// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable, IAccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {DetectionEscrow} from "./DetectionEscrow.sol";

import {ArrayHelpers} from "./libs/ArrayHelpers.sol";

import {IProtocolRegistry} from "./interfaces/IProtocolRegistry.sol";

import {IOBLS} from "./dependencies/othentic/interfaces/IOBLS.sol";
import {IAttestationCenter} from "./dependencies/othentic/interfaces/IAttestationCenter.sol";

contract ProtocolRegistry is IProtocolRegistry, AccessControlUpgradeable, UUPSUpgradeable {
    using ArrayHelpers for uint256[];

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant POLICY_ADMIN_ROLE = keccak256("POLICY_ADMIN_ROLE");

    uint256 public constant MAX_VENN_DETECTION_FEE = 200_000;
    uint256 public constant MAX_VENN_PROTOCOL_FEE = 200_000;

    address public vennFeeRecipient;
    address public attestationCenter;
    address public feePool;

    uint256 public taskDefinitionMaxFee;

    uint256 public vennDetectionFee;
    uint256 public vennProtocolFee;

    mapping(uint16 => uint256) public taskDefinitionIdFees;

    mapping(address => Protocol) internal protocols;
    mapping(address => ProtocolDetection) internal protocolDetections;

    modifier onlyPolicyAdmin(address _policyAddress) {
        require(
            IAccessControlUpgradeable(_policyAddress).hasRole(POLICY_ADMIN_ROLE, msg.sender),
            "ProtocolRegistry: Only policy admin."
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __ProtocolRegistry_init(
        address _attestationCenter,
        address _vennFeeRecipient,
        address _feePool,
        uint256 _taskDefinitionMaxFee,
        uint256 _vennDetectionFee,
        uint256 _vennProtocolFee
    ) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setAttestationCenter(_attestationCenter);
        _setVennFeeRecipient(_vennFeeRecipient);
        _setFeePool(_feePool);

        _setTaskDefinitionMaxFee(_taskDefinitionMaxFee);
        _setVennDetectionFee(_vennDetectionFee);
        _setVennProtocolFee(_vennProtocolFee);
    }

    function createAndRegisterProtocolDetection(
        address _operator,
        address[] calldata _assets,
        address[] calldata _admins,
        string calldata _metadataURI
    ) external {
        uint256 operatorId = IAttestationCenter(attestationCenter).operatorsIdsByAddress(
            _operator
        );
        require(operatorId != 0, "ProtocolRegistry: Operator not found.");

        address detectionEscrow = address(
            new DetectionEscrow(address(this), msg.sender, _operator)
        );

        protocolDetections[detectionEscrow] = ProtocolDetection({
            protocolAdmin: msg.sender,
            operator: _operator,
            assets: _assets,
            admins: _admins,
            vennFee: vennDetectionFee,
            isApproved: false,
            metadataURI: _metadataURI
        });

        emit ProtocolDetectionRegistered(
            detectionEscrow,
            _operator,
            _assets,
            _admins,
            vennDetectionFee,
            _metadataURI
        );
    }

    function approveProtocolDetectionAsOperator(address _detectionEscrow) external {
        ProtocolDetection storage protocolDetection = protocolDetections[_detectionEscrow];

        require(msg.sender == protocolDetection.operator, "ProtocolRegistry: Only operator.");

        protocolDetection.isApproved = true;

        emit ProtocolDetectionApproved(
            _detectionEscrow,
            protocolDetection.operator,
            protocolDetection.assets,
            protocolDetection.admins,
            protocolDetection.metadataURI
        );
    }

    function setTaskDefinitionFee(
        uint16 _taskDefinitionId,
        uint256 _fee
    ) external onlyRole(ADMIN_ROLE) {
        taskDefinitionIdFees[_taskDefinitionId] = _fee;

        emit TaskDefinitionFeeSet(_taskDefinitionId, _fee);
    }

    function registerProtocol(
        address _policyAddress,
        uint256[] calldata _requiredOperatorIds,
        uint16 _taskDefinitionId,
        string calldata _metadataURI
    ) external onlyPolicyAdmin(_policyAddress) {
        require(
            protocols[_policyAddress].policyAddress == address(0),
            "ProtocolRegistry: Protocol already registered."
        );
        _verifyVetoOperators(_requiredOperatorIds, _taskDefinitionId);

        protocols[_policyAddress] = Protocol({
            policyAddress: _policyAddress,
            requiredOperatorIds: _requiredOperatorIds,
            taskDefinitionId: _taskDefinitionId,
            metadataURI: _metadataURI
        });

        emit ProtocolRegistered(
            _policyAddress,
            _requiredOperatorIds,
            _taskDefinitionId,
            _metadataURI
        );
    }

    function updateProtocol(
        address _policyAddress,
        uint256[] calldata _requiredOperatorIds,
        uint16 _taskDefinitionId,
        string calldata _metadataURI
    ) external onlyPolicyAdmin(_policyAddress) {
        Protocol storage protocol = protocols[_policyAddress];

        require(
            protocol.policyAddress != address(0),
            "ProtocolRegistry: Protocol not registered."
        );
        _verifyVetoOperators(_requiredOperatorIds, _taskDefinitionId);

        protocol.requiredOperatorIds = _requiredOperatorIds;
        protocol.taskDefinitionId = _taskDefinitionId;
        protocol.metadataURI = _metadataURI;

        emit ProtocolUpdated(
            _policyAddress,
            _requiredOperatorIds,
            _taskDefinitionId,
            _metadataURI
        );
    }

    function setFeePool(address _feePool) external onlyRole(ADMIN_ROLE) {
        _setFeePool(_feePool);
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
    }

    function setTaskDefinitionMaxFee(uint256 _taskDefinitionMaxFee) external onlyRole(ADMIN_ROLE) {
        _setTaskDefinitionMaxFee(_taskDefinitionMaxFee);
    }

    function setVennDetectionFee(uint256 _vennDetectionFee) external onlyRole(ADMIN_ROLE) {
        _setVennDetectionFee(_vennDetectionFee);
    }

    function setVennProtocolFee(uint256 _vennProtocolFee) external onlyRole(ADMIN_ROLE) {
        _setVennProtocolFee(_vennProtocolFee);
    }

    function setVennFeeRecipient(address _vennFeeRecipient) external onlyRole(ADMIN_ROLE) {
        _setVennFeeRecipient(_vennFeeRecipient);
    }

    function _setFeePool(address _feePool) internal {
        feePool = _feePool;

        emit FeePoolSet(_feePool);
    }

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = _attestationCenter;

        emit AttestationCenterSet(_attestationCenter);
    }

    function _setTaskDefinitionMaxFee(uint256 _taskDefinitionMaxFee) internal {
        taskDefinitionMaxFee = _taskDefinitionMaxFee;

        emit TaskDefinitionMaxFeeSet(_taskDefinitionMaxFee);
    }

    function _setVennDetectionFee(uint256 _vennDetectionFee) internal {
        require(
            _vennDetectionFee <= MAX_VENN_DETECTION_FEE,
            "ProtocolRegistry: Venn detection fee must be less than or equal to max venn detection fee."
        );

        vennDetectionFee = _vennDetectionFee;

        emit VennDetectionFeeSet(_vennDetectionFee);
    }

    function _setVennProtocolFee(uint256 _vennProtocolFee) internal {
        require(
            _vennProtocolFee <= MAX_VENN_PROTOCOL_FEE,
            "ProtocolRegistry: Venn protocol fee must be less than or equal to max venn protocol fee."
        );

        vennProtocolFee = _vennProtocolFee;

        emit VennProtocolFeeSet(_vennProtocolFee);
    }

    function _setVennFeeRecipient(address _vennFeeRecipient) internal {
        require(
            _vennFeeRecipient != address(0),
            "ProtocolRegistry: Venn fee recipient cannot be the zero address."
        );

        vennFeeRecipient = _vennFeeRecipient;

        emit VennFeeRecipientSet(_vennFeeRecipient);
    }

    function getProtocolTaskDefinitionId(address _policyAddress) external view returns (uint16) {
        return protocols[_policyAddress].taskDefinitionId;
    }

    function getProtocolFee(address _policyAddress) external view returns (uint256) {
        Protocol storage protocol = protocols[_policyAddress];

        require(
            protocol.policyAddress != address(0),
            "ProtocolRegistry: Protocol not registered."
        );

        return taskDefinitionIdFees[protocol.taskDefinitionId];
    }

    function getRequiredOperatorIds(
        address _policyAddress
    ) external view returns (uint256[] memory) {
        return protocols[_policyAddress].requiredOperatorIds;
    }

    function _verifyVetoOperators(
        uint256[] memory _requiredOperatorIds,
        uint16 _taskDefinitionId
    ) internal view {
        if (_requiredOperatorIds.length == 0) return;

        require(
            _requiredOperatorIds.isSorted(),
            "ProtocolRegistry: Required operator ids must be sorted."
        );

        IOBLS obls = IAttestationCenter(attestationCenter).obls();

        for (uint256 i = 0; i < _requiredOperatorIds.length; i++) {
            require(
                obls.isActive(_requiredOperatorIds[i]),
                "ProtocolRegistry: Operator not active."
            );
        }

        if (_taskDefinitionId > 0) {
            uint256[] memory subnetOperatorIds = IAttestationCenter(attestationCenter)
                .getTaskDefinitionRestrictedOperators(_taskDefinitionId);

            uint256 missingOperatorId = _requiredOperatorIds.verifyArraySubset(subnetOperatorIds);
            require(missingOperatorId == 0, "ProtocolRegistry: Missing operator id.");
        }
    }

    function getProtocols(address _policyAddress) external view returns (Protocol memory) {
        return protocols[_policyAddress];
    }

    function getProtocolDetections(
        address _detectionEscrow
    ) external view returns (ProtocolDetection memory) {
        return protocolDetections[_detectionEscrow];
    }

    function _authorizeUpgrade(address) internal view override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
