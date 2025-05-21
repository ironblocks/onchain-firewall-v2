# IFirewallPolicy

## Overview

#### License: UNLICENSED

```solidity
interface IFirewallPolicy
```

Interface for the FirewallPolicy contract.
## Functions info

### preExecution (0xd9739cda)

```solidity
function preExecution(
    address _consumer,
    address _sender,
    bytes memory _data,
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
    bytes memory _data,
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
