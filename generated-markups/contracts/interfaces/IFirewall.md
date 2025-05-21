# IFirewall

## Overview

#### License: UNLICENSED

```solidity
interface IFirewall
```

Interface for the Firewall contract.
## Events info

### PolicyStatusUpdate

```solidity
event PolicyStatusUpdate(address policy, bool status)
```

Emitted when a policy is approved or disapproved by the owner.


Parameters:

| Name   | Type    | Description                          |
| :----- | :------ | :----------------------------------- |
| policy | address | The address of the policy contract.  |
| status | bool    | The status of the policy.            |

### ConsumerDryrunStatusUpdate

```solidity
event ConsumerDryrunStatusUpdate(address consumer, bool status)
```

Emitted when a consumer's dry-run mode is enabled or disabled.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| status   | bool    | The status of the dry-run mode.        |

### GlobalPolicyAdded

```solidity
event GlobalPolicyAdded(address indexed consumer, address policy)
```

Emitted when a policy is globally added or to a consumer.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |

### GlobalPolicyRemoved

```solidity
event GlobalPolicyRemoved(address indexed consumer, address policy)
```

Emitted when a policy is globally removed or from a consumer.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |

### PolicyAdded

```solidity
event PolicyAdded(address indexed consumer, bytes4 methodSig, address policy)
```

Emitted when a policy is added to a consumer.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |

### PolicyRemoved

```solidity
event PolicyRemoved(address indexed consumer, bytes4 methodSig, address policy)
```

Emitted when a policy is removed from a consumer.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |

### DryrunPolicyPreSuccess

```solidity
event DryrunPolicyPreSuccess(address indexed consumer, bytes4 methodSig, address policy)
```

Emitted when a policy's pre-execution hook was successfully executed in dry-run mode.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |

### GlobalDryrunPolicyPreSuccess

```solidity
event GlobalDryrunPolicyPreSuccess(address indexed consumer, address policy)
```

Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |

### DryrunPolicyPostSuccess

```solidity
event DryrunPolicyPostSuccess(address indexed consumer, bytes4 methodSig, address policy)
```

Emitted when a policy's post-execution hook was successfully executed in dry-run mode.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |

### GlobalDryrunPolicyPostSuccess

```solidity
event GlobalDryrunPolicyPostSuccess(address indexed consumer, address policy)
```

Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |

### DryrunPolicyPreError

```solidity
event DryrunPolicyPreError(address indexed consumer, bytes4 methodSig, address policy, bytes error)
```

Emitted when a policy's pre-execution hook failed in dry-run mode.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |
| error     | bytes   | The error message.                                                          |

### GlobalDryrunPolicyPreError

```solidity
event GlobalDryrunPolicyPreError(address indexed consumer, address policy, bytes error)
```

Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |
| error    | bytes   | The error message.                     |

### DryrunPolicyPostError

```solidity
event DryrunPolicyPostError(address indexed consumer, bytes4 methodSig, address policy, bytes error)
```

Emitted when a policy's post-execution hook failed in dry-run mode.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |
| error     | bytes   | The error message.                                                          |

### GlobalDryrunPolicyPostError

```solidity
event GlobalDryrunPolicyPostError(address indexed consumer, address policy, bytes error)
```

Emitted when a global policy's pre-execution hook was successfully executed in dry-run mode.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |
| error    | bytes   | The error message.                     |

### PolicyPreSuccess

```solidity
event PolicyPreSuccess(address indexed consumer, bytes4 methodSig, address policy)
```

Emitted when a policy's pre-execution hook was successfully executed.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |

### GlobalPolicyPreSuccess

```solidity
event GlobalPolicyPreSuccess(address indexed consumer, address policy)
```

Emitted when a global policy's pre-execution hook was successfully executed.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |

### PolicyPostSuccess

```solidity
event PolicyPostSuccess(address indexed consumer, bytes4 methodSig, address policy)
```

Emitted when a policy's post-execution hook was successfully executed.


Parameters:

| Name      | Type    | Description                                                                 |
| :-------- | :------ | :-------------------------------------------------------------------------- |
| consumer  | address | The address of the consumer contract.                                       |
| methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| policy    | address | The address of the policy contract.                                         |

### GlobalPolicyPostSuccess

```solidity
event GlobalPolicyPostSuccess(address indexed consumer, address policy)
```

Emitted when a global policy's post-execution hook was successfully executed.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| consumer | address | The address of the consumer contract.  |
| policy   | address | The address of the policy contract.    |

## Functions info

### preExecution (0x6fe1967c)

```solidity
function preExecution(
    address _sender,
    bytes calldata _data,
    uint256 _value
) external
```

Runs the preExecution hook of all subscribed policies.


Parameters:

| Name    | Type    | Description                                                                                     |
| :------ | :------ | :---------------------------------------------------------------------------------------------- |
| _sender | address | The address of the caller.                                                                      |
| _data   | bytes   | The calldata of the call (some firewall modifiers may pass custom data based on the use case).  |
| _value  | uint256 | The value of the call.                                                                          |

### postExecution (0x93163a91)

```solidity
function postExecution(
    address _sender,
    bytes calldata _data,
    uint256 _value
) external
```

Runs the postExecution hook of all subscribed policies.


Parameters:

| Name    | Type    | Description                                                                                     |
| :------ | :------ | :---------------------------------------------------------------------------------------------- |
| _sender | address | The address of the caller.                                                                      |
| _data   | bytes   | The calldata of the call (some firewall modifiers may pass custom data based on the use case).  |
| _value  | uint256 | The value of the call.                                                                          |

### setPolicyStatus (0x70bc76e4)

```solidity
function setPolicyStatus(address _policy, bool _status) external
```

Owner only function allowing the owner to approve or remove a policy contract. This allows the policy
to be subscribed to by consumers, or conversely no longer be allowed.


Parameters:

| Name    | Type    | Description                          |
| :------ | :------ | :----------------------------------- |
| _policy | address | The address of the policy contract.  |
| _status | bool    | The status of the policy.            |

### setConsumerDryrunStatus (0x29345746)

```solidity
function setConsumerDryrunStatus(address _consumer, bool _status) external
```

Admin only function allowing the consumers admin enable/disable dry run mode.


Parameters:

| Name      | Type    | Description                            |
| :-------- | :------ | :------------------------------------- |
| _consumer | address | The address of the consumer contract.  |
| _status   | bool    | The status of the dry run mode.        |

### addGlobalPolicy (0x7128077b)

```solidity
function addGlobalPolicy(address _consumer, address _policy) external
```

Admin only function allowing the consumers admin to add a policy to the consumers subscribed policies.


Parameters:

| Name      | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :-------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _consumer | address | The address of the consumer contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| _policy   | address | The address of the policy contract.  NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded version of the policy in the future, and / or a new vulnerability may be found in a policy at some future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future, preventing consumers from being able to subscribe to it in the future.  While doesn't block already-subscribed consumers from using the policy, it is highly recommended to have periodical reviews of the policies you are subscribed to and to make any required changes accordingly. |

### removeGlobalPolicy (0xa2636f4b)

```solidity
function removeGlobalPolicy(address _consumer, address _policy) external
```

Admin only function allowing the consumers admin to remove a policy from the consumers subscribed policies.


Parameters:

| Name      | Type    | Description                            |
| :-------- | :------ | :------------------------------------- |
| _consumer | address | The address of the consumer contract.  |
| _policy   | address | The address of the policy contract.    |

### addGlobalPolicyForConsumers (0xbb12fddc)

```solidity
function addGlobalPolicyForConsumers(
    address[] calldata _consumers,
    address _policy
) external
```

Admin only function allowing the consumers admin to add a single policy to multiple consumers.
Note that the consumer admin needs to be the same for all consumers.



Parameters:

| Name       | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :--------- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _consumers | address[] | The addresses of the consumer contracts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| _policy    | address   | The address of the policy contract. NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded version of the policy in the future, and / or a new vulnerability may be found in a policy at some future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future, preventing consumers from being able to subscribe to it in the future.  While doesn't block already-subscribed consumers from using the policy, it is highly recommended to have periodical reviews of the policies you are subscribed to and to make any required changes accordingly. |

### removeGlobalPolicyForConsumers (0x89df42b9)

```solidity
function removeGlobalPolicyForConsumers(
    address[] calldata _consumers,
    address _policy
) external
```

Admin only function allowing the consumers admin to remove a single policy from multiple consumers.
Note that the consumer admin needs to be the same for all consumers.



Parameters:

| Name       | Type      | Description                               |
| :--------- | :-------- | :---------------------------------------- |
| _consumers | address[] | The addresses of the consumer contracts.  |
| _policy    | address   | The address of the policy contract.       |

### addPolicies (0xefcb1e76)

```solidity
function addPolicies(
    address _consumer,
    bytes4[] calldata _methodSigs,
    address[] calldata _policies
) external
```

Admin only function allowing the consumers admin to add multiple policies to the consumers subscribed policies.


Parameters:

| Name        | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :---------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _consumer   | address   | The address of the consumer contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| _methodSigs | bytes4[]  | The method signatures of the consumer contract to which the policies apply.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| _policies   | address[] | The addresses of the policy contracts.  NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded version of the policy in the future, and / or a new vulnerability may be found in a policy at some future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future, preventing consumers from being able to subscribe to it in the future.  While doesn't block already-subscribed consumers from using the policy, it is highly recommended to have periodical reviews of the policies you are subscribed to and to make any required changes accordingly. |

### addPolicy (0xbd967c7a)

```solidity
function addPolicy(
    address _consumer,
    bytes4 _methodSig,
    address _policy
) external
```

Admin only function allowing the consumers admin to add a policy to the consumers subscribed policies.


Parameters:

| Name       | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :--------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _consumer  | address | The address of the consumer contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| _methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| _policy    | address | The address of the policy contract.  NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded version of the policy in the future, and / or a new vulnerability may be found in a policy at some future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future, preventing consumers from being able to subscribe to it in the future.  While doesn't block already-subscribed consumers from using the policy, it is highly recommended to have periodical reviews of the policies you are subscribed to and to make any required changes accordingly. |

### removePolicies (0xc98d236e)

```solidity
function removePolicies(
    address _consumer,
    bytes4[] calldata _methodSigs,
    address[] calldata _policies
) external
```

Admin only function allowing the consumers admin to remove multiple policies from the consumers subscribed policies.


Parameters:

| Name        | Type      | Description                                                                  |
| :---------- | :-------- | :--------------------------------------------------------------------------- |
| _consumer   | address   | The address of the consumer contract.                                        |
| _methodSigs | bytes4[]  | The method signatures of the consumer contract to which the policies apply.  |
| _policies   | address[] | The addresses of the policy contracts.                                       |

### removePolicy (0x1dea3a26)

```solidity
function removePolicy(
    address _consumer,
    bytes4 _methodSig,
    address _policy
) external
```

Admin only function allowing the consumers admin to remove a policy from the consumers subscribed policies.


Parameters:

| Name       | Type    | Description                                                                 |
| :--------- | :------ | :-------------------------------------------------------------------------- |
| _consumer  | address | The address of the consumer contract.                                       |
| _methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| _policy    | address | The address of the policy contract.                                         |

### approvedPolicies (0x1d10fc64)

```solidity
function approvedPolicies(address _policy) external view returns (bool)
```

View function for retrieving a policy's approval status.


Parameters:

| Name    | Type    | Description                          |
| :------ | :------ | :----------------------------------- |
| _policy | address | The address of the policy contract.  |


Return values:

| Name | Type | Description                               |
| :--- | :--- | :---------------------------------------- |
| [0]  | bool | status The approval status of the policy. |

### dryrunEnabled (0xe03060af)

```solidity
function dryrunEnabled(address _consumer) external view returns (bool)
```

View function for retrieving a consumers dry-run mode status.


Parameters:

| Name      | Type    | Description                            |
| :-------- | :------ | :------------------------------------- |
| _consumer | address | The address of the consumer contract.  |


Return values:

| Name | Type | Description                                     |
| :--- | :--- | :---------------------------------------------- |
| [0]  | bool | status The dry-run mode status of the consumer. |

### version (0x54fd4d50)

```solidity
function version() external view returns (uint256)
```

View function for retrieving the version of the firewall contract.


Return values:

| Name | Type    | Description                                   |
| :--- | :------ | :-------------------------------------------- |
| [0]  | uint256 | version The version of the firewall contract. |
