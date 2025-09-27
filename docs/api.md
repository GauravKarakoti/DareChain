# darex API Documentation

## Overview

darex is a decentralized truth and dare platform with integrated betting mechanics. This document describes the smart contract APIs.

## Contract Addresses

- **darex**: `0x...` (Main contract)
- **RewardDistribution**: `0x...` (Handles reward distribution)
- **BettingPool**: `0x...` (Per-dare betting pool)
- **PYUSD**: `0x...` (Stablecoin for transactions)
- **SelfProtocol**: `0x...` (Identity verification)

## Core Contracts

### darex.sol

Main contract that orchestrates the entire platform.

#### Key Functions

**createDare**
```solidity
function createDare(
    string memory _title,
    string memory _description,
    uint256 _reward,
    uint256 _deadline
) external```

### Submit Proof
```solidity
function submitProof(uint256 _dareId, string memory _proofCID) external```

### Complete dare

```solidity
function completeDare(uint256 _dareId, bool _success) external```