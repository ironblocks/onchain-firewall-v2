# OBLSMock

## Overview

#### License: UNLICENSED

```solidity
contract OBLSMock
```


## Functions info

### isActive (0x82afd23b)

```solidity
function isActive(uint256 _index) external pure returns (bool)
```


### increaseOperatorVotingPower (0xd66f643d)

```solidity
function increaseOperatorVotingPower(
    uint256 _index,
    uint256 _votingPower
) external
```


### decreaseOperatorVotingPower (0x20f527ad)

```solidity
function decreaseOperatorVotingPower(
    uint256 _index,
    uint256 _votingPower
) external
```


### setTotalVotingPowerPerRestrictedTaskDefinition (0xca87bf8f)

```solidity
function setTotalVotingPowerPerRestrictedTaskDefinition(
    uint16 _taskDefinitionId,
    uint256 _minimumVotingPower,
    uint256[] calldata _restrictedAttesterIds
) external
```


### setTotalVotingPowerPerTaskDefinition (0xe010f957)

```solidity
function setTotalVotingPowerPerTaskDefinition(
    uint16 _taskDefinitionId,
    uint256 _numOfTotalOperators,
    uint256 _minimumVotingPower
) external
```


### votingPower (0x72c4a927)

```solidity
function votingPower(uint256 _operatorId) external view returns (uint256)
```

