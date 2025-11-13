# Smart Contracts

This directory contains the Solidity smart contracts for BloodLink's blockchain verification system.

## Files

- **DonorVerification.sol** - Main smart contract for certificate verification
- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment instructions

## Quick Start

### 1. Get Test MATIC
Visit: https://faucet.polygon.technology/
- Network: Polygon Amoy
- Chain ID: 80002

### 2. Deploy via Remix
1. Go to https://remix.ethereum.org/
2. Create new file: DonorVerification.sol
3. Copy contract code
4. Compile with Solidity 0.8.17+
5. Connect MetaMask to Polygon Amoy
6. Deploy
7. Save contract address

### 3. Update Configuration
```bash
# In .env file
VITE_CONTRACT_ADDRESS=0x...  # Your deployed address
VITE_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_CHAIN_ID=80002
```

## Contract Functions

### Write Functions (Admin Only)
- `storeVerification(address, bytes32, bool)` - Store/update verification
- `changeAdmin(address)` - Transfer admin role

### Read Functions (Public)
- `verify(address, bytes32)` - Verify certificate hash
- `getRecord(address)` - Get full record
- `hasRecord(address)` - Check if record exists

## Events
- `RecordAdded` - Emitted when new verification added
- `RecordUpdated` - Emitted when verification updated
- `AdminChanged` - Emitted when admin changed

## Security
- Only admin can write to contract
- All reads are public
- Events provide audit trail
- Input validation on all functions

## Testing
Test on Polygon Amoy testnet before mainnet deployment.

## Support
For detailed instructions, see DEPLOYMENT_GUIDE.md
