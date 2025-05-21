# IVennFirewallConsumerBase

## Overview

#### License: UNLICENSED

```solidity
interface IVennFirewallConsumerBase is IFirewallConsumer
```

Interface for the Venn Firewall Consumer Base contract.
## Events info

### AttestationCenterProxyUpdated

```solidity
event AttestationCenterProxyUpdated(address newAttestationCenterProxy)
```

Emitted when the attestation center proxy is updated.


Parameters:

| Name                      | Type    | Description                       |
| :------------------------ | :------ | :-------------------------------- |
| newAttestationCenterProxy | address | The new attestation center proxy. |

### FirewallAdminProposed

```solidity
event FirewallAdminProposed(address newAdmin)
```

Emitted when the new firewall admin is proposed.


Parameters:

| Name     | Type    | Description             |
| :------- | :------ | :---------------------- |
| newAdmin | address | The new firewall admin. |

### FirewallAdminUpdated

```solidity
event FirewallAdminUpdated(address newAdmin)
```

Event emitted when the firewall admin is updated.


Parameters:

| Name     | Type    | Description                            |
| :------- | :------ | :------------------------------------- |
| newAdmin | address | The address of the new firewall admin. |

### FirewallUpdated

```solidity
event FirewallUpdated(address newFirewall)
```

Event emitted when the firewall is updated.


Parameters:

| Name        | Type    | Description                      |
| :---------- | :------ | :------------------------------- |
| newFirewall | address | The address of the new firewall. |

## Errors info

### NotFirewallAdmin

```solidity
error NotFirewallAdmin()
```

Error emitted when the caller is not the firewall admin.
### NotEnoughFee

```solidity
error NotEnoughFee()
```

Error emitted when the user does not have enough fee
### NonZeroUserNativeFee

```solidity
error NonZeroUserNativeFee()
```

Error emitted when the user passes a non-zero user native fee when not enabled.
### AttestationCenterProxyNotSet

```solidity
error AttestationCenterProxyNotSet()
```

Error emitted when the attestation center proxy is not set.
### ProxyCallFailed

```solidity
error ProxyCallFailed(bytes returnData)
```

Error emitted when the proxy call fails.


Parameters:

| Name       | Type  | Description                                       |
| :--------- | :---- | :------------------------------------------------ |
| returnData | bytes | The bytes of the return data from the proxy call. |

### NotNewFirewallAdmin

```solidity
error NotNewFirewallAdmin()
```

Error emitted when the new firewall admin is not the caller.
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
function setAttestationCenterProxy(address _attestationCenterProxy) external
```

Admin only function to set the attestation center proxy.


Parameters:

| Name                    | Type    | Description                                  |
| :---------------------- | :------ | :------------------------------------------- |
| _attestationCenterProxy | address | The address of the attestation center proxy. |

### setFirewall (0x8c36d02d)

```solidity
function setFirewall(address _firewall) external
```

Admin only function allowing the consumers admin to set the firewall address.


Parameters:

| Name      | Type    | Description                  |
| :-------- | :------ | :--------------------------- |
| _firewall | address | The address of the firewall. |

### setFirewallAdmin (0x734b7198)

```solidity
function setFirewallAdmin(address _firewallAdmin) external
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