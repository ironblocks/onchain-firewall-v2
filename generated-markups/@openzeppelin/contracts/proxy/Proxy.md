# Proxy

## Overview

#### License: MIT

```solidity
abstract contract Proxy
```

This abstract contract provides a fallback function that delegates all calls to another contract using the EVM
instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to
be specified by overriding the virtual {_implementation} function.

Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a
different contract through the {_delegate} function.

The success and return data of the delegated call will be returned back to the caller of the proxy.
## Functions info

### fallback

```solidity
fallback() external payable virtual
```

Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other
function in the contract matches the call data.
### receive

```solidity
receive() external payable virtual
```

Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data
is empty.