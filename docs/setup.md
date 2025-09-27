# DareX Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Hardhat
- MetaMask or similar wallet

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/GauravKarakoti/darex.git
cd darex/contracts
```

### 2. Install Dependencies
```bash
npm i
```

### 3. Environment Configuration
```bash
cp .env.example .env
```
Edit your env with your settings

## Local Development

### 1. Start Local Blockchain
```bash
npx hardhat node
```
### 2. Deploy Contracts (in new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Run tests
```bash
npx hardhat test
```

### 4. Run Tests with Coverage
```bash 
npx hardhat coverage
```

## Testnet Deployment

### 1. Get Testnet PYUSD

For Sepolia testnet, get test PYUSD from:
PYUSD faucet (if available) Or deploy mock token

### 2. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Verify contracts
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```
