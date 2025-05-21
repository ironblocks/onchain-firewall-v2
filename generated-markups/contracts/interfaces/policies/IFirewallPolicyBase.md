# IFirewallPolicyBase

## Overview

#### License: UNLICENSED

```solidity
interface IFirewallPolicyBase is IFirewallPolicy
```


## Events info

### ConsumerStatusSet

```solidity
event ConsumerStatusSet(address consumer, bool status)
```

The event emitted when the consumer status is set.


Parameters:

| Name     | Type    | Description                   |
| :------- | :------ | :---------------------------- |
| consumer | address | The address of the consumer.  |
| status   | bool    | The status of the consumer.   |

### ExecutorStatusSet

```solidity
event ExecutorStatusSet(address executor, bool status)
```

The event emitted when the executor status is set.


Parameters:

| Name     | Type    | Description                   |
| :------- | :------ | :---------------------------- |
| executor | address | The address of the executor.  |
| status   | bool    | The status of the executor.   |

## Functions info

### setConsumersStatuses (0x707aaf20)

```solidity
function setConsumersStatuses(
    address[] calldata _consumers,
    bool[] calldata _statuses
) external
```

Sets approval status of multiple consumers.
This is useful for adding a large amount of consumers to the allowlist in a single transaction.


Parameters:

| Name       | Type      | Description                                    |
| :--------- | :-------- | :--------------------------------------------- |
| _consumers | address[] | The consumers to set the approval status for.  |
| _statuses  | bool[]    | The approval status to set.                    |

### setExecutorStatus (0x62bb2f40)

```solidity
function setExecutorStatus(address _caller, bool _status) external
```

Sets the executor status.



Parameters:

| Name    | Type    | Description                   |
| :------ | :------ | :---------------------------- |
| _caller | address | The address of the executor.  |
| _status | bool    | The executor status to set.   |

### authorizedExecutors (0x679d86a7)

```solidity
function authorizedExecutors(address _caller) external view returns (bool)
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
function approvedConsumer(address _consumer) external view returns (bool)
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
