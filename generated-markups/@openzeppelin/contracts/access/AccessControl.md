# AccessControl

## Overview

#### License: MIT

```solidity
abstract contract AccessControl is Context, IAccessControl, ERC165
```

Contract module that allows children to implement role-based access
control mechanisms. This is a lightweight version that doesn't allow enumerating role
members except through off-chain means by accessing the contract event logs. Some
applications may benefit from on-chain enumerability, for those cases see
{AccessControlEnumerable}.

Roles are referred to by their `bytes32` identifier. These should be exposed
in the external API and be unique. The best way to achieve this is by
using `public constant` hash digests:

```solidity
bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
```

Roles can be used to represent a set of permissions. To restrict access to a
function call, use {hasRole}:

```solidity
function foo() public {
    require(hasRole(MY_ROLE, msg.sender));
    ...
}
```

Roles can be granted and revoked dynamically via the {grantRole} and
{revokeRole} functions. Each role has an associated admin role, and only
accounts that have a role's admin role can call {grantRole} and {revokeRole}.

By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
that only accounts with this role will be able to grant or revoke other
roles. More complex role relationships can be created by using
{_setRoleAdmin}.

WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
grant and revoke this role. Extra precautions should be taken to secure
accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
to enforce additional security measures for this role.
## Structs info

### RoleData

```solidity
struct RoleData {
	mapping(address => bool) members;
	bytes32 adminRole;
}
```


## Constants info

### DEFAULT_ADMIN_ROLE (0xa217fddf)

```solidity
bytes32 constant DEFAULT_ADMIN_ROLE = 0x00
```


## Modifiers info

### onlyRole

```solidity
modifier onlyRole(bytes32 role)
```

Modifier that checks that an account has a specific role. Reverts
with a standardized message including the required role.

The format of the revert reason is given by the following regular expression:

/^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/

_Available since v4.1._
## Functions info

### supportsInterface (0x01ffc9a7)

```solidity
function supportsInterface(
    bytes4 interfaceId
) public view virtual override returns (bool)
```

See {IERC165-supportsInterface}.
### hasRole (0x91d14854)

```solidity
function hasRole(
    bytes32 role,
    address account
) public view virtual override returns (bool)
```

Returns `true` if `account` has been granted `role`.
### getRoleAdmin (0x248a9ca3)

```solidity
function getRoleAdmin(
    bytes32 role
) public view virtual override returns (bytes32)
```

Returns the admin role that controls `role`. See {grantRole} and
{revokeRole}.

To change a role's admin, use {_setRoleAdmin}.
### grantRole (0x2f2ff15d)

```solidity
function grantRole(
    bytes32 role,
    address account
) public virtual override onlyRole(getRoleAdmin(role))
```

Grants `role` to `account`.

If `account` had not been already granted `role`, emits a {RoleGranted}
event.

Requirements:

- the caller must have ``role``'s admin role.

May emit a {RoleGranted} event.
### revokeRole (0xd547741f)

```solidity
function revokeRole(
    bytes32 role,
    address account
) public virtual override onlyRole(getRoleAdmin(role))
```

Revokes `role` from `account`.

If `account` had been granted `role`, emits a {RoleRevoked} event.

Requirements:

- the caller must have ``role``'s admin role.

May emit a {RoleRevoked} event.
### renounceRole (0x36568abe)

```solidity
function renounceRole(bytes32 role, address account) public virtual override
```

Revokes `role` from the calling account.

Roles are often managed via {grantRole} and {revokeRole}: this function's
purpose is to provide a mechanism for accounts to lose their privileges
if they are compromised (such as when a trusted device is misplaced).

If the calling account had been revoked `role`, emits a {RoleRevoked}
event.

Requirements:

- the caller must be `account`.

May emit a {RoleRevoked} event.