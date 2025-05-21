# Firewall

## Overview

#### License: UNLICENSED

```solidity
contract Firewall is IFirewall, Ownable2StepUpgradeable, UUPSUpgradeable
```

Author: David Benchimol @ Ironblocks

This contract provides an open marketplace of firewall policies that can be subscribed to by consumers.

Each policy is a contract that must implement the IFirewallPolicy interface. The policy contract is responsible for
making the decision on whether or not to allow a call to be executed. The policy contract gets access to the consumers
full context, including the sender, data, and value of the call as well as the ability to read state before and after
function execution.

Each consumer is a contract whose policies are managed by a single admin. The admin is responsible for adding and removing
policies.
## State variables info

### approvedPolicies (0x1d10fc64)

```solidity
mapping(address => bool) approvedPolicies
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
mapping(address => bool) dryrunEnabled
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

### subscribedPolicies (0xfb758994)

```solidity
mapping(address => mapping(bytes4 => address[])) subscribedPolicies
```


### subscribedGlobalPolicies (0x8490a327)

```solidity
mapping(address => address[]) subscribedGlobalPolicies
```


## Modifiers info

### onlyConsumerAdmin

```solidity
modifier onlyConsumerAdmin(address _consumer)
```

Modifier to check if the caller is the consumer admin.


Parameters:

| Name      | Type    | Description                           |
| :-------- | :------ | :------------------------------------ |
| _consumer | address | The address of the consumer contract. |

## Functions info

### constructor

```solidity
constructor()
```

oz-upgrades-unsafe-allow: constructor
### __Firewall_init (0x65d4d3bf)

```solidity
function __Firewall_init() external initializer
```


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
function setPolicyStatus(address _policy, bool _status) external onlyOwner
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
function setConsumerDryrunStatus(
    address _consumer,
    bool _status
) external onlyConsumerAdmin(_consumer)
```

Admin only function allowing the consumers admin enable/disable dry run mode.


Parameters:

| Name      | Type    | Description                            |
| :-------- | :------ | :------------------------------------- |
| _consumer | address | The address of the consumer contract.  |
| _status   | bool    | The status of the dry run mode.        |

### addGlobalPolicy (0x7128077b)

```solidity
function addGlobalPolicy(
    address _consumer,
    address _policy
) external onlyConsumerAdmin(_consumer)
```

Admin only function allowing the consumers admin to add a policy to the consumers subscribed policies.


Parameters:

| Name      | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :-------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _consumer | address | The address of the consumer contract.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| _policy   | address | The address of the policy contract.  NOTE: Policies that you register to may become obsolete in the future, there may be a an upgraded version of the policy in the future, and / or a new vulnerability may be found in a policy at some future time. For these reason, the Firewall Owner has the ability to disapprove a policy in the future, preventing consumers from being able to subscribe to it in the future.  While doesn't block already-subscribed consumers from using the policy, it is highly recommended to have periodical reviews of the policies you are subscribed to and to make any required changes accordingly. |

### removeGlobalPolicy (0xa2636f4b)

```solidity
function removeGlobalPolicy(
    address _consumer,
    address _policy
) external onlyConsumerAdmin(_consumer)
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
) external onlyConsumerAdmin(_consumer)
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
) external onlyConsumerAdmin(_consumer)
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
) external onlyConsumerAdmin(_consumer)
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
) external onlyConsumerAdmin(_consumer)
```

Admin only function allowing the consumers admin to remove a policy from the consumers subscribed policies.


Parameters:

| Name       | Type    | Description                                                                 |
| :--------- | :------ | :-------------------------------------------------------------------------- |
| _consumer  | address | The address of the consumer contract.                                       |
| _methodSig | bytes4  | The method signature of the consumer contract to which the policy applies.  |
| _policy    | address | The address of the policy contract.                                         |

### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

View function for retrieving the version of the firewall contract.


Return values:

| Name | Type    | Description                                   |
| :--- | :------ | :-------------------------------------------- |
| [0]  | uint256 | version The version of the firewall contract. |
