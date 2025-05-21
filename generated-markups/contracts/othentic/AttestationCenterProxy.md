# AttestationCenterProxy

## Overview

#### License: UNLICENSED

```solidity
contract AttestationCenterProxy is IAttestationCenterProxy, IERC165, AccessControlUpgradeable, SupportsSafeFunctionCalls, UUPSUpgradeable
```


## Constants info

### ADMIN_ROLE (0x75b238fc)

```solidity
bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE")
```

Get the admin role.
Admins can approve calls and change the address of the attestation center.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

## State variables info

### feePool (0xae2e933b)

```solidity
contract IFeePool feePool
```

Get the fee pool address.


Return values:

| Name | Type              | Description                  |
| :--- | :---------------- | :--------------------------- |
| [0]  | contract IFeePool | The address of the fee pool. |

### attestationCenter (0xd92807a2)

```solidity
contract IAttestationCenter attestationCenter
```

Get the attestation center address.


Return values:

| Name | Type                        | Description                            |
| :--- | :-------------------------- | :------------------------------------- |
| [0]  | contract IAttestationCenter | The address of the attestation center. |

## Functions info

### constructor

```solidity
constructor()
```

oz-upgrades-unsafe-allow: constructor
### __AttestationCenterProxy_init (0xa9d3afc7)

```solidity
function __AttestationCenterProxy_init(
    address _feePool,
    address _attestationCenter
) external initializer
```


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
function setAttestationCenter(
    address _attestationCenter
) external onlyRole(ADMIN_ROLE)
```

Set the attestation center address.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### setFeePool (0x19db2228)

```solidity
function setFeePool(address _feePool) external onlyRole(ADMIN_ROLE)
```

Set the fee pool address.


Parameters:

| Name     | Type    | Description                  |
| :------- | :------ | :--------------------------- |
| _feePool | address | The address of the fee pool. |

### supportsInterface (0x01ffc9a7)

```solidity
function supportsInterface(
    bytes4 _interfaceId
) public view override returns (bool)
```

See {IERC165-supportsInterface}.
### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

Get the version of the attestation center proxy.


Return values:

| Name | Type    | Description                                  |
| :--- | :------ | :------------------------------------------- |
| [0]  | uint256 | The version of the attestation center proxy. |
