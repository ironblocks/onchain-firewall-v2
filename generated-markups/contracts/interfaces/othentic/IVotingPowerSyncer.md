# IVotingPowerSyncer

## Overview

#### License: UNLICENSED

```solidity
interface IVotingPowerSyncer
```


## Structs info

### NewOperatorVotingPower

```solidity
struct NewOperatorVotingPower {
	uint256 operatorId;
	uint256 votingPower;
}
```


## Events info

### SyncerSet

```solidity
event SyncerSet(address indexed newSyncer)
```

Emitted when the syncer is set


Parameters:

| Name      | Type    | Description            |
| :-------- | :------ | :--------------------- |
| newSyncer | address | The new syncer address |

### OperatorVotingPowerSet

```solidity
event OperatorVotingPowerSet(IVotingPowerSyncer.NewOperatorVotingPower newOperatorVotingPower)
```

Emitted when the voting power of an operator is set


Parameters:

| Name                   | Type                                             | Description                          |
| :--------------------- | :----------------------------------------------- | :----------------------------------- |
| newOperatorVotingPower | struct IVotingPowerSyncer.NewOperatorVotingPower | The new voting power of the operator |

### BatchOperatorVotingPowerSet

```solidity
event BatchOperatorVotingPowerSet(IVotingPowerSyncer.NewOperatorVotingPower[] newOperatorVotingPowers)
```

Emitted when the batch of voting power of operators is set


Parameters:

| Name                    | Type                                               | Description                            |
| :---------------------- | :------------------------------------------------- | :------------------------------------- |
| newOperatorVotingPowers | struct IVotingPowerSyncer.NewOperatorVotingPower[] | The batch of voting power of operators |

## Functions info

### setSyncer (0xfe378f9c)

```solidity
function setSyncer(address newSyncer) external
```

Sets the syncer


Parameters:

| Name      | Type    | Description            |
| :-------- | :------ | :--------------------- |
| newSyncer | address | The new syncer address |

### setOperatorVotingPower (0x8b3cce16)

```solidity
function setOperatorVotingPower(
    uint256 l1BlockNumber,
    IVotingPowerSyncer.NewOperatorVotingPower memory newOperatorVotingPower
) external
```

Sets the voting power of an operator


Parameters:

| Name                   | Type                                             | Description                          |
| :--------------------- | :----------------------------------------------- | :----------------------------------- |
| l1BlockNumber          | uint256                                          | The L1 block number                  |
| newOperatorVotingPower | struct IVotingPowerSyncer.NewOperatorVotingPower | The new voting power of the operator |

### setBatchOperatorVotingPower (0xf4ce1b0c)

```solidity
function setBatchOperatorVotingPower(
    uint256 l1BlockNumber,
    IVotingPowerSyncer.NewOperatorVotingPower[] memory newOperatorVotingPowers
) external
```

Sets the voting power of a batch of operators


Parameters:

| Name                    | Type                                               | Description                           |
| :---------------------- | :------------------------------------------------- | :------------------------------------ |
| l1BlockNumber           | uint256                                            | The L1 block number                   |
| newOperatorVotingPowers | struct IVotingPowerSyncer.NewOperatorVotingPower[] | The new voting power of the operators |

### setTotalVotingPowerPerRestrictedTaskDefinition (0xca87bf8f)

```solidity
function setTotalVotingPowerPerRestrictedTaskDefinition(
    uint16 taskDefinitionId,
    uint256 minimumVotingPower,
    uint256[] calldata restrictedAttesterIds
) external
```

Sets the total voting power per restricted task definition


Parameters:

| Name                  | Type      | Description                 |
| :-------------------- | :-------- | :-------------------------- |
| taskDefinitionId      | uint16    | The task definition ID      |
| minimumVotingPower    | uint256   | The minimum voting power    |
| restrictedAttesterIds | uint256[] | The restricted attester IDs |

### setTotalVotingPowerPerTaskDefinition (0xe010f957)

```solidity
function setTotalVotingPowerPerTaskDefinition(
    uint16 taskDefinitionId,
    uint256 numOfTotalOperators,
    uint256 minimumVotingPower
) external
```

Sets the total voting power per task definition


Parameters:

| Name                | Type    | Description                    |
| :------------------ | :------ | :----------------------------- |
| taskDefinitionId    | uint16  | The task definition ID         |
| numOfTotalOperators | uint256 | The number of total operators  |
| minimumVotingPower  | uint256 | The minimum voting power       |

### votingPower (0x72c4a927)

```solidity
function votingPower(uint256 operatorId) external view returns (uint256)
```

Returns the voting power of an operator


Parameters:

| Name       | Type    | Description      |
| :--------- | :------ | :--------------- |
| operatorId | uint256 | The operator ID  |


Return values:

| Name | Type    | Description                      |
| :--- | :------ | :------------------------------- |
| [0]  | uint256 | The voting power of the operator |

### votingPowers (0x696fee13)

```solidity
function votingPowers(
    uint256[] memory operatorIds
) external view returns (uint256[] memory)
```

Returns the voting powers of a batch of operators


Parameters:

| Name        | Type      | Description       |
| :---------- | :-------- | :---------------- |
| operatorIds | uint256[] | The operator IDs  |


Return values:

| Name | Type      | Description                        |
| :--- | :-------- | :--------------------------------- |
| [0]  | uint256[] | The voting powers of the operators |

### obls (0x659fa976)

```solidity
function obls() external view returns (IOBLS)
```

Returns the OBLS contract


Return values:

| Name | Type           | Description       |
| :--- | :------------- | :---------------- |
| [0]  | contract IOBLS | The OBLS contract |

### syncer (0xa81cd300)

```solidity
function syncer() external view returns (address)
```

Returns the syncer


Return values:

| Name | Type    | Description        |
| :--- | :------ | :----------------- |
| [0]  | address | The syncer address |

### lastSyncedL1BlockNumber (0xeef9dc9b)

```solidity
function lastSyncedL1BlockNumber() external view returns (uint256)
```

Returns the last synced L1 block number


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The last synced L1 block number |
