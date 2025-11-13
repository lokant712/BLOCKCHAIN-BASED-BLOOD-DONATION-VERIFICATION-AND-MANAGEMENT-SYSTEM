import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import hospitalService from '../../services/hospitalService';
import emergencyService from '../../services/emergencyService';
import realtimeService from '../../services/realtimeService';
import notificationService from '../../services/notificationService';
import nearbyDonorService from '../../services/nearbyDonorService';
import EmergencyWorkflow from './components/EmergencyWorkflow';
import EmergencyRequestForm from './components/EmergencyRequestForm';
import NearbyDonorsPanel from './components/NearbyDonorsPanel';
import DonorResponseTracker from './components/DonorResponseTracker';
import CertificateApproval from './components/CertificateApproval'; // Added CertificateApproval import
import CertificateVerification from './components/CertificateVerification'; // Added CertificateVerification import
import { authHelper } from '../../utils/authHelper';
import { supabase } from '../../lib/supabase';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard data
  const [bloodRequests, setBloodRequests] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [hospitalStats, setHospitalStats] = useState({});
  const [emergencyStats, setEmergencyStats] = useState({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showEmergencyWorkflow, setShowEmergencyWorkflow] = useState(false);
  const [emergencyRequestId, setEmergencyRequestId] = useState(null);
  const [emergencyRequestData, setEmergencyRequestData] = useState(null);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showDonorTracker, setShowDonorTracker] = useState(false);
  const [trackingRequestId, setTrackingRequestId] = useState(null);
  const [showDonorDetails, setShowDonorDetails] = useState(false);
  const [selectedRequestForDonorDetails, setSelectedRequestForDonorDetails] = useState(null);
  
  // Inventory editing state
  const [isEditingInventory, setIsEditingInventory] = useState(false);
  const [editingInventory, setEditingInventory] = useState({});
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  
  // Real-time state
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [donorResponses, setDonorResponses] = useState([]);
  const [newDonorResponse, setNewDonorResponse] = useState(null);
  
  // Nearby donors state
  const [showNearbyDonors, setShowNearbyDonors] = useState(false);
  const [selectedRequestForDonors, setSelectedRequestForDonors] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    bloodType: 'all',
    urgency: 'all',
    status: 'all',
    sortBy: 'newest'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Set up real-time subscriptions for hospital
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscriptions for hospital:', user.id);

    const setupRealtimeSubscriptions = async () => {
      try {
        // Subscribe to donor responses
        const responseSubscription = await realtimeService.subscribeToDonorResponses(
          user.id,
          (responseData) => {
            console.log('New donor response received:', responseData);
            
            // Only process actual donor responses (accepted/declined), not pending notifications
            if (responseData.status === 'pending') {
              console.log('Skipping pending notification - waiting for actual donor response');
              return;
            }
            
            // Add to donor responses list
            setDonorResponses(prev => {
              // Check if response already exists to avoid duplicates
              const exists = prev.some(resp => resp.id === responseData.id);
              if (exists) return prev;
              
              return [responseData, ...prev];
            });

            // If donor accepted, automatically update request status to fulfilled
            if (responseData.status === 'accepted') {
              console.log('Donor accepted request, updating status to fulfilled');
              handleUpdateRequestStatus(responseData.request_id, 'fulfilled');
              
              // Force refresh of blood requests to show updated donor response count
              setTimeout(() => {
                console.log('Refreshing blood requests after donor acceptance');
                loadDashboardData();
              }, 1000);
            }

            // Show browser notification
            notificationService.showDonorResponseNotification(responseData);
            
            // Set new donor response for UI highlighting
            setNewDonorResponse(responseData);
            
            // Clear the highlight after 10 seconds
            setTimeout(() => {
              setNewDonorResponse(null);
            }, 10000);
          }
        );

        // Subscribe to request updates
        const updateSubscription = await realtimeService.subscribeToRequestUpdates(
          user.id,
          (updateData) => {
            console.log('Blood request update received:', updateData);
            // Refresh dashboard data when requests are updated
            loadDashboardData();
          }
        );

        if (responseSubscription || updateSubscription) {
          setRealtimeConnected(true);
          console.log('Real-time subscriptions established successfully');
        } else {
          console.log('Failed to establish real-time subscriptions');
        }
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
      }
    };

    setupRealtimeSubscriptions();

    // Set up notification event listeners
    const handleDonorResponseNotificationClick = (event) => {
      const { response } = event.detail;
      console.log('Donor response notification clicked:', response);
      // You can add navigation logic here if needed
    };

    window.addEventListener('donor-response-notification-clicked', handleDonorResponseNotificationClick);

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      realtimeService.unsubscribe(`responses_${user.id}`);
      realtimeService.unsubscribe(`updates_${user.id}`);
      window.removeEventListener('donor-response-notification-clicked', handleDonorResponseNotificationClick);
      setRealtimeConnected(false);
    };
  }, [user?.id]);

  const loadDashboardData = async () => {
    // Check Supabase authentication first
    const supabaseUser = await authHelper.checkAuth();
    if (!supabaseUser) {
      console.log('No Supabase user found, trying anonymous auth...');
      await authHelper.signInAnonymously();
    }

    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      navigate('/user-login');
      return;
    }

    const userData = JSON.parse(userSession);
    setUser(userData);

    if (userData?.id) {
      console.log('🏥 HospitalDashboard: Loading data for user ID:', userData.id);
      setIsLoading(true);
      try {
        // Load requests first (most important)
        const requests = await hospitalService.getBloodRequests(userData.id);
        console.log('🏥 HospitalDashboard: Loaded requests:', requests);
        console.log('🏥 HospitalDashboard: Number of requests:', requests?.length || 0);
        setBloodRequests(requests);

        // Load other data separately to prevent stats errors from affecting requests
        try {
          const [inventory, stats, emergencyStats] = await Promise.all([
            hospitalService.getBloodInventory(userData.id),
            hospitalService.getHospitalStats(userData.id),
            emergencyService.getEmergencyStats(userData.id)
          ]);
          
          setInventoryData(inventory);
          setHospitalStats(stats);
          setEmergencyStats(emergencyStats);
        } catch (statsError) {
          console.error('Failed to load stats/inventory (non-critical):', statsError);
          // Set default values for stats but keep requests
          setInventoryData([]);
          setHospitalStats({});
          setEmergencyStats({});
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setBloodRequests([]);
        setInventoryData([]);
        setHospitalStats({});
        setEmergencyStats({});
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    navigate('/user-login');
  };

  const handleStartEmergency = (request) => {
    setEmergencyRequestId(request.id);
    setEmergencyRequestData({
      bloodType: request.blood_type,
      urgency: request.urgency,
      hospitalName: user?.hospitalName || user?.name,
      city: user?.city || 'Your Area',
      patientAge: request.patient_age,
      patientGender: request.patient_gender,
      latitude: user?.latitude || null,
      longitude: user?.longitude || null,
      hospitalId: user?.id
    });
    setShowEmergencyWorkflow(true);
  };

  const handleCloseEmergencyWorkflow = () => {
    setShowEmergencyWorkflow(false);
    setEmergencyRequestId(null);
    setEmergencyRequestData(null);
    loadDashboardData(); // Refresh data
  };

  const handleTrackResponses = (requestId) => {
    setTrackingRequestId(requestId);
    setShowDonorTracker(true);
  };

  const handleCloseDonorTracker = () => {
    setShowDonorTracker(false);
    setTrackingRequestId(null);
  };

  const handleCreateEmergencyRequest = async (requestData) => {
    try {
      // The form already creates the request, so we just need to start the emergency workflow
      setEmergencyRequestId(requestData.id);
      setEmergencyRequestData({
        bloodType: requestData.blood_type,
        urgency: requestData.urgency,
        hospitalName: user?.hospitalName || user?.name,
        city: user?.city || 'Your Area',
        patientAge: requestData.patient_age,
        patientGender: requestData.patient_gender,
        latitude: user?.latitude || null,
        longitude: user?.longitude || null,
        hospitalId: user?.id
      });
      setShowEmergencyForm(false);
      setShowEmergencyWorkflow(true);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error handling emergency request:', error);
    }
  };

  const handleCancelEmergencyForm = () => {
    setShowEmergencyForm(false);
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await hospitalService.updateRequestStatus(requestId, status);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const handleFindNearbyDonors = (request) => {
    console.log('Finding nearby donors for request:', request);
    setSelectedRequestForDonors({
      id: request.id,
      bloodType: request.blood_type,
      unitsNeeded: request.units_needed,
      urgency: request.urgency,
      latitude: user.latitude || 40.7128, // Use hospital location or default
      longitude: user.longitude || -74.0060,
      hospitalName: user.hospitalName || user.name
    });
    setShowNearbyDonors(true);
  };

  const handleShowDonorDetails = async (request) => {
    console.log('Showing donor details for request:', request);
    console.log('Donor responses:', request.donor_responses);
    console.log('Donor responses length:', request.donor_responses?.length);
    console.log('Donor responses type:', typeof request.donor_responses);
    
    // Fetch fresh donor responses for this request
    try {
      const { data: freshDonorResponses, error } = await supabase
        .from('donor_responses')
        .select(`
          id,
          donor_id,
          status,
          contact_preference,
          available_time,
          message,
          created_at,
          user_profiles!left (
            id,
            full_name,
            phone,
            email,
            blood_type,
            address,
            city,
            state,
            zip_code,
            is_available,
            availability_radius,
            date_of_birth,
            last_emergency_response_date,
            gender
          )
        `)
        .eq('request_id', request.id);

      if (error) {
        console.error('Error fetching fresh donor responses:', error);
      } else {
        console.log('Fresh donor responses:', freshDonorResponses);
        console.log('Fresh donor responses count:', freshDonorResponses?.length || 0);
        
        // Update the request with fresh donor responses
        const updatedRequest = {
          ...request,
          donor_responses: freshDonorResponses || []
        };
        
        setSelectedRequestForDonorDetails(updatedRequest);
        setShowDonorDetails(true);
        return;
      }
    } catch (error) {
      console.error('Error in handleShowDonorDetails:', error);
    }
    
    // Fallback to original request if fetching fails
    setSelectedRequestForDonorDetails(request);
    setShowDonorDetails(true);
  };

  const handleCloseDonorDetails = () => {
    setShowDonorDetails(false);
    setSelectedRequestForDonorDetails(null);
  };

  const handleDonorSelect = (donor) => {
    console.log('Selected donor:', donor);
    // You can implement donor contact logic here
    if (donor.phone) {
      window.open(`tel:${donor.phone}`);
    }
  };

  const handleCloseNearbyDonors = () => {
    setShowNearbyDonors(false);
    setSelectedRequestForDonors(null);
  };


  // Inventory editing functions
  const handleStartEditInventory = () => {
    const initialEditingState = {};
    ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].forEach(bloodType => {
      const inventory = inventoryData?.find(item => item.bloodType === bloodType);
      initialEditingState[bloodType] = inventory?.currentUnits || 0;
    });
    setEditingInventory(initialEditingState);
    setIsEditingInventory(true);
  };

  const handleCancelEditInventory = () => {
    setIsEditingInventory(false);
    setEditingInventory({});
  };

  const handleRefreshInventory = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Manually refreshing inventory data...');
      const updatedInventory = await hospitalService.getBloodInventory(user.id);
      console.log('Refreshed inventory data:', updatedInventory);
      setInventoryData(updatedInventory);
    } catch (error) {
      console.error('Failed to refresh inventory:', error);
    }
  };

  const handleInventoryChange = (bloodType, value) => {
    // Allow empty string for better UX during editing
    if (value === '') {
      setEditingInventory(prev => ({
        ...prev,
        [bloodType]: ''
      }));
      return;
    }
    
    const numValue = Math.max(0, parseInt(value) || 0);
    setEditingInventory(prev => ({
      ...prev,
      [bloodType]: numValue
    }));
  };

  const handleSaveInventory = async () => {
    if (!user?.id) {
      alert('User not found. Please log in again.');
      return;
    }
    
    // Validate inventory values
    const invalidEntries = Object.entries(editingInventory).filter(([bloodType, units]) => 
      units === '' || isNaN(units) || units < 0
    );
    
    if (invalidEntries.length > 0) {
      console.error('Invalid inventory values:', invalidEntries);
      alert('Please enter valid numbers for all blood types (0 or greater)');
      return;
    }
    
    setIsSavingInventory(true);
    try {
      console.log('Starting inventory update process...');
      console.log('User ID:', user.id);
      console.log('Inventory data to save:', editingInventory);
      
      // Update each blood type inventory one by one for better error handling
      const results = [];
      for (const [bloodType, units] of Object.entries(editingInventory)) {
        try {
          console.log(`Updating ${bloodType}: ${units} units`);
          const result = await hospitalService.updateBloodInventory(user.id, bloodType, units);
          results.push({ bloodType, success: true, data: result });
        } catch (error) {
          console.error(`Failed to update ${bloodType}:`, error);
          results.push({ bloodType, success: false, error: error.message });
        }
      }
      
      // Check if any updates failed
      const failedUpdates = results.filter(r => !r.success);
      if (failedUpdates.length > 0) {
        console.error('Some inventory updates failed:', failedUpdates);
        alert(`Failed to update some blood types: ${failedUpdates.map(f => f.bloodType).join(', ')}. Please try again.`);
        return;
      }
      
      // Verify data was saved correctly
      console.log('Verifying inventory data...');
      await hospitalService.verifyInventoryData(user.id);
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh inventory data specifically
      console.log('Refreshing inventory data...');
      const updatedInventory = await hospitalService.getBloodInventory(user.id);
      console.log('Updated inventory data:', updatedInventory);
      setInventoryData(updatedInventory);
      
      setIsEditingInventory(false);
      setEditingInventory({});
      
      // Success feedback
      console.log('Inventory updated successfully');
      alert('Blood inventory updated successfully!');
    } catch (error) {
      console.error('Failed to save inventory:', error);
      alert(`Failed to save inventory: ${error.message}. Please check the console for more details.`);
    } finally {
      setIsSavingInventory(false);
    }
  };

  // Filter requests
  const filteredRequests = bloodRequests?.filter(request => {
    if (filters.bloodType !== 'all' && request.blood_type !== filters.bloodType) return false;
    if (filters.urgency !== 'all' && request.urgency !== filters.urgency) return false;
    if (filters.status !== 'all' && request.status !== filters.status) return false;
    return true;
  })?.sort((a, b) => {
    switch (filters.sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'urgency':
        const urgencyOrder = { critical: 4, urgent: 3, normal: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'fulfilled': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hospital Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage blood requests and emergency responses for {user?.hospitalName || user?.name}
              </p>
            </div>
            <Button
              onClick={() => {
                setActiveTab('history');
                setShowEmergencyForm(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Create Emergency Request
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: 'BarChart3' },
              { id: 'history', label: 'Request History', icon: 'History' },
              { id: 'inventory', label: 'Inventory', icon: 'Package' },
              { id: 'certificates', label: 'Certificates', icon: 'FileText' }, // Added Certificates tab
              { id: 'verification', label: 'Verification', icon: 'Shield' } // Added Verification tab
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Real-time Connection Status */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {realtimeConnected ? 'Connected to donor responses' : 'Connecting to donor responses...'}
            </span>
          </div>
          {newDonorResponse && (
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              <Icon name="Heart" size={16} />
              <span>New Donor Response!</span>
            </div>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Icon name="Droplets" size={24} className="text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.totalRequests || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon name="AlertTriangle" size={24} className="text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.criticalRequests || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name="Clock" size={24} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.pendingRequests || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon name="CheckCircle" size={24} className="text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fulfilled</p>
                    <p className="text-2xl font-bold text-gray-900">{hospitalStats.fulfilledRequests || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Blood Requests</h3>
              </div>
              <div className="p-6">
                {filteredRequests?.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.patientName || 'Unknown Patient'}</p>
                        <p className="text-sm text-gray-600">
                          {request.bloodType} • {request.patientAge && request.patientGender 
                            ? `${request.patientGender}, ${request.patientAge} years`
                            : 'Patient details not available'
                          } • 
                          <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </div>
                      {(request.urgency === 'critical' || request.urgency === 'urgent') && (
                        <Button
                          onClick={() => handleStartEmergency(request)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                        >
                          <Icon name="Zap" size={14} className="mr-1" />
                          Emergency
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!filteredRequests || filteredRequests.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No blood requests found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Request History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Emergency Request Form */}
            {showEmergencyForm && (
              <EmergencyRequestForm
                onSubmit={handleCreateEmergencyRequest}
                onCancel={handleCancelEmergencyForm}
                hospitalData={user}
              />
            )}

            {/* Create Emergency Request Button */}
            {!showEmergencyForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Blood Request History</h3>
                    <p className="text-sm text-gray-600">View all blood requests and create new emergency requests</p>
                  </div>
                  <Button
                    onClick={() => setShowEmergencyForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    Create Emergency Request
                  </Button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                  <select
                    value={filters.bloodType}
                    onChange={(e) => setFilters({...filters, bloodType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Types</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Urgency</option>
                    <option value="critical">Critical</option>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="urgency">By Urgency</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Request History Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Blood Request History ({filteredRequests?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Urgency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donor Responses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests?.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.patientName || 'Unknown Patient'}</div>
                            <div className="text-sm text-gray-500">
                              {request.bloodType} • {request.unitsNeeded} units • 
                              <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                                {request.urgency}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.patientAge && request.patientGender 
                              ? `${request.patientGender}, ${request.patientAge} years`
                              : 'Not specified'
                            }
                          </div>
                          <div className="text-sm text-gray-500">{request.medicalCondition || 'No condition specified'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.noResponsesYet ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              No notifications sent
                            </span>
                          ) : request.acceptedResponses > 0 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                              {request.acceptedResponses} accepted
                            </span>
                          ) : request.declinedResponses > 0 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
                              {request.declinedResponses} declined
                            </span>
                          ) : request.notificationsSent ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                              {request.matchedDonors} responses
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              No responses
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.createdAt ? request.createdAt.toLocaleDateString() : 'Invalid Date'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {(request.urgency === 'critical' || request.urgency === 'urgent') && request.status !== 'fulfilled' && (
                              <Button
                                onClick={() => handleStartEmergency(request)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                              >
                                <Icon name="Zap" size={12} className="mr-1" />
                                Emergency
                              </Button>
                            )}
                            {request.status === 'active' && (
                              <Button
                                onClick={() => handleUpdateRequestStatus(request.id, 'fulfilled')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                              >
                                Mark Fulfilled
                              </Button>
                            )}
                            <Button
                              onClick={() => handleShowDonorDetails(request)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                            >
                              <Icon name="Users" size={12} className="mr-1" />
                              Donor Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!filteredRequests || filteredRequests.length === 0) && (
                  <div className="text-center py-12">
                    <Icon name="History" size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No blood request history found</p>
                    <p className="text-sm text-gray-400 mt-2">Create your first emergency request to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Blood Inventory</h3>
                  <div className="flex space-x-3">
                    {!isEditingInventory ? (
                      <>
                        <Button
                          onClick={handleRefreshInventory}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
                        >
                          <Icon name="RefreshCw" size={16} className="mr-2" />
                          Refresh
                        </Button>
                        <Button
                          onClick={handleStartEditInventory}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                        >
                          <Icon name="Edit" size={16} className="mr-2" />
                          Edit Inventory
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleCancelEditInventory}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
                          disabled={isSavingInventory}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveInventory}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                          disabled={isSavingInventory}
                        >
                          {isSavingInventory ? (
                            <>
                              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Icon name="Save" size={16} className="mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <strong>Debug Info:</strong> Inventory data has {inventoryData?.length || 0} items. 
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bloodType) => {
                    const inventory = inventoryData?.find(item => item.bloodType === bloodType);
                    const currentUnits = inventory?.currentUnits || 0;
                    const displayUnits = isEditingInventory ? editingInventory[bloodType] : currentUnits;
                    const isLow = displayUnits < 5;
                    
                    return (
                      <div key={bloodType} className={`p-4 rounded-lg border-2 ${isLow ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="text-center">
                          {isEditingInventory ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                min="0"
                                value={displayUnits}
                                onChange={(e) => handleInventoryChange(bloodType, e.target.value)}
                                className={`w-full text-center text-2xl font-bold border rounded px-2 py-1 focus:outline-none focus:ring-2 ${
                                  displayUnits === '' || displayUnits < 0 
                                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="0"
                              />
                              <div className="text-sm text-gray-600">units</div>
                              <div className="text-lg font-medium text-gray-900">{bloodType}</div>
                            </div>
                          ) : (
                            <>
                              <div className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                {displayUnits}
                              </div>
                              <div className="text-sm text-gray-600">units</div>
                              <div className="text-lg font-medium text-gray-900">{bloodType}</div>
                            </>
                          )}
                          {isLow && (
                            <div className="text-xs text-red-600 font-medium mt-1">Low Stock</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {isEditingInventory && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <Icon name="Info" size={20} className="text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Editing Mode</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You can now edit the blood inventory quantities. Click "Save Changes" to update the inventory or "Cancel" to discard changes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Certificates Tab - Certificate Approval */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <CertificateApproval />
          </div>
        )}

        {/* Verification Tab - Certificate Verification */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <CertificateVerification />
          </div>
        )}

      </div>

      {/* Emergency Workflow Modal */}
      {showEmergencyWorkflow && (
        <EmergencyWorkflow
          requestId={emergencyRequestId}
          requestData={emergencyRequestData}
          onClose={handleCloseEmergencyWorkflow}
        />
      )}

      {/* Donor Response Tracker */}
      {showDonorTracker && (
        <DonorResponseTracker
          requestId={trackingRequestId}
          onClose={handleCloseDonorTracker}
        />
      )}

      {/* Nearby Donors Modal */}
      {showNearbyDonors && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <NearbyDonorsPanel
              requestData={selectedRequestForDonors}
              onDonorSelect={handleDonorSelect}
              onClose={handleCloseNearbyDonors}
            />
          </div>
        </div>
      )}

      {/* Donor Details Modal */}
      {showDonorDetails && selectedRequestForDonorDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Donor Details</h3>
                <button
                  onClick={handleCloseDonorDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
              
              {/* Request Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-2">Request Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Blood Type:</span>
                    <span className="ml-2 text-gray-900">{selectedRequestForDonorDetails.bloodType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Units Needed:</span>
                    <span className="ml-2 text-gray-900">{selectedRequestForDonorDetails.unitsNeeded}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Urgency:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(selectedRequestForDonorDetails.urgency)}`}>
                      {selectedRequestForDonorDetails.urgency}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequestForDonorDetails.status)}`}>
                      {selectedRequestForDonorDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Donor Information */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Donor Information</h4>
                {selectedRequestForDonorDetails.donor_responses && selectedRequestForDonorDetails.donor_responses.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRequestForDonorDetails.donor_responses.map((response, index) => (
                      <div key={response.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Icon name="User" size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {response.user_profiles?.full_name || 'Unknown Donor'}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {response.user_profiles?.blood_type || 'Unknown Blood Type'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            response.status === 'accepted' 
                              ? 'bg-green-100 text-green-600' 
                              : response.status === 'declined'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {response.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Age:</span>
                            <span className="ml-2 text-gray-900">
                              {response.user_profiles?.date_of_birth 
                                ? Math.floor((new Date() - new Date(response.user_profiles.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                                : response.user_profiles?.age || 'Not available'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Gender:</span>
                            <span className="ml-2 text-gray-900">
                              {response.user_profiles?.gender || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Blood Type:</span>
                            <span className="ml-2 text-gray-900">
                              {response.user_profiles?.blood_type || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Phone:</span>
                            <span className="ml-2 text-gray-900">
                              {response.user_profiles?.phone || 'Not available'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Email:</span>
                            <span className="ml-2 text-gray-900">
                              {response.user_profiles?.email || 'Not available'}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600">Address:</span>
                            <span className="ml-2 text-gray-900">
                              {response.user_profiles?.address 
                                ? `${response.user_profiles.address}${response.user_profiles.zip_code ? ', ' + response.user_profiles.zip_code : ''}`
                                : 'Not available'
                              }
                            </span>
                          </div>
                          {response.message && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-600">Message:</span>
                              <p className="ml-2 text-gray-900 mt-1">{response.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="Users" size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No donor responses yet</p>
                    <p className="text-sm text-gray-400 mt-2">Donor details will appear here once they respond to the request</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;