# SampleNonVennUpgradeableConsumer

## Overview

#### License: UNLICENSED

```solidity
contract SampleNonVennUpgradeableConsumer is OwnableUpgradeable
```


## State variables info

### deposits (0xfc7e286d)

```solidity
mapping(address => uint256) deposits
```


### tokenDeposits (0x3add0454)

```solidity
mapping(address => mapping(address => uint256)) tokenDeposits
```


## Functions info

### deposit (0xd0e30db0)

```solidity
function deposit() external payable
```


### withdraw (0x2e1a7d4d)

```solidity
function withdraw(uint256 _amount) external
```


### depositToken (0x338b5dea)

```solidity
function depositToken(address _token, uint256 _amount) external
```


### withdrawToken (0x9e281a98)

```solidity
function withdrawToken(address _token, uint256 _amount) external
```


### setOwner (0x13af4035)

```solidity
function setOwner(address _newOwner) external onlyOwner
```


### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

