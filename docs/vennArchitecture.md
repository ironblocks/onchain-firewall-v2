# Venn Architecture

## Overview

**Venn** is a decentralized security infrastructure that protects decentralized applications (dApps) from malicious transactions. By combining **offchain transaction validation** with **onchain security policy enforcement**, Venn establishes a powerful, adaptive security layer for the Web3 ecosystem.

## Core Architecture

Venn is built on a **security-via-restaking** mechanism, leveraging **EigenLayer** as its foundational infrastructure. This design provides:

- **Stronger security** through economic incentives and aligned interests
- **Scalable validation** by offloading compute-heavy tasks offchain
- **Efficient resource usage** while preserving trustless guarantees
- **Flexible integration** with existing Web3 applications

## Key Components

### 1. Protocols

**Protocols** are dApps that integrate with Venn to enhance their security. They gain:

- **Customizable Security**

  - Protocol-specific security policies
  - Flexible policy enforcement mechanisms
  - Adaptive threat detection rules

- **Validation Capabilities**

  - Real-time transaction validation
  - Offchain analysis and verification

- **Integration Benefits**
  - Seamless Web3 infrastructure integration
  - Minimal protocol modifications required
  - Transparent security layer

For information about protocols and their integration, see [Protocols](./protocols.md).

### 2. Operators

**Operators** power Venn's offchain network. Their responsibilities include:

- **Validation Services**

  - Offchain compute resource contribution
  - Transaction analysis custom logic
  - Real-time validation processing

- **Economic Incentives**

  - Fee-based reward system
  - Stake-based security guarantees

- **Network Participation**
  - Operator registration and management
  - Subnet subscription and operation

For operator-related information, see [Operators](./operators.md).

### 3. Subnets

**Subnets** are specialized networks within Venn that focus on specific security domains. They provide:

- **Domain Specialization**

  - Focused security validation
  - Custom operator sets

- **Fee Management**

  - Subnet-level fee configuration
  - Operator reward distribution
  - Transparent fee tracking

- **Integration Features**
  - Protocol subscription management
  - Operator selection and management

For fee management details, see [Fee Management](./feeManagement.md).

## System Interactions

### Protocol-Operator Relationship

- Protocols does not manage operators directly
- Protocols and operators are connected through subnets
- Operators validate transactions, which are then reported to the protocol
- Fee-based incentive alignment

### Operator-Subnet Relationship

- Operators join specific subnets
- Operators can join multiple subnets
- Subnets manage operator sets

### Protocol-Subnet Relationship

- Protocols subscribe to subnets
- Protocols can subscribe to multiple subnets
- Subnets can have multiple protocols
- Protocols can prepay the fee for the protocol
