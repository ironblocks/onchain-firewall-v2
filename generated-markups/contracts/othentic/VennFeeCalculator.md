# VennFeeCalculator

## Overview

#### License: UNLICENSED

```solidity
contract VennFeeCalculator is IVennFeeCalculator, AccessControlUpgradeable, UUPSUpgradeable
```


## Constants info

### ADMIN_ROLE (0x75b238fc)

```solidity
bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE")
```

Get the admin role.
Admins can approve calls and change the address of the operator registry.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### FEE_POOL_ROLE (0x9a98fb32)

```solidity
bytes32 constant FEE_POOL_ROLE = keccak256("FEE_POOL_ROLE")
```

Get the fee pool role.


Return values:

| Name | Type    | Description        |
| :--- | :------ | :----------------- |
| [0]  | bytes32 | The fee pool role. |

## State variables info

### operatorRegistry (0x58c2225b)

```solidity
contract IOperatorRegistry operatorRegistry
```

Get the operator registry address.


Return values:

| Name | Type                       | Description                           |
| :--- | :------------------------- | :------------------------------------ |
| [0]  | contract IOperatorRegistry | The address of the operator registry. |

### taskDefinitionIdTotalFees (0x27928309)

```solidity
mapping(uint16 => uint256) taskDefinitionIdTotalFees
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
mapping(bytes32 => uint256) distributedFees
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

### taskDefinitionIdOperatorFees (0x38a837a5)

```solidity
mapping(uint16 => mapping(enum IVennFeeCalculator.OperatorType => uint256)) taskDefinitionIdOperatorFees
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

### operatorFees (0x5bb47a72)

```solidity
mapping(uint16 => uint256) operatorFees
```


## Functions info

### constructor

```solidity
constructor()
```

oz-upgrades-unsafe-allow: constructor
### __VennFeeCalculator_init (0xb3903602)

```solidity
function __VennFeeCalculator_init(
    address _operatorRegistry
) external initializer
```


### isBaseRewardFee (0xd005a4f6)

```solidity
function isBaseRewardFee() external pure returns (bool)
```


### calculateBaseRewardFees (0x55a85664)

```solidity
function calculateBaseRewardFees(
    IFeeCalculator.FeeCalculatorData calldata _feeCalculatorData
)
    external
    pure
    returns (
        uint256 baseRewardFeeForAttesters,
        uint256 baseRewardFeeForAggregator,
        uint256 baseRewardFeeForPerformer
    )
```


### calculateFeesPerId (0x36684b67)

```solidity
function calculateFeesPerId(
    IFeeCalculator.FeeCalculatorData calldata _feeCalculatorData
) external returns (IFeeCalculator.FeePerId[] memory feesPerId)
```


### setTaskDefinitionFee (0xe564a559)

```solidity
function setTaskDefinitionFee(
    uint16 _taskDefinitionId,
    uint256 _totalFee
) external onlyRole(ADMIN_ROLE)
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
) external onlyRole(ADMIN_ROLE)
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
) external onlyRole(ADMIN_ROLE)
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
function distributeFee(
    uint16 _taskDefinitionId
) external onlyRole(FEE_POOL_ROLE)
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
) external onlyRole(ADMIN_ROLE) returns (uint256 feeAmount)
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

### getTaskDefinitionIdFeeRecipients (0xf555f0a3)

```solidity
function getTaskDefinitionIdFeeRecipients(
    uint16 _taskDefinitionId
)
    external
    view
    returns (bytes32[] memory recipients, uint256[] memory feeShares)
```


### setOperatorRegistry (0x9d28fb86)

```solidity
function setOperatorRegistry(
    address _operatorRegistry
) external onlyRole(ADMIN_ROLE)
```

Set the operator registry address.


Parameters:

| Name              | Type    | Description                           |
| :---------------- | :------ | :------------------------------------ |
| _operatorRegistry | address | The address of the operator registry. |

### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

Get the version of the fee distributor.


Return values:

| Name | Type    | Description                         |
| :--- | :------ | :---------------------------------- |
| [0]  | uint256 | The version of the fee distributor. |
