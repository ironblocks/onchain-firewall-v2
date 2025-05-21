# IBeacon

## Overview

#### License: MIT

```solidity
interface IBeacon
```

This is the interface that {BeaconProxy} expects of its beacon.
## Functions info

### implementation (0x5c60da1b)

```solidity
function implementation() external view returns (address)
```

Must return an address that can be used as a delegate call target.

{BeaconProxy} will check that this address is a contract.