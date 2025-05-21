# FirewallPolicyBaseMock

## Overview

#### License: UNLICENSED

```solidity
contract FirewallPolicyBaseMock is FirewallPolicyBase
```


## Functions info

### setConsumersStatuses (0x707aaf20)

```solidity
function setConsumersStatuses(
    address[] calldata _consumers,
    bool[] calldata _statuses
) external override
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
function setExecutorStatus(address _caller, bool _status) external override
```

Sets the executor status.



Parameters:

| Name    | Type    | Description                   |
| :------ | :------ | :---------------------------- |
| _caller | address | The address of the executor.  |
| _status | bool    | The executor status to set.   |

### preExecution (0xd9739cda)

```solidity
function preExecution(
    address,
    address,
    bytes memory,
    uint256
) external override
```


### postExecution (0xc6d4328b)

```solidity
function postExecution(
    address,
    address,
    bytes memory,
    uint256
) external override
```


### onlyAuthorized (0x415964fc)

```solidity
function onlyAuthorized(
    address _consumer
) external view isAuthorized(_consumer)
```

