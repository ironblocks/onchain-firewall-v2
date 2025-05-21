# VennFirewallConsumer

## Overview

#### License: UNLICENSED

```solidity
contract VennFirewallConsumer is VennFirewallConsumerBase
```

Author: David Benchimol @ Ironblocks

This contract is a parent contract that can be used to add firewall protection to any contract.

The contract must define a firewall contract which will manage the policies that are applied to the contract.
It also must define a firewall admin which will be able to add and remove policies.
## Functions info

### constructor

```solidity
constructor(address _firewall, address _firewallAdmin)
```

