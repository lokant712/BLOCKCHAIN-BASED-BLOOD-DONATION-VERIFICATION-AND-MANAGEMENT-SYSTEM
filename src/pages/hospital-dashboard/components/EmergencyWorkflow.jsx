import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import hospitalService from '../../../services/hospitalService';
import emergencyService from '../../../services/emergencyService';

const EmergencyWorkflow = ({ requestId, requestData, onClose }) => {
  const [currentStep, setCurrentStep] = useState('search'); // search, notify, track
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    if (requestData && currentStep === 'search') {
      startDonorSearch();
    }
  }, [requestData, currentStep]);

  const startDonorSearch = async () => {
    setIsSearching(true);
    setSearchProgress(0);

    try {
      console.log('🔍 Starting donor search with requestData:', requestData);
      
      // Simulate search progress
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call real emergency service to find matching donors
      console.log('📞 Calling emergencyService.findMatchingDonors...');
      const donors = await emergencyService.findMatchingDonors(requestData);
      console.log('📊 Emergency service returned donors:', donors);
      
      clearInterval(progressInterval);
      setSearchProgress(100);
      
      // Transform donor data to match component expectations
      const transformedDonors = donors.map(donor => ({
        id: donor.id,
        name: donor.full_name,
        bloodType: donor.blood_type,
        distance: donor.distance || 0,
        phone: donor.phone,
        email: donor.email,
        totalDonations: donor.total_donations || 0,
        lastDonationDate: donor.last_donation_date,
        isAvailable: donor.is_available,
        city: donor.city,
        state: donor.state,
        latitude: donor.latitude,
        longitude: donor.longitude,
        isEligible: donor.isEligible,
        eligibilityReason: donor.eligibilityReason,
        canBeSelected: donor.canBeSelected
      }));
      
      setTimeout(() => {
        setMatchedDonors(transformedDonors);
        setIsSearching(false);
        setCurrentStep('notify');
      }, 500);

    } catch (error) {
      console.error('Error searching for donors:', error);
      setIsSearching(false);
      setSearchProgress(0);
      
      // Show error message to user
      alert(`Error finding donors: ${error.message}`);
    }
  };

  const handleDonorSelect = (donorId) => {
    setSelectedDonors(prev => {
      if (prev.includes(donorId)) {
        return prev.filter(id => id !== donorId);
      } else {
        return [...prev, donorId];
      }
    });
  };

  const handleNotifySelectedDonors = async () => {
    if (selectedDonors.length === 0) {
      alert('Please select at least one donor to notify.');
      return;
    }

    console.log('🚀 Starting notification process for selected donors:', selectedDonors);
    console.log('🆔 Request ID:', requestId);
    console.log('📊 Request Data:', requestData);
    setIsNotifying(true);
    try {
      // Filter matched donors to only selected ones
      const selectedDonorObjects = matchedDonors.filter(donor => selectedDonors.includes(donor.id));
      console.log('📋 Selected donor objects:', selectedDonorObjects);
      
      // Use real emergency service to notify selected donors
      console.log('📱 Calling emergencyService.notifyDonors with:', {
        requestId,
        donorCount: selectedDonorObjects.length,
        requestData: requestData
      });
      
      // Validate requestId
      if (!requestId) {
        throw new Error('Request ID is missing');
      }
      
      const notifications = await emergencyService.notifyDonors(requestId, selectedDonorObjects, requestData);
      console.log('✅ Notifications sent successfully:', notifications);
      
      // Check if notifications were actually created
      if (!notifications || notifications.length === 0) {
        throw new Error('No notifications were created. Check if the "notified" status exists in the database enum.');
      }
      
      // Transform notifications to match component expectations
      // Note: These are notification records, not actual donor responses
      const transformedResponses = notifications.map(notification => {
        // Find the corresponding donor object to get full contact details
        const donorObject = selectedDonorObjects.find(d => d.id === notification.donor_id);
        
        return {
          id: notification.id,
          donorId: notification.donor_id,
          donorName: notification.donor_name || donorObject?.full_name || 'Unknown Donor',
          bloodType: notification.blood_type,
          status: notification.status, // 'notified'
          phone: notification.phone || donorObject?.phone,
          email: donorObject?.email,
          address: donorObject?.address ? 
            `${donorObject.address}${donorObject.city ? `, ${donorObject.city}` : ''}${donorObject.state ? `, ${donorObject.state}` : ''}` :
            null,
          distance: notification.distance || 0,
          respondedAt: notification.created_at,
          message: notification.message,
          availableTime: null // Not available until donor responds
        };
      });

      console.log('✅ Notifications sent successfully to', transformedResponses.length, 'donors');
      console.log('📊 Transformed responses:', transformedResponses);
      
      // Close the emergency workflow popup after successful notification
      console.log('🚪 Closing emergency workflow popup');
      onClose();
    } catch (error) {
      console.error('❌ Error notifying selected donors:', error);
      alert(`Error sending notifications: ${error.message}`);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleNotifyDonors = async () => {
    setIsNotifying(true);
    try {
      // Use real emergency service to notify donors
      const notifications = await emergencyService.notifyDonors(requestId, matchedDonors, requestData);
      
      // Transform notifications to match component expectations
      // Note: These are notification placeholders, not actual donor responses
      const transformedResponses = notifications.map(notification => ({
        id: notification.id,
        donorId: notification.donor_id,
        donorName: matchedDonors.find(d => d.id === notification.donor_id)?.name || 'Unknown Donor',
        bloodType: requestData.bloodType,
        status: 'notified', // Mark as notified, not pending
        phone: matchedDonors.find(d => d.id === notification.donor_id)?.phone,
        distance: matchedDonors.find(d => d.id === notification.donor_id)?.distance || 0,
        respondedAt: notification.responded_at,
        message: notification.message,
        availableTime: notification.available_time
      }));

      setDonorResponses(transformedResponses);
      setCurrentStep('track');
    } catch (error) {
      console.error('Error notifying donors:', error);
      alert(`Error sending notifications: ${error.message}`);
    } finally {
      setIsNotifying(false);
    }
  };


  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Emergency Blood Request Workflow</h2>
                <p className="text-sm text-gray-600">
                  {requestData?.bloodType} blood needed - {requestData?.urgency?.toUpperCase()}
                </p>
                <p className="text-xs text-blue-600">Current Step: {currentStep}</p>
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

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { id: 'search', label: 'Search Donors', icon: 'Search' },
              { id: 'notify', label: 'Notify Donors', icon: 'Bell' }
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step.id ? 'bg-red-600 text-white' : 
                  ['search', 'notify'].indexOf(currentStep) > index ? 'bg-green-600 text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}>
                  <Icon name={step.icon} size={16} />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.id ? 'text-red-600' : 
                  ['search', 'notify', 'track'].indexOf(currentStep) > index ? 'text-green-600' : 
                  'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    ['search', 'notify', 'track'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Search Donors */}
          {currentStep === 'search' && (
            <div className="text-center">
              {isSearching ? (
                <div>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Search" size={32} className="text-red-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Searching for Compatible Donors</h3>
                  <p className="text-gray-600 mb-6">
                    Finding donors with {requestData?.bloodType} blood type within your area...
                  </p>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className="bg-red-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${searchProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">{searchProgress}% complete</p>
                </div>
              ) : (
                <div>
                  <Icon name="CheckCircle" size={48} className="text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Search Complete</h3>
                  <p className="text-gray-600">Found {matchedDonors.length} compatible donors</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select and Notify Donors */}
          {currentStep === 'notify' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Donors to Notify</h3>
                <p className="text-gray-600">
                  Choose which donors to send the emergency request to. Selected donors will see this request in their urgent requests panel.
                </p>
                <div className="mt-2 text-sm text-blue-600">
                  {selectedDonors.length} of {matchedDonors.filter(d => d.canBeSelected !== false).length} eligible donors selected
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {matchedDonors.length} total donors found ({matchedDonors.filter(d => d.isEligible !== false).length} eligible)
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {matchedDonors.map((donor) => {
                  const isSelected = selectedDonors.includes(donor.id);
                  const isEligible = donor.isEligible !== false; // Default to true if not specified
                  const canBeSelected = donor.canBeSelected !== false; // Default to true if not specified
                  
                  return (
                    <div 
                      key={donor.id} 
                      className={`border rounded-lg p-4 transition-all ${
                        !canBeSelected 
                          ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                          : isSelected 
                            ? 'border-red-500 bg-red-50 cursor-pointer' 
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                      onClick={() => canBeSelected && handleDonorSelect(donor.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            !canBeSelected 
                              ? 'border-gray-300 bg-gray-200' 
                              : isSelected 
                                ? 'border-red-500 bg-red-500' 
                                : 'border-gray-300'
                          }`}>
                            {isSelected && canBeSelected && <Icon name="Check" size={12} className="text-white" />}
                            {!canBeSelected && <Icon name="X" size={10} className="text-gray-400" />}
                          </div>
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Icon name="User" size={20} className="text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{donor.name || donor.full_name}</h4>
                            <p className="text-sm text-gray-600 mb-1">
                              {donor.bloodType} • {donor.distance} km away • {donor.totalDonations} donations
                            </p>
                            
                            {/* Eligibility Status */}
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isEligible 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                <Icon 
                                  name={isEligible ? "Check" : "X"} 
                                  size={10} 
                                  className="mr-1" 
                                />
                                {isEligible ? 'Eligible' : 'Not Eligible'}
                              </span>
                              {!isEligible && donor.eligibilityReason && (
                                <p className="text-xs text-red-600 mt-1">{donor.eligibilityReason}</p>
                              )}
                            </div>
                            
                            {/* Contact Information */}
                            <div className="space-y-1">
                              {donor.phone && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Icon name="Phone" size={12} className="mr-1 text-green-600" />
                                  {donor.phone}
                                </p>
                              )}
                              {donor.email && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Icon name="Mail" size={12} className="mr-1 text-blue-600" />
                                  {donor.email}
                                </p>
                              )}
                              {(donor.address || donor.city || donor.state) && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Icon name="MapPin" size={12} className="mr-1 text-red-600" />
                                  {donor.address ? 
                                    `${donor.address}${donor.city ? `, ${donor.city}` : ''}${donor.state ? `, ${donor.state}` : ''}` :
                                    donor.city && donor.state ? `${donor.city}, ${donor.state}` : donor.city || donor.state
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon name="Phone" size={16} className="text-green-600" />
                          <Icon name="Mail" size={16} className="text-blue-600" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      const eligibleDonorIds = matchedDonors
                        .filter(d => d.canBeSelected !== false)
                        .map(d => d.id);
                      setSelectedDonors(eligibleDonorIds);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
                  >
                    Select All Eligible
                  </Button>
                  <Button
                    onClick={() => setSelectedDonors([])}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
                  >
                    Clear All
                  </Button>
                </div>
                
                <Button
                  onClick={handleNotifySelectedDonors}
                  disabled={isNotifying || selectedDonors.length === 0}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 disabled:bg-gray-400"
                >
                  {isNotifying ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                      Sending Requests...
                    </>
                  ) : (
                    <>
                      <Icon name="Bell" size={16} className="mr-2" />
                      Send Request to {selectedDonors.length} Selected Donor{selectedDonors.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmergencyWorkflow;
