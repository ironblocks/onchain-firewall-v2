# Protocols

## Overview

Protocols are the core components of the Venn network, representing decentralized applications that integrate with Venn to enhance their security. The protocol system provides a robust framework for managing protocol-wide configurations, policies, and security measures.

For more information about the overall architecture, see [Venn Architecture](./vennArchitecture.md).

## Core Components

### Protocol Registry

The Protocol Registry serves as the central management system for protocol-related operations. It provides the following functionality:

- **Protocol Management**

  - Protocol registration and updates
  - Metadata management

- **Subnet Integration**
  - Subnet subscription and management
  - Operator requirements configuration
  - Veto mechanism for operator selection

## Protocol Lifecycle

### 1. Setup Phase

- Deploy Venn Policy contract
- Configure DApp for Venn integration
- Define security requirements

### 2. Registration Phase

- Submit protocol metadata
- Complete protocol registration

### 3. Integration Phase

- Subscribe to appropriate subnets
- Prepay the fee for the protocol (optional)

## Protocol-Policy Relationship

The relationship between protocols and policies is fundamental to Venn's architecture:

- **Policy Abstraction**

  - Policy represents decentralized applications
  - Venn operates through policies, not directly with protocols
  - Policy address serves as the protocol identifier

- **Admin Responsibilities**
  - Deploy and configure Venn Policy
  - Associate protocol address with policy address
  - Manage protocol-wide settings

## Fee Management

Protocols interact with the fee management system through subnets:

- **Fee Configuration**

  - Fees are set at the subnet level
  - Protocol admins select appropriate subnets
  - No direct protocol-level fee configuration

- **Integration Points**
  - Subnet selection affects fee structure
  - Fee distribution through subnet operators
  - Transparent fee tracking and management

For detailed information about fee management, refer to the [Fee Management](./feeManagement.md) documentation.
