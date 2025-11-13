@echo off
REM BloodLink Blockchain Verification Setup Script (Windows)
REM This script helps you set up the blockchain verification system

echo.
echo ========================================
echo BloodLink Blockchain Verification Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)
echo [OK] Node.js found
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)
echo [OK] npm found
npm --version

REM Install dependencies
echo.
echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully

REM Check for .env file
echo.
echo Checking configuration...
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env
    echo [OK] Created .env file
    echo.
    echo [WARNING] Please update .env with your actual values:
    echo    - VITE_CONTRACT_ADDRESS
    echo    - VITE_RPC_URL
    echo    - VITE_CHAIN_ID
) else (
    echo [OK] .env file exists
)

REM Check if Supabase CLI is installed
echo.
echo Checking Supabase CLI...
where supabase >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Supabase CLI not found. Installing...
    call npm install -g supabase
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install Supabase CLI
    ) else (
        echo [OK] Supabase CLI installed
    )
) else (
    echo [OK] Supabase CLI found
    supabase --version
)

REM Summary
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Deploy Smart Contract:
echo    - Open Remix: https://remix.ethereum.org/
echo    - Upload: supabase\contracts\DonorVerification.sol
echo    - Deploy to Polygon Amoy testnet
echo    - Save contract address
echo.
echo 2. Update .env file:
echo    - Set VITE_CONTRACT_ADDRESS=0x...
echo    - Verify VITE_RPC_URL and VITE_CHAIN_ID
echo.
echo 3. Run Database Migration:
echo    supabase db push
echo    OR manually run: supabase\migrations\20250103_donor_certificates.sql
echo.
echo 4. Deploy Edge Function:
echo    supabase secrets set RPC_URL=https://rpc-amoy.polygon.technology/
echo    supabase secrets set MINTER_PRIVATE_KEY=your_key
echo    supabase secrets set DONOR_CONTRACT_ADDRESS=0x...
echo    supabase secrets set CHAIN_ID=80002
echo    supabase functions deploy verify-certificate
echo.
echo 5. Start Development Server:
echo    npm run dev
echo.
echo Documentation:
echo    - Full Guide: BLOCKCHAIN_VERIFICATION_GUIDE.md
echo    - Summary: IMPLEMENTATION_SUMMARY.md
echo    - Contract Deployment: supabase\contracts\DEPLOYMENT_GUIDE.md
echo.
echo Happy Coding!
echo.
pause
