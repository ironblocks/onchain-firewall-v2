# IPolicyDeployer

## Overview

#### License: UNLICENSED

```solidity
interface IPolicyDeployer
```

Interface for the PolicyDeployer contract.
## Events info

### PolicyCreated

```solidity
event PolicyCreated(address indexed factory, address policy)
```

Emitted when a policy is created.


Parameters:

| Name    | Type    | Description                           |
| :------ | :------ | :------------------------------------ |
| factory | address | The factory that created the policy.  |
| policy  | address | The policy that was created.          |

### FactoryStatusSet

```solidity
event FactoryStatusSet(address indexed factory, bool status)
```

Emitted when the factory status is set.


Parameters:

| Name    | Type    | Description                           |
| :------ | :------ | :------------------------------------ |
| factory | address | The factory that had its status set.  |
| status  | bool    | The status that was set.              |

### FirewallModuleSet

```solidity
event FirewallModuleSet(address indexed firewallModule)
```

Emitted when the firewall module is set.


Parameters:

| Name           | Type    | Description                       |
| :------------- | :------ | :-------------------------------- |
| firewallModule | address | The firewall module that was set. |

## Functions info

### deployPolicies (0xe276a36b)

```solidity
function deployPolicies(
    address _firewall,
    address[] calldata _factories,
    bytes[] calldata _createData
) external returns (address[] memory policies)
```

Deploy policies.


Parameters:

| Name        | Type      | Description                                 |
| :---------- | :-------- | :------------------------------------------ |
| _firewall   | address   | The firewall to approve the policies with.  |
| _factories  | address[] | The factories to create the policies with.  |
| _createData | bytes[]   | The data to create the policies with.       |


Return values:

| Name     | Type      | Description                        |
| :------- | :-------- | :--------------------------------- |
| policies | address[] | The addresses of the new policies. |

### setFactoryStatuses (0x22dda669)

```solidity
function setFactoryStatuses(
    address[] calldata _factories,
    bool[] calldata _statuses
) external
```

Set the statuses of the factories.


Parameters:

| Name       | Type      | Description                            |
| :--------- | :-------- | :------------------------------------- |
| _factories | address[] | The factories to set the statuses of.  |
| _statuses  | bool[]    | The statuses to set.                   |

### setFirewallModule (0x03ba98f3)

```solidity
function setFirewallModule(address _firewallModule) external
```

Set the firewall module.


Parameters:

| Name            | Type    | Description                 |
| :-------------- | :------ | :-------------------------- |
| _firewallModule | address | The firewall module to set. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### approvedFactories (0x3777261d)

```solidity
function approvedFactories(address _factory) external view returns (bool)
```

Get the status of a factory.


Parameters:

| Name     | Type    | Description                        |
| :------- | :------ | :--------------------------------- |
| _factory | address | The factory to get the status of.  |


Return values:

| Name | Type | Description                |
| :--- | :--- | :------------------------- |
| [0]  | bool | The status of the factory. |

### firewallModule (0xe858c2b8)

```solidity
function firewallModule() external view returns (IFirewallModule)
```

Get the firewall module.


Return values:

| Name | Type                     | Description          |
| :--- | :----------------------- | :------------------- |
| [0]  | contract IFirewallModule | The firewall module. |
