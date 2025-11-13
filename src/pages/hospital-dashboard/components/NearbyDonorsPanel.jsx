import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import nearbyDonorService from '../../../services/nearbyDonorService';
import { formatDistance, getEstimatedTravelTime } from '../../../utils/geoUtils';

/**
 * Component for displaying and managing nearby donors for a blood request
 * Provides search, filtering, and notification capabilities
 */
const NearbyDonorsPanel = ({ requestData, onDonorSelect, onClose }) => {
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortBy, setSortBy] = useState('distance');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (requestData) {
      searchNearbyDonors();
    }
  }, [requestData, searchRadius, sortBy]);

  const searchNearbyDonors = async () => {
    if (!requestData) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Searching for nearby donors:', requestData);
      
      const result = await nearbyDonorService.findNearbyDonors(requestData, {
        maxDistance: searchRadius,
        maxResults: 20,
        sortBy: sortBy
      });

      setDonors(result.donors);
      setStats(result);

      console.log('Found nearby donors:', result);
    } catch (err) {
      console.error('Error searching nearby donors:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotifyDonors = async (selectedDonors) => {
    try {
      const donorIds = selectedDonors.map(donor => donor.id);
      const result = await nearbyDonorService.notifyNearbyDonors(requestData, donorIds);
      
      console.log('Notified donors:', result);
      alert(`Successfully notified ${result.notifiedCount} donors!`);
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error notifying donors:', err);
      alert('Failed to notify donors. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEligibilityColor = (eligible) => {
    return eligible ? 'text-green-600' : 'text-red-600';
  };

  if (!requestData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Icon name="Search" size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a blood request to find nearby donors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Nearby Donors</h3>
            <p className="text-sm text-gray-600">
              {requestData.bloodType} • {requestData.unitsNeeded} units needed
            </p>
          </div>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>
      </div>

      {/* Search Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius: {searchRadius}km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="distance">Distance</option>
              <option value="last_donation">Last Donation</option>
              <option value="total_donations">Experience</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="px-6 py-3 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              <strong>{stats.eligibleCount}</strong> eligible donors found
            </span>
            <span className="text-blue-600">
              {stats.totalCount} total donors in {stats.searchRadius}km radius
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Searching for nearby donors...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <Icon name="AlertTriangle" size={32} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error searching donors</p>
            <p className="text-sm text-gray-600">{error}</p>
            <Button
              onClick={searchNearbyDonors}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && donors.length === 0 && (
          <div className="text-center py-8">
            <Icon name="Users" size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No nearby donors found</p>
            <p className="text-sm text-gray-400 mt-2">
              Try increasing the search radius or check if donors are available
            </p>
          </div>
        )}

        {!isLoading && !error && donors.length > 0 && (
          <div className="space-y-4">
            {/* Donor List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {donors.map((donor) => (
                <div
                  key={donor.id}
                  className={`p-4 border rounded-lg ${
                    donor.eligibility.eligible 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{donor.full_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          donor.eligibility.eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {donor.eligibility.eligible ? 'Eligible' : 'Not Eligible'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {donor.blood_type} • {donor.distanceFormatted}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Phone:</strong> {donor.phone || 'Not provided'}</p>
                          <p><strong>Location:</strong> {donor.city}, {donor.state}</p>
                        </div>
                        <div>
                          <p><strong>Donations:</strong> {donor.total_donations || 0}</p>
                          <p><strong>Travel Time:</strong> {donor.travelTime.formatted}</p>
                        </div>
                      </div>

                      {donor.last_donation_date && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last donation: {new Date(donor.last_donation_date).toLocaleDateString()}
                        </p>
                      )}

                      {!donor.eligibility.eligible && donor.eligibility.reasons.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600">
                            <strong>Reasons:</strong> {donor.eligibility.reasons.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      {donor.eligibility.eligible && (
                        <Button
                          onClick={() => onDonorSelect && onDonorSelect(donor)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                        >
                          <Icon name="Phone" size={14} className="mr-1" />
                          Contact
                        </Button>
                      )}
                      <Button
                        onClick={() => window.open(`tel:${donor.phone}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                      >
                        <Icon name="Phone" size={14} className="mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {donors.filter(d => d.eligibility.eligible).length} eligible donors
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    const eligibleDonors = donors.filter(d => d.eligibility.eligible);
                    if (eligibleDonors.length > 0) {
                      handleNotifyDonors(eligibleDonors);
                    } else {
                      alert('No eligible donors to notify');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                >
                  <Icon name="Bell" size={16} className="mr-2" />
                  Notify All Eligible
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyDonorsPanel;

