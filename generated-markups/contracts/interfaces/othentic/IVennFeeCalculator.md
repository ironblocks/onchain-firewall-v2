# IVennFeeCalculator

## Overview

#### License: UNLICENSED

```solidity
interface IVennFeeCalculator is IFeeCalculator
```

Interface for the VennFeeCalculator contract.
## Enums info

### OperatorType

```solidity
enum OperatorType {
	 ATTESTER,
	 AGGREGATOR,
	 PERFORMER
}
```

Enum for the operator types.
## Events info

### TaskDefinitionFeeSet

```solidity
event TaskDefinitionFeeSet(uint16 indexed _taskDefinitionId, uint256 _totalFee)
```

Event for the task definition fee set.


Parameters:

| Name              | Type    | Description              |
| :---------------- | :------ | :----------------------- |
| _taskDefinitionId | uint16  | The task definition id.  |
| _totalFee         | uint256 | The total fee.           |

### TaskDefinitionFeeRecipientsSet

```solidity
event TaskDefinitionFeeRecipientsSet(uint16 indexed _taskDefinitionId, bytes32[] _recipients, uint256[] _feeShares)
```

Event for the fee recipients set.


Parameters:

| Name              | Type      | Description              |
| :---------------- | :-------- | :----------------------- |
| _taskDefinitionId | uint16    | The task definition id.  |
| _recipients       | bytes32[] | The recipients.          |
| _feeShares        | uint256[] | The fee shares.          |

### TaskDefinitionIdOperatorFeesSet

```solidity
event TaskDefinitionIdOperatorFeesSet(uint16 indexed _taskDefinitionId, IVennFeeCalculator.OperatorType[] _operatorTypes, uint256[] _fees)
```

Event for the task definition id operator fees set.


Parameters:

| Name              | Type                                   | Description              |
| :---------------- | :------------------------------------- | :----------------------- |
| _taskDefinitionId | uint16                                 | The task definition id.  |
| _operatorTypes    | enum IVennFeeCalculator.OperatorType[] | The operator types.      |
| _fees             | uint256[]                              | The fees.                |

### FeeDistributed

```solidity
event FeeDistributed(uint16 indexed _taskDefinitionId, bytes32 indexed _recipient, uint256 _feeAmount)
```

Event for the fee distributed.


Parameters:

| Name              | Type    | Description              |
| :---------------- | :------ | :----------------------- |
| _taskDefinitionId | uint16  | The task definition id.  |
| _recipient        | bytes32 | The recipient.           |
| _feeAmount        | uint256 | The fee amount.          |

### FeeWithdrawn

```solidity
event FeeWithdrawn(uint16 indexed _taskDefinitionId, bytes32 indexed _recipient, uint256 _feeAmount)
```

Event for the fee withdrawn.


Parameters:

| Name              | Type    | Description              |
| :---------------- | :------ | :----------------------- |
| _taskDefinitionId | uint16  | The task definition id.  |
| _recipient        | bytes32 | The recipient.           |
| _feeAmount        | uint256 | The fee amount.          |

### OperatorRegistryUpdated

```solidity
event OperatorRegistryUpdated(address newOperatorRegistry)
```

Emitted when the operator registry is updated.


Parameters:

| Name                | Type    | Description                |
| :------------------ | :------ | :------------------------- |
| newOperatorRegistry | address | The new operator registry. |

## Functions info

### setOperatorRegistry (0x9d28fb86)

```solidity
function setOperatorRegistry(address _operatorRegistry) external
```

Set the operator registry address.


Parameters:

| Name              | Type    | Description                           |
| :---------------- | :------ | :------------------------------------ |
| _operatorRegistry | address | The address of the operator registry. |

### operatorRegistry (0x58c2225b)

```solidity
function operatorRegistry() external view returns (IOperatorRegistry)
```

Get the operator registry address.


Return values:

| Name | Type                       | Description                           |
| :--- | :------------------------- | :------------------------------------ |
| [0]  | contract IOperatorRegistry | The address of the operator registry. |

### setTaskDefinitionFee (0xe564a559)

```solidity
function setTaskDefinitionFee(
    uint16 _taskDefinitionId,
    uint256 _totalFee
) external
```

Set the task definition id fee.


Parameters:

| Name              | Type    | Description              |
| :---------------- | :------ | :----------------------- |
| _taskDefinitionId | uint16  | The task definition id.  |
| _totalFee         | uint256 | The total fee.           |

### setTaskDefinitionFeeRecipients (0x91ac171b)

```solidity
function setTaskDefinitionFeeRecipients(
    uint16 _taskDefinitionId,
    bytes32[] calldata _recipients,
    uint256[] calldata _feeShares
) external
```

Set the task definition id fee recipients.


Parameters:

| Name              | Type      | Description              |
| :---------------- | :-------- | :----------------------- |
| _taskDefinitionId | uint16    | The task definition id.  |
| _recipients       | bytes32[] | The recipients.          |
| _feeShares        | uint256[] | The fee shares.          |

### setTaskDefinitionIdOperatorFees (0x80b538c7)

```solidity
function setTaskDefinitionIdOperatorFees(
    uint16 _taskDefinitionId,
    IVennFeeCalculator.OperatorType[] calldata _operatorTypes,
    uint256[] calldata _fees
) external
```

Set the task definition id operator fees.


Parameters:

| Name              | Type                                   | Description              |
| :---------------- | :------------------------------------- | :----------------------- |
| _taskDefinitionId | uint16                                 | The task definition id.  |
| _operatorTypes    | enum IVennFeeCalculator.OperatorType[] | The operator types.      |
| _fees             | uint256[]                              | The fees.                |

### distributeFee (0x8bebae13)

```solidity
function distributeFee(uint16 _taskDefinitionId) external
```

Distribute the fee.


Parameters:

| Name              | Type   | Description             |
| :---------------- | :----- | :---------------------- |
| _taskDefinitionId | uint16 | The task definition id. |

### withdrawFee (0x61ef2459)

```solidity
function withdrawFee(
    uint16 _taskDefinitionId,
    bytes32 _recipient
) external returns (uint256)
```

Withdraw the fee.


Parameters:

| Name              | Type    | Description              |
| :---------------- | :------ | :----------------------- |
| _taskDefinitionId | uint16  | The task definition id.  |
| _recipient        | bytes32 | The recipient.           |


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | uint256 | The fee amount. |

### taskDefinitionIdOperatorFees (0x38a837a5)

```solidity
function taskDefinitionIdOperatorFees(
    uint16 _taskDefinitionId,
    IVennFeeCalculator.OperatorType _operatorType
) external view returns (uint256)
```

Get the task definition id operator fees.


Parameters:

| Name              | Type                                 | Description              |
| :---------------- | :----------------------------------- | :----------------------- |
| _taskDefinitionId | uint16                               | The task definition id.  |
| _operatorType     | enum IVennFeeCalculator.OperatorType | The operator type.       |


Return values:

| Name | Type    | Description        |
| :--- | :------ | :----------------- |
| [0]  | uint256 | The operator fees. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.
Admins can approve calls and change the address of the operator registry.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### FEE_POOL_ROLE (0x9a98fb32)

```solidity
function FEE_POOL_ROLE() external view returns (bytes32)
```

Get the fee pool role.


Return values:

| Name | Type    | Description        |
| :--- | :------ | :----------------- |
| [0]  | bytes32 | The fee pool role. |

### taskDefinitionIdTotalFees (0x27928309)

```solidity
function taskDefinitionIdTotalFees(
    uint16 _taskDefinitionId
) external view returns (uint256)
```

Get the task definition id total fees.


Parameters:

| Name              | Type   | Description              |
| :---------------- | :----- | :----------------------- |
| _taskDefinitionId | uint16 | The task definition id.  |


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | uint256 | The total fees. |

### distributedFees (0x1b6c5556)

```solidity
function distributedFees(bytes32 _recipient) external view returns (uint256)
```

Get the distributed fees.


Parameters:

| Name       | Type    | Description     |
| :--------- | :------ | :-------------- |
| _recipient | bytes32 | The recipient.  |


Return values:

| Name | Type    | Description           |
| :--- | :------ | :-------------------- |
| [0]  | uint256 | The distributed fees. |

### version (0x54fd4d50)

```solidity
function version() external view returns (uint256)
```

Get the version of the fee distributor.


Return values:

| Name | Type    | Description                         |
| :--- | :------ | :---------------------------------- |
| [0]  | uint256 | The version of the fee distributor. |
