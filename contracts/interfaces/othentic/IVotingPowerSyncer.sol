// SPDX-License-Identifier: UNLICENSED
// See LICENSE file for full license text.
// Copyright (c) Ironblocks 2025
pragma solidity ^0.8.25;

import {IOBLS} from "../../dependencies/othentic/interfaces/IOBLS.sol";

interface IVotingPowerSyncer {
    struct NewOperatorVotingPower {
        uint256 operatorId;
        uint256 votingPower;
    }

    /**
     * @dev Emitted when the syncer is set
     * @param newSyncer The new syncer address
     */
    event SyncerSet(address indexed newSyncer);

    /**
     * @dev Emitted when the voting power of an operator is set
     * @param newOperatorVotingPower The new voting power of the operator
     */
    event OperatorVotingPowerSet(NewOperatorVotingPower newOperatorVotingPower);

    /**
     * @dev Emitted when the batch of voting power of operators is set
     * @param newOperatorVotingPowers The batch of voting power of operators
     */
    event BatchOperatorVotingPowerSet(NewOperatorVotingPower[] newOperatorVotingPowers);

    /**
     * @dev Sets the syncer
     * @param newSyncer The new syncer address
     */
    function setSyncer(address newSyncer) external;

    /**
     * @dev Sets the voting power of an operator
     * @param l1BlockNumber The L1 block number
     * @param newOperatorVotingPower The new voting power of the operator
     */
    function setOperatorVotingPower(
        uint256 l1BlockNumber,
        NewOperatorVotingPower memory newOperatorVotingPower
    ) external;

    /**
     * @dev Sets the voting power of a batch of operators
     * @param l1BlockNumber The L1 block number
     * @param newOperatorVotingPowers The new voting power of the operators
     */
    function setBatchOperatorVotingPower(
        uint256 l1BlockNumber,
        NewOperatorVotingPower[] memory newOperatorVotingPowers
    ) external;

    /**
     * @dev Sets the total voting power per restricted task definition
     * @param taskDefinitionId The task definition ID
     * @param minimumVotingPower The minimum voting power
     * @param restrictedAttesterIds The restricted attester IDs
     */
    function setTotalVotingPowerPerRestrictedTaskDefinition(
        uint16 taskDefinitionId,
        uint256 minimumVotingPower,
        uint256[] calldata restrictedAttesterIds
    ) external;

    /**
     * @dev Sets the total voting power per task definition
     * @param taskDefinitionId The task definition ID
     * @param numOfTotalOperators The number of total operators
     * @param minimumVotingPower The minimum voting power
     */
    function setTotalVotingPowerPerTaskDefinition(
        uint16 taskDefinitionId,
        uint256 numOfTotalOperators,
        uint256 minimumVotingPower
    ) external;

    /**
     * @dev Returns the voting power of an operator
     * @param operatorId The operator ID
     * @return The voting power of the operator
     */
    function votingPower(uint256 operatorId) external view returns (uint256);

    /**
     * @dev Returns the voting powers of a batch of operators
     * @param operatorIds The operator IDs
     * @return The voting powers of the operators
     */
    function votingPowers(uint256[] memory operatorIds) external view returns (uint256[] memory);

    /**
     * @dev Returns the OBLS contract
     * @return The OBLS contract
     */
    function obls() external view returns (IOBLS);

    /**
     * @dev Returns the syncer
     * @return The syncer address
     */
    function syncer() external view returns (address);

    /**
     * @dev Returns the last synced L1 block number
     * @return The last synced L1 block number
     */
    function lastSyncedL1BlockNumber() external view returns (uint256);
}
