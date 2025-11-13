#!/bin/bash

# BloodLink Blockchain Verification Setup Script
# This script helps you set up the blockchain verification system

echo "🩸 BloodLink Blockchain Verification Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Check for .env file
echo ""
echo "🔧 Checking configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your actual values:${NC}"
    echo "   - VITE_CONTRACT_ADDRESS"
    echo "   - VITE_RPC_URL"
    echo "   - VITE_CHAIN_ID"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check if Supabase CLI is installed
echo ""
echo "Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Supabase CLI installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Supabase CLI${NC}"
    fi
else
    echo -e "${GREEN}✓ Supabase CLI found: $(supabase --version)${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Deploy Smart Contract:"
echo "   - Open Remix: https://remix.ethereum.org/"
echo "   - Upload: supabase/contracts/DonorVerification.sol"
echo "   - Deploy to Polygon Amoy testnet"
echo "   - Save contract address"
echo ""
echo "2. Update .env file:"
echo "   - Set VITE_CONTRACT_ADDRESS=0x..."
echo "   - Verify VITE_RPC_URL and VITE_CHAIN_ID"
echo ""
echo "3. Run Database Migration:"
echo "   supabase db push"
echo "   OR manually run: supabase/migrations/20250103_donor_certificates.sql"
echo ""
echo "4. Deploy Edge Function:"
echo "   supabase secrets set RPC_URL=https://rpc-amoy.polygon.technology/"
echo "   supabase secrets set MINTER_PRIVATE_KEY=your_key"
echo "   supabase secrets set DONOR_CONTRACT_ADDRESS=0x..."
echo "   supabase secrets set CHAIN_ID=80002"
echo "   supabase functions deploy verify-certificate"
echo ""
echo "5. Start Development Server:"
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - Full Guide: BLOCKCHAIN_VERIFICATION_GUIDE.md"
echo "   - Summary: IMPLEMENTATION_SUMMARY.md"
echo "   - Contract Deployment: supabase/contracts/DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Happy Coding!"
