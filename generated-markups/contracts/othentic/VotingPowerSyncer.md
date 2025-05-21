# VotingPowerSyncer

## Overview

#### License: UNLICENSED

```solidity
contract VotingPowerSyncer is IVotingPowerSyncer, Ownable
```


## State variables info

### obls (0x659fa976)

```solidity
contract IOBLS immutable obls
```

Returns the OBLS contract


Return values:

| Name | Type           | Description       |
| :--- | :------------- | :---------------- |
| [0]  | contract IOBLS | The OBLS contract |

### syncer (0xa81cd300)

```solidity
address syncer
```

Returns the syncer


Return values:

| Name | Type    | Description        |
| :--- | :------ | :----------------- |
| [0]  | address | The syncer address |

### lastSyncedL1BlockNumber (0xeef9dc9b)

```solidity
uint256 lastSyncedL1BlockNumber
```

Returns the last synced L1 block number


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The last synced L1 block number |

## Modifiers info

### onlySyncer

```solidity
modifier onlySyncer()
```


## Functions info

### constructor

```solidity
constructor(address _obls, address _syncer)
```


### setSyncer (0xfe378f9c)

```solidity
function setSyncer(address _syncer) external onlyOwner
```


### setOperatorVotingPower (0x8b3cce16)

```solidity
function setOperatorVotingPower(
    uint256 _l1BlockNumber,
    IVotingPowerSyncer.NewOperatorVotingPower memory _newOperatorVotingPower
) external onlySyncer
```


### setBatchOperatorVotingPower (0xf4ce1b0c)

```solidity
function setBatchOperatorVotingPower(
    uint256 _l1BlockNumber,
    IVotingPowerSyncer.NewOperatorVotingPower[] memory _operatorsVotingPower
) external onlySyncer
```


### setTotalVotingPowerPerRestrictedTaskDefinition (0xca87bf8f)

```solidity
function setTotalVotingPowerPerRestrictedTaskDefinition(
    uint16 _taskDefinitionId,
    uint256 _minimumVotingPower,
    uint256[] calldata _restrictedAttesterIds
) external onlySyncer
```


### setTotalVotingPowerPerTaskDefinition (0xe010f957)

```solidity
function setTotalVotingPowerPerTaskDefinition(
    uint16 _taskDefinitionId,
    uint256 _numOfTotalOperators,
    uint256 _minimumVotingPower
) external onlySyncer
```


### votingPower (0x72c4a927)

```solidity
function votingPower(uint256 _operatorId) external view returns (uint256)
```


### votingPowers (0x696fee13)

```solidity
function votingPowers(
    uint256[] memory _operatorIds
) external view returns (uint256[] memory _votingPowers)
```

