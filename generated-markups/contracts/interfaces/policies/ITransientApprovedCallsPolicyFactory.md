# ITransientApprovedCallsPolicyFactory

## Overview

#### License: UNLICENSED

```solidity
interface ITransientApprovedCallsPolicyFactory
```

Interface for the TransientApprovedCallsPolicyFactory contract.
## Events info

### PolicyCreated

```solidity
event PolicyCreated(address indexed policy)
```

Emitted when a policy is created.


Parameters:

| Name   | Type    | Description                |
| :----- | :------ | :------------------------- |
| policy | address | The address of the policy. |

## Functions info

### create (0xcf5ba53f)

```solidity
function create(bytes calldata _data) external returns (address)
```

Create a new policy.


Parameters:

| Name  | Type  | Description                          |
| :---- | :---- | :----------------------------------- |
| _data | bytes | The data to create the policy with.  |


Return values:

| Name | Type    | Description                    |
| :--- | :------ | :----------------------------- |
| [0]  | address | The address of the new policy. |
