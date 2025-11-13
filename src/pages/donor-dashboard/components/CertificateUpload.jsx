import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadCertificate, createCertificateRecord } from '../../../services/blockchainVerificationService';
import { computeCertificateHash, validateCertificateFile, extractFileMetadata } from '../../../utils/certificateHash';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

/**
 * Certificate Upload Component for Donors
 * Allows donors to upload health certificates for blockchain verification
 */
export default function CertificateUpload({ onUploadComplete }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      setError(null);
      return;
    }

    // Validate file
    const validation = validateCertificateFile(selectedFile, {
      maxSizeMB: 10,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    });

    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  /**
   * Handle upload submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !walletAddress) {
      setError('Please select a file and enter your wallet address');
      return;
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Invalid Ethereum wallet address format');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Compute file hash client-side (for transparency)
      const certHash = await computeCertificateHash(file);

      // Upload file to Supabase Storage
      const uploadResult = await uploadCertificate(file, user.id);

      // Extract file metadata
      const metadata = extractFileMetadata(file);

      // Create database record
      const certificateData = {
        donor_id: user.id,
        file_path: uploadResult.path,
        cert_hash: certHash,
        donor_wallet_address: walletAddress, // Save wallet address
        eligible: null, // Pending review
        tx_hash: null,
        chain_address: null,
      };

      await createCertificateRecord(certificateData);

      console.log('Certificate uploaded successfully!');
      setSuccess(true);
      
      // Reset form
      setFile(null);
      setWalletAddress('');
      setPreviewUrl(null);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Show success message for 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload certificate');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clear form
   */
  const handleClear = () => {
    setFile(null);
    setWalletAddress('');
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Upload Health Certificate
      </h2>
      
      <p className="text-gray-600 mb-6">
        Upload your health certificate for blockchain verification. Once approved by hospital staff,
        your certificate will be permanently recorded on the blockchain for authenticity.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ethereum Wallet Address *
          </label>
          <Input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full"
            disabled={isUploading}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Your Ethereum address will be linked to your certificate on the blockchain
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certificate File *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-red-50 file:text-red-700
              hover:file:bg-red-100
              disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Accepted formats: PDF, JPG, PNG (Max 10MB)
          </p>
        </div>

        {/* File Preview */}
        {file && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected File:</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {file.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {file.type}
              </p>
            </div>
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4">
                <img 
                  src={previewUrl} 
                  alt="Certificate preview" 
                  className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Certificate uploaded successfully!</p>
            <p className="text-sm mt-1">Your certificate is now pending review by hospital staff.</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={!file || !walletAddress || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload Certificate'
            )}
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleClear}
            disabled={isUploading}
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
