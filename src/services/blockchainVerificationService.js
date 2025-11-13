/**
 * Blockchain Verification Service
 * Handles all blockchain-related operations for certificate verification
 */

import { supabase } from '../lib/supabase';
import { ethers } from 'ethers';
import DonorVerificationABI from '../contracts/DonorVerificationABI.json';

/**
 * Get contract instance (read-only, no wallet needed)
 */
function getContract() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://rpc-amoy.polygon.technology/';

  if (!contractAddress) {
    throw new Error('Contract address not configured');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(contractAddress, DonorVerificationABI, provider);
}

/**
 * Upload certificate to Supabase Storage
 * @param {File} file - Certificate file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Upload result with path
 */
export async function uploadCertificate(file, userId) {
  try {
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    return {
      success: true,
      path: data.path,
      fullPath: filePath,
    };
  } catch (error) {
    console.error('Error uploading certificate:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Create certificate record in database
 * @param {Object} certificateData - Certificate metadata
 * @returns {Promise<Object>} Created certificate record
 */
export async function createCertificateRecord(certificateData) {
  try {
    const { data, error } = await supabase
      .from('donor_certificates')
      .insert([certificateData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating certificate record:', error);
    throw new Error(`Failed to create record: ${error.message}`);
  }
}

/**
 * Get certificates for a donor
 * @param {string} donorId - Donor user ID
 * @returns {Promise<Array>} List of certificates
 */
export async function getDonorCertificates(donorId) {
  try {
    const { data, error } = await supabase
      .from('donor_certificates')
      .select('*')
      .eq('donor_id', donorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching donor certificates:', error);
    throw new Error(`Failed to fetch certificates: ${error.message}`);
  }
}

/**
 * Get all pending certificates (for admin/hospital)
 * @returns {Promise<Array>} List of pending certificates
 */
export async function getPendingCertificates() {
  try {
    // First get certificates
    const { data: certificates, error } = await supabase
      .from('donor_certificates')
      .select('*')
      .is('eligible', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!certificates || certificates.length === 0) {
      return [];
    }

    // Then fetch donor profiles for each certificate
    const certificatesWithDonors = await Promise.all(
      certificates.map(async (cert) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, blood_type, phone')
          .eq('id', cert.donor_id)
          .single();

        return {
          ...cert,
          donor: profile || { full_name: 'Unknown', blood_type: 'Unknown', phone: 'N/A' }
        };
      })
    );

    return certificatesWithDonors;
  } catch (error) {
    console.error('Error fetching pending certificates:', error);
    throw new Error(`Failed to fetch pending certificates: ${error.message}`);
  }
}

/**
 * Get all verified certificates (for admin/hospital)
 * @returns {Promise<Array>} List of verified certificates
 */
export async function getVerifiedCertificates() {
  try {
    // First get certificates
    const { data: certificates, error } = await supabase
      .from('donor_certificates')
      .select('*')
      .not('eligible', 'is', null)
      .order('verified_at', { ascending: false });

    if (error) throw error;

    if (!certificates || certificates.length === 0) {
      return [];
    }

    // Then fetch donor profiles for each certificate
    const certificatesWithDonors = await Promise.all(
      certificates.map(async (cert) => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, blood_type, phone')
          .eq('id', cert.donor_id)
          .single();

        return {
          ...cert,
          donor: profile || { full_name: 'Unknown', blood_type: 'Unknown', phone: 'N/A' }
        };
      })
    );

    return certificatesWithDonors;
  } catch (error) {
    console.error('Error fetching verified certificates:', error);
    throw new Error(`Failed to fetch verified certificates: ${error.message}`);
  }
}

/**
 * Download certificate file from storage
 * @param {string} filePath - Storage file path
 * @returns {Promise<Blob>} File blob
 */
export async function downloadCertificate(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from('certificates')
      .download(filePath);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Get public URL for certificate (if needed for preview)
 * @param {string} filePath - Storage file path
 * @returns {string} Public URL
 */
export function getCertificateUrl(filePath) {
  const { data } = supabase.storage
    .from('certificates')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Submit certificate for verification (calls Edge Function)
 * @param {string} certificateId - Certificate ID
 * @param {string} donorWalletAddress - Donor's Ethereum address
 * @param {boolean} eligible - Approval status
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise<Object>} Verification result
 */
export async function verifyCertificateOnBlockchain(certificateId, donorWalletAddress, eligible, adminNotes = '') {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    console.log('Calling Edge Function with:', {
      certificateId,
      donorWalletAddress,
      eligible,
      adminNotes
    });

    // Call Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-certificate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        certificateId,
        donorWalletAddress,
        eligible,
        adminNotes,
      }),
    });

    const responseText = await response.text();
    console.log('Edge Function raw response:', responseText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
        console.error('Edge Function error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response:', responseText);
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('Edge Function response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Verification failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error verifying certificate on blockchain:', error);
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
}

/**
 * Verify certificate hash on blockchain (read-only)
 * @param {string} donorAddress - Donor's Ethereum address
 * @param {string} certHash - Certificate hash to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyHashOnBlockchain(donorAddress, certHash) {
  try {
    const contract = getContract();

    // Call verify function
    const [eligible, timestamp, matches] = await contract.verify(donorAddress, certHash);

    return {
      eligible,
      timestamp: Number(timestamp),
      matches,
      timestampDate: timestamp > 0 ? new Date(Number(timestamp) * 1000) : null,
    };
  } catch (error) {
    console.error('Error verifying hash on blockchain:', error);
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
}

/**
 * Get donor's blockchain record
 * @param {string} donorAddress - Donor's Ethereum address
 * @returns {Promise<Object>} Record data
 */
export async function getDonorBlockchainRecord(donorAddress) {
  try {
    const contract = getContract();

    // Call getRecord function
    const [certHash, eligible, timestamp, exists] = await contract.getRecord(donorAddress);

    if (!exists) {
      return null;
    }

    return {
      certHash,
      eligible,
      timestamp: Number(timestamp),
      timestampDate: new Date(Number(timestamp) * 1000),
      exists,
    };
  } catch (error) {
    console.error('Error fetching blockchain record:', error);
    throw new Error(`Failed to fetch blockchain record: ${error.message}`);
  }
}

/**
 * Check if donor has blockchain record
 * @param {string} donorAddress - Donor's Ethereum address
 * @returns {Promise<boolean>} True if record exists
 */
export async function hasBlockchainRecord(donorAddress) {
  try {
    const contract = getContract();
    return await contract.hasRecord(donorAddress);
  } catch (error) {
    console.error('Error checking blockchain record:', error);
    return false;
  }
}

export default {
  uploadCertificate,
  createCertificateRecord,
  getDonorCertificates,
  getPendingCertificates,
  getVerifiedCertificates,
  downloadCertificate,
  getCertificateUrl,
  verifyCertificateOnBlockchain,
  verifyHashOnBlockchain,
  getDonorBlockchainRecord,
  hasBlockchainRecord,
};
