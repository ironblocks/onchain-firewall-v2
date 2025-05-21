# ERC4626Upgradeable

## Overview

#### License: MIT

```solidity
abstract contract ERC4626Upgradeable is Initializable, ERC20Upgradeable, IERC4626Upgradeable
```

Implementation of the ERC4626 "Tokenized Vault Standard" as defined in
https://eips.ethereum.org/EIPS/eip-4626[EIP-4626].

This extension allows the minting and burning of "shares" (represented using the ERC20 inheritance) in exchange for
underlying "assets" through standardized {deposit}, {mint}, {redeem} and {burn} workflows. This contract extends
the ERC20 standard. Any additional extensions included along it would affect the "shares" token represented by this
contract and not the "assets" token which is an independent contract.

[CAUTION]
====
In empty (or nearly empty) ERC-4626 vaults, deposits are at high risk of being stolen through frontrunning
with a "donation" to the vault that inflates the price of a share. This is variously known as a donation or inflation
attack and is essentially a problem of slippage. Vault deployers can protect against this attack by making an initial
deposit of a non-trivial amount of the asset, such that price manipulation becomes infeasible. Withdrawals may
similarly be affected by slippage. Users can protect against this attack as well as unexpected slippage in general by
verifying the amount received is as expected, using a wrapper that performs these checks such as
https://github.com/fei-protocol/ERC4626#erc4626router-and-base[ERC4626Router].

Since v4.9, this implementation uses virtual assets and shares to mitigate that risk. The `_decimalsOffset()`
corresponds to an offset in the decimal representation between the underlying asset's decimals and the vault
decimals. This offset also determines the rate of virtual shares to virtual assets in the vault, which itself
determines the initial exchange rate. While not fully preventing the attack, analysis shows that the default offset
(0) makes it non-profitable, as a result of the value being captured by the virtual shares (out of the attacker's
donation) matching the attacker's expected gains. With a larger offset, the attack becomes orders of magnitude more
expensive than it is profitable. More details about the underlying math can be found
xref:erc4626.adoc#inflation-attack[here].

The drawback of this approach is that the virtual shares do capture (a very small) part of the value being accrued
to the vault. Also, if the vault experiences losses, the users try to exit the vault, the virtual shares and assets
will cause the first user to exit to experience reduced losses in detriment to the last users that will experience
bigger losses. Developers willing to revert back to the pre-v4.9 behavior just need to override the
`_convertToShares` and `_convertToAssets` functions.

To learn more, check out our xref:ROOT:erc4626.adoc[ERC-4626 guide].
====

_Available since v4.7._
## Functions info

### decimals (0x313ce567)

```solidity
function decimals() public view virtual override returns (uint8)
```

Decimals are computed by adding the decimal offset on top of the underlying asset's decimals. This
"original" value is cached during construction of the vault contract. If this read operation fails (e.g., the
asset has not been created yet), a default of 18 is used to represent the underlying asset's decimals.

See {IERC20Metadata-decimals}.
### asset (0x38d52e0f)

```solidity
function asset() public view virtual override returns (address)
```

See {IERC4626-asset}.
### totalAssets (0x01e1d114)

```solidity
function totalAssets() public view virtual override returns (uint256)
```

See {IERC4626-totalAssets}.
### convertToShares (0xc6e6f592)

```solidity
function convertToShares(
    uint256 assets
) public view virtual override returns (uint256)
```

See {IERC4626-convertToShares}.
### convertToAssets (0x07a2d13a)

```solidity
function convertToAssets(
    uint256 shares
) public view virtual override returns (uint256)
```

See {IERC4626-convertToAssets}.
### maxDeposit (0x402d267d)

```solidity
function maxDeposit(address) public view virtual override returns (uint256)
```

See {IERC4626-maxDeposit}.
### maxMint (0xc63d75b6)

```solidity
function maxMint(address) public view virtual override returns (uint256)
```

See {IERC4626-maxMint}.
### maxWithdraw (0xce96cb77)

```solidity
function maxWithdraw(
    address owner
) public view virtual override returns (uint256)
```

See {IERC4626-maxWithdraw}.
### maxRedeem (0xd905777e)

```solidity
function maxRedeem(
    address owner
) public view virtual override returns (uint256)
```

See {IERC4626-maxRedeem}.
### previewDeposit (0xef8b30f7)

```solidity
function previewDeposit(
    uint256 assets
) public view virtual override returns (uint256)
```

See {IERC4626-previewDeposit}.
### previewMint (0xb3d7f6b9)

```solidity
function previewMint(
    uint256 shares
) public view virtual override returns (uint256)
```

See {IERC4626-previewMint}.
### previewWithdraw (0x0a28a477)

```solidity
function previewWithdraw(
    uint256 assets
) public view virtual override returns (uint256)
```

See {IERC4626-previewWithdraw}.
### previewRedeem (0x4cdad506)

```solidity
function previewRedeem(
    uint256 shares
) public view virtual override returns (uint256)
```

See {IERC4626-previewRedeem}.
### deposit (0x6e553f65)

```solidity
function deposit(
    uint256 assets,
    address receiver
) public virtual override returns (uint256)
```

See {IERC4626-deposit}.
### mint (0x94bf804d)

```solidity
function mint(
    uint256 shares,
    address receiver
) public virtual override returns (uint256)
```

See {IERC4626-mint}.

As opposed to {deposit}, minting is allowed even if the vault is in a state where the price of a share is zero.
In this case, the shares will be minted without requiring any assets to be deposited.
### withdraw (0xb460af94)

```solidity
function withdraw(
    uint256 assets,
    address receiver,
    address owner
) public virtual override returns (uint256)
```

See {IERC4626-withdraw}.
### redeem (0xba087652)

```solidity
function redeem(
    uint256 shares,
    address receiver,
    address owner
) public virtual override returns (uint256)
```

See {IERC4626-redeem}.