# ConsumerMock

## Overview

#### License: UNLICENSED

```solidity
contract ConsumerMock is IFirewallConsumer
```


## State variables info

### firewallAdmin (0xf05c8582)

```solidity
address firewallAdmin
```

Returns the address of the firewall admin.


Return values:

| Name | Type    | Description                                |
| :--- | :------ | :----------------------------------------- |
| [0]  | address | address The address of the firewall admin. |

### firewall (0xc22a4a85)

```solidity
address firewall
```


## Functions info

### constructor

```solidity
constructor(address _firewall)
```


### setFirewall (0x8c36d02d)

```solidity
function setFirewall(address _firewall) external
```


### setFirewallAdmin (0x734b7198)

```solidity
function setFirewallAdmin(address _firewallAdmin) external
```


### preExecution (0x6fe1967c)

```solidity
function preExecution(
    address _sender,
    bytes calldata _data,
    uint256 _value
) external
```


### postExecution (0x93163a91)

```solidity
function postExecution(
    address _sender,
    bytes calldata _data,
    uint256 _value
) external
```

