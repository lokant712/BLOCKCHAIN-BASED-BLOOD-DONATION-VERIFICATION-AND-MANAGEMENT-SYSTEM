import { useState } from 'react';
import { verifyHashOnBlockchain, getDonorBlockchainRecord } from '../../../services/blockchainVerificationService';
import { computeCertificateHash, formatHashForDisplay, compareHashes } from '../../../utils/certificateHash';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

/**
 * Certificate Verification Interface
 * Allows anyone to verify certificate authenticity using blockchain
 */
export default function CertificateVerification() {
  const [verificationMode, setVerificationMode] = useState('file'); // 'file' or 'address'
  
  // File verification state
  const [file, setFile] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Address lookup state
  const [lookupAddress, setLookupAddress] = useState('');
  
  // Results state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
    setVerificationResult(null);
    setError(null);
  };

  /**
   * Verify certificate by file hash
   */
  const handleVerifyFile = async (e) => {
    e.preventDefault();
    
    if (!file || !walletAddress) {
      setError('Please select a file and enter wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError('Invalid Ethereum wallet address format');
      return;
    }

    setVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      // Compute file hash
      console.log('Computing certificate hash...');
      const certHash = await computeCertificateHash(file);
      console.log('Certificate hash:', certHash);

      // Verify on blockchain
      console.log('Verifying on blockchain...');
      const result = await verifyHashOnBlockchain(walletAddress, certHash);

      setVerificationResult({
        mode: 'file',
        certHash,
        walletAddress,
        ...result,
      });
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Lookup donor record by address
   */
  const handleLookupAddress = async (e) => {
    e.preventDefault();
    
    if (!lookupAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(lookupAddress)) {
      setError('Invalid Ethereum wallet address format');
      return;
    }

    setVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      console.log('Looking up blockchain record for:', lookupAddress);
      const record = await getDonorBlockchainRecord(lookupAddress);

      if (!record) {
        setError('No verification record found for this address');
        setVerifying(false);
        return;
      }

      setVerificationResult({
        mode: 'address',
        walletAddress: lookupAddress,
        certHash: record.certHash,
        eligible: record.eligible,
        timestamp: record.timestamp,
        timestampDate: record.timestampDate,
        exists: record.exists,
      });
    } catch (err) {
      console.error('Lookup error:', err);
      setError(err.message || 'Lookup failed');
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Clear form
   */
  const handleClear = () => {
    setFile(null);
    setWalletAddress('');
    setLookupAddress('');
    setVerificationResult(null);
    setError(null);
  };

  /**
   * Render verification result
   */
  const renderResult = () => {
    if (!verificationResult) return null;

    const isValid = verificationResult.mode === 'file' 
      ? verificationResult.matches && verificationResult.eligible
      : verificationResult.eligible;

    return (
      <div className={`mt-6 p-6 rounded-lg border-2 ${
        isValid 
          ? 'bg-green-50 border-green-500' 
          : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {isValid ? (
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${
              isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {isValid ? '✓ Certificate Verified' : '✗ Verification Failed'}
            </h3>

            <div className="space-y-3">
              {verificationResult.mode === 'file' && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Certificate Hash Matches:</p>
                    <p className={`text-lg font-semibold ${
                      verificationResult.matches ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {verificationResult.matches ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Computed Hash:</p>
                    <code className="block bg-white px-3 py-2 rounded text-xs font-mono mt-1">
                      {verificationResult.certHash}
                    </code>
                  </div>
                </>
              )}

              {verificationResult.mode === 'address' && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Certificate Hash:</p>
                  <code className="block bg-white px-3 py-2 rounded text-xs font-mono mt-1">
                    {verificationResult.certHash}
                  </code>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700">Donor Eligibility:</p>
                <p className={`text-lg font-semibold ${
                  verificationResult.eligible ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult.eligible ? 'Eligible' : 'Not Eligible'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Wallet Address:</p>
                <code className="block bg-white px-3 py-2 rounded text-xs font-mono mt-1">
                  {verificationResult.walletAddress}
                </code>
              </div>

              {verificationResult.timestampDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Verified On Blockchain:</p>
                  <p className="text-gray-900 mt-1">
                    {verificationResult.timestampDate.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600">
                  {isValid ? (
                    <>
                      This certificate has been verified on the blockchain and the donor is eligible.
                      The certificate is authentic and has not been tampered with.
                    </>
                  ) : (
                    <>
                      {verificationResult.mode === 'file' && !verificationResult.matches && (
                        <>The provided certificate file does not match the blockchain record. The file may have been modified.</>
                      )}
                      {!verificationResult.eligible && (
                        <>The donor has been marked as not eligible by hospital staff.</>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Certificate Blockchain Verification
      </h2>
      
      <p className="text-gray-600 mb-6">
        Verify the authenticity and eligibility of donor health certificates using blockchain technology.
      </p>

      {/* Mode Selection */}
      <div className="mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => {
              setVerificationMode('file');
              handleClear();
            }}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              verificationMode === 'file'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Verify by File
          </button>
          <button
            onClick={() => {
              setVerificationMode('address');
              handleClear();
            }}
            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              verificationMode === 'address'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Lookup by Address
          </button>
        </div>
      </div>

      {/* File Verification Form */}
      {verificationMode === 'file' && (
        <form onSubmit={handleVerifyFile} className="space-y-6">
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
                hover:file:bg-red-100"
              disabled={verifying}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload the certificate file to verify
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donor Wallet Address *
            </label>
            <Input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              disabled={verifying}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the Ethereum wallet address linked to this certificate
            </p>
          </div>

          {file && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Selected File:</p>
              <p className="text-sm text-gray-600">{file.name}</p>
              <p className="text-sm text-gray-600">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!file || !walletAddress || verifying}
              className="flex-1"
            >
              {verifying ? 'Verifying...' : 'Verify Certificate'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={verifying}
            >
              Clear
            </Button>
          </div>
        </form>
      )}

      {/* Address Lookup Form */}
      {verificationMode === 'address' && (
        <form onSubmit={handleLookupAddress} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donor Wallet Address *
            </label>
            <Input
              type="text"
              value={lookupAddress}
              onChange={(e) => setLookupAddress(e.target.value)}
              placeholder="0x..."
              disabled={verifying}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the Ethereum wallet address to lookup verification record
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!lookupAddress || verifying}
              className="flex-1"
            >
              {verifying ? 'Looking up...' : 'Lookup Record'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleClear}
              disabled={verifying}
            >
              Clear
            </Button>
          </div>
        </form>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Verification Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Verification Result */}
      {renderResult()}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          ℹ️ How Verification Works:
        </h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Verify by File:</strong> Upload the certificate and wallet address. 
            The system computes the file hash and checks it against the blockchain record.
          </li>
          <li>
            <strong>Lookup by Address:</strong> Enter a wallet address to view the 
            verification record stored on the blockchain.
          </li>
          <li>
            All verification records are immutable and stored on the Polygon blockchain.
          </li>
          <li>
            Green checkmark = Certificate is authentic and donor is eligible.
          </li>
        </ul>
      </div>
    </div>
  );
}
