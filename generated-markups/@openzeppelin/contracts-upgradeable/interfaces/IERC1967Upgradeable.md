# IERC1967Upgradeable

## Overview

#### License: MIT

```solidity
interface IERC1967Upgradeable
```

ERC-1967: Proxy Storage Slots. This interface contains the events defined in the ERC.

_Available since v4.8.3._
## Events info

### Upgraded

```solidity
event Upgraded(address indexed implementation)
```

Emitted when the implementation is upgraded.
### AdminChanged

```solidity
event AdminChanged(address previousAdmin, address newAdmin)
```

Emitted when the admin account has changed.
### BeaconUpgraded

```solidity
event BeaconUpgraded(address indexed beacon)
```

Emitted when the beacon is changed.