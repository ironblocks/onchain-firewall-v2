// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable, IAccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import {DetectionEscrow} from "./DetectionEscrow.sol";

import {ArrayHelpers} from "./libs/ArrayHelpers.sol";

import {IProtocolRegistry} from "./interfaces/IProtocolRegistry.sol";

import {IOBLS} from "./dependencies/othentic/interfaces/IOBLS.sol";
import {IAttestationCenter} from "./dependencies/othentic/interfaces/IAttestationCenter.sol";

contract ProtocolRegistry is IProtocolRegistry, AccessControlUpgradeable, UUPSUpgradeable {
    using ArrayHelpers for uint256[];
    using EnumerableSet for EnumerableSet.UintSet;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant MAX_VENN_DETECTION_FEE = 200_000;
    uint256 public constant MAX_VENN_PROTOCOL_FEE = 200_000;

    IAttestationCenter public attestationCenter;

    address public vennFeeRecipient;

    uint256 public vennDetectionFee;
    uint256 public vennProtocolFee;

    mapping(address policy => Protocol) internal protocols;
    mapping(address policy => ProtocolDetection) internal protocolDetections;
    mapping(address policy => mapping(uint16 taskDefinitionId => uint256[] operatorIds))
        internal protocolTaskDefinitionOperatorIds;
    mapping(address policy => EnumerableSet.UintSet taskDefinitionIds)
        internal protocolTaskDefinitionIds;

    modifier onlyPolicyAdmin(address _policyAddress) {
        _onlyPolicyAdmin(_policyAddress);
        _;
    }

    modifier onlyExistsProtocol(address _policyAddress) {
        _onlyExistsProtocol(_policyAddress);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __ProtocolRegistry_init(
        address _attestationCenter,
        address _vennFeeRecipient,
        uint256 _vennDetectionFee,
        uint256 _vennProtocolFee
    ) external initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setAttestationCenter(_attestationCenter);
        _setVennFeeRecipient(_vennFeeRecipient);

        _setVennDetectionFee(_vennDetectionFee);
        _setVennProtocolFee(_vennProtocolFee);
    }

    function createAndRegisterProtocolDetection(
        address _operator,
        address[] calldata _assets,
        address[] calldata _admins,
        string calldata _metadataURI
    ) external returns (address detectionEscrow) {
        uint256 operatorId = attestationCenter.operatorsIdsByAddress(_operator);
        require(operatorId != 0, "ProtocolRegistry: Operator not found.");

        detectionEscrow = address(new DetectionEscrow(address(this), msg.sender, _operator));

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

    function registerProtocol(
        address _policyAddress,
        string calldata _metadataURI
    ) external onlyPolicyAdmin(_policyAddress) {
        require(
            protocols[_policyAddress].policyAddress == address(0),
            "ProtocolRegistry: Protocol already registered."
        );

        protocols[_policyAddress] = Protocol({
            policyAddress: _policyAddress,
            metadataURI: _metadataURI
        });

        emit ProtocolRegistered(_policyAddress, _metadataURI);
    }

    function updateProtocol(
        address _policyAddress,
        string calldata _metadataURI
    ) external onlyPolicyAdmin(_policyAddress) onlyExistsProtocol(_policyAddress) {
        Protocol storage protocol = protocols[_policyAddress];

        protocol.metadataURI = _metadataURI;

        emit ProtocolUpdated(_policyAddress, _metadataURI);
    }

    function subscribeSubnet(
        address _policyAddress,
        uint16 _taskDefinitionId,
        uint256[] calldata _requiredOperatorIds
    ) external onlyPolicyAdmin(_policyAddress) onlyExistsProtocol(_policyAddress) {
        require(
            _taskDefinitionId == 0 ||
                _taskDefinitionId <= attestationCenter.numOfTaskDefinitions(),
            "ProtocolRegistry: Invalid task definition id."
        );

        _verifyVetoOperators(_requiredOperatorIds, _taskDefinitionId);

        protocolTaskDefinitionIds[_policyAddress].add(_taskDefinitionId);

        protocolTaskDefinitionOperatorIds[_policyAddress][
            _taskDefinitionId
        ] = _requiredOperatorIds;

        emit SubnetSubscribed(_policyAddress, _taskDefinitionId, _requiredOperatorIds);
    }

    function unsubscribeSubnet(
        address _policyAddress,
        uint16 _taskDefinitionId
    ) external onlyPolicyAdmin(_policyAddress) onlyExistsProtocol(_policyAddress) {
        require(
            protocolTaskDefinitionIds[_policyAddress].remove(_taskDefinitionId),
            "ProtocolRegistry: Subnet not subscribed."
        );

        delete protocolTaskDefinitionOperatorIds[_policyAddress][_taskDefinitionId];

        emit SubnetUnsubscribed(_policyAddress, _taskDefinitionId);
    }

    function setAttestationCenter(address _attestationCenter) external onlyRole(ADMIN_ROLE) {
        _setAttestationCenter(_attestationCenter);
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

    function _setAttestationCenter(address _attestationCenter) internal {
        attestationCenter = IAttestationCenter(_attestationCenter);

        emit AttestationCenterSet(_attestationCenter);
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

    function getProtocolTaskDefinitionIds(
        address _policyAddress
    ) external view onlyExistsProtocol(_policyAddress) returns (uint256[] memory) {
        return protocolTaskDefinitionIds[_policyAddress].values();
    }

    function isSubnetSubscribed(
        address _policyAddress,
        uint16 _taskDefinitionId
    ) external view onlyExistsProtocol(_policyAddress) returns (bool) {
        return protocolTaskDefinitionIds[_policyAddress].contains(_taskDefinitionId);
    }

    function getRequiredOperatorIds(
        address _policyAddress,
        uint16 _taskDefinitionId
    ) external view onlyExistsProtocol(_policyAddress) returns (uint256[] memory) {
        return protocolTaskDefinitionOperatorIds[_policyAddress][_taskDefinitionId];
    }

    function _verifyVetoOperators(
        uint256[] calldata _requiredOperatorIds,
        uint16 _taskDefinitionId
    ) internal view {
        if (_requiredOperatorIds.length == 0) {
            return;
        }

        require(
            _requiredOperatorIds.isSortedAndUnique(),
            "ProtocolRegistry: Required operator ids must be sorted."
        );

        IOBLS obls = attestationCenter.obls();

        for (uint256 i = 0; i < _requiredOperatorIds.length; i++) {
            require(
                obls.isActive(_requiredOperatorIds[i]),
                "ProtocolRegistry: Operator not active."
            );
        }

        if (_taskDefinitionId > 0) {
            uint256[] memory subnetOperatorIds = attestationCenter
                .getTaskDefinitionRestrictedOperators(_taskDefinitionId);

            uint256 missingOperatorId = _requiredOperatorIds.verifyArraySubset(subnetOperatorIds);
            require(missingOperatorId == 0, "ProtocolRegistry: Missing operator id.");
        }
    }

    function getProtocol(address _policyAddress) external view returns (Protocol memory) {
        return protocols[_policyAddress];
    }

    function getProtocolDetection(
        address _detectionEscrow
    ) external view returns (ProtocolDetection memory) {
        return protocolDetections[_detectionEscrow];
    }

    function _onlyPolicyAdmin(address _policyAddress) internal view {
        require(
            IAccessControlUpgradeable(_policyAddress).hasRole(ADMIN_ROLE, msg.sender),
            "ProtocolRegistry: Only policy admin."
        );
    }

    function _onlyExistsProtocol(address _policyAddress) internal view {
        require(
            protocols[_policyAddress].policyAddress != address(0),
            "ProtocolRegistry: Protocol not registered."
        );
    }

    function _authorizeUpgrade(address) internal view override onlyRole(ADMIN_ROLE) {}

    function version() external pure returns (uint256) {
        return 1;
    }
}
