# PolicyMock

## Overview

#### License: UNLICENSED

```solidity
contract PolicyMock is IFirewallPolicy, AccessControlUpgradeable
```


## Events info

### PreExecutionMock

```solidity
event PreExecutionMock(address consumer, address sender, bytes data, uint256 value)
```


### PostExecutionMock

```solidity
event PostExecutionMock(address consumer, address sender, bytes data, uint256 value)
```


### TaskPerformed

```solidity
event TaskPerformed(address sender, bytes data)
```


## Constants info

### ADMIN_ROLE (0x75b238fc)

```solidity
bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE")
```


## State variables info

### preAlwaysFails (0xf01938d1)

```solidity
bool preAlwaysFails
```


### postAlwaysFails (0x356fd5fd)

```solidity
bool postAlwaysFails
```


## Functions info

### constructor

```solidity
constructor()
```


### setPreAlwaysFails (0x271155c7)

```solidity
function setPreAlwaysFails(bool _alwaysFails) external
```


### setPostAlwaysFails (0x852fda26)

```solidity
function setPostAlwaysFails(bool _alwaysFails) external
```


### preExecution (0xd9739cda)

```solidity
function preExecution(
    address _consumer,
    address _sender,
    bytes calldata _data,
    uint256 _value
) external
```

Pre-execution hook for the firewall policy.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _consumer | address | The address of the consumer.  |
| _sender   | address | The address of the sender.    |
| _data     | bytes   | The data of the call.         |
| _value    | uint256 | The value of the call.        |

### postExecution (0xc6d4328b)

```solidity
function postExecution(
    address _consumer,
    address _sender,
    bytes calldata _data,
    uint256 _value
) external
```

Post-execution hook for the firewall policy.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _consumer | address | The address of the consumer.  |
| _sender   | address | The address of the sender.    |
| _data     | bytes   | The data of the call.         |
| _value    | uint256 | The value of the call.        |

### performTask (0xfcf145c7)

```solidity
function performTask(bytes calldata _data) external
```

