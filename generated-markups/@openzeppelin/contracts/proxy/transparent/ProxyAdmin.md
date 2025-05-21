# ProxyAdmin

## Overview

#### License: MIT

```solidity
contract ProxyAdmin is Ownable
```

This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an
explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.
## Functions info

### getProxyImplementation (0x204e1c7a)

```solidity
function getProxyImplementation(
    ITransparentUpgradeableProxy proxy
) public view virtual returns (address)
```

Returns the current implementation of `proxy`.

Requirements:

- This contract must be the admin of `proxy`.
### getProxyAdmin (0xf3b7dead)

```solidity
function getProxyAdmin(
    ITransparentUpgradeableProxy proxy
) public view virtual returns (address)
```

Returns the current admin of `proxy`.

Requirements:

- This contract must be the admin of `proxy`.
### changeProxyAdmin (0x7eff275e)

```solidity
function changeProxyAdmin(
    ITransparentUpgradeableProxy proxy,
    address newAdmin
) public virtual onlyOwner
```

Changes the admin of `proxy` to `newAdmin`.

Requirements:

- This contract must be the current admin of `proxy`.
### upgrade (0x99a88ec4)

```solidity
function upgrade(
    ITransparentUpgradeableProxy proxy,
    address implementation
) public virtual onlyOwner
```

Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}.

Requirements:

- This contract must be the admin of `proxy`.
### upgradeAndCall (0x9623609d)

```solidity
function upgradeAndCall(
    ITransparentUpgradeableProxy proxy,
    address implementation,
    bytes memory data
) public payable virtual onlyOwner
```

Upgrades `proxy` to `implementation` and calls a function on the new implementation. See
{TransparentUpgradeableProxy-upgradeToAndCall}.

Requirements:

- This contract must be the admin of `proxy`.