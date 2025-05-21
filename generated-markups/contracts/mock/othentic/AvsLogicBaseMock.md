# AvsLogicBaseMock

## Overview

#### License: UNLICENSED

```solidity
contract AvsLogicBaseMock is AvsLogicBase
```


## Functions info

### constructor

```solidity
constructor(address _attestationCenter) AvsLogicBase(_attestationCenter)
```


### afterTaskSubmission (0xdd1a5387)

```solidity
function afterTaskSubmission(
    IAttestationCenter.TaskInfo calldata,
    bool,
    bytes calldata,
    uint256[2] calldata,
    uint256[] calldata
) external
```


### beforeTaskSubmission (0x502f5bd0)

```solidity
function beforeTaskSubmission(
    IAttestationCenter.TaskInfo calldata,
    bool,
    bytes calldata,
    uint256[2] calldata,
    uint256[] calldata
) external
```

