import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import realtimeService from '../../../services/realtimeService';

const DonorResponseTracker = ({ requestId, onClose }) => {
  const [donorResponses, setDonorResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedDonor, setConnectedDonor] = useState(null);

  useEffect(() => {
    loadDonorResponses();
    setupRealtimeSubscription();
  }, [requestId]);

  const loadDonorResponses = async () => {
    try {
      setIsLoading(true);
      // Load existing donor responses for this request
      // This would be implemented based on your API structure
      console.log('Loading donor responses for request:', requestId);
      // For now, we'll use empty array - you can implement the actual API call
      setDonorResponses([]);
    } catch (error) {
      console.error('Error loading donor responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      // Subscribe to real-time donor responses for this specific request
      const subscription = await realtimeService.subscribeToDonorResponses(
        requestId, // You might need to pass hospital ID instead
        (responseData) => {
          console.log('New donor response received:', responseData);
          setDonorResponses(prev => {
            // Check if response already exists to avoid duplicates
            const exists = prev.some(resp => resp.id === responseData.id);
            if (exists) return prev;
            
            return [responseData, ...prev];
          });
        }
      );
      
      return subscription;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  };

  const handleConnectDonor = (donor) => {
    setConnectedDonor(donor);
    // Show success message
    alert(`Successfully connected with ${donor.donorName}! The donor has been notified and other donors have been informed that the request is fulfilled.`);
    onClose(); // Close the tracker
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'notified': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <Icon name="Loader2" size={48} className="animate-spin mx-auto mb-4 text-red-600" />
            <p className="text-gray-600">Loading donor responses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Activity" size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Donor Response Tracker</h2>
                <p className="text-sm text-gray-600">
                  Monitor real-time responses from donors
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Donor Responses</h3>
            <p className="text-gray-600">Monitor real-time responses from donors</p>
          </div>

          <div className="space-y-4">
            {donorResponses.map((response) => (
              <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{response.donorName}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {response.bloodType} • {response.distance} km away
                      </p>
                      
                      {/* Contact Information */}
                      <div className="space-y-1">
                        {response.phone && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="Phone" size={12} className="mr-1 text-green-600" />
                            {response.phone}
                          </p>
                        )}
                        {response.email && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="Mail" size={12} className="mr-1 text-blue-600" />
                            {response.email}
                          </p>
                        )}
                        {response.address && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <Icon name="MapPin" size={12} className="mr-1 text-red-600" />
                            {response.address}
                          </p>
                        )}
                      </div>
                      
                      {response.message && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">"{response.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                      {response.status}
                    </span>
                    {response.status === 'accepted' && (
                      <Button
                        onClick={() => handleConnectDonor(response)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                      >
                        <Icon name="Phone" size={14} className="mr-2" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {donorResponses.length === 0 && (
            <div className="text-center py-8">
              <Icon name="Clock" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4 opacity-50" />
              <p className="text-gray-600">No donor responses yet. Responses will appear here as they come in.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorResponseTracker;
