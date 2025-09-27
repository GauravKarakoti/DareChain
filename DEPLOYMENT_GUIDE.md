# DareFi Deployment Guide

## Overview
DareFi is a simplified decentralized dare platform built for World Chain that allows users to:
- Create dares with ETH rewards
- Submit proof of completion 
- Vote and claim rewards
- All interactions are secured with World ID verification

## Prerequisites
- Node.js and npm installed
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash` then `foundryup`)
- World ID app configured in the World developer portal
- Test ETH for World Chain Sepolia

## 1. Smart Contract Deployment

### Install Foundry (if not already installed)
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Deploy the Contract
```bash
cd contracts

# Set up environment variables
export PRIVATE_KEY="your_private_key_here"
export WORLD_ID_ADDRESS="0x11cA3127182f7583EfC416a8771BD4d11Fae4334" # World Chain Sepolia

# Deploy to World Chain Sepolia
forge script script/DeployDareFiCore.s.sol --rpc-url worldchain-sepolia --broadcast --verify
```

### Copy Contract Address
After deployment, copy the contract address from the output and update the following files:

1. **Frontend Components**: Update `DAREFI_CONTRACT_ADDRESS` in:
   - `/src/components/CreateDare/index.tsx`
   - `/src/components/DareList/index.tsx` 
   - `/src/components/SubmitProof/index.tsx`
   - `/src/components/ManageDares/index.tsx`
   - `/src/components/ClaimReward/index.tsx`

## 2. Frontend Configuration

### Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_WLD_CLIENT_ID=your_world_app_id
WLD_CLIENT_ID=your_world_app_id
WLD_CLIENT_SECRET=your_world_app_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### World ID Configuration
1. Go to [World Developer Portal](https://developer.worldcoin.org)
2. Create/configure your app
3. Add these Incognito Actions:
   - `create-dare`
   - `submit-proof`
   - `test-action`
4. Set verification level to Orb for production (Device for testing)

### Install Dependencies & Run
```bash
npm install
npm run dev
```

## 3. Contract Integration Steps

### Update Contract Address
Replace `0x...` with your deployed contract address in all component files:

```typescript
const DAREFI_CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### Update Environment Variables
Update the client app ID in components:
```typescript
app_id: process.env.NEXT_PUBLIC_WLD_CLIENT_ID as `app_${string}`,
```

## 4. Testing the Application

### User Journey
1. **Login**: User logs in with World ID
2. **Verify**: User verifies with World ID (Orb level for production)
3. **Create Dare**: User creates a dare with ETH deposit
4. **Submit Proof**: Other users submit proof of completion
5. **Approve**: Dare creator approves winning submission
6. **Claim Reward**: Winner claims ETH reward

### Test Scenarios
1. Create a simple dare (e.g., "Take a photo of your breakfast")
2. Submit proof text from another account
3. Approve the submission as the creator
4. Claim the reward as the winner

## 5. Production Deployment

### Smart Contract
- Deploy to World Chain Mainnet
- Update World ID address to mainnet: `0x163b09b4fE21177c455D850BD815B6D583732432`
- Verify contract on World Chain Explorer

### Frontend
- Deploy to Vercel/Netlify
- Update environment variables for production
- Configure World ID app for production domain

## 6. Key Features Implemented

### Smart Contract (Simplified)
- ✅ Create dares with ETH deposits
- ✅ Submit text proofs 
- ✅ Direct approval by creators
- ✅ Reward claiming
- ✅ World ID verification integration
- ✅ Emergency cancel function

### Frontend
- ✅ World ID authentication
- ✅ Create dare form
- ✅ Browse active dares
- ✅ Submit proof modal
- ✅ Manage dares (for creators)
- ✅ Claim rewards
- ✅ Responsive mobile-first design

## 7. Architecture

### Smart Contracts
- `DareFiCore.sol`: Main dare management contract
- `WorldIDVerification.sol`: World ID integration base contract

### Frontend Components
- `CreateDare`: Form to create new dares
- `DareList`: Browse and interact with active dares
- `SubmitProof`: Modal for submitting completion proof
- `ManageDares`: Manage dares you created
- `ClaimReward`: Claim rewards from won dares

## Troubleshooting

### Common Issues
1. **Foundry not found**: Install Foundry and restart terminal
2. **World ID verification fails**: Check app configuration in developer portal
3. **Transaction fails**: Ensure sufficient ETH balance and correct network
4. **Contract not found**: Verify contract address is updated in all components

### Development Tips
- Test on World Chain Sepolia before mainnet
- Use World ID Simulator for testing
- Check browser console for detailed error messages
- Monitor contract events on World Chain Explorer

## Next Steps (Future Enhancements)
- Add IPFS for media proof storage
- Implement voting system for community validation
- Add dare categories and filtering
- Integrate with World Chain's native tokens
- Add reputation system for users
