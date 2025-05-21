# OperatorRegistry

## Overview

#### License: UNLICENSED

```solidity
contract OperatorRegistry is IOperatorRegistry, AccessControlUpgradeable, UUPSUpgradeable
```


## Constants info

### ADMIN_ROLE (0x75b238fc)

```solidity
bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE")
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

## State variables info

### attestationCenter (0xd92807a2)

```solidity
contract IAttestationCenter attestationCenter
```

Get the attestation center.


Return values:

| Name | Type                        | Description             |
| :--- | :-------------------------- | :---------------------- |
| [0]  | contract IAttestationCenter | The attestation center. |

### maxSubscribedOperatorsCount (0x935be370)

```solidity
uint256 maxSubscribedOperatorsCount
```


## Functions info

### constructor

```solidity
constructor()
```

oz-upgrades-unsafe-allow: constructor
### __OperatorRegistry_init (0x2aa1a27b)

```solidity
function __OperatorRegistry_init(
    address _attestationCenter,
    uint256 _maxSubscribedOperatorsCount
) external initializer
```


### registerOperator (0xfce92894)

```solidity
function registerOperator(
    address _operator,
    string calldata _metadata
) external onlyRole(ADMIN_ROLE)
```

Register an operator.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _operator | address | The address of the operator.  |
| _metadata | string  | The metadata of the operator. |

### unregisterOperator (0x96115bc2)

```solidity
function unregisterOperator(address _operator) external onlyRole(ADMIN_ROLE)
```

Unregister an operator.


Parameters:

| Name      | Type    | Description                  |
| :-------- | :------ | :--------------------------- |
| _operator | address | The address of the operator. |

### subscribeOperators (0x173d91b2)

```solidity
function subscribeOperators(
    uint16 _taskDefinitionId,
    address[] calldata _subscribedOperators,
    uint256[] calldata _subscribedOperatorFeeShares
) external
```

Subscribe additional operators to a task definition.


Parameters:

| Name                         | Type      | Description                                 |
| :--------------------------- | :-------- | :------------------------------------------ |
| _taskDefinitionId            | uint16    | The ID of the task definition.              |
| _subscribedOperators         | address[] | The addresses of the subscribed operators.  |
| _subscribedOperatorFeeShares | uint256[] | The fee shares of the subscribed operators. |

### getSubscribedOperatorFees (0xb85e089f)

```solidity
function getSubscribedOperatorFees(
    uint16 _taskDefinitionId,
    uint256 _operatorId
)
    external
    view
    returns (uint256[] memory operatorIds, uint256[] memory operatorFees)
```

Get the subscribed operator fees.


Parameters:

| Name              | Type    | Description                     |
| :---------------- | :------ | :------------------------------ |
| _taskDefinitionId | uint16  | The ID of the task definition.  |
| _operatorId       | uint256 | The ID of the operator.         |


Return values:

| Name         | Type      | Description                           |
| :----------- | :-------- | :------------------------------------ |
| operatorIds  | uint256[] | The IDs of the subscribed operators.  |
| operatorFees | uint256[] | The fees of the subscribed operators. |

### getSubscribedOperatorTotalCount (0x838e5c42)

```solidity
function getSubscribedOperatorTotalCount(
    uint16 _taskDefinitionId,
    uint256[] calldata _operatorIds
) external view returns (uint256 totalCount)
```

Get the total count of subscribed operators.


Parameters:

| Name              | Type      | Description                     |
| :---------------- | :-------- | :------------------------------ |
| _taskDefinitionId | uint16    | The ID of the task definition.  |
| _operatorIds      | uint256[] | The IDs of the operators.       |


Return values:

| Name       | Type    | Description                              |
| :--------- | :------ | :--------------------------------------- |
| totalCount | uint256 | The total count of subscribed operators. |

### setAttestationCenter (0x11c69311)

```solidity
function setAttestationCenter(
    address _attestationCenter
) external onlyRole(ADMIN_ROLE)
```

Set the attestation center.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### setMaxSubscribedOperatorsCount (0xeb7f22b0)

```solidity
function setMaxSubscribedOperatorsCount(
    uint256 _maxSubscribedOperatorsCount
) external onlyRole(ADMIN_ROLE)
```


### getOperator (0x5865c60c)

```solidity
function getOperator(
    address _operator
) external view returns (IOperatorRegistry.Operator memory)
```

Get the operator data.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _operator | address | The address of the operator.  |


Return values:

| Name | Type                              | Description        |
| :--- | :-------------------------------- | :----------------- |
| [0]  | struct IOperatorRegistry.Operator | The operator data. |

### isOperatorRegistered (0x6b1906f8)

```solidity
function isOperatorRegistered(address _operator) public view returns (bool)
```


### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

Get the version of the operator registry.


Return values:

| Name | Type    | Description                           |
| :--- | :------ | :------------------------------------ |
| [0]  | uint256 | The version of the operator registry. |
