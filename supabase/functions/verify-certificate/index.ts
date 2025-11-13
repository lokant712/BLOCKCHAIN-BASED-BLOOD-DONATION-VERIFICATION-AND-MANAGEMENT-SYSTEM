import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ethers } from "npm:ethers@6.9.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Smart contract ABI (only functions we need)
const DONOR_VERIFICATION_ABI = [
  "function storeVerification(address _donor, bytes32 _certHash, bool _eligible) public",
  "function verify(address _donor, bytes32 _certHash) public view returns (bool eligible, uint256 timestamp, bool matches)",
  "function getRecord(address _donor) public view returns (bytes32 certHash, bool eligible, uint256 timestamp, bool exists)"
];

interface VerifyRequest {
  certificateId: string;
  donorWalletAddress: string;
  eligible: boolean;
  adminNotes?: string;
}

/**
 * Compute SHA-256 hash of file bytes (server-side)
 */
async function computeFileHash(fileData: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
}

/**
 * Main handler for certificate verification
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the request using the user's access token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is hospital staff
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'hospital') {
      throw new Error('Only hospital staff can verify certificates');
    }

    // Parse request body
    const body: VerifyRequest = await req.json();
    const { certificateId, donorWalletAddress, eligible, adminNotes } = body;

    if (!certificateId || !donorWalletAddress) {
      throw new Error('Missing required fields: certificateId, donorWalletAddress');
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(donorWalletAddress)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Fetch certificate record from database
    const { data: certificate, error: certError } = await supabase
      .from('donor_certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      throw new Error('Certificate not found');
    }

    // Download certificate file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('certificates')
      .download(certificate.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download certificate file: ${downloadError?.message}`);
    }

    // Compute file hash
    const fileArrayBuffer = await fileData.arrayBuffer();
    const certHash = await computeFileHash(fileArrayBuffer);

    console.log('Computed certificate hash:', certHash);

    // Initialize blockchain connection
    const rpcUrl = Deno.env.get('RPC_URL');
    const privateKey = Deno.env.get('MINTER_PRIVATE_KEY');
    const contractAddress = Deno.env.get('DONOR_CONTRACT_ADDRESS');

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error('Missing blockchain configuration environment variables');
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, DONOR_VERIFICATION_ABI, wallet);

    console.log('Storing verification on blockchain...');
    console.log('Donor address:', donorWalletAddress);
    console.log('Certificate hash:', certHash);
    console.log('Eligible:', eligible);

    // Store verification on blockchain
    const tx = await contract.storeVerification(
      donorWalletAddress,
      certHash,
      eligible
    );

    console.log('Transaction submitted:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Update database with verification details
    const { error: updateError } = await supabase
      .from('donor_certificates')
      .update({
        cert_hash: certHash,
        eligible: eligible,
        tx_hash: tx.hash,
        chain_address: contractAddress,
        verified_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_notes: adminNotes || null,
      })
      .eq('id', certificateId);

    if (updateError) {
      console.error('Failed to update database:', updateError);
      // Transaction is on blockchain, but DB update failed - log this
      throw new Error('Blockchain verification successful but database update failed');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          certificateId,
          certHash,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          contractAddress,
          eligible,
          verifiedAt: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in verify-certificate function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
