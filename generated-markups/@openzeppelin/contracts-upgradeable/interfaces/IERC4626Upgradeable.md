# IERC4626Upgradeable

## Overview

#### License: MIT

```solidity
interface IERC4626Upgradeable is IERC20Upgradeable, IERC20MetadataUpgradeable
```

Interface of the ERC4626 "Tokenized Vault Standard", as defined in
https://eips.ethereum.org/EIPS/eip-4626[ERC-4626].

_Available since v4.7._
## Events info

### Deposit

```solidity
event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)
```


### Withdraw

```solidity
event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)
```


## Functions info

### asset (0x38d52e0f)

```solidity
function asset() external view returns (address assetTokenAddress)
```

Returns the address of the underlying token used for the Vault for accounting, depositing, and withdrawing.

- MUST be an ERC-20 token contract.
- MUST NOT revert.
### totalAssets (0x01e1d114)

```solidity
function totalAssets() external view returns (uint256 totalManagedAssets)
```

Returns the total amount of the underlying asset that is “managed” by Vault.

- SHOULD include any compounding that occurs from yield.
- MUST be inclusive of any fees that are charged against assets in the Vault.
- MUST NOT revert.
### convertToShares (0xc6e6f592)

```solidity
function convertToShares(uint256 assets) external view returns (uint256 shares)
```

Returns the amount of shares that the Vault would exchange for the amount of assets provided, in an ideal
scenario where all the conditions are met.

- MUST NOT be inclusive of any fees that are charged against assets in the Vault.
- MUST NOT show any variations depending on the caller.
- MUST NOT reflect slippage or other on-chain conditions, when performing the actual exchange.
- MUST NOT revert.

NOTE: This calculation MAY NOT reflect the “per-user” price-per-share, and instead should reflect the
“average-user’s” price-per-share, meaning what the average user should expect to see when exchanging to and
from.
### convertToAssets (0x07a2d13a)

```solidity
function convertToAssets(uint256 shares) external view returns (uint256 assets)
```

Returns the amount of assets that the Vault would exchange for the amount of shares provided, in an ideal
scenario where all the conditions are met.

- MUST NOT be inclusive of any fees that are charged against assets in the Vault.
- MUST NOT show any variations depending on the caller.
- MUST NOT reflect slippage or other on-chain conditions, when performing the actual exchange.
- MUST NOT revert.

NOTE: This calculation MAY NOT reflect the “per-user” price-per-share, and instead should reflect the
“average-user’s” price-per-share, meaning what the average user should expect to see when exchanging to and
from.
### maxDeposit (0x402d267d)

```solidity
function maxDeposit(address receiver) external view returns (uint256 maxAssets)
```

Returns the maximum amount of the underlying asset that can be deposited into the Vault for the receiver,
through a deposit call.

- MUST return a limited value if receiver is subject to some deposit limit.
- MUST return 2 ** 256 - 1 if there is no limit on the maximum amount of assets that may be deposited.
- MUST NOT revert.
### previewDeposit (0xef8b30f7)

```solidity
function previewDeposit(uint256 assets) external view returns (uint256 shares)
```

Allows an on-chain or off-chain user to simulate the effects of their deposit at the current block, given
current on-chain conditions.

- MUST return as close to and no more than the exact amount of Vault shares that would be minted in a deposit
call in the same transaction. I.e. deposit should return the same or more shares as previewDeposit if called
in the same transaction.
- MUST NOT account for deposit limits like those returned from maxDeposit and should always act as though the
deposit would be accepted, regardless if the user has enough tokens approved, etc.
- MUST be inclusive of deposit fees. Integrators should be aware of the existence of deposit fees.
- MUST NOT revert.

NOTE: any unfavorable discrepancy between convertToShares and previewDeposit SHOULD be considered slippage in
share price or some other type of condition, meaning the depositor will lose assets by depositing.
### deposit (0x6e553f65)

```solidity
function deposit(
    uint256 assets,
    address receiver
) external returns (uint256 shares)
```

Mints shares Vault shares to receiver by depositing exactly amount of underlying tokens.

- MUST emit the Deposit event.
- MAY support an additional flow in which the underlying tokens are owned by the Vault contract before the
deposit execution, and are accounted for during deposit.
- MUST revert if all of assets cannot be deposited (due to deposit limit being reached, slippage, the user not
approving enough underlying tokens to the Vault contract, etc).

NOTE: most implementations will require pre-approval of the Vault with the Vault’s underlying asset token.
### maxMint (0xc63d75b6)

```solidity
function maxMint(address receiver) external view returns (uint256 maxShares)
```

Returns the maximum amount of the Vault shares that can be minted for the receiver, through a mint call.
- MUST return a limited value if receiver is subject to some mint limit.
- MUST return 2 ** 256 - 1 if there is no limit on the maximum amount of shares that may be minted.
- MUST NOT revert.
### previewMint (0xb3d7f6b9)

```solidity
function previewMint(uint256 shares) external view returns (uint256 assets)
```

Allows an on-chain or off-chain user to simulate the effects of their mint at the current block, given
current on-chain conditions.

- MUST return as close to and no fewer than the exact amount of assets that would be deposited in a mint call
in the same transaction. I.e. mint should return the same or fewer assets as previewMint if called in the
same transaction.
- MUST NOT account for mint limits like those returned from maxMint and should always act as though the mint
would be accepted, regardless if the user has enough tokens approved, etc.
- MUST be inclusive of deposit fees. Integrators should be aware of the existence of deposit fees.
- MUST NOT revert.

NOTE: any unfavorable discrepancy between convertToAssets and previewMint SHOULD be considered slippage in
share price or some other type of condition, meaning the depositor will lose assets by minting.
### mint (0x94bf804d)

```solidity
function mint(
    uint256 shares,
    address receiver
) external returns (uint256 assets)
```

Mints exactly shares Vault shares to receiver by depositing amount of underlying tokens.

- MUST emit the Deposit event.
- MAY support an additional flow in which the underlying tokens are owned by the Vault contract before the mint
execution, and are accounted for during mint.
- MUST revert if all of shares cannot be minted (due to deposit limit being reached, slippage, the user not
approving enough underlying tokens to the Vault contract, etc).

NOTE: most implementations will require pre-approval of the Vault with the Vault’s underlying asset token.
### maxWithdraw (0xce96cb77)

```solidity
function maxWithdraw(address owner) external view returns (uint256 maxAssets)
```

Returns the maximum amount of the underlying asset that can be withdrawn from the owner balance in the
Vault, through a withdraw call.

- MUST return a limited value if owner is subject to some withdrawal limit or timelock.
- MUST NOT revert.
### previewWithdraw (0x0a28a477)

```solidity
function previewWithdraw(uint256 assets) external view returns (uint256 shares)
```

Allows an on-chain or off-chain user to simulate the effects of their withdrawal at the current block,
given current on-chain conditions.

- MUST return as close to and no fewer than the exact amount of Vault shares that would be burned in a withdraw
call in the same transaction. I.e. withdraw should return the same or fewer shares as previewWithdraw if
called
in the same transaction.
- MUST NOT account for withdrawal limits like those returned from maxWithdraw and should always act as though
the withdrawal would be accepted, regardless if the user has enough shares, etc.
- MUST be inclusive of withdrawal fees. Integrators should be aware of the existence of withdrawal fees.
- MUST NOT revert.

NOTE: any unfavorable discrepancy between convertToShares and previewWithdraw SHOULD be considered slippage in
share price or some other type of condition, meaning the depositor will lose assets by depositing.
### withdraw (0xb460af94)

```solidity
function withdraw(
    uint256 assets,
    address receiver,
    address owner
) external returns (uint256 shares)
```

Burns shares from owner and sends exactly assets of underlying tokens to receiver.

- MUST emit the Withdraw event.
- MAY support an additional flow in which the underlying tokens are owned by the Vault contract before the
withdraw execution, and are accounted for during withdraw.
- MUST revert if all of assets cannot be withdrawn (due to withdrawal limit being reached, slippage, the owner
not having enough shares, etc).

Note that some implementations will require pre-requesting to the Vault before a withdrawal may be performed.
Those methods should be performed separately.
### maxRedeem (0xd905777e)

```solidity
function maxRedeem(address owner) external view returns (uint256 maxShares)
```

Returns the maximum amount of Vault shares that can be redeemed from the owner balance in the Vault,
through a redeem call.

- MUST return a limited value if owner is subject to some withdrawal limit or timelock.
- MUST return balanceOf(owner) if owner is not subject to any withdrawal limit or timelock.
- MUST NOT revert.
### previewRedeem (0x4cdad506)

```solidity
function previewRedeem(uint256 shares) external view returns (uint256 assets)
```

Allows an on-chain or off-chain user to simulate the effects of their redeemption at the current block,
given current on-chain conditions.

- MUST return as close to and no more than the exact amount of assets that would be withdrawn in a redeem call
in the same transaction. I.e. redeem should return the same or more assets as previewRedeem if called in the
same transaction.
- MUST NOT account for redemption limits like those returned from maxRedeem and should always act as though the
redemption would be accepted, regardless if the user has enough shares, etc.
- MUST be inclusive of withdrawal fees. Integrators should be aware of the existence of withdrawal fees.
- MUST NOT revert.

NOTE: any unfavorable discrepancy between convertToAssets and previewRedeem SHOULD be considered slippage in
share price or some other type of condition, meaning the depositor will lose assets by redeeming.
### redeem (0xba087652)

```solidity
function redeem(
    uint256 shares,
    address receiver,
    address owner
) external returns (uint256 assets)
```

Burns exactly shares from owner and sends assets of underlying tokens to receiver.

- MUST emit the Withdraw event.
- MAY support an additional flow in which the underlying tokens are owned by the Vault contract before the
redeem execution, and are accounted for during redeem.
- MUST revert if all of shares cannot be redeemed (due to withdrawal limit being reached, slippage, the owner
not having enough shares, etc).

NOTE: some implementations will require pre-requesting to the Vault before a withdrawal may be performed.
Those methods should be performed separately.