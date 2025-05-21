# SafeERC20Upgradeable

## Overview

#### License: MIT

```solidity
library SafeERC20Upgradeable
```

Wrappers around ERC20 operations that throw on failure (when the token
contract returns false). Tokens that return no value (and instead revert or
throw on failure) are also supported, non-reverting calls are assumed to be
successful.
To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
## Functions info

### safeTransfer

```solidity
function safeTransfer(
    IERC20Upgradeable token,
    address to,
    uint256 value
) internal
```

Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
non-reverting calls are assumed to be successful.
### safeTransferFrom

```solidity
function safeTransferFrom(
    IERC20Upgradeable token,
    address from,
    address to,
    uint256 value
) internal
```

Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
### safeApprove

```solidity
function safeApprove(
    IERC20Upgradeable token,
    address spender,
    uint256 value
) internal
```

Deprecated. This function has issues similar to the ones found in
{IERC20-approve}, and its usage is discouraged.

Whenever possible, use {safeIncreaseAllowance} and
{safeDecreaseAllowance} instead.
### safeIncreaseAllowance

```solidity
function safeIncreaseAllowance(
    IERC20Upgradeable token,
    address spender,
    uint256 value
) internal
```

Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
non-reverting calls are assumed to be successful.
### safeDecreaseAllowance

```solidity
function safeDecreaseAllowance(
    IERC20Upgradeable token,
    address spender,
    uint256 value
) internal
```

Decrease the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
non-reverting calls are assumed to be successful.
### forceApprove

```solidity
function forceApprove(
    IERC20Upgradeable token,
    address spender,
    uint256 value
) internal
```

Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
to be set to zero before setting it to a non-zero value, such as USDT.
### safePermit

```solidity
function safePermit(
    IERC20PermitUpgradeable token,
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) internal
```

Use a ERC-2612 signature to set the `owner` approval toward `spender` on `token`.
Revert on invalid signature.