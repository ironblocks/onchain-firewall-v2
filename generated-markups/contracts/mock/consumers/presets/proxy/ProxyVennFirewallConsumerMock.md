# ProxyVennFirewallConsumerMock

## Overview

#### License: UNLICENSED

```solidity
contract ProxyVennFirewallConsumerMock is ProxyVennFirewallConsumer
```


## State variables info

### initializerAddress (0xd6dc0b0d)

```solidity
address initializerAddress
```


## Functions info

### initializeFirewallAdmin (0x7eba9471)

```solidity
function initializeFirewallAdmin(address _firewallAdmin) external override
```

Proxy Admin only function, allows the Proxy Admin to initialize the firewall admin in the following cases:
- If the contract was originally deployed with a zero-address in the constructor (for various reasons);
- Or, if the contract is upgradeable and the proxy was initialized before this implementation was deployed.


Parameters:

| Name           | Type    | Description                        |
| :------------- | :------ | :--------------------------------- |
| _firewallAdmin | address | The address of the firewall admin. |

### getNewFirewallAdmin (0x47160976)

```solidity
function getNewFirewallAdmin() external view returns (address)
```


### setInitializerAddress (0xe87ccf6d)

```solidity
function setInitializerAddress(address _initializerAddress) external
```


### isAllowedInitializerFunction (0x3b922c18)

```solidity
function isAllowedInitializerFunction(
    bytes32 _adminMemorySlot
) external view isAllowedInitializer(_adminMemorySlot)
```

