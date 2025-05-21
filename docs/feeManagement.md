# Fee Management System

## Overview

The Fee Management System is a critical component of the protocol that encourages operators to validate transactions while ensuring sustainable protocol economics. It handles the collection of fees from consumers and their subsequent distribution to various stakeholders.

## Architecture

The system consists of three main components:

1. **Fee Collection** - Collects the fee from the consumer
2. **Fee Calculation** - Calculates the fee amount and distribution ratios
3. **Fee Distribution** - Distributes the fee to the stakeholders

## Fee Calculation

The `VennFeeCalculator` contract is responsible for determining the fee amounts and distribution ratios. Key features include:

- Configurable fee amounts per subnet
- Adjustable distribution percentages for:
  - Operators (validators)
  - Protocol treasuries
- Admin-controlled parameters for flexibility

## Fee Collection and Distribution Flow

1. **Collection**:

   - Fees are collected from consumers during transaction submission
   - Amount is calculated based on subnet-specific parameters

2. **Calculation**:

   - The fee amount and distribution ratios are calculated

3. **Distribution**:
   - Distribution occurs within the same transaction as collection
   - Funds are automatically allocated according to configured percentages
   - Transparent and verifiable on-chain
