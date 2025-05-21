# UUPSUpgradeable

## Overview

#### License: MIT

```solidity
abstract contract UUPSUpgradeable is Initializable, IERC1822ProxiableUpgradeable, ERC1967UpgradeUpgradeable
```

An upgradeability mechanism designed for UUPS proxies. The functions included here can perform an upgrade of an
{ERC1967Proxy}, when this contract is set as the implementation behind such a proxy.

A security mechanism ensures that an upgrade does not turn off upgradeability accidentally, although this risk is
reinstated if the upgrade retains upgradeability but removes the security mechanism, e.g. by replacing
`UUPSUpgradeable` with a custom implementation of upgrades.

The {_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.

_Available since v4.1._
## Modifiers info

### onlyProxy

```solidity
modifier onlyProxy()
```

Check that the execution is being performed through a delegatecall call and that the execution context is
a proxy contract with an implementation (as defined in ERC1967) pointing to self. This should only be the case
for UUPS and transparent proxies that are using the current contract as their implementation. Execution of a
function through ERC1167 minimal proxies (clones) would not normally pass this test, but is not guaranteed to
fail.
### notDelegated

```solidity
modifier notDelegated()
```

Check that the execution is not being performed through a delegate call. This allows a function to be
callable on the implementing contract but not through proxies.
## Functions info

### proxiableUUID (0x52d1902d)

```solidity
function proxiableUUID()
    external
    view
    virtual
    override
    notDelegated
    returns (bytes32)
```

Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the
implementation. It is used to validate the implementation's compatibility when performing an upgrade.

IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks
bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this
function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.
### upgradeTo (0x3659cfe6)

```solidity
function upgradeTo(address newImplementation) public virtual onlyProxy
```

Upgrade the implementation of the proxy to `newImplementation`.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event.


oz-upgrades-unsafe-allow-reachable: delegatecall
### upgradeToAndCall (0x4f1ef286)

```solidity
function upgradeToAndCall(
    address newImplementation,
    bytes memory data
) public payable virtual onlyProxy
```

Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call
encoded in `data`.

Calls {_authorizeUpgrade}.

Emits an {Upgraded} event.


oz-upgrades-unsafe-allow-reachable: delegatecall