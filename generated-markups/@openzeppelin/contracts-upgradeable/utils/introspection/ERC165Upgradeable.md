# ERC165Upgradeable

## Overview

#### License: MIT

```solidity
abstract contract ERC165Upgradeable is Initializable, IERC165Upgradeable
```

Implementation of the {IERC165} interface.

Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
for the additional interface id that will be supported. For example:

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
}
```

Alternatively, {ERC165Storage} provides an easier to use but more expensive implementation.
## Functions info

### supportsInterface (0x01ffc9a7)

```solidity
function supportsInterface(
    bytes4 interfaceId
) public view virtual override returns (bool)
```

See {IERC165-supportsInterface}.