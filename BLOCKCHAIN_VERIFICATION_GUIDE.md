# Blockchain Certificate Verification System

## Overview

This guide provides complete instructions for implementing and testing the blockchain-backed donor certificate verification system for BloodLink.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Deployment Steps](#deployment-steps)
4. [Testing Checklist](#testing-checklist)
5. [User Workflows](#user-workflows)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Components

1. **Smart Contract (Solidity)**: Stores certificate hashes and eligibility on Polygon testnet
2. **Supabase Database**: Stores certificate metadata and file references
3. **Supabase Storage**: Securely stores actual certificate files
4. **Supabase Edge Function**: Server-side function to compute hashes and write to blockchain
5. **React Components**: UI for upload, approval, and verification

### Data Flow

```
[Donor] → Upload Certificate → [Supabase Storage]
                              ↓
                    [Database Record Created]
                              ↓
[Admin] → Review & Approve → [Edge Function]
                              ↓
              [Compute Hash + Write to Blockchain]
                              ↓
              [Update Database with TX Hash]
                              ↓
[Anyone] → Verify Certificate → [Read from Blockchain]
```

---

## Prerequisites

### Required Tools

- [x] Node.js 18+ and npm
- [x] Supabase account and project
- [x] MetaMask wallet (or any Web3 wallet)
- [x] Polygon testnet MATIC tokens
- [x] Remix IDE or Hardhat (for contract deployment)

### Required Knowledge

- Basic understanding of blockchain and Ethereum
- Familiarity with Supabase and React
- Basic command line usage

---

## Deployment Steps

### Step 1: Database Setup

1. **Run the SQL migration**:
   ```bash
   # If using Supabase CLI
   supabase db push

   # Or manually execute in Supabase SQL Editor:
   # supabase/migrations/20250103_donor_certificates.sql
   ```

2. **Verify tables created**:
   - `donor_certificates` table should exist
   - `certificates` storage bucket should exist
   - RLS policies should be active

### Step 2: Deploy Smart Contract

**Option A: Using Remix (Recommended for beginners)**

1. Go to https://remix.ethereum.org/
2. Create new file: `DonorVerification.sol`
3. Copy contract code from `supabase/contracts/DonorVerification.sol`
4. Compile with Solidity 0.8.17+
5. Connect MetaMask to Polygon Amoy testnet:
   - Network: Polygon Amoy
   - RPC URL: https://rpc-amoy.polygon.technology/
   - Chain ID: 80002
   - Symbol: MATIC
6. Get test MATIC from https://faucet.polygon.technology/
7. Deploy contract
8. **Save the contract address** (e.g., 0x123...)
9. **Copy the ABI** from Remix

**Option B: Using Hardhat**

See `supabase/contracts/DEPLOYMENT_GUIDE.md` for detailed Hardhat instructions.

### Step 3: Configure Environment Variables

1. **Update `.env` file**:
   ```bash
   # Add blockchain configuration
   VITE_CONTRACT_ADDRESS=0x... # Your deployed contract address
   VITE_RPC_URL=https://rpc-amoy.polygon.technology/
   VITE_CHAIN_ID=80002
   ```

2. **Set Supabase Edge Function secrets**:
   ```bash
   # Install Supabase CLI if not already
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref your-project-ref

   # Set secrets
   supabase secrets set RPC_URL=https://rpc-amoy.polygon.technology/
   supabase secrets set MINTER_PRIVATE_KEY=your_backend_wallet_private_key
   supabase secrets set DONOR_CONTRACT_ADDRESS=0x... # Same as VITE_CONTRACT_ADDRESS
   supabase secrets set CHAIN_ID=80002
   ```

   ⚠️ **Important**: Create a separate wallet for the backend (MINTER_PRIVATE_KEY). This wallet needs test MATIC for gas fees.

### Step 4: Deploy Edge Function

```bash
# Deploy the verify-certificate function
supabase functions deploy verify-certificate

# Verify deployment
supabase functions list
```

### Step 5: Install Dependencies

```bash
# Install ethers.js for blockchain interaction
npm install ethers
```

### Step 6: Integrate Components

1. **Add to Donor Dashboard**:
   ```javascript
   // src/pages/donor-dashboard/index.jsx
   import CertificateUpload from './components/CertificateUpload';

   // Inside component:
   <CertificateUpload onUploadComplete={() => loadData()} />
   ```

2. **Add to Hospital Dashboard**:
   ```javascript
   // src/pages/hospital-dashboard/index.jsx
   import CertificateApproval from './components/CertificateApproval';
   import CertificateVerification from './components/CertificateVerification';

   // Add as tabs or sections
   ```

---

## Testing Checklist

### Phase 1: Basic Upload

- [ ] Donor can upload certificate file (PDF/Image)
- [ ] Donor enters Ethereum wallet address
- [ ] File is stored in Supabase Storage
- [ ] Database record is created with `eligible = null`
- [ ] File hash is computed correctly

### Phase 2: Admin Approval

- [ ] Hospital/admin can view pending certificates
- [ ] Can download and review certificate files
- [ ] Enter donor's wallet address for verification
- [ ] Click "Approve" triggers Edge Function
- [ ] Edge Function computes hash server-side
- [ ] Transaction is submitted to blockchain
- [ ] Database is updated with tx_hash and cert_hash
- [ ] Certificate status changes to `eligible = true`

### Phase 3: Blockchain Verification

- [ ] Query contract with donor address and hash
- [ ] Verify function returns correct eligibility
- [ ] Timestamp is recorded correctly
- [ ] Hash comparison works (matches = true)

### Phase 4: Certificate Verification UI

- [ ] **Verify by File**: Upload file + address → correct result
- [ ] **Lookup by Address**: Enter address → shows record
- [ ] Modified file shows `matches = false`
- [ ] Non-existent address shows "No record found"
- [ ] Visual indicators (green check / red X) work

### Phase 5: Security Tests

- [ ] Only donors can upload their own certificates
- [ ] Only hospital/admin can approve certificates
- [ ] RLS policies prevent unauthorized access
- [ ] Edge Function validates authentication
- [ ] Private keys are never exposed to frontend

### Phase 6: Error Handling

- [ ] File size limit enforced (10MB)
- [ ] File type validation works
- [ ] Invalid wallet address rejected
- [ ] Network errors handled gracefully
- [ ] Transaction failures logged properly

---

## User Workflows

### Donor Workflow

1. **Navigate to Donor Dashboard**
2. Click "Certificate Upload" section
3. Enter Ethereum wallet address (from MetaMask)
4. Select health certificate file (PDF/Image)
5. Click "Upload Certificate"
6. Receive confirmation: "Certificate uploaded successfully"
7. Wait for hospital approval

### Hospital Admin Workflow

1. **Navigate to Hospital Dashboard**
2. Click "Certificate Management" section
3. View "Pending" tab - see list of unverified certificates
4. Click "Review" on a certificate
5. Download and verify certificate authenticity
6. Confirm donor's wallet address
7. Add optional admin notes
8. Click "Approve" or "Reject"
9. Wait for blockchain transaction confirmation
10. View transaction hash and block number
11. Certificate moves to "Verified" tab

### Verification Workflow (Anyone)

**Method 1: Verify by File**

1. Navigate to "Certificate Verification" page
2. Select "Verify by File" tab
3. Upload certificate file
4. Enter donor's wallet address
5. Click "Verify Certificate"
6. View result: ✓ Verified or ✗ Failed

**Method 2: Lookup by Address**

1. Navigate to "Certificate Verification" page
2. Select "Lookup by Address" tab
3. Enter wallet address
4. Click "Lookup Record"
5. View stored certificate hash and eligibility

---

## Security Considerations

### Private Key Management

- ✅ **DO**: Store backend wallet private key in Supabase secrets
- ✅ **DO**: Use a dedicated wallet for the backend (not your personal wallet)
- ✅ **DO**: Fund backend wallet with minimal MATIC (enough for ~100 transactions)
- ❌ **DON'T**: Expose private keys in frontend code
- ❌ **DON'T**: Commit private keys to Git
- ❌ **DON'T**: Share backend wallet private key

### Data Privacy

- ✅ **DO**: Store actual certificate files in Supabase Storage (private)
- ✅ **DO**: Only store hash on blockchain (not the file itself)
- ✅ **DO**: Use RLS policies to restrict access
- ❌ **DON'T**: Store PII directly on blockchain
- ❌ **DON'T**: Make certificate bucket public

### Smart Contract Security

- ✅ **DO**: Restrict `storeVerification` to admin only
- ✅ **DO**: Validate addresses before calling contract
- ✅ **DO**: Handle transaction failures gracefully
- ❌ **DON'T**: Allow arbitrary addresses to write to contract
- ❌ **DON'T**: Deploy without testing on testnet first

### Access Control

- ✅ **DO**: Validate user roles server-side
- ✅ **DO**: Use Supabase auth for Edge Function calls
- ✅ **DO**: Implement proper RLS policies
- ❌ **DON'T**: Trust client-side role checks alone

---

## Troubleshooting

### Contract Deployment Issues

**Error: "Insufficient funds"**
- Solution: Get more test MATIC from faucet
- URL: https://faucet.polygon.technology/

**Error: "Nonce too high"**
- Solution: Reset MetaMask account
- MetaMask → Settings → Advanced → Reset Account

**Contract not verified on PolygonScan**
- Solution: Use exact compiler version and settings
- Verify on https://amoy.polygonscan.com/

### Edge Function Issues

**Error: "Missing authorization header"**
- Solution: Ensure Supabase auth is working
- Check if user is logged in
- Verify token is being sent

**Error: "Only hospital staff can verify"**
- Solution: Check user role in `user_profiles` table
- Ensure role is 'hospital' or 'admin'

**Error: "Failed to download certificate"**
- Solution: Check file path is correct
- Verify file exists in storage
- Check RLS policies allow access

**Error: "Transaction failed"**
- Solution: Check backend wallet has MATIC
- Verify RPC URL is correct
- Check contract address is correct

### Frontend Issues

**ethers.js not found**
- Solution: `npm install ethers`

**Contract address not configured**
- Solution: Update `.env` with `VITE_CONTRACT_ADDRESS`

**Invalid wallet address format**
- Solution: Ensure address starts with 0x and is 42 characters

### Database Issues

**RLS policy denying access**
- Solution: Check user role in database
- Verify RLS policies are correct
- Use service role key in Edge Function

**Storage bucket not found**
- Solution: Run migration script to create bucket
- Or manually create 'certificates' bucket in Supabase

---

## Monitoring & Maintenance

### Monitoring Blockchain Transactions

1. View on PolygonScan: https://amoy.polygonscan.com/
2. Search by transaction hash
3. Check transaction status and gas usage
4. Monitor events emitted by contract

### Database Monitoring

```sql
-- Check pending certificates
SELECT COUNT(*) FROM donor_certificates WHERE eligible IS NULL;

-- Check verified certificates
SELECT COUNT(*) FROM donor_certificates WHERE eligible IS NOT NULL;

-- Recent verifications
SELECT * FROM donor_certificates 
WHERE verified_at IS NOT NULL 
ORDER BY verified_at DESC 
LIMIT 10;
```

### Edge Function Logs

```bash
# View function logs
supabase functions logs verify-certificate

# Follow logs in real-time
supabase functions logs verify-certificate --follow
```

---

## Production Deployment

### Mainnet Migration

1. **Deploy contract to Polygon mainnet**:
   - RPC URL: https://polygon-rpc.com/
   - Chain ID: 137
   - Get real MATIC from exchanges

2. **Update environment variables**:
   ```bash
   VITE_CONTRACT_ADDRESS=0x... # Mainnet address
   VITE_RPC_URL=https://polygon-rpc.com/
   VITE_CHAIN_ID=137
   ```

3. **Security hardening**:
   - Implement multisig for admin role
   - Add emergency pause functionality
   - Conduct security audit
   - Set up monitoring and alerts

4. **Gas optimization**:
   - Batch multiple verifications if needed
   - Monitor gas prices and optimize timing
   - Consider Layer 2 solutions for lower costs

---

## Cost Estimation

### Testnet (Free)
- Smart contract deployment: Free (test MATIC)
- Each verification transaction: Free (test MATIC)
- Storage: Supabase free tier

### Mainnet (Production)
- Smart contract deployment: ~$1-5 (one-time)
- Each verification transaction: ~$0.01-0.10 (varies with gas)
- Storage: Supabase pricing based on usage
- Estimated monthly cost for 1000 verifications: ~$10-50

---

## Support & Resources

### Documentation
- Polygon Docs: https://docs.polygon.technology/
- Supabase Docs: https://supabase.com/docs
- Ethers.js Docs: https://docs.ethers.org/

### Tools
- Polygon Faucet: https://faucet.polygon.technology/
- Remix IDE: https://remix.ethereum.org/
- PolygonScan: https://polygonscan.com/

### Community
- Polygon Discord: https://discord.gg/polygon
- Supabase Discord: https://discord.supabase.com/

---

## Conclusion

This blockchain verification system provides:
- ✅ Tamper-proof certificate storage
- ✅ Transparent verification process
- ✅ Decentralized trust
- ✅ Privacy-preserving (only hash on-chain)
- ✅ Low cost (testnet free, mainnet pennies per transaction)

Follow this guide step-by-step to implement the full system. Test thoroughly on testnet before deploying to production.
