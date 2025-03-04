// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

/**
 * @title IProtocolRegistry
 * @dev Interface for the Protocol Registry contract.
 */
interface IProtocolRegistry {
    /**
     * @dev Struct for storing protocol information.
     * @param policyAddress The address of the policy contract.
     * @param requiredOperatorIds The IDs of the operators required for the protocol.
     * @param taskDefinitionId The ID of the task definition for the protocol.
     * @param metadataURI The metadata URI for the protocol.
     */
    struct Protocol {
        address policyAddress;
        uint256[] requiredOperatorIds;
        uint16 taskDefinitionId;
        string metadataURI;
    }

    /**
     * @dev Struct for storing protocol detection information.
     * @param protocolAdmin The address of the protocol admin.
     * @param operator The address of the operator.
     * @param assets The addresses of the assets.
     * @param admins The addresses of the admins.
     * @param vennFee The fee for the protocol detection.
     * @param isApproved Whether the protocol detection is approved.
     * @param metadataURI The metadata URI for the protocol detection.
     */
    struct ProtocolDetection {
        address protocolAdmin;
        address operator;
        address[] assets;
        address[] admins;
        uint256 vennFee;
        bool isApproved;
        string metadataURI;
    }

    /**
     * @dev Event emitted when a protocol is updated.
     * @param policyAddress The address of the policy contract.
     * @param requiredOperatorIds The IDs of the operators required for the protocol.
     * @param taskDefinitionId The ID of the task definition for the protocol.
     * @param metadataURI The metadata URI for the protocol.
     */
    event ProtocolUpdated(
        address indexed policyAddress,
        uint256[] requiredOperatorIds,
        uint16 taskDefinitionId,
        string metadataURI
    );

    /**
     * @dev Event emitted when a task definition fee is set.
     * @param taskDefinitionId The ID of the task definition.
     * @param fee The fee for the task definition.
     */
    event TaskDefinitionFeeSet(uint16 indexed taskDefinitionId, uint256 fee);

    /**
     * @dev Event emitted when a protocol is registered.
     * @param policyAddress The address of the policy contract.
     * @param requiredOperatorIds The IDs of the operators required for the protocol.
     * @param taskDefinitionId The ID of the task definition for the protocol.
     * @param metadataURI The metadata URI for the protocol.
     */
    event ProtocolRegistered(
        address indexed policyAddress,
        uint256[] requiredOperatorIds,
        uint16 taskDefinitionId,
        string metadataURI
    );

    /**
     * @dev Event emitted when a protocol detection is approved.
     * @param detectionEscrow The address of the detection escrow.
     * @param operator The address of the operator.
     * @param assets The addresses of the assets.
     * @param admins The addresses of the admins.
     * @param metadataURI The metadata URI for the protocol detection.
     */
    event ProtocolDetectionApproved(
        address indexed detectionEscrow,
        address indexed operator,
        address[] assets,
        address[] admins,
        string metadataURI
    );

    /**
     * @dev Event emitted when a protocol detection is registered.
     * @param detectionEscrow The address of the detection escrow.
     * @param operator The address of the operator.
     * @param assets The addresses of the assets.
     * @param admins The addresses of the admins.
     * @param fee The fee for the protocol detection.
     * @param metadataURI The metadata URI for the protocol detection.
     */
    event ProtocolDetectionRegistered(
        address indexed detectionEscrow,
        address indexed operator,
        address[] assets,
        address[] admins,
        uint256 fee,
        string metadataURI
    );

    /**
     * @dev Event emitted when a venn fee recipient is set.
     * @param vennFeeRecipient The address of the venn fee recipient.
     */
    event VennFeeRecipientSet(address indexed vennFeeRecipient);

    /**
     * @dev Event emitted when a venn detection fee is set.
     * @param fee The fee for a venn detection.
     */
    event VennDetectionFeeSet(uint256 fee);

    /**
     * @dev Event emitted when a fee pool is set.
     * @param feePool The address of the fee pool.
     */
    event FeePoolSet(address indexed feePool);

    /**
     * @dev Event emitted when an attestation center is set.
     * @param attestationCenter The address of the attestation center.
     */
    event AttestationCenterSet(address indexed attestationCenter);

    /**
     * @dev Event emitted when a task definition max fee is set.
     * @param fee The maximum fee for a task definition.
     */
    event TaskDefinitionMaxFeeSet(uint256 fee);

    /**
     * @dev Event emitted when a venn protocol fee is set.
     * @param fee The fee for a venn protocol.
     */
    event VennProtocolFeeSet(uint256 fee);

    /**
     * @dev Initialize the protocol registry.
     * @param _attestationCenter The address of the attestation center.
     * @param _vennFeeRecipient The address of the venn fee recipient.
     * @param _feePool The address of the fee pool.
     * @param _taskDefinitionMaxFee The maximum fee for a task definition.
     * @param _vennDetectionFee The fee for a venn detection.
     * @param _vennProtocolFee The fee for a venn protocol.
     */
    function __ProtocolRegistry_init(
        address _attestationCenter,
        address _vennFeeRecipient,
        address _feePool,
        uint256 _taskDefinitionMaxFee,
        uint256 _vennDetectionFee,
        uint256 _vennProtocolFee
    ) external;

    /**
     * @dev Create and register a protocol detection.
     * @param _operator The address of the operator.
     * @param _assets The addresses of the assets.
     * @param _admins The addresses of the admins.
     * @param _metadataURI The metadata URI for the protocol detection.
     */
    function createAndRegisterProtocolDetection(
        address _operator,
        address[] calldata _assets,
        address[] calldata _admins,
        string calldata _metadataURI
    ) external;

    /**
     * @dev Approve a protocol detection as an operator.
     * @param _detectionEscrow The address of the detection escrow.
     */
    function approveProtocolDetectionAsOperator(address _detectionEscrow) external;

    /**
     * @dev Set the fee for a task definition.
     * @param _taskDefinitionId The ID of the task definition.
     * @param _fee The fee for the task definition.
     */
    function setTaskDefinitionFee(uint16 _taskDefinitionId, uint256 _fee) external;

    /**
     * @dev Register a protocol.
     * @param _policyAddress The address of the policy contract.
     * @param _requiredOperatorIds The IDs of the operators required for the protocol.
     * @param _taskDefinitionId The ID of the task definition for the protocol.
     * @param _metadataURI The metadata URI for the protocol.
     */
    function registerProtocol(
        address _policyAddress,
        uint256[] calldata _requiredOperatorIds,
        uint16 _taskDefinitionId,
        string calldata _metadataURI
    ) external;

    /**
     * @dev Update a protocol.
     * @param _policyAddress The address of the policy contract.
     * @param _requiredOperatorIds The IDs of the operators required for the protocol.
     * @param _taskDefinitionId The ID of the task definition for the protocol.
     * @param _metadataURI The metadata URI for the protocol.
     */
    function updateProtocol(
        address _policyAddress,
        uint256[] calldata _requiredOperatorIds,
        uint16 _taskDefinitionId,
        string calldata _metadataURI
    ) external;

    /**
     * @dev Set the fee pool.
     * @param _feePool The address of the fee pool.
     */
    function setFeePool(address _feePool) external;

    /**
     * @dev Set the attestation center.
     * @param _attestationCenter The address of the attestation center.
     */
    function setAttestationCenter(address _attestationCenter) external;

    /**
     * @dev Set the task definition max fee.
     * @param _taskDefinitionMaxFee The maximum fee for a task definition.
     */
    function setTaskDefinitionMaxFee(uint256 _taskDefinitionMaxFee) external;

    /**
     * @dev Set the venn detection fee.
     * @param _vennDetectionFee The fee for a venn detection.
     */
    function setVennDetectionFee(uint256 _vennDetectionFee) external;

    /**
     * @dev Set the venn protocol fee.
     * @param _vennProtocolFee The fee for a venn protocol.
     */
    function setVennProtocolFee(uint256 _vennProtocolFee) external;

    /**
     * @dev Set the venn fee recipient.
     * @param _vennFeeRecipient The address of the venn fee recipient.
     */
    function setVennFeeRecipient(address _vennFeeRecipient) external;

    /**
     * @dev Get the task definition ID for a protocol.
     * @param _policyAddress The address of the policy contract.
     * @return The ID of the task definition for the protocol.
     */
    function getProtocolTaskDefinitionId(address _policyAddress) external view returns (uint16);

    /**
     * @dev Get the fee for a protocol.
     * @param _policyAddress The address of the policy contract.
     * @return The fee for the protocol.
     */
    function getProtocolFee(address _policyAddress) external view returns (uint256);

    /**
     * @dev Get the required operator IDs for a protocol.
     * @param _policyAddress The address of the policy contract.
     * @return The IDs of the operators required for the protocol.
     */
    function getRequiredOperatorIds(
        address _policyAddress
    ) external view returns (uint256[] memory);

    /**
     * @dev Get the version of the protocol registry.
     * @return The version of the protocol registry.
     */
    function version() external pure returns (uint256);

    /**
     * @dev Get the admin role.
     * @return The admin role.
     */
    function ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the policy admin role.
     * @return The policy admin role.
     */
    function POLICY_ADMIN_ROLE() external view returns (bytes32);

    /**
     * @dev Get the maximum venn detection fee.
     * @return The maximum venn detection fee.
     */
    function MAX_VENN_DETECTION_FEE() external view returns (uint256);

    /**
     * @dev Get the maximum venn protocol fee.
     * @return The maximum venn protocol fee.
     */
    function MAX_VENN_PROTOCOL_FEE() external view returns (uint256);

    /**
     * @dev Get the fee for a task definition.
     * @param _taskDefinitionId The ID of the task definition.
     * @return The fee for the task definition.
     */
    function taskDefinitionIdFees(uint16 _taskDefinitionId) external view returns (uint256);

    /**
     * @dev Get the venn fee recipient.
     * @return The address of the venn fee recipient.
     */
    function vennFeeRecipient() external view returns (address);

    /**
     * @dev Get the attestation center.
     * @return The address of the attestation center.
     */
    function attestationCenter() external view returns (address);

    /**
     * @dev Get the fee pool.
     * @return The address of the fee pool.
     */
    function feePool() external view returns (address);

    /**
     * @dev Get the task definition max fee.
     * @return The maximum fee for a task definition.
     */
    function taskDefinitionMaxFee() external view returns (uint256);

    /**
     * @dev Get the venn detection fee. Base 1_000_000.
     * @return The fee for a venn detection.
     */
    function vennDetectionFee() external view returns (uint256);

    /**
     * @dev Get the venn protocol fee. Base 1_000_000.
     * @return The fee for a venn protocol.
     */
    function vennProtocolFee() external view returns (uint256);

    /**
     * @dev Get the protocol struct for a policy address.
     * @param _policyAddress The address of the policy contract.
     * @return The protocol struct for the policy address.
     */
    function getProtocols(address _policyAddress) external view returns (Protocol memory);

    /**
     * @dev Get the protocol detection struct for a detection escrow.
     * @param _detectionEscrow The address of the detection escrow.
     * @return The protocol detection struct for the detection escrow.
     */
    function getProtocolDetections(
        address _detectionEscrow
    ) external view returns (ProtocolDetection memory);
}
