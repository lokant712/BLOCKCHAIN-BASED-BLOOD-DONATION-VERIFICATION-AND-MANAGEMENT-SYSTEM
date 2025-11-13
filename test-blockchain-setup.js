/**
 * Test Blockchain Setup
 * Validates that all blockchain verification components are configured correctly
 */

import { ethers } from 'ethers';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
};

const CONTRACT_ABI = [
  "function admin() public view returns (address)",
  "function hasRecord(address _donor) public view returns (bool)",
  "function getRecord(address _donor) public view returns (bytes32 certHash, bool eligible, uint256 timestamp, bool exists)"
];

async function testBlockchainSetup() {
  console.log('\n===========================================');
  console.log('   Blockchain Verification Setup Test');
  console.log('===========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Check environment variables
  log.info('Test 1: Checking environment variables...');
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_RPC_URL;
  const chainId = process.env.VITE_CHAIN_ID;

  if (!contractAddress || contractAddress === '0x...') {
    log.error('VITE_CONTRACT_ADDRESS not set or is placeholder');
    failedTests++;
  } else {
    log.success(`Contract address configured: ${contractAddress}`);
    passedTests++;
  }

  if (!rpcUrl) {
    log.error('VITE_RPC_URL not set');
    failedTests++;
  } else {
    log.success(`RPC URL configured: ${rpcUrl}`);
    passedTests++;
  }

  if (!chainId) {
    log.error('VITE_CHAIN_ID not set');
    failedTests++;
  } else {
    log.success(`Chain ID configured: ${chainId}`);
    passedTests++;
  }

  if (contractAddress === '0x...' || !contractAddress || !rpcUrl) {
    log.warn('\nCannot proceed with further tests. Please configure environment variables.\n');
    return;
  }

  // Test 2: Connect to RPC
  log.info('\nTest 2: Connecting to blockchain RPC...');
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    log.success(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    if (network.chainId.toString() !== chainId) {
      log.warn(`Chain ID mismatch: expected ${chainId}, got ${network.chainId}`);
    }
    passedTests++;
  } catch (error) {
    log.error(`Failed to connect to RPC: ${error.message}`);
    failedTests++;
    log.warn('\nCannot proceed with contract tests.\n');
    return;
  }

  // Test 3: Validate contract address format
  log.info('\nTest 3: Validating contract address format...');
  if (ethers.isAddress(contractAddress)) {
    log.success('Contract address format is valid');
    passedTests++;
  } else {
    log.error('Invalid contract address format');
    failedTests++;
    log.warn('\nCannot proceed with contract interaction tests.\n');
    return;
  }

  // Test 4: Check if contract is deployed
  log.info('\nTest 4: Checking if contract is deployed...');
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const code = await provider.getCode(contractAddress);
    
    if (code === '0x' || code === '0x0') {
      log.error('No contract found at this address (code is empty)');
      log.warn('Please deploy the smart contract first.');
      failedTests++;
    } else {
      log.success('Contract is deployed');
      passedTests++;
    }
  } catch (error) {
    log.error(`Failed to check contract deployment: ${error.message}`);
    failedTests++;
  }

  // Test 5: Try to interact with contract
  log.info('\nTest 5: Testing contract interaction...');
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    
    // Try to get admin address
    const adminAddress = await contract.admin();
    log.success(`Contract admin address: ${adminAddress}`);
    passedTests++;
  } catch (error) {
    log.error(`Failed to interact with contract: ${error.message}`);
    log.warn('This might indicate the contract ABI is incorrect or the contract is not deployed correctly.');
    failedTests++;
  }

  // Test 6: Test a read function
  log.info('\nTest 6: Testing contract read function...');
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
    
    // Test with zero address (should return false/empty record)
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const hasRec = await contract.hasRecord(zeroAddress);
    log.success(`hasRecord query successful (result: ${hasRec})`);
    passedTests++;
  } catch (error) {
    log.error(`Failed to query contract: ${error.message}`);
    failedTests++;
  }

  // Test 7: Check Supabase configuration
  log.info('\nTest 7: Checking Supabase configuration...');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    log.error('VITE_SUPABASE_URL not set');
    failedTests++;
  } else {
    log.success('Supabase URL configured');
    passedTests++;
  }

  if (!supabaseKey) {
    log.error('VITE_SUPABASE_ANON_KEY not set');
    failedTests++;
  } else {
    log.success('Supabase key configured');
    passedTests++;
  }

  // Summary
  console.log('\n===========================================');
  console.log('              Test Summary');
  console.log('===========================================');
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log('===========================================\n');

  if (failedTests === 0) {
    log.success('All tests passed! Your blockchain setup is ready.\n');
    console.log('Next steps:');
    console.log('1. Run database migration: supabase db push');
    console.log('2. Deploy Edge Function: supabase functions deploy verify-certificate');
    console.log('3. Start development server: npm run dev');
    console.log('');
  } else {
    log.error('Some tests failed. Please fix the issues above.\n');
    console.log('For help, see:');
    console.log('- BLOCKCHAIN_VERIFICATION_GUIDE.md');
    console.log('- supabase/contracts/DEPLOYMENT_GUIDE.md');
    console.log('');
  }
}

// Run tests
testBlockchainSetup().catch(error => {
  log.error(`Test script failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
