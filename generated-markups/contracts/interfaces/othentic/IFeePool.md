# IFeePool

## Overview

#### License: UNLICENSED

```solidity
interface IFeePool
```

Interface for the FeePool contract.
## Events info

### ProtocolRegistrySet

```solidity
event ProtocolRegistrySet(address protocolRegistry)
```

Emitted when the protocol registry is set.


Parameters:

| Name             | Type    | Description                           |
| :--------------- | :------ | :------------------------------------ |
| protocolRegistry | address | The address of the protocol registry. |

### VennFeeCalculatorSet

```solidity
event VennFeeCalculatorSet(address vennFeeCalculator)
```

Emitted when the venn fee calculator is set.


Parameters:

| Name              | Type    | Description                             |
| :---------------- | :------ | :-------------------------------------- |
| vennFeeCalculator | address | The address of the venn fee calculator. |

### NativeFeesDeposited

```solidity
event NativeFeesDeposited(address _policy, uint256 _amount)
```

Emitted when native fees are deposited for a policy.


Parameters:

| Name    | Type    | Description                   |
| :------ | :------ | :---------------------------- |
| _policy | address | The address of the policy.    |
| _amount | uint256 | The amount of fees deposited. |

### RescuedFeesDeposited

```solidity
event RescuedFeesDeposited(uint256 _amount)
```

Emitted when rescued fees are deposited.


Parameters:

| Name    | Type    | Description                   |
| :------ | :------ | :---------------------------- |
| _amount | uint256 | The amount of fees deposited. |

### RescuedFeesWithdrawn

```solidity
event RescuedFeesWithdrawn(address _recipient, uint256 _amount)
```

Emitted when rescued fees are withdrawn.


Parameters:

| Name       | Type    | Description                    |
| :--------- | :------ | :----------------------------- |
| _recipient | address | The address of the recipient.  |
| _amount    | uint256 | The amount of fees withdrawn.  |

### FeesWithdrawn

```solidity
event FeesWithdrawn(address _recipient, uint256 _amount)
```

Emitted when fees are withdrawn.


Parameters:

| Name       | Type    | Description                    |
| :--------- | :------ | :----------------------------- |
| _recipient | address | The address of the recipient.  |
| _amount    | uint256 | The amount of fees withdrawn.  |

### NativeFeeClaimed

```solidity
event NativeFeeClaimed(address _policy, uint256 _amount)
```

Emitted when native fees are claimed from a policy.


Parameters:

| Name    | Type    | Description                 |
| :------ | :------ | :-------------------------- |
| _policy | address | The address of the policy.  |
| _amount | uint256 | The amount of fees claimed. |

### PolicyNativeFeeAmountSet

```solidity
event PolicyNativeFeeAmountSet(address _policy, uint256 _amount)
```

Emitted when the policy native fee amount is set.


Parameters:

| Name    | Type    | Description                 |
| :------ | :------ | :-------------------------- |
| _policy | address | The address of the policy.  |
| _amount | uint256 | The amount of fees to set.  |

## Functions info

### withdrawFees (0xad3b1b47)

```solidity
function withdrawFees(address payable _recipient, uint256 _amount) external
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
) external
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
) external
```

Claim native fees from a policy.


Parameters:

| Name              | Type    | Description                                   |
| :---------------- | :------ | :-------------------------------------------- |
| _policy           | address | The address of the policy.                    |
| _taskDefinitionId | uint16  | The ID of the task definition for the policy. |

### setProtocolRegistry (0x3e22119d)

```solidity
function setProtocolRegistry(address _protocolRegistry) external
```

Set the protocol registry.


Parameters:

| Name              | Type    | Description                           |
| :---------------- | :------ | :------------------------------------ |
| _protocolRegistry | address | The address of the protocol registry. |

### setVennFeeCalculator (0xbe6a5e83)

```solidity
function setVennFeeCalculator(address _vennFeeCalculator) external
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
) external view returns (uint256)
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
) external view returns (uint256)
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

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### FEE_CLAIMER_ROLE (0xf93554ae)

```solidity
function FEE_CLAIMER_ROLE() external view returns (bytes32)
```

Get the fee claimer role.


Return values:

| Name | Type    | Description           |
| :--- | :------ | :-------------------- |
| [0]  | bytes32 | The fee claimer role. |

### FEE_WITHDRAWER_ROLE (0xc4c6cd41)

```solidity
function FEE_WITHDRAWER_ROLE() external view returns (bytes32)
```

Get the fee withdrawer role.


Return values:

| Name | Type    | Description              |
| :--- | :------ | :----------------------- |
| [0]  | bytes32 | The fee withdrawer role. |

### protocolRegistry (0x7656419f)

```solidity
function protocolRegistry() external view returns (IProtocolRegistry)
```

Get the protocol registry address.


Return values:

| Name | Type                       | Description                           |
| :--- | :------------------------- | :------------------------------------ |
| [0]  | contract IProtocolRegistry | The address of the protocol registry. |

### collectedNativeFees (0x6e542487)

```solidity
function collectedNativeFees() external view returns (uint256)
```

Get the collected native fees.


Return values:

| Name | Type    | Description                |
| :--- | :------ | :------------------------- |
| [0]  | uint256 | The collected native fees. |

### collectedRescuedFees (0x55704590)

```solidity
function collectedRescuedFees() external view returns (uint256)
```

Get the collected rescued fees.


Return values:

| Name | Type    | Description                 |
| :--- | :------ | :-------------------------- |
| [0]  | uint256 | The collected rescued fees. |

### policyBalance (0xc8f69c03)

```solidity
function policyBalance(address _policy) external view returns (uint256)
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

### version (0x54fd4d50)

```solidity
function version() external view returns (uint256)
```

Get the version of the fee pool.


Return values:

| Name | Type    | Description                  |
| :--- | :------ | :--------------------------- |
| [0]  | uint256 | The version of the fee pool. |
