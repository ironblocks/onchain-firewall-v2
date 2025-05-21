# IAttestationCenterProxy

## Overview

#### License: UNLICENSED

```solidity
interface IAttestationCenterProxy
```

Interface for the AttestationCenterProxy contract.
## Events info

### AttestationCenterUpdated

```solidity
event AttestationCenterUpdated(address newAttestationCenter)
```

Emitted when the attestation center is updated.


Parameters:

| Name                 | Type    | Description                 |
| :------------------- | :------ | :-------------------------- |
| newAttestationCenter | address | The new attestation center. |

### FeePoolUpdated

```solidity
event FeePoolUpdated(address newFeePool)
```

Emitted when the fee pool is updated.


Parameters:

| Name       | Type    | Description       |
| :--------- | :------ | :---------------- |
| newFeePool | address | The new fee pool. |

## Functions info

### submitTask (0xfff768e3)

```solidity
function submitTask(
    IAttestationCenter.TaskInfo calldata _taskInfo,
    IAttestationCenter.TaskSubmissionDetails calldata _taskSubmissionDetails
) external payable
```

Submit a single task to the attestation center.


Parameters:

| Name                   | Type                                            | Description                  |
| :--------------------- | :---------------------------------------------- | :--------------------------- |
| _taskInfo              | struct IAttestationCenter.TaskInfo              | The task information.        |
| _taskSubmissionDetails | struct IAttestationCenter.TaskSubmissionDetails | The task submission details. |

### submitTasks (0xfdb6cbd3)

```solidity
function submitTasks(
    IAttestationCenter.TaskInfo[] calldata _taskInfo,
    IAttestationCenter.TaskSubmissionDetails[] calldata _taskSubmissionDetails
) external payable
```

Submit multiple tasks to the attestation center.


Parameters:

| Name                   | Type                                              | Description                  |
| :--------------------- | :------------------------------------------------ | :--------------------------- |
| _taskInfo              | struct IAttestationCenter.TaskInfo[]              | The task information.        |
| _taskSubmissionDetails | struct IAttestationCenter.TaskSubmissionDetails[] | The task submission details. |

### setAttestationCenter (0x11c69311)

```solidity
function setAttestationCenter(address _attestationCenter) external
```

Set the attestation center address.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### setFeePool (0x19db2228)

```solidity
function setFeePool(address _feePool) external
```

Set the fee pool address.


Parameters:

| Name     | Type    | Description                  |
| :------- | :------ | :--------------------------- |
| _feePool | address | The address of the fee pool. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.
Admins can approve calls and change the address of the attestation center.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### feePool (0xae2e933b)

```solidity
function feePool() external view returns (IFeePool)
```

Get the fee pool address.


Return values:

| Name | Type              | Description                  |
| :--- | :---------------- | :--------------------------- |
| [0]  | contract IFeePool | The address of the fee pool. |

### attestationCenter (0xd92807a2)

```solidity
function attestationCenter() external view returns (IAttestationCenter)
```

Get the attestation center address.


Return values:

| Name | Type                        | Description                            |
| :--- | :-------------------------- | :------------------------------------- |
| [0]  | contract IAttestationCenter | The address of the attestation center. |

### version (0x54fd4d50)

```solidity
function version() external view returns (uint256)
```

Get the version of the attestation center proxy.


Return values:

| Name | Type    | Description                                  |
| :--- | :------ | :------------------------------------------- |
| [0]  | uint256 | The version of the attestation center proxy. |
