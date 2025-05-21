# BeaconProxy

## Overview

#### License: MIT

```solidity
contract BeaconProxy is Proxy, ERC1967Upgrade
```

This contract implements a proxy that gets the implementation address for each call from an {UpgradeableBeacon}.

The beacon address is stored in storage slot `uint256(keccak256('eip1967.proxy.beacon')) - 1`, so that it doesn't
conflict with the storage layout of the implementation behind the proxy.

_Available since v3.4._
## Functions info

### constructor

```solidity
constructor(address beacon, bytes memory data) payable
```

Initializes the proxy with `beacon`.

If `data` is nonempty, it's used as data in a delegate call to the implementation returned by the beacon. This
will typically be an encoded function call, and allows initializing the storage of the proxy like a Solidity
constructor.

Requirements:

- `beacon` must be a contract with the interface {IBeacon}.