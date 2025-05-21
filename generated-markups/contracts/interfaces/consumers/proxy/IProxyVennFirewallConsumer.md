# IProxyVennFirewallConsumer

## Overview

#### License: UNLICENSED

```solidity
interface IProxyVennFirewallConsumer is IVennFirewallConsumerBase
```

This extension allows the Proxy Owner to initialize the Firewall Admin even if the contract was originally deployed
with a zero-address in the constructor or if the contract is upgradeable and the proxy was initialized before this implementation was deployed.
## Functions info

### initializeFirewallAdmin (0x7eba9471)

```solidity
function initializeFirewallAdmin(address _firewallAdmin) external
```

Proxy Admin only function, allows the Proxy Admin to initialize the firewall admin in the following cases:
- If the contract was originally deployed with a zero-address in the constructor (for various reasons);
- Or, if the contract is upgradeable and the proxy was initialized before this implementation was deployed.


Parameters:

| Name           | Type    | Description                        |
| :------------- | :------ | :--------------------------------- |
| _firewallAdmin | address | The address of the firewall admin. |
