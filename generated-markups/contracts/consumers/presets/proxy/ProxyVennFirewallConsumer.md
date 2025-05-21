# ProxyVennFirewallConsumer

## Overview

#### License: UNLICENSED

```solidity
abstract contract ProxyVennFirewallConsumer is IProxyVennFirewallConsumer, VennFirewallConsumerBase
```

This extension allows the Proxy Owner to initialize the Firewall Admin even if the contract was originally deployed
with a zero-address in the constructor or if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
## Modifiers info

### isAllowedInitializer

```solidity
modifier isAllowedInitializer(bytes32 _adminMemorySlot)
```

