# FeePool

## Overview

#### License: UNLICENSED

```solidity
contract FeePool is IFeePool, AccessControlUpgradeable, UUPSUpgradeable
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

### FEE_CLAIMER_ROLE (0xf93554ae)

```solidity
bytes32 constant FEE_CLAIMER_ROLE = keccak256("FEE_CLAIMER_ROLE")
```

Get the fee claimer role.


Return values:

| Name | Type    | Description           |
| :--- | :------ | :-------------------- |
| [0]  | bytes32 | The fee claimer role. |

### FEE_WITHDRAWER_ROLE (0xc4c6cd41)

```solidity
bytes32 constant FEE_WITHDRAWER_ROLE = keccak256("FEE_WITHDRAWER_ROLE")
```

Get the fee withdrawer role.


Return values:

| Name | Type    | Description              |
| :--- | :------ | :----------------------- |
| [0]  | bytes32 | The fee withdrawer role. |

## State variables info

### protocolRegistry (0x7656419f)

```solidity
contract IProtocolRegistry protocolRegistry
```

Get the protocol registry address.


Return values:

| Name | Type                       | Description                           |
| :--- | :------------------------- | :------------------------------------ |
| [0]  | contract IProtocolRegistry | The address of the protocol registry. |

### vennFeeCalculator (0xb42d2e3f)

```solidity
contract IVennFeeCalculator vennFeeCalculator
```


### collectedNativeFees (0x6e542487)

```solidity
uint256 collectedNativeFees
```

Get the collected native fees.


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | uint256 | The collected native fees. |

### collectedRescuedFees (0x55704590)

```solidity
uint256 collectedRescuedFees
```

Get the collected rescued fees.


Return values:

| Name | Type    | Description                 |
| :--- | :------ | :-------------------------- |
| [0]  | uint256 | The collected rescued fees. |

### policyBalance (0xc8f69c03)

```solidity
mapping(address => uint256) policyBalance
```

Get the policy balance.


Parameters:

| Name    | Type    | Description                 |
| :------ | :------ | :-------------------------- |
| _policy | address | The address of the policy.  |


Return values:

| Name | Type    | Description         |
| :--- | :------ | :------------------ |
| [0]  | uint256 | The policy balance. |

## Functions info

### constructor

```solidity
constructor()
```

oz-upgrades-unsafe-allow: constructor
### __FeePool_init (0xd89ff209)

```solidity
function __FeePool_init(
    address _protocolRegistry,
    address _vennFeeCalculator
) external initializer
```


### withdrawFees (0xad3b1b47)

```solidity
function withdrawFees(
    address payable _recipient,
    uint256 _amount
) external onlyRole(FEE_WITHDRAWER_ROLE)
```

Withdraw fees from the fee pool.


Parameters:

| Name       | Type            | Description                       |
| :--------- | :-------------- | :-------------------------------- |
| _recipient | address payable | The address to receive the fees.  |
| _amount    | uint256         | The amount of fees to withdraw.   |

### withdrawRescuedFees (0x03228b46)

```solidity
function withdrawRescuedFees(
    address payable _recipient,
    uint256 _amount
) external onlyRole(FEE_WITHDRAWER_ROLE)
```

Withdraw rescued fees from the fee pool.


Parameters:

| Name       | Type            | Description                       |
| :--------- | :-------------- | :-------------------------------- |
| _recipient | address payable | The address to receive the fees.  |
| _amount    | uint256         | The amount of fees to withdraw.   |

### depositRescuedFees (0xeb512d89)

```solidity
function depositRescuedFees() external payable
```

Deposit rescued fees into the fee pool.
### depositNativeForPolicy (0x14b0e555)

```solidity
function depositNativeForPolicy(address _policy) external payable
```

Deposit native fees for a policy.


Parameters:

| Name    | Type    | Description                |
| :------ | :------ | :------------------------- |
| _policy | address | The address of the policy. |

### claimNativeFeeFromPolicy (0xe3b2dafd)

```solidity
function claimNativeFeeFromPolicy(
    address _policy,
    uint16 _taskDefinitionId
) external onlyRole(FEE_CLAIMER_ROLE)
```

Claim native fees from a policy.


Parameters:

| Name              | Type    | Description                                   |
| :---------------- | :------ | :-------------------------------------------- |
| _policy           | address | The address of the policy.                    |
| _taskDefinitionId | uint16  | The ID of the task definition for the policy. |

### setProtocolRegistry (0x3e22119d)

```solidity
function setProtocolRegistry(
    address _protocolRegistry
) external onlyRole(ADMIN_ROLE)
```

Set the protocol registry.


Parameters:

| Name              | Type    | Description                           |
| :---------------- | :------ | :------------------------------------ |
| _protocolRegistry | address | The address of the protocol registry. |

### setVennFeeCalculator (0xbe6a5e83)

```solidity
function setVennFeeCalculator(
    address _vennFeeCalculator
) external onlyRole(ADMIN_ROLE)
```

Set the venn fee calculator.


Parameters:

| Name               | Type    | Description                             |
| :----------------- | :------ | :-------------------------------------- |
| _vennFeeCalculator | address | The address of the venn fee calculator. |

### getRequiredNativeAmountForPolicy (0xa4c4a432)

```solidity
function getRequiredNativeAmountForPolicy(
    address _policy,
    uint16 _taskDefinitionId
) public view returns (uint256)
```

Get the required native amount for a policy.


Parameters:

| Name              | Type    | Description                                    |
| :---------------- | :------ | :--------------------------------------------- |
| _policy           | address | The address of the policy.                     |
| _taskDefinitionId | uint16  | The ID of the task definition for the policy.  |


Return values:

| Name | Type    | Description                 |
| :--- | :------ | :-------------------------- |
| [0]  | uint256 | The required native amount. |

### getTotalRequiredNativeAmountForPolicies (0x2c588d7a)

```solidity
function getTotalRequiredNativeAmountForPolicies(
    address[] calldata _policies,
    uint16[] calldata _taskDefinitionIds
) external view returns (uint256 totalRequiredAmount)
```

Get the total required native amount for a list of policies.


Parameters:

| Name               | Type      | Description                       |
| :----------------- | :-------- | :-------------------------------- |
| _policies          | address[] | The list of policy addresses.     |
| _taskDefinitionIds | uint16[]  | The list of task definition IDs.  |


Return values:

| Name | Type    | Description                       |
| :--- | :------ | :-------------------------------- |
| [0]  | uint256 | The total required native amount. |

### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

Get the version of the fee pool.


Return values:

| Name | Type    | Description                  |
| :--- | :------ | :--------------------------- |
| [0]  | uint256 | The version of the fee pool. |
