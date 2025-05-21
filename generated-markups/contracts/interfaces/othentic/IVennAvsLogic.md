# IVennAvsLogic

## Overview

#### License: UNLICENSED

```solidity
interface IVennAvsLogic is IAvsLogicBase
```

Interface for the VennAvsLogic contract.
## Events info

### FeePoolUpdated

```solidity
event FeePoolUpdated(address newFeePool)
```

Emitted when the fee pool is updated.


Parameters:

| Name       | Type    | Description       |
| :--------- | :------ | :---------------- |
| newFeePool | address | The new fee pool. |

### ProtocolRegistryUpdated

```solidity
event ProtocolRegistryUpdated(address newProtocolRegistry)
```

Emitted when the protocol registry is updated


Parameters:

| Name                | Type    | Description                |
| :------------------ | :------ | :------------------------- |
| newProtocolRegistry | address | The new protocol registry. |

## Functions info

### setFeePool (0x19db2228)

```solidity
function setFeePool(address _feePool) external
```

Set the fee pool address


Parameters:

| Name     | Type    | Description           |
| :------- | :------ | :-------------------- |
| _feePool | address | The fee pool address. |

### setProtocolRegistry (0x3e22119d)

```solidity
function setProtocolRegistry(address _protocolRegistry) external
```

Set the protocol registry address


Parameters:

| Name              | Type    | Description                    |
| :---------------- | :------ | :----------------------------- |
| _protocolRegistry | address | The protocol registry address. |

### feePool (0xae2e933b)

```solidity
function feePool() external view returns (IFeePool)
```

Get the fee pool address


Return values:

| Name | Type              | Description           |
| :--- | :---------------- | :-------------------- |
| [0]  | contract IFeePool | The fee pool address. |

### protocolRegistry (0x7656419f)

```solidity
function protocolRegistry() external view returns (IProtocolRegistry)
```

Get the protocol registry address


Return values:

| Name | Type                       | Description                    |
| :--- | :------------------------- | :----------------------------- |
| [0]  | contract IProtocolRegistry | The protocol registry address. |
