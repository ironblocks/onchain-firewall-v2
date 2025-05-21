# DetectionEscrow

## Overview

#### License: UNLICENSED

```solidity
contract DetectionEscrow is IDetectionEscrow
```


## State variables info

### protocolRegistry (0x7656419f)

```solidity
contract IProtocolRegistry protocolRegistry
```

Get the protocol registry address.


Return values:

| Name | Type                       | Description                    |
| :--- | :------------------------- | :----------------------------- |
| [0]  | contract IProtocolRegistry | The protocol registry address. |

### operator (0x570ca735)

```solidity
address payable operator
```

Get the operator address.


Return values:

| Name | Type            | Description           |
| :--- | :-------------- | :-------------------- |
| [0]  | address payable | The operator address. |

### protocolAdmin (0x420f6861)

```solidity
address payable protocolAdmin
```

Get the protocol admin address.


Return values:

| Name | Type            | Description                 |
| :--- | :-------------- | :-------------------------- |
| [0]  | address payable | The protocol admin address. |

### pendingOperatorPayment (0xfa8459dc)

```solidity
uint256 pendingOperatorPayment
```

Get the pending operator payment.


Return values:

| Name | Type    | Description                   |
| :--- | :------ | :---------------------------- |
| [0]  | uint256 | The pending operator payment. |

## Modifiers info

### onlyOperator

```solidity
modifier onlyOperator()
```


### onlyProtocolAdmin

```solidity
modifier onlyProtocolAdmin()
```


## Functions info

### constructor

```solidity
constructor(
    address _protocolRegistry,
    address _protocolAdmin,
    address _operator
)
```


### approveClaimPayment (0x13a4eb81)

```solidity
function approveClaimPayment(uint256 _amount) external onlyProtocolAdmin
```

Approve a claim payment.


Parameters:

| Name    | Type    | Description                |
| :------ | :------ | :------------------------- |
| _amount | uint256 | The amount of the payment. |

### withdrawFunds (0x155dd5ee)

```solidity
function withdrawFunds(uint256 _amount) external onlyProtocolAdmin
```

Withdraw funds.


Parameters:

| Name    | Type    | Description                          |
| :------ | :------ | :----------------------------------- |
| _amount | uint256 | The amount of the funds to withdraw. |

### initializeClaimPayment (0xd66247c5)

```solidity
function initializeClaimPayment(
    uint256 _amount,
    string memory _invoiceDetails
) public onlyOperator
```

Initialize a claim payment.


Parameters:

| Name            | Type    | Description                 |
| :-------------- | :------ | :-------------------------- |
| _amount         | uint256 | The amount of the payment.  |
| _invoiceDetails | string  | The invoice details.        |

### initializeClaimPayment (0xf9f9729a)

```solidity
function initializeClaimPayment(uint256 _amount) external onlyOperator
```

Initialize a claim payment.


Parameters:

| Name    | Type    | Description                |
| :------ | :------ | :------------------------- |
| _amount | uint256 | The amount of the payment. |

### receive

```solidity
receive() external payable
```

