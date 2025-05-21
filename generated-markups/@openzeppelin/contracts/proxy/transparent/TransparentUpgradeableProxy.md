# TransparentUpgradeableProxy

## Overview

#### License: MIT

```solidity
contract TransparentUpgradeableProxy is ERC1967Proxy
```

This contract implements a proxy that is upgradeable by an admin.

To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector
clashing], which can potentially be used in an attack, this contract uses the
https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two
things that go hand in hand:

1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if
that call matches one of the admin functions exposed by the proxy itself.
2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the
implementation. If the admin tries to call a function on the implementation it will fail with an error that says
"admin cannot fallback to proxy target".

These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing
the admin, so it's best if it's a dedicated account that is not used for anything else. This will avoid headaches due
to sudden errors when trying to call a function from the proxy implementation.

Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,
you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.

NOTE: The real interface of this proxy is that defined in `ITransparentUpgradeableProxy`. This contract does not
inherit from that interface, and instead the admin functions are implicitly implemented using a custom dispatch
mechanism in `_fallback`. Consequently, the compiler will not produce an ABI for this contract. This is necessary to
fully implement transparency without decoding reverts caused by selector clashes between the proxy and the
implementation.

WARNING: It is not recommended to extend this contract to add additional external functions. If you do so, the compiler
will not check that there are no selector conflicts, due to the note above. A selector clash between any new function
and the functions declared in {ITransparentUpgradeableProxy} will be resolved in favor of the new one. This could
render the admin operations inaccessible, which could prevent upgradeability. Transparency may also be compromised.
## Modifiers info

### ifAdmin

```solidity
modifier ifAdmin()
```

Modifier used internally that will delegate the call to the implementation unless the sender is the admin.

CAUTION: This modifier is deprecated, as it could cause issues if the modified function has arguments, and the
implementation provides a function with the same selector.
## Functions info

### constructor

```solidity
constructor(
    address _logic,
    address admin_,
    bytes memory _data
) payable ERC1967Proxy(_logic, _data)
```

Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and
optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.