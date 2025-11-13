import { useState, useEffect } from 'react';
import { getPendingCertificates, getVerifiedCertificates, downloadCertificate, verifyCertificateOnBlockchain } from '../../../services/blockchainVerificationService';
import { computeCertificateHash, formatHashForDisplay } from '../../../utils/certificateHash';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

/**
 * Admin Certificate Approval Interface
 * Allows hospital staff and admins to review and approve donor certificates
 */
export default function CertificateApproval() {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [verifiedCerts, setVerifiedCerts] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'verified'
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);
  
  // Modal state for certificate review
  const [reviewModal, setReviewModal] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  /**
   * Load certificates on mount
   */
  useEffect(() => {
    loadCertificates();
  }, []);

  /**
   * Fetch all certificates
   */
  const loadCertificates = async () => {
    setLoading(true);
    setError(null);
    
    // Clear existing state to force fresh render
    setPendingCerts([]);
    setVerifiedCerts([]);
    
    try {
      const [pending, verified] = await Promise.all([
        getPendingCertificates(),
        getVerifiedCertificates(),
      ]);

      // Force new object references to trigger re-render
      setPendingCerts([...pending]);
      setVerifiedCerts([...verified]);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open review modal
   */
  const openReviewModal = (certificate) => {
    setReviewModal(certificate);
    setWalletAddress(certificate.donor_wallet_address || ''); // Pre-fill wallet address
    setAdminNotes('');
  };

  /**
   * Close review modal
   */
  const closeReviewModal = () => {
    setReviewModal(null);
    setWalletAddress('');
    setAdminNotes('');
  };

  /**
   * Download and preview certificate
   */
  const handleDownloadCertificate = async (filePath, fileName) => {
    try {
      const blob = await downloadCertificate(filePath);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'certificate';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download certificate: ' + err.message);
    }
  };

  /**
   * Approve certificate and store on blockchain
   */
  const handleApprove = async () => {
    if (!reviewModal || !walletAddress) {
      alert('Please enter the donor\'s wallet address');
      return;
    }

    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      alert('Invalid Ethereum wallet address format');
      return;
    }

    setProcessingId(reviewModal.id);
    
    try {
      // Call Edge Function to verify on blockchain
      const result = await verifyCertificateOnBlockchain(
        reviewModal.id,
        walletAddress,
        true, // eligible = true
        adminNotes
      );

      alert(
        `Certificate approved successfully!\n\n` +
        `Transaction Hash: ${result.txHash}\n` +
        `Block Number: ${result.blockNumber}\n` +
        `Certificate Hash: ${formatHashForDisplay(result.certHash)}`
      );

      // Reload certificates
      await loadCertificates();
      closeReviewModal();
    } catch (err) {
      console.error('Approval error:', err);
      alert('Failed to approve certificate: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Reject certificate
   */
  const handleReject = async () => {
    if (!reviewModal || !walletAddress) {
      alert('Please enter the donor\'s wallet address');
      return;
    }

    // Validate Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      alert('Invalid Ethereum wallet address format');
      return;
    }

    if (!confirm('Are you sure you want to reject this certificate?')) {
      return;
    }

    setProcessingId(reviewModal.id);
    
    try {
      // Call Edge Function to record rejection on blockchain
      const result = await verifyCertificateOnBlockchain(
        reviewModal.id,
        walletAddress,
        false, // eligible = false
        adminNotes || 'Certificate rejected'
      );

      alert(`Certificate rejected and recorded on blockchain.\nTransaction Hash: ${result.txHash}`);

      // Reload certificates
      await loadCertificates();
      closeReviewModal();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Failed to reject certificate: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Render certificate card
   */
  const renderCertificateCard = (cert, isPending) => (
    <div key={`cert-${cert.id}-${cert.donor_id}`} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {cert.donor?.full_name || 'Unknown Donor'}
          </h3>
          <p className="text-sm text-gray-600">Blood Type: {cert.donor?.blood_type || 'N/A'}</p>
          <p className="text-sm text-gray-600">Phone: {cert.donor?.phone || 'N/A'}</p>
        </div>
        <div className="text-right">
          {isPending ? (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Pending Review
            </span>
          ) : (
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              cert.eligible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {cert.eligible ? 'Approved' : 'Rejected'}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Uploaded:</span>{' '}
          {new Date(cert.created_at).toLocaleDateString()}
        </p>
        
        {cert.donor_wallet_address && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Wallet:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {cert.donor_wallet_address.slice(0, 6)}...{cert.donor_wallet_address.slice(-4)}
            </code>
          </p>
        )}
        
        {cert.cert_hash && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Hash:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {formatHashForDisplay(cert.cert_hash)}
            </code>
          </p>
        )}

        {cert.verified_at && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Verified:</span>{' '}
            {new Date(cert.verified_at).toLocaleDateString()}
          </p>
        )}

        {cert.tx_hash && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">TX Hash:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {formatHashForDisplay(cert.tx_hash)}
            </code>
          </p>
        )}

        {cert.admin_notes && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {cert.admin_notes}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleDownloadCertificate(cert.file_path, 'certificate.pdf')}
        >
          Download
        </Button>
        
        {isPending && (
          <Button
            size="sm"
            onClick={() => openReviewModal(cert)}
          >
            Review
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Certificate Verification Management
        </h2>
        <p className="text-gray-600">
          Review and approve donor health certificates for blockchain verification
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending ({pendingCerts.length})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'verified'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Verified ({verifiedCerts.length})
          </button>
        </nav>
      </div>

      {/* Certificate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'pending' ? (
          pendingCerts.length > 0 ? (
            pendingCerts.map(cert => renderCertificateCard(cert, true))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No pending certificates
            </div>
          )
        ) : (
          verifiedCerts.length > 0 ? (
            verifiedCerts.map(cert => renderCertificateCard(cert, false))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No verified certificates
            </div>
          )
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Review Certificate
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Donor:</p>
                  <p className="text-gray-900">{reviewModal.donor?.full_name || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Blood Type:</p>
                  <p className="text-gray-900">{reviewModal.donor?.blood_type || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Uploaded:</p>
                  <p className="text-gray-900">{new Date(reviewModal.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donor Ethereum Wallet Address *
                    {reviewModal.donor_wallet_address && (
                      <span className="text-green-600 ml-2">(Auto-filled)</span>
                    )}
                  </label>
                  <Input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reviewModal.donor_wallet_address 
                      ? 'This address was provided by the donor during upload. Verify before approving.'
                      : 'Enter the donor\'s Ethereum wallet address'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Add any notes about this verification..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={!walletAddress || processingId === reviewModal.id}
                  className="flex-1"
                >
                  {processingId === reviewModal.id ? 'Processing...' : 'Approve'}
                </Button>
                
                <Button
                  onClick={handleReject}
                  disabled={!walletAddress || processingId === reviewModal.id}
                  variant="secondary"
                  className="flex-1 bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Reject
                </Button>
                
                <Button
                  onClick={closeReviewModal}
                  variant="secondary"
                  disabled={processingId === reviewModal.id}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
