# IProtocolRegistry

## Overview

#### License: UNLICENSED

```solidity
interface IProtocolRegistry
```

Interface for the Protocol Registry contract.
## Structs info

### Protocol

```solidity
struct Protocol {
	address policyAddress;
	string metadataURI;
}
```

Struct for storing protocol information.


Parameters:

| Name          | Type    | Description                          |
| :------------ | :------ | :----------------------------------- |
| policyAddress | address | The address of the policy contract.  |
| metadataURI   | string  | The metadata URI for the protocol.   |

### ProtocolDetection

```solidity
struct ProtocolDetection {
	address protocolAdmin;
	address operator;
	address[] assets;
	address[] admins;
	uint256 vennFee;
	bool isApproved;
	string metadataURI;
}
```

Struct for storing protocol detection information.


Parameters:

| Name          | Type      | Description                                  |
| :------------ | :-------- | :------------------------------------------- |
| protocolAdmin | address   | The address of the protocol admin.           |
| operator      | address   | The address of the operator.                 |
| assets        | address[] | The addresses of the assets.                 |
| admins        | address[] | The addresses of the admins.                 |
| vennFee       | uint256   | The fee for the protocol detection.          |
| isApproved    | bool      | Whether the protocol detection is approved.  |
| metadataURI   | string    | The metadata URI for the protocol detection. |

## Events info

### ProtocolUpdated

```solidity
event ProtocolUpdated(address indexed policyAddress, string metadataURI)
```

Event emitted when a protocol is updated.


Parameters:

| Name          | Type    | Description                          |
| :------------ | :------ | :----------------------------------- |
| policyAddress | address | The address of the policy contract.  |
| metadataURI   | string  | The metadata URI for the protocol.   |

### ProtocolRegistered

```solidity
event ProtocolRegistered(address indexed policyAddress, string metadataURI)
```

Event emitted when a protocol is registered.


Parameters:

| Name          | Type    | Description                          |
| :------------ | :------ | :----------------------------------- |
| policyAddress | address | The address of the policy contract.  |
| metadataURI   | string  | The metadata URI for the protocol.   |

### SubnetSubscribed

```solidity
event SubnetSubscribed(address indexed policyAddress, uint16 taskDefinitionId, uint256[] requiredOperatorIds)
```

Event emitted when a protocol subscribes a subnet.


Parameters:

| Name                | Type      | Description                                         |
| :------------------ | :-------- | :-------------------------------------------------- |
| policyAddress       | address   | The address of the policy contract.                 |
| taskDefinitionId    | uint16    | The ID of the task definition for the protocol.     |
| requiredOperatorIds | uint256[] | The IDs of the operators required for the protocol. |

### SubnetUnsubscribed

```solidity
event SubnetUnsubscribed(address indexed policyAddress, uint16 taskDefinitionId)
```

Event emitted when a protocol unsubscribes a subnet.


Parameters:

| Name             | Type    | Description                                     |
| :--------------- | :------ | :---------------------------------------------- |
| policyAddress    | address | The address of the policy contract.             |
| taskDefinitionId | uint16  | The ID of the task definition for the protocol. |

### ProtocolDetectionApproved

```solidity
event ProtocolDetectionApproved(address indexed detectionEscrow, address indexed operator, address[] assets, address[] admins, string metadataURI)
```

Event emitted when a protocol detection is approved.


Parameters:

| Name            | Type      | Description                                  |
| :-------------- | :-------- | :------------------------------------------- |
| detectionEscrow | address   | The address of the detection escrow.         |
| operator        | address   | The address of the operator.                 |
| assets          | address[] | The addresses of the assets.                 |
| admins          | address[] | The addresses of the admins.                 |
| metadataURI     | string    | The metadata URI for the protocol detection. |

### ProtocolDetectionRegistered

```solidity
event ProtocolDetectionRegistered(address indexed detectionEscrow, address indexed operator, address[] assets, address[] admins, uint256 fee, string metadataURI)
```

Event emitted when a protocol detection is registered.


Parameters:

| Name            | Type      | Description                                  |
| :-------------- | :-------- | :------------------------------------------- |
| detectionEscrow | address   | The address of the detection escrow.         |
| operator        | address   | The address of the operator.                 |
| assets          | address[] | The addresses of the assets.                 |
| admins          | address[] | The addresses of the admins.                 |
| fee             | uint256   | The fee for the protocol detection.          |
| metadataURI     | string    | The metadata URI for the protocol detection. |

### VennFeeRecipientSet

```solidity
event VennFeeRecipientSet(address indexed vennFeeRecipient)
```

Event emitted when a venn fee recipient is set.


Parameters:

| Name             | Type    | Description                            |
| :--------------- | :------ | :------------------------------------- |
| vennFeeRecipient | address | The address of the venn fee recipient. |

### VennDetectionFeeSet

```solidity
event VennDetectionFeeSet(uint256 fee)
```

Event emitted when a venn detection fee is set.


Parameters:

| Name | Type    | Description                   |
| :--- | :------ | :---------------------------- |
| fee  | uint256 | The fee for a venn detection. |

### AttestationCenterSet

```solidity
event AttestationCenterSet(address indexed attestationCenter)
```

Event emitted when an attestation center is set.


Parameters:

| Name              | Type    | Description                            |
| :---------------- | :------ | :------------------------------------- |
| attestationCenter | address | The address of the attestation center. |

### VennProtocolFeeSet

```solidity
event VennProtocolFeeSet(uint256 fee)
```

Event emitted when a venn protocol fee is set.


Parameters:

| Name | Type    | Description                  |
| :--- | :------ | :--------------------------- |
| fee  | uint256 | The fee for a venn protocol. |

## Functions info

### __ProtocolRegistry_init (0xfa06470d)

```solidity
function __ProtocolRegistry_init(
    address _attestationCenter,
    address _vennFeeRecipient,
    uint256 _vennDetectionFee,
    uint256 _vennProtocolFee
) external
```

Initialize the protocol registry.


Parameters:

| Name               | Type    | Description                             |
| :----------------- | :------ | :-------------------------------------- |
| _attestationCenter | address | The address of the attestation center.  |
| _vennFeeRecipient  | address | The address of the venn fee recipient.  |
| _vennDetectionFee  | uint256 | The fee for a venn detection.           |
| _vennProtocolFee   | uint256 | The fee for a venn protocol.            |

### createAndRegisterProtocolDetection (0xe43e7396)

```solidity
function createAndRegisterProtocolDetection(
    address _operator,
    address[] calldata _assets,
    address[] calldata _admins,
    string calldata _metadataURI
) external returns (address detectionEscrow)
```

Create and register a protocol detection.


Parameters:

| Name         | Type      | Description                                   |
| :----------- | :-------- | :-------------------------------------------- |
| _operator    | address   | The address of the operator.                  |
| _assets      | address[] | The addresses of the assets.                  |
| _admins      | address[] | The addresses of the admins.                  |
| _metadataURI | string    | The metadata URI for the protocol detection.  |


Return values:

| Name            | Type    | Description                          |
| :-------------- | :------ | :----------------------------------- |
| detectionEscrow | address | The address of the detection escrow. |

### approveProtocolDetectionAsOperator (0x81fde738)

```solidity
function approveProtocolDetectionAsOperator(address _detectionEscrow) external
```

Approve a protocol detection as an operator.


Parameters:

| Name             | Type    | Description                          |
| :--------------- | :------ | :----------------------------------- |
| _detectionEscrow | address | The address of the detection escrow. |

### registerProtocol (0x4731765c)

```solidity
function registerProtocol(
    address _policyAddress,
    string calldata _metadataURI
) external
```

Register a protocol.


Parameters:

| Name           | Type    | Description                          |
| :------------- | :------ | :----------------------------------- |
| _policyAddress | address | The address of the policy contract.  |
| _metadataURI   | string  | The metadata URI for the protocol.   |

### updateProtocol (0x8024e777)

```solidity
function updateProtocol(
    address _policyAddress,
    string calldata _metadataURI
) external
```

Update a protocol.


Parameters:

| Name           | Type    | Description                          |
| :------------- | :------ | :----------------------------------- |
| _policyAddress | address | The address of the policy contract.  |
| _metadataURI   | string  | The metadata URI for the protocol.   |

### subscribeSubnet (0xc80d4f19)

```solidity
function subscribeSubnet(
    address _policyAddress,
    uint16 _taskDefinitionId,
    uint256[] calldata _requiredOperatorIds
) external
```

Subscribe a subnet to a protocol.


Parameters:

| Name                 | Type      | Description                                         |
| :------------------- | :-------- | :-------------------------------------------------- |
| _policyAddress       | address   | The address of the policy contract.                 |
| _taskDefinitionId    | uint16    | The ID of the task definition for the protocol.     |
| _requiredOperatorIds | uint256[] | The IDs of the operators required for the protocol. |

### unsubscribeSubnet (0xaa4e6373)

```solidity
function unsubscribeSubnet(
    address _policyAddress,
    uint16 _taskDefinitionId
) external
```

Unsubscribe a subnet from a protocol.


Parameters:

| Name              | Type    | Description                                     |
| :---------------- | :------ | :---------------------------------------------- |
| _policyAddress    | address | The address of the policy contract.             |
| _taskDefinitionId | uint16  | The ID of the task definition for the protocol. |

### setAttestationCenter (0x11c69311)

```solidity
function setAttestationCenter(address _attestationCenter) external
```

Set the attestation center.


Parameters:

| Name               | Type    | Description                            |
| :----------------- | :------ | :------------------------------------- |
| _attestationCenter | address | The address of the attestation center. |

### setVennDetectionFee (0x7d1f47d1)

```solidity
function setVennDetectionFee(uint256 _vennDetectionFee) external
```

Set the venn detection fee.


Parameters:

| Name              | Type    | Description                   |
| :---------------- | :------ | :---------------------------- |
| _vennDetectionFee | uint256 | The fee for a venn detection. |

### setVennProtocolFee (0xe99626ab)

```solidity
function setVennProtocolFee(uint256 _vennProtocolFee) external
```

Set the venn protocol fee.


Parameters:

| Name             | Type    | Description                  |
| :--------------- | :------ | :--------------------------- |
| _vennProtocolFee | uint256 | The fee for a venn protocol. |

### setVennFeeRecipient (0xaf02f775)

```solidity
function setVennFeeRecipient(address _vennFeeRecipient) external
```

Set the venn fee recipient.


Parameters:

| Name              | Type    | Description                            |
| :---------------- | :------ | :------------------------------------- |
| _vennFeeRecipient | address | The address of the venn fee recipient. |

### getProtocolTaskDefinitionIds (0x1effd67c)

```solidity
function getProtocolTaskDefinitionIds(
    address _policyAddress
) external view returns (uint256[] memory)
```

Get the task definition IDs for a protocol.


Parameters:

| Name           | Type    | Description                          |
| :------------- | :------ | :----------------------------------- |
| _policyAddress | address | The address of the policy contract.  |


Return values:

| Name | Type      | Description                                       |
| :--- | :-------- | :------------------------------------------------ |
| [0]  | uint256[] | The IDs of the task definitions for the protocol. |

### isSubnetSubscribed (0x46bb6fee)

```solidity
function isSubnetSubscribed(
    address _policyAddress,
    uint16 _taskDefinitionId
) external view returns (bool)
```

Check if a protocol is subscribed to a task definition.


Parameters:

| Name              | Type    | Description                                      |
| :---------------- | :------ | :----------------------------------------------- |
| _policyAddress    | address | The address of the policy contract.              |
| _taskDefinitionId | uint16  | The ID of the task definition for the protocol.  |


Return values:

| Name | Type | Description                                                |
| :--- | :--- | :--------------------------------------------------------- |
| [0]  | bool | Whether the protocol is subscribed to the task definition. |

### getRequiredOperatorIds (0x0bf86f54)

```solidity
function getRequiredOperatorIds(
    address _policyAddress,
    uint16 _taskDefinitionId
) external view returns (uint256[] memory)
```

Get the required operator IDs for a protocol.


Parameters:

| Name              | Type    | Description                                      |
| :---------------- | :------ | :----------------------------------------------- |
| _policyAddress    | address | The address of the policy contract.              |
| _taskDefinitionId | uint16  | The ID of the task definition for the protocol.  |


Return values:

| Name | Type      | Description                                         |
| :--- | :-------- | :-------------------------------------------------- |
| [0]  | uint256[] | The IDs of the operators required for the protocol. |

### version (0x54fd4d50)

```solidity
function version() external pure returns (uint256)
```

Get the version of the protocol registry.


Return values:

| Name | Type    | Description                           |
| :--- | :------ | :------------------------------------ |
| [0]  | uint256 | The version of the protocol registry. |

### ADMIN_ROLE (0x75b238fc)

```solidity
function ADMIN_ROLE() external view returns (bytes32)
```

Get the admin role.


Return values:

| Name | Type    | Description     |
| :--- | :------ | :-------------- |
| [0]  | bytes32 | The admin role. |

### MAX_VENN_DETECTION_FEE (0x1271ebbd)

```solidity
function MAX_VENN_DETECTION_FEE() external view returns (uint256)
```

Get the maximum venn detection fee.


Return values:

| Name | Type    | Description                     |
| :--- | :------ | :------------------------------ |
| [0]  | uint256 | The maximum venn detection fee. |

### MAX_VENN_PROTOCOL_FEE (0x2f90ccf0)

```solidity
function MAX_VENN_PROTOCOL_FEE() external view returns (uint256)
```

Get the maximum venn protocol fee.


Return values:

| Name | Type    | Description                    |
| :--- | :------ | :----------------------------- |
| [0]  | uint256 | The maximum venn protocol fee. |

### vennFeeRecipient (0xa5d1fe8a)

```solidity
function vennFeeRecipient() external view returns (address)
```

/**

Get the venn fee recipient.


Return values:

| Name | Type    | Description                            |
| :--- | :------ | :------------------------------------- |
| [0]  | address | The address of the venn fee recipient. |

### attestationCenter (0xd92807a2)

```solidity
function attestationCenter() external view returns (IAttestationCenter)
```

Get the attestation center.


Return values:

| Name | Type                        | Description                            |
| :--- | :-------------------------- | :------------------------------------- |
| [0]  | contract IAttestationCenter | The address of the attestation center. |

### vennDetectionFee (0x76b11605)

```solidity
function vennDetectionFee() external view returns (uint256)
```

Get the venn detection fee. Base 1_000_000.


Return values:

| Name | Type    | Description                   |
| :--- | :------ | :---------------------------- |
| [0]  | uint256 | The fee for a venn detection. |

### vennProtocolFee (0x251eb228)

```solidity
function vennProtocolFee() external view returns (uint256)
```

Get the venn protocol fee. Base 1_000_000.


Return values:

| Name | Type    | Description                  |
| :--- | :------ | :--------------------------- |
| [0]  | uint256 | The fee for a venn protocol. |

### getProtocol (0x21027dc5)

```solidity
function getProtocol(
    address _policyAddress
) external view returns (IProtocolRegistry.Protocol memory)
```

Get the protocol struct for a policy address.


Parameters:

| Name           | Type    | Description                          |
| :------------- | :------ | :----------------------------------- |
| _policyAddress | address | The address of the policy contract.  |


Return values:

| Name | Type                              | Description                                 |
| :--- | :-------------------------------- | :------------------------------------------ |
| [0]  | struct IProtocolRegistry.Protocol | The protocol struct for the policy address. |

### getProtocolDetection (0xea29c4e8)

```solidity
function getProtocolDetection(
    address _detectionEscrow
) external view returns (IProtocolRegistry.ProtocolDetection memory)
```

Get the protocol detection struct for a detection escrow.


Parameters:

| Name             | Type    | Description                           |
| :--------------- | :------ | :------------------------------------ |
| _detectionEscrow | address | The address of the detection escrow.  |


Return values:

| Name | Type                                       | Description                                             |
| :--- | :----------------------------------------- | :------------------------------------------------------ |
| [0]  | struct IProtocolRegistry.ProtocolDetection | The protocol detection struct for the detection escrow. |
