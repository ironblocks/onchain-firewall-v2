# IOperatorRegistry

## Overview

#### License: UNLICENSED

```solidity
interface IOperatorRegistry
```

Interface for the Operator Registry contract.
## Structs info

### Operator

```solidity
struct Operator {
	address operator;
	uint256 operatorId;
	string metadata;
}
```

Struct for storing operator data.


Parameters:

| Name       | Type    | Description                   |
| :--------- | :------ | :---------------------------- |
| operator   | address | The address of the operator.  |
| operatorId | uint256 | The ID of the operator.       |
| metadata   | string  | The metadata of the operator. |

## Events info

### OperatorRegistered

```solidity
event OperatorRegistered(address operator, uint256 operatorId, string metadata)
```

Event for the operator registered.


Parameters:

| Name       | Type    | Description                   |
| :--------- | :------ | :---------------------------- |
| operator   | address | The address of the operator.  |
| operatorId | uint256 | The ID of the operator.       |
| metadata   | string  | The metadata of the operator. |

### OperatorUnregistered

```solidity
event OperatorUnregistered(address operator)
```

Event for the operator unregistered.


Parameters:

| Name     | Type    | Description                  |
| :------- | :------ | :--------------------------- |
| operator | address | The address of the operator. |

### OperatorSubscriptionSet

```solidity
event OperatorSubscriptionSet(uint16 indexed taskDefinitionId, address indexed operator, address[] subscribedOperators, uint256[] subscribedOperatorFeeShares)
```

Event for the operator subscription set.


Parameters:

| Name                        | Type      | Description                                 |
| :-------------------------- | :-------- | :------------------------------------------ |
| taskDefinitionId            | uint16    | The ID of the task definition.              |
| operator                    | address   | The address of the operator.                |
| subscribedOperators         | address[] | The addresses of the subscribed operators.  |
| subscribedOperatorFeeShares | uint256[] | The fee shares of the subscribed operators. |

### AttestationCenterSet

```solidity
event AttestationCenterSet(address attestationCenter)
```

Event for the attestation center set.


Parameters:

| Name              | Type    | Description                            |
| :---------------- | :------ | :------------------------------------- |
| attestationCenter | address | The address of the attestation center. |

### MaxSubscribedOperatorsCountSet

```solidity
event MaxSubscribedOperatorsCountSet(uint256 maxSubscribedOperatorsCount)
```

Event for the max subscribed operators count set.


Parameters:

| Name                        | Type    | Description                         |
| :-------------------------- | :------ | :---------------------------------- |
| maxSubscribedOperatorsCount | uint256 | The max subscribed operators count. |

## Functions info

### registerOperator (0xfce92894)

```solidity
function registerOperator(
    address _operator,
    string calldata _metadata
) external
```

Register an operator.


Parameters:

| Name      | Type    | Description                   |
| :-------- | :------ | :---------------------------- |
| _operator | address | The address of the operator.  |
| _metadata | string  | The metadata of the operator. |

### unregisterOperator (0x96115bc2)

```solidity
function unregisterOperator(address _operator) external
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
function setAttestationCenter(address _attestationCenter) external
```

Set the attestation center.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### attestationCenter (0xd92807a2)

```solidity
function attestationCenter() external view returns (IAttestationCenter)
```

Get the attestation center.


Return values:

| Name | Type                        | Description             |
| :--- | :-------------------------- | :---------------------- |
| [0]  | contract IAttestationCenter | The attestation center. |

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

### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

Get the version of the operator registry.


Return values:

| Name | Type    | Description                           |
| :--- | :------ | :------------------------------------ |
| [0]  | uint256 | The version of the operator registry. |
