/**
 * Certificate Hashing Utilities
 * Provides consistent SHA-256 hashing for certificate files
 * Used both client-side and server-side for verification
 */

/**
 * Compute SHA-256 hash of a file
 * @param {File|Blob|ArrayBuffer} fileInput - File to hash
 * @returns {Promise<string>} Hex string hash with 0x prefix
 */
export async function computeCertificateHash(fileInput) {
  try {
    let arrayBuffer;

    // Handle different input types
    if (fileInput instanceof File || fileInput instanceof Blob) {
      arrayBuffer = await fileInput.arrayBuffer();
    } else if (fileInput instanceof ArrayBuffer) {
      arrayBuffer = fileInput;
    } else {
      throw new Error('Invalid input type. Expected File, Blob, or ArrayBuffer');
    }

    // Check if Web Crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available. Please use HTTPS or a modern browser.');
    }

    // Compute SHA-256 hash using Web Crypto API
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);

    // Convert to hex string with 0x prefix
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `0x${hashHex}`;
  } catch (error) {
    console.error('Error computing certificate hash:', error);
    throw new Error(`Failed to compute hash: ${error.message}`);
  }
}

/**
 * Convert hex string to bytes32 format for smart contract
 * @param {string} hexString - Hex string (with or without 0x prefix)
 * @returns {string} Bytes32 formatted string
 */
export function hexToBytes32(hexString) {
  // Remove 0x prefix if present
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;

  // Validate hex string
  if (!/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
    throw new Error('Invalid hex string for bytes32 conversion');
  }

  return `0x${cleanHex}`;
}

/**
 * Validate certificate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateCertificateFile(file, options = {}) {
  const {
    maxSizeMB = 10,
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  } = options;

  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit` 
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}` 
    };
  }

  // Check file name
  if (!file.name || file.name.length > 255) {
    return { 
      valid: false, 
      error: 'Invalid file name' 
    };
  }

  return { valid: true };
}

/**
 * Generate storage path for certificate
 * @param {string} userId - User ID
 * @param {string} fileName - Original file name
 * @returns {string} Storage path
 */
export function generateCertificatePath(userId, fileName) {
  if (!userId || !fileName) {
    throw new Error('userId and fileName are required');
  }

  // Sanitize filename
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const extension = sanitized.split('.').pop();
  const baseName = sanitized.replace(`.${extension}`, '');

  return `${userId}/${baseName}_${timestamp}.${extension}`;
}

/**
 * Format hash for display (shortened version)
 * @param {string} hash - Full hash string
 * @param {number} prefixLength - Number of chars to show at start
 * @param {number} suffixLength - Number of chars to show at end
 * @returns {string} Formatted hash
 */
export function formatHashForDisplay(hash, prefixLength = 10, suffixLength = 8) {
  if (!hash || hash.length < prefixLength + suffixLength) {
    return hash || 'N/A';
  }

  return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
}

/**
 * Compare two hashes for equality
 * @param {string} hash1 - First hash
 * @param {string} hash2 - Second hash
 * @returns {boolean} True if hashes match
 */
export function compareHashes(hash1, hash2) {
  if (!hash1 || !hash2) return false;

  // Normalize both hashes (remove 0x prefix and lowercase)
  const normalized1 = hash1.toLowerCase().replace('0x', '');
  const normalized2 = hash2.toLowerCase().replace('0x', '');

  return normalized1 === normalized2;
}

/**
 * Extract file metadata for logging/auditing
 * @param {File} file - File object
 * @returns {Object} Metadata object
 */
export function extractFileMetadata(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    lastModifiedDate: new Date(file.lastModified).toISOString(),
  };
}

export default {
  computeCertificateHash,
  hexToBytes32,
  validateCertificateFile,
  generateCertificatePath,
  formatHashForDisplay,
  compareHashes,
  extractFileMetadata,
};
