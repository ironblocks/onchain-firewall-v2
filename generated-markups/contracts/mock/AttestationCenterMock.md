# AttestationCenterMock

## Overview

#### License: UNLICENSED

```solidity
contract AttestationCenterMock
```


## Events info

### TaskSubmitted

```solidity
event TaskSubmitted(IAttestationCenter.TaskInfo _taskInfo, IAttestationCenter.TaskSubmissionDetails _taskSubmissionDetails)
```


## State variables info

### obls (0x659fa976)

```solidity
address obls
```


### numOfTaskDefinitions (0x34a7c391)

```solidity
uint16 numOfTaskDefinitions
```


### taskDefinitionRestrictedOperators (0x9141ed2c)

```solidity
mapping(uint16 => uint256[]) taskDefinitionRestrictedOperators
```


## Functions info

### constructor

```solidity
constructor(address _obls)
```


### operatorsIdsByAddress (0x5b15c568)

```solidity
function operatorsIdsByAddress(
    address _operator
) external pure returns (uint256)
```


### setTaskDefinitionRestrictedOperators (0xc8c9e7ab)

```solidity
function setTaskDefinitionRestrictedOperators(
    uint16 _taskDefinitionId,
    uint256[] calldata _operatorIds
) external
```


### getTaskDefinitionRestrictedOperators (0x4e2ce53f)

```solidity
function getTaskDefinitionRestrictedOperators(
    uint16 _taskDefinitionId
) external view returns (uint256[] memory)
```


### submitTask (0xfff768e3)

```solidity
function submitTask(
    IAttestationCenter.TaskInfo calldata _taskInfo,
    IAttestationCenter.TaskSubmissionDetails calldata _taskSubmissionDetails
) external payable
```


### setNumOfTaskDefinitions (0xccf73449)

```solidity
function setNumOfTaskDefinitions(uint16 _numOfTaskDefinitions) external
```


### getOperatorPaymentDetail (0x9eb72d4c)

```solidity
function getOperatorPaymentDetail(
    uint256 _operatorId
) external pure returns (IAttestationCenter.PaymentDetails memory _operator)
```

