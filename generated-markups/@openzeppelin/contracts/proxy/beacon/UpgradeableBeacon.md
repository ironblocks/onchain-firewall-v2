# UpgradeableBeacon

## Overview

#### License: MIT

```solidity
contract UpgradeableBeacon is IBeacon, Ownable
```

This contract is used in conjunction with one or more instances of {BeaconProxy} to determine their
implementation contract, which is where they will delegate all function calls.

An owner is able to change the implementation the beacon points to, thus upgrading the proxies that use this beacon.
## Events info

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```

Emitted when the implementation returned by the beacon is changed.
## Functions info

### constructor

```solidity
constructor(address implementation_)
```

Sets the address of the initial implementation, and the deployer account as the owner who can upgrade the
beacon.
### implementation (0x5c60da1b)

```solidity
function implementation() public view virtual override returns (address)
```

Returns the current implementation address.
### upgradeTo (0x3659cfe6)

```solidity
function upgradeTo(address newImplementation) public virtual onlyOwner
```

Upgrades the beacon to a new implementation.

Emits an {Upgraded} event.

Requirements:

- msg.sender must be the owner of the contract.
- `newImplementation` must be a contract.