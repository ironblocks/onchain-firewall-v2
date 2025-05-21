# VennAvsLogic

## Overview

#### License: UNLICENSED

```solidity
contract VennAvsLogic is AvsLogicBase, IVennAvsLogic
```


## State variables info

### feePool (0xae2e933b)

```solidity
contract IFeePool feePool
```

Get the fee pool address


Return values:

| Name | Type              | Description           |
| :--- | :---------------- | :-------------------- |
| [0]  | contract IFeePool | The fee pool address. |

### protocolRegistry (0x7656419f)

```solidity
contract IProtocolRegistry protocolRegistry
```

Get the protocol registry address


Return values:

| Name | Type                       | Description                    |
| :--- | :------------------------- | :----------------------------- |
| [0]  | contract IProtocolRegistry | The protocol registry address. |

## Functions info

### constructor

```solidity
constructor(
    address _attestationCenter,
    address _feePool,
    address _protocolRegistry
) AvsLogicBase(_attestationCenter)
```


### beforeTaskSubmission (0x502f5bd0)

```solidity
function beforeTaskSubmission(
    IAttestationCenter.TaskInfo calldata _taskInfo,
    bool,
    bytes calldata,
    uint256[2] calldata,
    uint256[] calldata _attestersIds
) external onlyAttestationCenter
```


### afterTaskSubmission (0xdd1a5387)

```solidity
function afterTaskSubmission(
    IAttestationCenter.TaskInfo calldata _taskInfo,
    bool _isApproved,
    bytes calldata,
    uint256[2] calldata,
    uint256[] calldata
) external onlyAttestationCenter
```


### setFeePool (0x19db2228)

```solidity
function setFeePool(address _feePool) external onlyRole(ADMIN_ROLE)
```

Set the fee pool address


Parameters:

| Name     | Type    | Description           |
| :------- | :------ | :-------------------- |
| _feePool | address | The fee pool address. |

### setProtocolRegistry (0x3e22119d)

```solidity
function setProtocolRegistry(
    address _protocolRegistry
) external onlyRole(ADMIN_ROLE)
```

Set the protocol registry address


Parameters:

| Name              | Type    | Description                    |
| :---------------- | :------ | :----------------------------- |
| _protocolRegistry | address | The protocol registry address. |

### receive

```solidity
receive() external payable
```

