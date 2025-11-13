# Blockchain Verification - Quick Reference Card

## 🚀 Quick Start (5 Steps)

```bash
# 1. Install dependencies
npm install

# 2. Deploy smart contract (use Remix)
# Visit: https://remix.ethereum.org/
# Deploy: supabase/contracts/DonorVerification.sol
# Save contract address

# 3. Configure environment
# Update .env with:
VITE_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_CHAIN_ID=80002

# 4. Run database migration
supabase db push
# OR manually run: supabase/migrations/20250103_donor_certificates.sql

# 5. Deploy Edge Function
supabase secrets set RPC_URL=https://rpc-amoy.polygon.technology/
supabase secrets set MINTER_PRIVATE_KEY=your_backend_wallet_key
supabase secrets set DONOR_CONTRACT_ADDRESS=0x...
supabase secrets set CHAIN_ID=80002
supabase functions deploy verify-certificate
```

## 📝 Important Commands

```bash
# Test blockchain setup
npm run test:blockchain

# Start development server
npm run dev

# View Edge Function logs
supabase functions logs verify-certificate --follow

# Run SQL migration
supabase db push

# Deploy Edge Function
supabase functions deploy verify-certificate
```

## 🌐 Important URLs

| Resource | URL |
|----------|-----|
| Polygon Faucet | https://faucet.polygon.technology/ |
| Remix IDE | https://remix.ethereum.org/ |
| Amoy Explorer | https://amoy.polygonscan.com/ |
| Supabase Dashboard | https://supabase.com/dashboard |

## 📂 Key Files

```
supabase/
├── contracts/
│   ├── DonorVerification.sol          # Smart contract
│   └── DEPLOYMENT_GUIDE.md            # Contract deployment guide
├── functions/
│   └── verify-certificate/
│       └── index.ts                   # Edge Function
└── migrations/
    └── 20250103_donor_certificates.sql # Database schema

src/
├── pages/
│   ├── donor-dashboard/components/
│   │   └── CertificateUpload.jsx      # Upload component
│   └── hospital-dashboard/components/
│       ├── CertificateApproval.jsx    # Approval component
│       └── CertificateVerification.jsx # Verification component
├── services/
│   └── blockchainVerificationService.js
└── utils/
    └── certificateHash.js

BLOCKCHAIN_VERIFICATION_GUIDE.md       # Full deployment guide
IMPLEMENTATION_SUMMARY.md              # Implementation details
```

## 🔑 Environment Variables

```bash
# Blockchain (Frontend)
VITE_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_CHAIN_ID=80002

# Blockchain (Edge Function Secrets)
RPC_URL=https://rpc-amoy.polygon.technology/
MINTER_PRIVATE_KEY=your_private_key
DONOR_CONTRACT_ADDRESS=0x...
CHAIN_ID=80002

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🧪 Test Flow

### 1. As Donor
```
1. Navigate to Donor Dashboard
2. Upload certificate file
3. Enter wallet address (0x...)
4. Submit
5. Wait for admin approval
```

### 2. As Hospital/Admin
```
1. Navigate to Hospital Dashboard
2. Go to "Certificate Management"
3. Click "Pending" tab
4. Review certificate
5. Enter donor wallet address
6. Click "Approve"
7. Wait for blockchain confirmation
```

### 3. Verification (Anyone)
```
Method A: Verify by File
1. Upload certificate
2. Enter wallet address
3. Click "Verify"
4. View result

Method B: Lookup by Address
1. Enter wallet address
2. Click "Lookup"
3. View record
```

## 🔐 Security Checklist

- [ ] Backend wallet private key in Supabase secrets (NOT in .env)
- [ ] RLS policies enabled on donor_certificates table
- [ ] Certificates bucket is private
- [ ] Smart contract deployed and verified
- [ ] Edge Function authentication enabled
- [ ] .env file in .gitignore
- [ ] Separate wallet for backend operations

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Contract address not configured" | Update VITE_CONTRACT_ADDRESS in .env |
| "Insufficient funds" | Get test MATIC from faucet |
| "Invalid wallet address" | Ensure format is 0x + 40 hex chars |
| "Edge Function failed" | Check secrets are set correctly |
| "RLS policy denying access" | Verify user role in user_profiles |
| TypeScript errors in Edge Function | Normal for Deno, works when deployed |

## 📊 Database Queries

```sql
-- Pending certificates
SELECT COUNT(*) FROM donor_certificates WHERE eligible IS NULL;

-- Approved certificates
SELECT COUNT(*) FROM donor_certificates WHERE eligible = true;

-- Recent verifications
SELECT * FROM donor_certificates 
WHERE verified_at IS NOT NULL 
ORDER BY verified_at DESC LIMIT 10;

-- Check storage usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes
FROM storage.objects 
WHERE bucket_id = 'certificates'
GROUP BY bucket_id;
```

## 💰 Cost Estimates

### Testnet
- **Everything**: FREE (test MATIC from faucet)

### Mainnet
- **Contract Deployment**: $1-5 (one-time)
- **Per Verification**: $0.01-0.10
- **1000 verifications/month**: ~$10-50

## 📱 Component Integration

### Add to Donor Dashboard
```jsx
import CertificateUpload from './components/CertificateUpload';

// In component:
<CertificateUpload onUploadComplete={() => loadData()} />
```

### Add to Hospital Dashboard
```jsx
import CertificateApproval from './components/CertificateApproval';
import CertificateVerification from './components/CertificateVerification';

// Add as tabs or sections
```

## 🔄 Workflow Diagram

```
Donor → Upload Certificate
         ↓
      Supabase Storage + DB (pending)
         ↓
Admin → Review & Approve
         ↓
      Edge Function
         ↓
   Compute Hash + Blockchain Write
         ↓
      DB Updated (verified)
         ↓
Anyone → Verify Certificate
         ↓
   Read from Blockchain
         ↓
      ✓ Authentic / ✗ Invalid
```

## 🎯 Smart Contract Functions

### Admin (Write)
```solidity
storeVerification(address donor, bytes32 hash, bool eligible)
changeAdmin(address newAdmin)
```

### Public (Read)
```solidity
verify(address donor, bytes32 hash) → (bool eligible, uint256 timestamp, bool matches)
getRecord(address donor) → (bytes32 hash, bool eligible, uint256 timestamp, bool exists)
hasRecord(address donor) → bool
```

## 📞 Need Help?

1. **Full Guide**: `BLOCKCHAIN_VERIFICATION_GUIDE.md`
2. **Contract Deployment**: `supabase/contracts/DEPLOYMENT_GUIDE.md`
3. **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
4. **Test Setup**: `npm run test:blockchain`

## ✅ Pre-Launch Checklist

- [ ] Smart contract deployed to testnet
- [ ] Contract address in .env
- [ ] Database migration completed
- [ ] Edge Function deployed
- [ ] Secrets configured
- [ ] Test upload working
- [ ] Test approval working
- [ ] Test verification working
- [ ] RLS policies tested
- [ ] Components integrated
- [ ] Documentation reviewed

---

**Ready to deploy?** Follow `BLOCKCHAIN_VERIFICATION_GUIDE.md` step by step!
