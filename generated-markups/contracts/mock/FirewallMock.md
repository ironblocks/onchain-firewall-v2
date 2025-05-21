# FirewallMock

## Overview

#### License: UNLICENSED

```solidity
contract FirewallMock
```


## Events info

### PreExecution

```solidity
event PreExecution(address _sender, bytes _data, uint256 _value)
```


### PostExecution

```solidity
event PostExecution(address _sender, bytes _data, uint256 _value)
```


## State variables info

### preExecutionFails (0x1b72f40b)

```solidity
bool preExecutionFails
```


### postExecutionFails (0x0d72250d)

```solidity
bool postExecutionFails
```


## Functions info

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


### setPreExecutionFails (0xfc9114b3)

```solidity
function setPreExecutionFails(bool _preExecutionFails) external
```


### setPostExecutionFails (0x890d9d0d)

```solidity
function setPostExecutionFails(bool _postExecutionFails) external
```

