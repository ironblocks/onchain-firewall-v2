# VennGuard

## Overview

#### License: UNLICENSED

```solidity
contract VennGuard is IGuard, AccessControl
```


## Constants info

### MAX_BYPASS_GUARD_WAIT_TIME (0xd189b0ae)

```solidity
uint256 constant MAX_BYPASS_GUARD_WAIT_TIME = 7 days
```


### SIGNER_ROLE (0xa1ebf35d)

```solidity
bytes32 constant SIGNER_ROLE = keccak256("SIGNER_ROLE")
```


## State variables info

### attestationCenterProxy (0x89856bc4)

```solidity
address immutable attestationCenterProxy
```


### multisendContract (0x0802188f)

```solidity
address immutable multisendContract
```


### safe (0x186f0354)

```solidity
address immutable safe
```


### nonce (0xaffed0e0)

```solidity
uint256 nonce
```


### bypassGuardWaitTime (0xd99c1a92)

```solidity
uint256 bypassGuardWaitTime
```


### bypassGuardInitTime (0xe76f8ae4)

```solidity
mapping(bytes32 => uint256) bypassGuardInitTime
```


## Functions info

### constructor

```solidity
constructor(
    address _attestationCenterProxy,
    address _multisendContract,
    address _safe,
    uint256 _bypassGuardWaitTime
)
```


### bypassGuard (0xcb826af4)

```solidity
function bypassGuard(
    address to,
    uint256 value,
    bytes memory data,
    IGnosisSafe.Operation operation,
    uint256 safeTxGas,
    uint256 baseGas,
    uint256 gasPrice,
    address gasToken,
    address payable refundReceiver,
    bytes memory signatures
) external
```


### checkTransaction (0x75f0bb52)

```solidity
function checkTransaction(
    address to,
    uint256 value,
    bytes memory data,
    IGnosisSafe.Operation operation,
    uint256 safeTxGas,
    uint256 baseGas,
    uint256 gasPrice,
    address gasToken,
    address payable refundReceiver,
    bytes memory,
    address
) external
```


### approveMetaTxHash (0xe45f39e0)

```solidity
function approveMetaTxHash(
    bytes32 metaTxHash,
    uint256 _expiration,
    uint256 _nonce
) external onlyRole(SIGNER_ROLE)
```


### checkAfterExecution (0x93271368)

```solidity
function checkAfterExecution(bytes32 txHash, bool) external view
```


### supportsInterface (0x01ffc9a7)

```solidity
function supportsInterface(
    bytes4 interfaceId
) public view virtual override returns (bool)
```


### _encodeTransactionData (0xa7c367f0)

```solidity
function _encodeTransactionData(
    address to,
    uint256 value,
    bytes memory data,
    IGnosisSafe.Operation operation,
    uint256 safeTxGas,
    uint256 baseGas,
    uint256 gasPrice,
    address gasToken,
    address refundReceiver,
    uint256 _nonce
) public view returns (bytes memory)
```

