# IApprovedCallsPolicy

## Overview

#### License: UNLICENSED

```solidity
interface IApprovedCallsPolicy
```


## Functions info

### approveCallsViaSignature (0x0c908cff)

```solidity
function approveCallsViaSignature(
    bytes32[] calldata _callHashes,
    uint256 _expiration,
    address _txOrigin,
    uint256 _nonce,
    bytes calldata _signature
) external
```

Approves a set of calls via a signature.


Parameters:

| Name        | Type      | Description                                  |
| :---------- | :-------- | :------------------------------------------- |
| _callHashes | bytes32[] | The hashes of the calls to approve.          |
| _expiration | uint256   | The expiration timestamp of the signature.   |
| _txOrigin   | address   | The address that initiated the transaction.  |
| _nonce      | uint256   | The nonce for the transaction.               |
| _signature  | bytes     | The signature of the transaction.            |
