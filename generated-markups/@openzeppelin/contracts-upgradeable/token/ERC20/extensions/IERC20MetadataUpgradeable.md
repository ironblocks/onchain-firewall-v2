# IERC20MetadataUpgradeable

## Overview

#### License: MIT

```solidity
interface IERC20MetadataUpgradeable is IERC20Upgradeable
```

Interface for the optional metadata functions from the ERC20 standard.

_Available since v4.1._
## Functions info

### name (0x06fdde03)

```solidity
function name() external view returns (string memory)
```

Returns the name of the token.
### symbol (0x95d89b41)

```solidity
function symbol() external view returns (string memory)
```

Returns the symbol of the token.
### decimals (0x313ce567)

```solidity
function decimals() external view returns (uint8)
```

Returns the decimals places of the token.