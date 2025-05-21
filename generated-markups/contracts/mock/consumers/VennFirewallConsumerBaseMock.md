# VennFirewallConsumerBaseMock

## Overview

#### License: UNLICENSED

```solidity
contract VennFirewallConsumerBaseMock is VennFirewallConsumerBase
```


## Events info

### ArbitraryCall

```solidity
event ArbitraryCall(bytes data)
```


## State variables info

### firstSlot (0xc27187a9)

```solidity
uint256 firstSlot = 234554321
```


### safeFunctionCaller (0x9ec0ba71)

```solidity
address safeFunctionCaller
```


### safeFunctionCallFlag (0xdc4bd0e5)

```solidity
uint256 safeFunctionCallFlag
```


### userPaidFee (0x252811c8)

```solidity
uint256 userPaidFee
```


## Functions info

### attestationCenter (0xd92807a2)

```solidity
function attestationCenter() external view returns (address)
```


### firewall (0xc22a4a85)

```solidity
function firewall() external view returns (address)
```


### newFirewallAdmin (0xf11f8010)

```solidity
function newFirewallAdmin() external view returns (address)
```


### setFirewallAdminMock (0x15bce620)

```solidity
function setFirewallAdminMock(address _newFirewallAdmin) external
```


### arbitraryCall (0x89296a5f)

```solidity
function arbitraryCall(bytes calldata _data) external
```


### saveSafeFunctionCallFlag (0x75dc9899)

```solidity
function saveSafeFunctionCallFlag() external payable
```


### setSafeFunctionCallFlagAndReturnMsgValue (0xc5a7532a)

```solidity
function setSafeFunctionCallFlagAndReturnMsgValue(
    address _safeFunctionCaller,
    uint256 _safeFunctionCallFlag,
    uint256 _userPaidFee
) external payable returns (uint256)
```


### setSafeFunctionCallFlagAndCallFunction (0x30b3b928)

```solidity
function setSafeFunctionCallFlagAndCallFunction(
    address _safeFunctionCaller,
    uint256 _safeFunctionCallFlag,
    uint256 _userPaidFee,
    bytes calldata _data
) external payable
```


### firewallProtectedFunction (0x347340c5)

```solidity
function firewallProtectedFunction() external payable firewallProtected
```

