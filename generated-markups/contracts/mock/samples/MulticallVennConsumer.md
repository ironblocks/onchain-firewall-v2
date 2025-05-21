# MulticallVennConsumer

## Overview

#### License: UNLICENSED

```solidity
contract MulticallVennConsumer is VennFirewallConsumer
```


## Functions info

### constructor

```solidity
constructor(address _firewall) VennFirewallConsumer(_firewall, msg.sender)
```


### multicall (0x28181829)

```solidity
function multicall(
    address[] calldata _targets,
    bytes[] calldata _data,
    uint256[] calldata _values
) external payable firewallProtected returns (bytes[] memory results)
```


### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

