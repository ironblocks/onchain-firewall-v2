# IDetectionEscrow

## Overview

#### License: UNLICENSED

```solidity
interface IDetectionEscrow
```


## Events info

### FundsWithdrawn

```solidity
event FundsWithdrawn(uint256 amount)
```

Emitted when funds are withdrawn.


Parameters:

| Name   | Type    | Description                        |
| :----- | :------ | :--------------------------------- |
| amount | uint256 | The amount of the funds withdrawn. |

### PaymentRequested

```solidity
event PaymentRequested(uint256 amount, string invoiceDetails)
```

Emitted when a payment is requested.


Parameters:

| Name           | Type    | Description                 |
| :------------- | :------ | :-------------------------- |
| amount         | uint256 | The amount of the payment.  |
| invoiceDetails | string  | The invoice details.        |

### PaymentApproved

```solidity
event PaymentApproved(uint256 amount)
```

Emitted when a payment is approved.


Parameters:

| Name   | Type    | Description                |
| :----- | :------ | :------------------------- |
| amount | uint256 | The amount of the payment. |

### PaymentSent

```solidity
event PaymentSent(uint256 amount)
```

Emitted when a payment is sent.


Parameters:

| Name   | Type    | Description                |
| :----- | :------ | :------------------------- |
| amount | uint256 | The amount of the payment. |

### VennFeeSent

```solidity
event VennFeeSent(uint256 amount)
```

Emitted when a venn fee is sent.


Parameters:

| Name   | Type    | Description                 |
| :----- | :------ | :-------------------------- |
| amount | uint256 | The amount of the venn fee. |

## Functions info

### approveClaimPayment (0x13a4eb81)

```solidity
function approveClaimPayment(uint256 _amount) external
```

Approve a claim payment.


Parameters:

| Name    | Type    | Description                |
| :------ | :------ | :------------------------- |
| _amount | uint256 | The amount of the payment. |

### withdrawFunds (0x155dd5ee)

```solidity
function withdrawFunds(uint256 _amount) external
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
) external
```

Initialize a claim payment.


Parameters:

| Name            | Type    | Description                 |
| :-------------- | :------ | :-------------------------- |
| _amount         | uint256 | The amount of the payment.  |
| _invoiceDetails | string  | The invoice details.        |

### initializeClaimPayment (0xf9f9729a)

```solidity
function initializeClaimPayment(uint256 _amount) external
```

Initialize a claim payment.


Parameters:

| Name    | Type    | Description                |
| :------ | :------ | :------------------------- |
| _amount | uint256 | The amount of the payment. |

### protocolRegistry (0x7656419f)

```solidity
function protocolRegistry() external view returns (IProtocolRegistry)
```

Get the protocol registry address.


Return values:

| Name | Type                       | Description                    |
| :--- | :------------------------- | :----------------------------- |
| [0]  | contract IProtocolRegistry | The protocol registry address. |

### operator (0x570ca735)

```solidity
function operator() external view returns (address payable)
```

Get the operator address.


Return values:

| Name | Type            | Description           |
| :--- | :-------------- | :-------------------- |
| [0]  | address payable | The operator address. |

### protocolAdmin (0x420f6861)

```solidity
function protocolAdmin() external view returns (address payable)
```

Get the protocol admin address.


Return values:

| Name | Type            | Description                 |
| :--- | :-------------- | :-------------------------- |
| [0]  | address payable | The protocol admin address. |

### pendingOperatorPayment (0xfa8459dc)

```solidity
function pendingOperatorPayment() external view returns (uint256)
```

Get the pending operator payment.


Return values:

| Name | Type    | Description                   |
| :--- | :------ | :---------------------------- |
| [0]  | uint256 | The pending operator payment. |
