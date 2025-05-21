# PolicyDeployer

## Overview

#### License: UNLICENSED

```solidity
contract PolicyDeployer is IPolicyDeployer, AccessControl
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

### firewallModule (0xe858c2b8)

```solidity
contract IFirewallModule firewallModule
```

Get the firewall module.


Return values:

| Name | Type                     | Description          |
| :--- | :----------------------- | :------------------- |
| [0]  | contract IFirewallModule | The firewall module. |

### approvedFactories (0x3777261d)

```solidity
mapping(address => bool) approvedFactories
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

## Functions info

### constructor

```solidity
constructor(address _firewallModule)
```


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
) external onlyRole(ADMIN_ROLE)
```

Set the statuses of the factories.


Parameters:

| Name       | Type      | Description                            |
| :--------- | :-------- | :------------------------------------- |
| _factories | address[] | The factories to set the statuses of.  |
| _statuses  | bool[]    | The statuses to set.                   |

### setFirewallModule (0x03ba98f3)

```solidity
function setFirewallModule(
    address _firewallModule
) external onlyRole(ADMIN_ROLE)
```

Set the firewall module.


Parameters:

| Name            | Type    | Description                 |
| :-------------- | :------ | :-------------------------- |
| _firewallModule | address | The firewall module to set. |
