# VennFirewallConsumerBase

## Overview

#### License: UNLICENSED

```solidity
abstract contract VennFirewallConsumerBase is IVennFirewallConsumerBase
```

Author: David Benchimol @ Ironblocks

This contract is a parent contract that can be used to add firewall protection to any contract.

The contract must define a firewall contract which will manage the policies that are applied to the contract.
It also must define a firewall admin which will be able to add and remove policies.
## Modifiers info

### firewallProtected

```solidity
modifier firewallProtected()
```

Modifier that will run the preExecution and postExecution hooks of the firewall, applying each of
the subscribed policies.

NOTE: Applying this modifier on functions that exit execution flow by an inline assmebly "return" call will
prevent the postExecution hook from running - breaking the protection provided by the firewall.
If you have any questions, please refer to the Firewall's documentation and/or contact our support.
### onlyFirewallAdmin

```solidity
modifier onlyFirewallAdmin()
```

Modifier similar to onlyOwner, but for the firewall admin.
## Functions info

### safeFunctionCall (0xcb09f61f)

```solidity
function safeFunctionCall(
    uint256 _userNativeFee,
    bytes calldata _proxyPayload,
    bytes calldata _data
) external payable
```

Function to perform a safe function call. This function will call the attestation center proxy and then call the data.


Parameters:

| Name           | Type    | Description                                              |
| :------------- | :------ | :------------------------------------------------------- |
| _userNativeFee | uint256 | The user's native fee.                                   |
| _proxyPayload  | bytes   | The proxy payload to call the attestation center proxy.  |
| _data          | bytes   | The data to call.                                        |

### setAttestationCenterProxy (0x54222e6c)

```solidity
function setAttestationCenterProxy(
    address _attestationCenterProxy
) external onlyFirewallAdmin
```

Admin only function to set the attestation center proxy.


Parameters:

| Name                    | Type    | Description                                  |
| :---------------------- | :------ | :------------------------------------------- |
| _attestationCenterProxy | address | The address of the attestation center proxy. |

### setAllowNonZeroUserNativeFee (0xe9c4c89b)

```solidity
function setAllowNonZeroUserNativeFee(
    bool _allowNonZeroUserNativeFee
) external onlyFirewallAdmin
```


### firewallAdmin (0xf05c8582)

```solidity
function firewallAdmin() external view returns (address)
```

Returns the address of the firewall admin.


Return values:

| Name | Type    | Description                                |
| :--- | :------ | :----------------------------------------- |
| [0]  | address | address The address of the firewall admin. |

### setFirewall (0x8c36d02d)

```solidity
function setFirewall(address _firewall) external onlyFirewallAdmin
```

Admin only function allowing the consumers admin to set the firewall address.


Parameters:

| Name      | Type    | Description                  |
| :-------- | :------ | :--------------------------- |
| _firewall | address | The address of the firewall. |

### setFirewallAdmin (0x734b7198)

```solidity
function setFirewallAdmin(address _firewallAdmin) external onlyFirewallAdmin
```

Admin only function, sets new firewall admin. New admin must accept.


Parameters:

| Name           | Type    | Description                            |
| :------------- | :------ | :------------------------------------- |
| _firewallAdmin | address | The address of the new firewall admin. |

### acceptFirewallAdmin (0x7c65c38b)

```solidity
function acceptFirewallAdmin() external
```

Accept the role as firewall admin.