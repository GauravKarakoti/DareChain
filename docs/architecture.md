
# Submit Proof
```solidity
function submitProof(uint256 _dareId, string memory _proofCID) external
```

# Complete Dare

```solidity
function completeDare(uint256 _dareId, bool _success) external
```

## RewardDistribution.sol 

This handles all reward distribution logic

```solidity
function distributeDareRewards(
    uint256 _dareId,
    address _creator,
    address _winner,
    uint256 _reward,
    bool _success
) external returns (uint256, uint256)
```

## Distribute betting rewards

- Distributed betting winnings which includes creator fees (2% from the losing pool)

```solidity
function distributeBettingRewards(
    uint256 _dareId,
    address _creator,
    uint256 _totalLosingPool,
    uint256 _totalWinningPool,
    address _better,
    uint256 _betAmount,
    uint256 _winnings
) external returns (uint256)
```
# Claim Creator Earnings

```solidity
function claimCreatorEarnings() external
```
This function allows creator to claim their accumulated fees from betting

## BettingPool.sol

Manages betting for individual dares
```solidity
function placeBet(uint256 _amount, bool _vote) external
```

- places a bet on dare outcome
- vote = True for success, False for failure

## Calculate winnings
 Calculates potential winnings for a better 

 ```solidity 
 function calculateWinnings(address _better) public view returns (uint256)
 ```

 ## Claim Winnings

 Claim winnings after dare completion

 ```Solidity
function claimWinnings() external
```
---

# PYUSD Integration 
## Token Approval

Before any approval, user must approve the contract to spend PYUSD:
```javascript
await pyusdToken.approve(darexAddress, amount);
```
## Token Transfers

- Dares: PYUSD transferred from creator to contract
- Bets: PYUSD transferred from better to betting pool
- Rewards: PYUSD distributed to winners
---

# Identity Verification
## Self Protocol Integration
Self Protocol Integration

```solidity
modifier onlyVerified() {
    require(selfProtocol.verifyIdentity(msg.sender), "Identity not verified");
    _;
}
```
---
# Fee Structure

## Platform Fees

- Dare Creation: 0.5% of reward amount
- Betting: 2% creator fee from losing pool

## Fee Distribution

- Platform fees go to treasury
- Creator fees accumulate and can be claimed

---

# Error Handling
## Common Errors

- "Identity not verified": User not verified with Self Protocol
- "Dare does not exist": Invalid dare ID
- "Dare expired": Action attempted after deadline
- "PYUSD transfer failed": Token transfer issue
---

# Security Features

- Reentrancy protection
- Access controls
- Input validation
- Emergency withdrawal functions
---
# Contract Architecture

## Deployment Order

1. MockPYUSD (if not using mainnet PYUSD)
2. MockSelfProtocol (if not using mainnet Self Protocol)
3. RewardDistribution
4. darex

## Constructor Parameters
darex Constructor:
```javascript
constructor(
    address _pyusd,        // PYUSD token address
    address _selfProtocol, // Self Protocol address
    address _treasury      // Treasury address for fees
)
```

## Core Components

### 1. Smart Contract Layer

#### darex (Main Contract)
- **Purpose**: Orchestrates the entire platform
- **Responsibilities**:
  - Dare creation and management
  - User identity verification
  - Betting pool creation
  - Cross-contract communication

#### RewardDistribution Contract
- **Purpose**: Handles all financial transactions
- **Responsibilities**:
  - Dare reward distribution
  - Betting winnings calculation
  - Fee collection and distribution
  - Earnings claiming

#### BettingPool Contract
- **Purpose**: Manages individual dare betting
- **Responsibilities**:
  - Bet placement and tracking
  - Winnings calculation
  - Pool management per dare

### 2. External Integrations

#### PYUSD Stablecoin
- **Role**: Primary currency for all transactions
- **Usage**:
  - Dare rewards
  - Betting amounts
  - Fee payments

#### Self Protocol
- **Role**: Identity verification service
- **Usage**:
  - User verification before participation
  - Reputation system foundation

#### Filecoin Storage
- **Role**: Decentralized proof storage
- **Usage**:
  - Store photo/video proofs
  - Immutable evidence storage

## Data Flow

### Dare Creation Flow
1. User verifies identity via Self Protocol
2. User approves PYUSD spending for dare reward
3. darex creates new dare and betting pool
4. PYUSD reward locked in contract

### Proof Submission Flow
1. Participant verifies identity
2. Participant uploads proof to Filecoin
3. Participant submits Filecoin CID to darex
4. Betting becomes available

### Betting Flow
1. Better verifies identity
2. Better approves PYUSD spending for bet
3. Better places bet in specific BettingPool
4. Bet amount locked until dare completion

### Completion Flow
1. Dare deadline passes
2. Creator or anyone completes the dare
3. RewardDistribution handles payout
4. BettingPool resolves and allows claims

## Security Architecture

### 1. Access Control
- **Identity Verification**: All participants must be verified
- **Role-Based Access**: Different permissions for creators, participants, bettors
- **Ownership Controls**: Admin functions restricted to owner

### 2. Financial Security
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Funds Segregation**: Separate contracts for different financial operations
- **Emergency Withdrawals**: Admin can recover funds in emergencies

### 3. Data Integrity
- **Immutable Records**: All actions recorded on blockchain
- **Proof Storage**: Decentralized storage for tamper-proof evidence
- **Transparent Operations**: All transactions visible on blockchain