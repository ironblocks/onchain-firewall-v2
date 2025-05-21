# ITransparentUpgradeableProxy

## Overview

#### License: MIT

```solidity
interface ITransparentUpgradeableProxy is IERC1967
```

Interface for {TransparentUpgradeableProxy}. In order to implement transparency, {TransparentUpgradeableProxy}
does not implement this interface directly, and some of its functions are implemented by an internal dispatch
mechanism. The compiler is unaware that these functions are implemented by {TransparentUpgradeableProxy} and will not
include them in the ABI so this interface must be used to interact with it.
## Functions info

### admin (0xf851a440)

```solidity
function admin() external view returns (address)
```


### implementation (0x5c60da1b)

```solidity
function implementation() external view returns (address)
```


### changeAdmin (0x8f283970)

```solidity
function changeAdmin(address) external
```


### upgradeTo (0x3659cfe6)

```solidity
function upgradeTo(address) external
```


### upgradeToAndCall (0x4f1ef286)

```solidity
function upgradeToAndCall(address, bytes memory) external payable
```

