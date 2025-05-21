# IAccessControlUpgradeable

## Overview

#### License: MIT

```solidity
interface IAccessControlUpgradeable
```

External interface of AccessControl declared to support ERC165 detection.
## Events info

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```

Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`

`DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
{RoleAdminChanged} not being emitted signaling this.

_Available since v3.1._
### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```

Emitted when `account` is granted `role`.

`sender` is the account that originated the contract call, an admin role
bearer except when using {AccessControl-_setupRole}.
### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```

Emitted when `account` is revoked `role`.

`sender` is the account that originated the contract call:
- if using `revokeRole`, it is the admin role bearer
- if using `renounceRole`, it is the role bearer (i.e. `account`)
## Functions info

### hasRole (0x91d14854)

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

Returns `true` if `account` has been granted `role`.
### getRoleAdmin (0x248a9ca3)

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

Returns the admin role that controls `role`. See {grantRole} and
{revokeRole}.

To change a role's admin, use {AccessControl-_setRoleAdmin}.
### grantRole (0x2f2ff15d)

```solidity
function grantRole(bytes32 role, address account) external
```

Grants `role` to `account`.

If `account` had not been already granted `role`, emits a {RoleGranted}
event.

Requirements:

- the caller must have ``role``'s admin role.
### revokeRole (0xd547741f)

```solidity
function revokeRole(bytes32 role, address account) external
```

Revokes `role` from `account`.

If `account` had been granted `role`, emits a {RoleRevoked} event.

Requirements:

- the caller must have ``role``'s admin role.
### renounceRole (0x36568abe)

```solidity
function renounceRole(bytes32 role, address account) external
```

Revokes `role` from the calling account.

Roles are often managed via {grantRole} and {revokeRole}: this function's
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).

If the calling account had been granted `role`, emits a {RoleRevoked}
event.

Requirements:

- the caller must be `account`.