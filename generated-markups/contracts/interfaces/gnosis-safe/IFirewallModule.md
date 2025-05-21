# IFirewallModule

## Overview

#### License: UNLICENSED

```solidity
interface IFirewallModule
```

Interface for the Firewall Module.
## Events info

### DeployerStatusSet

```solidity
event DeployerStatusSet(address indexed deployer, bool status)
```

Emitted when a deployer is approved.


Parameters:

| Name     | Type    | Description                   |
| :------- | :------ | :---------------------------- |
| deployer | address | The address of the deployer.  |
| status   | bool    | The status of the deployer.   |

### FirewallStatusSet

```solidity
event FirewallStatusSet(address indexed firewall, bool status)
```

Emitted when a firewall is approved.


Parameters:

| Name     | Type    | Description                   |
| :------- | :------ | :---------------------------- |
| firewall | address | The address of the firewall.  |
| status   | bool    | The status of the firewall.   |

## Functions info

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
) external
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
) external
```

Set the status of a list of firewalls.


Parameters:

| Name       | Type      | Description                                  |
| :--------- | :-------- | :------------------------------------------- |
| _firewalls | address[] | The list of firewalls to set the status of.  |
| _status    | bool      | The status to set.                           |

### gnosisSafe (0xa84173ae)

```solidity
function gnosisSafe() external view returns (address)
```

Get the gnosis safe address.


Return values:

| Name | Type    | Description              |
| :--- | :------ | :----------------------- |
| [0]  | address | The gnosis safe address. |

### approvedDeployers (0x72adaab2)

```solidity
function approvedDeployers(address _deployer) external view returns (bool)
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
function approvedFirewalls(address _firewall) external view returns (bool)
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
