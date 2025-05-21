# FirewallPolicyBase

## Overview

#### License: UNLICENSED

```solidity
abstract contract FirewallPolicyBase is IFirewallPolicyBase
```


## State variables info

### authorizedExecutors (0x679d86a7)

```solidity
mapping(address => bool) authorizedExecutors
```

The authorized executors.


Parameters:

| Name    | Type    | Description                   |
| :------ | :------ | :---------------------------- |
| _caller | address | The address of the executor.  |


Return values:

| Name | Type | Description                            |
| :--- | :--- | :------------------------------------- |
| [0]  | bool | The authorized status of the executor. |

### approvedConsumer (0xb736b9e0)

```solidity
mapping(address => bool) approvedConsumer
```

The approved consumers.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _consumer | address | The address of the consumer.  |


Return values:

| Name | Type | Description                          |
| :--- | :--- | :----------------------------------- |
| [0]  | bool | The approved status of the consumer. |

## Modifiers info

### isAuthorized

```solidity
modifier isAuthorized(address _consumer)
```

Modifier to check if the consumer is authorized to execute the function.