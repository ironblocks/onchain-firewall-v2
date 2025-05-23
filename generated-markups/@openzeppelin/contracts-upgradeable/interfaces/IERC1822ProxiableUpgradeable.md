# IERC1822ProxiableUpgradeable

## Overview

#### License: MIT

```solidity
interface IERC1822ProxiableUpgradeable
```

ERC1822: Universal Upgradeable Proxy Standard (UUPS) documents a method for upgradeability through a simplified
proxy whose upgrades are fully controlled by the current implementation.
## Functions info

### proxiableUUID (0x52d1902d)

```solidity
function proxiableUUID() external view returns (bytes32)
```

Returns the storage slot that the proxiable contract assumes is being used to store the implementation
address.

IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks
bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this
function revert if invoked through a proxy.