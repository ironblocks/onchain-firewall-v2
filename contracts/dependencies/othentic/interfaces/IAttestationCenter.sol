// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.19;

/**
 * @author Othentic Labs LTD.
 * @notice Terms of Service: https://www.othentic.xyz/terms-of-service
 */
import {IAvsLogic} from "./IAvsLogic.sol";
import {IOBLS} from "./IOBLS.sol";
import {TaskDefinitionParams} from "../TaskDefinitionLibrary.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IBeforePaymentsLogic} from "./IBeforePaymentsLogic.sol";

interface IAttestationCenter is IAccessControl {
    enum OperatorStatus {
        INACTIVE,
        ACTIVE
    }

    enum PaymentStatus {
        REDEEMED,
        COMMITTED,
        CHALLENGED
    }

    struct PaymentDetails {
        address operator;
        uint256 lastPaidTaskNumber;
        uint256 feeToClaim;
        PaymentStatus paymentStatus;
    }

    struct PaymentRequestMessage {
        address operator;
        uint256 feeToClaim;
    }

    struct TaskInfo {
        string proofOfTask;
        bytes data;
        address taskPerformer;
        uint16 taskDefinitionId;
    }

    struct TaskSubmissionDetails {
        bool isApproved;
        bytes tpSignature;
        uint256[2] taSignature;
        uint256[] attestersIds;
    }

    event OperatorRegisteredToNetwork(address operator, uint256 votingPower);
    event OperatorUnregisteredFromNetwork(uint256 operatorId);
    event PaymentRequested(address operator, uint256 lastPaidTaskNumber, uint256 feeToClaim);
    event PaymentsRequested(PaymentRequestMessage[] operators, uint256 lastPaidTaskNumber);
    event ClearPaymentRejected(
        address operator,
        uint256 requestedTaskNumber,
        uint256 requestedAmountClaimed
    );
    event TaskSubmitted(
        address operator,
        uint32 taskNumber,
        string proofOfTask,
        bytes data,
        uint16 taskDefinitionId
    );
    event TaskRejected(
        address operator,
        uint32 taskNumber,
        string proofOfTask,
        bytes data,
        uint16 taskDefinitionId
    );
    event SetAvsLogic(address avsLogic);
    event SetAvsGovernanceMultisig(address newAvsGovernanceMultisig);
    event SetMessageHandler(address newMessageHandler);
    event RewardAccumulated(
        uint256 indexed _operatorId,
        uint256 _baseRewardFeeForOperator,
        uint32 indexed _taskNumber
    );
    event SetFeeCalculator(address feeCalculator);
    event OperatorBlsKeyUpdated(address indexed operator, uint256[4] blsKey);
    event TaskDefinitionRestrictedOperatorsModified(
        uint16 taskDefinitionId,
        uint256[] restrictedOperatorIndexes,
        bool[] isRestricted
    );
    event SetMinimumTaskDefinitionVotingPower(uint minimumVotingPower);
    event SetRestrictedOperator(uint16 taskDefinitionId, uint256[] restrictedOperatorIndexes);

    error InvalidOperatorId();
    error InvalidOperatorsForPayment();
    error PaymentReedemed();
    error PaymentClaimed();
    error InvalidPaymentClaim();
    error MessageAlreadySigned();
    error InactiveTaskPerformer();
    error InactiveAggregator();
    error InvalidTaskDefinition();
    error TaskDefinitionNotFound(uint16 taskDefinitionId);
    error OperatorNotRegistered(address _operatorAddress);
    error InvalidPerformerSignature();
    error InvalidRangeForBatchPaymentRequest();
    error InvalidBlsKeyUpdateSignature();
    error InvalidRestrictedOperator(uint256 taskDefinitionId, uint256 operatorIndex);
    error InvalidRestrictedOperatorIndexes();
    error InvalidArrayLength();
    error InvalidAttesterSet();

    function taskNumber() external view returns (uint32);

    function baseRewardFee() external view returns (uint256);

    function numOfOperators() external view returns (uint256);

    function numOfTotalOperators() external view returns (uint256);

    function votingPower(address _operator) external view returns (uint256);

    function getOperatorPaymentDetail(
        uint256 _operatorId
    ) external view returns (PaymentDetails memory);

    function getTaskDefinitionMinimumVotingPower(
        uint16 _taskDefinitionId
    ) external view returns (uint256);

    function getTaskDefinitionMaximumNumberOfAttesters(
        uint16 _taskDefinitionId
    ) external view returns (uint256);

    function getTaskDefinitionRestrictedOperators(
        uint16 _taskDefinitionId
    ) external view returns (uint256[] memory);

    function numOfTaskDefinitions() external view returns (uint16);

    function getTaskDefinitionRestrictedAttesters(
        uint16 _taskDefinitionId
    ) external view returns (uint256[] memory);

    function operatorsIdsByAddress(address _operator) external view returns (uint256);

    function avsLogic() external view returns (IAvsLogic);

    function beforePaymentsLogic() external view returns (IBeforePaymentsLogic);

    function obls() external view returns (IOBLS);

    // obsolete - use submit task with TaskSubmissionDetails
    function submitTask(
        TaskInfo calldata _taskInfo,
        bool _isApproved,
        bytes calldata _tpSignature,
        uint256[2] calldata _taSignature,
        uint256[] calldata _attestersIds
    ) external;

    function submitTask(
        TaskInfo calldata _taskInfo,
        TaskSubmissionDetails calldata _taskSubmissionDetails
    ) external;

    function requestPayment(uint256 _operatorId) external;

    function requestBatchPayment() external;

    function requestBatchPayment(uint _from, uint _to) external;

    function registerToNetwork(
        address _operator,
        uint256 _votingPower,
        uint256[4] memory _blsKey,
        address _rewardsReceiver
    ) external;

    function unRegisterOperatorFromNetwork(address _operator) external;

    function clearPayment(
        address _operator,
        uint256 _lastPaidTaskNumber,
        uint256 _amountClaimed
    ) external;

    function clearBatchPayment(
        PaymentRequestMessage[] memory _operators,
        uint256 _lastPaidTaskNumber
    ) external;

    function transferAvsGovernanceMultisig(address _newAvsGovernanceMultisig) external;

    function setAvsLogic(IAvsLogic _avsLogic) external;

    function createNewTaskDefinition(
        string memory _name,
        TaskDefinitionParams calldata _taskDefinitionParams
    ) external returns (uint16);

    function setTaskDefinitionMinVotingPower(
        uint16 _taskDefinitionId,
        uint256 _minimumVotingPower
    ) external;

    function setTaskDefinitionRestrictedAttesters(
        uint16 _taskDefinitionId,
        uint256[] calldata _restrictedAttesterIndexes
    ) external;

    function setTaskDefinitionRestrictedOperators(
        uint16 _taskDefinitionId,
        uint256[] calldata _restrictedOperatorIndexes
    ) external;

    function setIsOpenAggregator(bool _isOpenAggregator) external;

    function vault() external view returns (address);
    function avsTreasury() external view returns (address);

    function transferMessageHandler(address _newMessageHandler) external;

    function setFeeCalculator(address _feeCalculator) external;

    function isFlowPaused(bytes4 _pausableFlow) external view returns (bool _isPaused);
    function pause(bytes4 _pausableFlow) external;
    function unpause(bytes4 _pausableFlow) external;

    function setOblsSharesSyncer(address _oblsSharesSyncer) external;
}
