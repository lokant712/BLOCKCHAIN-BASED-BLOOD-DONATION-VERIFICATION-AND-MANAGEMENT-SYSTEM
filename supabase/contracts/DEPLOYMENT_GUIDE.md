# DonorVerification Smart Contract Deployment Guide

## Overview
This guide walks you through deploying the DonorVerification smart contract to Polygon testnet (Mumbai/Amoy).

## Prerequisites
- MetaMask wallet installed
- Test MATIC tokens from faucet
- Basic understanding of smart contracts

## Option 1: Deploy with Remix (Recommended for beginners)

### Step 1: Get Test MATIC
1. Visit Polygon Mumbai Faucet: https://faucet.polygon.technology/
2. Or Amoy Faucet: https://faucet.polygon.technology/
3. Enter your wallet address and request test tokens
4. Wait for tokens to arrive (usually 1-2 minutes)

### Step 2: Deploy Contract
1. Go to Remix IDE: https://remix.ethereum.org/
2. Create new file: `DonorVerification.sol`
3. Copy the contract code from `DonorVerification.sol`
4. Click on "Solidity Compiler" tab (left sidebar)
5. Select compiler version: 0.8.17 or higher
6. Click "Compile DonorVerification.sol"
7. Go to "Deploy & Run Transactions" tab
8. Set Environment to "Injected Provider - MetaMask"
9. Confirm MetaMask is connected to Polygon Mumbai/Amoy
   - Network Name: Polygon Mumbai or Polygon Amoy
   - RPC URL: https://rpc-mumbai.maticvigil.com/ or https://rpc-amoy.polygon.technology/
   - Chain ID: 80001 (Mumbai) or 80002 (Amoy)
10. Click "Deploy"
11. Confirm transaction in MetaMask
12. Wait for deployment confirmation

### Step 3: Save Contract Details
After deployment, save these values:
- **Contract Address**: Copy from Remix console (e.g., 0x123...)
- **ABI**: Click "Compilation Details" → Copy ABI JSON
- **Network**: Mumbai or Amoy
- **Admin Address**: Your deployer wallet address

### Step 4: Verify Contract (Optional but Recommended)
1. Go to PolygonScan Testnet:
   - Mumbai: https://mumbai.polygonscan.com/
   - Amoy: https://amoy.polygonscan.com/
2. Search for your contract address
3. Click "Contract" → "Verify and Publish"
4. Select compiler version (0.8.17+)
5. Paste contract code
6. Submit verification

## Option 2: Deploy with Hardhat (For advanced users)

### Step 1: Initialize Hardhat Project
```bash
mkdir donor-verification-contract
cd donor-verification-contract
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### Step 2: Configure Hardhat
Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com/",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001
    },
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80002
    }
  }
};
```

### Step 3: Create .env File
```bash
PRIVATE_KEY=your_wallet_private_key_here
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com/
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
```

### Step 4: Copy Contract
Copy `DonorVerification.sol` to `contracts/` folder

### Step 5: Create Deployment Script
Create `scripts/deploy.js`:
```javascript
async function main() {
  const DonorVerification = await ethers.getContractFactory("DonorVerification");
  const contract = await DonorVerification.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("DonorVerification deployed to:", address);
  console.log("Admin address:", await contract.admin());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 6: Deploy
```bash
# Deploy to Mumbai
npx hardhat run scripts/deploy.js --network mumbai

# Or deploy to Amoy
npx hardhat run scripts/deploy.js --network amoy
```

## Environment Variables for Backend

After deployment, add these to your `.env` file:

```bash
# Blockchain Configuration
VITE_CONTRACT_ADDRESS=0x... # Your deployed contract address
VITE_CHAIN_ID=80001 # 80001 for Mumbai, 80002 for Amoy
VITE_NETWORK_NAME=mumbai # or 'amoy'

# Supabase Edge Function Secrets (set via Supabase CLI)
RPC_URL=https://rpc-mumbai.maticvigil.com/ # or Amoy RPC
MINTER_PRIVATE_KEY=your_backend_wallet_private_key
DONOR_CONTRACT_ADDRESS=0x... # Same as VITE_CONTRACT_ADDRESS
CHAIN_ID=80001 # Same as VITE_CHAIN_ID
```

## Setting Supabase Edge Function Secrets

```bash
# Navigate to your project
cd bloodlink

# Set secrets for Edge Function
supabase secrets set RPC_URL=https://rpc-mumbai.maticvigil.com/
supabase secrets set MINTER_PRIVATE_KEY=your_private_key
supabase secrets set DONOR_CONTRACT_ADDRESS=0x...
supabase secrets set CHAIN_ID=80001
```

## Testing the Contract

### Using Remix
1. After deployment, use the "Deployed Contracts" panel
2. Test `storeVerification`:
   - _donor: Test address (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)
   - _certHash: Test hash (e.g., 0x1234567890abcdef...)
   - _eligible: true
3. Click "transact" and confirm in MetaMask
4. Test `verify` with same donor and hash
5. Check `getRecord` to see stored data

### Using Ethers.js (Frontend)
```javascript
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Read operation (no gas)
const [eligible, timestamp, matches] = await contract.verify(
  donorAddress,
  certHash
);

console.log({ eligible, timestamp, matches });
```

## Network Details

### Polygon Mumbai (Being Deprecated)
- Chain ID: 80001
- RPC: https://rpc-mumbai.maticvigil.com/
- Explorer: https://mumbai.polygonscan.com/
- Faucet: https://faucet.polygon.technology/

### Polygon Amoy (Recommended)
- Chain ID: 80002
- RPC: https://rpc-amoy.polygon.technology/
- Explorer: https://amoy.polygonscan.com/
- Faucet: https://faucet.polygon.technology/

## Security Notes
1. **Never commit private keys** to version control
2. Use environment variables for all secrets
3. The deployer address becomes the admin - keep this wallet secure
4. Consider using a multisig wallet for production
5. Test thoroughly on testnet before mainnet deployment

## Troubleshooting

### "Insufficient funds" error
- Get more test MATIC from faucet
- Wait a few minutes and try again

### "Nonce too high" error
- Reset MetaMask account (Settings → Advanced → Reset Account)

### Contract not verified on PolygonScan
- Make sure you're using exact compiler version
- Check that source code matches exactly (including formatting)

## Next Steps
1. Deploy the contract using one of the methods above
2. Save contract address and ABI
3. Configure environment variables
4. Deploy Supabase Edge Function (see Edge Function guide)
5. Test the full verification flow
