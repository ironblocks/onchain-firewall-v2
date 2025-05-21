# FirewallModule

## Overview

#### License: UNLICENSED

```solidity
contract FirewallModule is IFirewallModule
```


## State variables info

### gnosisSafe (0xa84173ae)

```solidity
address gnosisSafe
```

Get the gnosis safe address.


Return values:

| Name | Type    | Description              |
| :--- | :------ | :----------------------- |
| [0]  | address | The gnosis safe address. |

### approvedDeployers (0x72adaab2)

```solidity
mapping(address => bool) approvedDeployers
```

Get the status of a deployer.


Parameters:

| Name      | Type    | Description                         |
| :-------- | :------ | :---------------------------------- |
| _deployer | address | The deployer to get the status of.  |


Return values:

| Name | Type | Description                 |
| :--- | :--- | :-------------------------- |
| [0]  | bool | The status of the deployer. |

### approvedFirewalls (0xa7f217bc)

```solidity
mapping(address => bool) approvedFirewalls
```

Get the status of a firewall.


Parameters:

| Name      | Type    | Description                         |
| :-------- | :------ | :---------------------------------- |
| _firewall | address | The firewall to get the status of.  |


Return values:

| Name | Type | Description                 |
| :--- | :--- | :-------------------------- |
| [0]  | bool | The status of the firewall. |

## Modifiers info

### onlySafe

```solidity
modifier onlySafe()
```


## Functions info

### constructor

```solidity
constructor(address _gnosisSafe)
```


### approvePolicy (0xf0938da3)

```solidity
function approvePolicy(address _policy, address _firewall) external
```

Approve a policy to be used by a firewall.


Parameters:

| Name      | Type    | Description              |
| :-------- | :------ | :----------------------- |
| _policy   | address | The policy to approve.   |
| _firewall | address | The firewall to approve. |

### setDeployersStatus (0xad357cfa)

```solidity
function setDeployersStatus(
    address[] calldata _deployers,
    bool _status
) external onlySafe
```

Set the status of a list of deployers.


Parameters:

| Name       | Type      | Description                                  |
| :--------- | :-------- | :------------------------------------------- |
| _deployers | address[] | The list of deployers to set the status of.  |
| _status    | bool      | The status to set.                           |

### setFirewallsStatus (0x206f6de7)

```solidity
function setFirewallsStatus(
    address[] calldata _firewalls,
    bool _status
) external onlySafe
```

Set the status of a list of firewalls.


Parameters:

| Name       | Type      | Description                                  |
| :--------- | :-------- | :------------------------------------------- |
| _firewalls | address[] | The list of firewalls to set the status of.  |
| _status    | bool      | The status to set.                           |
