# DareFi Smart Contracts

Simplified decentralized dare platform smart contracts for World Chain.

## Contracts

### Core Contracts
- **DareFiCore.sol**: Main dare management contract with ETH rewards
- **WorldIDVerification.sol**: Base contract for World ID human verification

### Interfaces
- **IWorldID.sol**: World ID interface for verification

### Tests & Mocks
- **DareFiCore.t.sol**: Comprehensive tests for the main contract
- **MockWorldID.sol**: Mock World ID contract for testing

## Features

- ✅ Create dares with ETH deposits
- ✅ Submit text-based proof of completion
- ✅ Creator approval system (no complex voting)
- ✅ Direct ETH reward claiming
- ✅ World ID verification for sybil resistance
- ✅ Emergency cancel function for creators

## Usage

### Install Dependencies
```shell
forge install
```

### Build
```shell
forge build
```

### Test
```shell
forge test
```

### Deploy to World Chain Sepolia
```shell
# Set environment variables
export PRIVATE_KEY="your_private_key_here"
export WORLD_ID_ADDRESS="0x11cA3127182f7583EfC416a8771BD4d11Fae4334"

# Deploy
forge script script/DeployDareFiCore.s.sol --rpc-url worldchain-sepolia --broadcast --verify
```

### Deploy to World Chain Mainnet
```shell
# Set environment variables  
export PRIVATE_KEY="your_private_key_here"
export WORLD_ID_ADDRESS="0x163b09b4fE21177c455D850BD815B6D583732432"

# Deploy
forge script script/DeployDareFiCore.s.sol --rpc-url worldchain --broadcast --verify
```

## Architecture

The contracts follow a simple, secure pattern:

1. **World ID Verification**: All participants must verify as human
2. **Dare Creation**: Users deposit ETH to create challenges
3. **Proof Submission**: Verified humans submit text proofs
4. **Direct Approval**: Dare creators approve winning submissions
5. **Reward Claiming**: Winners claim ETH rewards

## Security Features

- ReentrancyGuard protection on all payable functions
- World ID verification prevents sybil attacks
- Nullifier hash prevents double verification
- Emergency cancel function for creators
- Time-based deadline enforcement
