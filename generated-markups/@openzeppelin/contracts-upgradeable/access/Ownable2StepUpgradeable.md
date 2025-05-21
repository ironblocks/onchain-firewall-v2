# Ownable2StepUpgradeable

## Overview

#### License: MIT

```solidity
abstract contract Ownable2StepUpgradeable is Initializable, OwnableUpgradeable
```

Contract module which provides access control mechanism, where
there is an account (an owner) that can be granted exclusive access to
specific functions.

By default, the owner account will be the one that deploys the contract. This
can later be changed with {transferOwnership} and {acceptOwnership}.

This module is used through inheritance. It will make available all functions
from parent (Ownable).
## Events info

### OwnershipTransferStarted

```solidity
event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner)
```


## Functions info

### pendingOwner (0xe30c3978)

```solidity
function pendingOwner() public view virtual returns (address)
```

Returns the address of the pending owner.
### transferOwnership (0xf2fde38b)

```solidity
function transferOwnership(address newOwner) public virtual override onlyOwner
```

Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one.
Can only be called by the current owner.
### acceptOwnership (0x79ba5097)

```solidity
function acceptOwnership() public virtual
```

The new owner accepts the ownership transfer.