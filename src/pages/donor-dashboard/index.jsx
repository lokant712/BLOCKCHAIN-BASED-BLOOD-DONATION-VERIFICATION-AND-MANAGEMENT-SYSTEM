import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import EmergencyActionButton from '../../components/ui/EmergencyActionButton';
import AvailabilityCard from './components/AvailabilityCard';
import UrgentRequestsPanel from './components/UrgentRequestsPanel';
import DonationHistory from './components/DonationHistory';
import DonorStats from './components/DonorStats';
import CertificateUpload from './components/CertificateUpload'; // Added CertificateUpload import
import donorService from '../../services/donorService';
import profileService from '../../services/profileService';
import realtimeService from '../../services/realtimeService';
import notificationService from '../../services/notificationService';

const DonorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [donorStats, setDonorStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Real-time state
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [newEmergencyRequest, setNewEmergencyRequest] = useState(null);

  // Mock user data
  const mockUser = {
    id: "donor_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0123",
    role: "donor",
    bloodType: "O+",
    isAvailable: true,
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: "New York, NY"
    },
    verificationStatus: "verified",
    joinDate: "2023-01-15"
  };


  // Mock donation history
  const mockDonationHistory = [
    {
      id: "don_001",
      hospitalName: "Mount Sinai Hospital",
      date: "September 1, 2024",
      bloodType: "O+",
      amount: 450,
      status: "completed",
      donationId: "MS-2024-0901",
      certificate: true,
      thankYouMessage: "Your donation helped save a life during emergency surgery. Thank you for your generosity!"
    },
    {
      id: "don_002",
      hospitalName: "NewYork-Presbyterian",
      date: "June 15, 2024",
      bloodType: "O+",
      amount: 450,
      status: "completed",
      donationId: "NYP-2024-0615",
      certificate: true,
      thankYouMessage: "Your blood donation made a critical difference for a patient in need."
    },
    {
      id: "don_003",
      hospitalName: "Lenox Health",
      date: "March 20, 2024",
      bloodType: "O+",
      amount: 450,
      status: "completed",
      donationId: "LH-2024-0320",
      certificate: true
    },
    {
      id: "don_004",
      hospitalName: "Mount Sinai Hospital",
      date: "December 10, 2023",
      bloodType: "O+",
      amount: 450,
      status: "completed",
      donationId: "MS-2023-1210",
      certificate: true
    }
  ];

  // Mock donor stats
  const mockDonorStats = {
    totalDonations: 12,
    livesSaved: 12,
    donorLevel: "Gold"
  };



  useEffect(() => {
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      navigate('/user-login');
      return;
    }

    // Parse user session
    const userData = JSON.parse(userSession);
    setUser(userData);

    // Clear any existing urgent requests to start fresh
    setUrgentRequests([]);

    // Load real data from services
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load real data from services
        console.log('🔄 Loading donor dashboard data for user:', userData.id);
        const [stats, requests, history, userProfile] = await Promise.all([
          donorService.getDonorStats(userData.id),
          donorService.getUrgentRequests(userData.id),
          donorService.getDonationHistory(userData.id),
          profileService.getUserProfile(userData.id)
        ]);
        
        console.log('📊 Dashboard data loaded:', {
          stats: stats ? 'loaded' : 'failed',
          requests: requests?.length || 0,
          history: history?.length || 0,
          userProfile: userProfile ? 'loaded' : 'failed'
        });
        
        // Debug: Log the actual requests being loaded
        if (requests && requests.length > 0) {
          console.log('🔍 Urgent requests loaded from database:', requests);
          requests.forEach((req, index) => {
            console.log(`Request ${index + 1}:`, {
              id: req.id,
              bloodType: req.bloodType,
              hospitalName: req.hospitalName,
              urgency: req.urgency,
              timeAgo: req.timeAgo
            });
          });
        } else {
          console.log('✅ No urgent requests found in database');
        }
        
        // Update user with real availability status from database
        if (userProfile) {
          setUser(prev => ({
            ...prev,
            isAvailable: userProfile.is_available ?? true // Default to true if null/undefined
          }));
        }
        
        // Set real data, fallback to mock data only for stats and history
        setDonorStats(stats || mockDonorStats);
        setUrgentRequests(requests || []); // Don't use mock requests, show empty state instead
        setDonationHistory(history || mockDonationHistory);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Fallback to mock data on error (except for urgent requests)
        setUrgentRequests([]); // Don't show mock requests on error
        setDonationHistory(mockDonationHistory);
        setDonorStats(mockDonorStats);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscriptions for donor:', user.id);
    console.log('User data:', user);

    // Set up real-time subscription for emergency blood requests
    const setupRealtimeSubscription = async () => {
      try {
        // First, get the user's profile from database to ensure we have correct blood type
        const userProfile = await profileService.getUserProfile(user.id);
        if (!userProfile) {
          console.error('Could not fetch user profile for real-time subscription');
          return;
        }

        console.log('User profile from database:', userProfile);
        console.log('User blood type:', userProfile.blood_type);

        // Update user state with real profile data
        setUser(prev => ({
          ...prev,
          bloodType: userProfile.blood_type, // Ensure blood type is from database
          isAvailable: userProfile.is_available ?? true,
          latitude: userProfile.latitude,
          longitude: userProfile.longitude
        }));

        // Temporarily disable real-time subscription to prevent random requests
        // TODO: Implement proper donor-specific notification tracking
        console.log('Real-time subscription disabled to prevent random requests');
        const subscription = null;
        
        // const subscription = await realtimeService.subscribeToBloodRequests(
        //   user.id,
        //   (emergencyRequest) => {
        //     console.log('New emergency request received:', emergencyRequest);
        //     console.log('Request blood type:', emergencyRequest.bloodType);
        //     console.log('User blood type:', userProfile.blood_type);
        //     
        //     // Add to urgent requests list
        //     setUrgentRequests(prev => {
        //       // Check if request already exists to avoid duplicates
        //       const exists = prev.some(req => req.id === emergencyRequest.id);
        //       if (exists) return prev;
        //       
        //       return [emergencyRequest, ...prev];
        //     });

        //     // Show browser notification
        //     notificationService.showEmergencyRequestNotification(emergencyRequest);
        //     
        //     // Set new emergency request for UI highlighting
        //     setNewEmergencyRequest(emergencyRequest);
        //     
        //     // Clear the highlight after 10 seconds
        //     setTimeout(() => {
        //       setNewEmergencyRequest(null);
        //     }, 10000);
        //   }
        // );

        if (subscription) {
          setRealtimeConnected(true);
          console.log('Real-time subscription established successfully');
        } else {
          console.log('Failed to establish real-time subscription');
        }
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Set up notification event listeners
    const handleNotificationClick = (event) => {
      const { request } = event.detail;
      console.log('Emergency notification clicked:', request);
      // You can add navigation logic here if needed
    };

    const handleNotificationAction = (event) => {
      const { request, action } = event.detail;
      console.log('Emergency notification action:', action, request);
      
      if (action === 'accept') {
        handleRequestResponse(request.id, 'accept');
      } else if (action === 'decline') {
        handleRequestResponse(request.id, 'decline');
      }
    };

    window.addEventListener('emergency-notification-clicked', handleNotificationClick);
    window.addEventListener('emergency-notification-action', handleNotificationAction);

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      realtimeService.unsubscribe(user.id);
      window.removeEventListener('emergency-notification-clicked', handleNotificationClick);
      window.removeEventListener('emergency-notification-action', handleNotificationAction);
      setRealtimeConnected(false);
    };
  }, [user?.id]);

  const handleAvailabilityChange = async (newSettings) => {
    try {
      // Update local state
      setUser(prev => ({
        ...prev,
        isAvailable: newSettings?.isAvailable
      }));
      
      // Update database if user has an ID
      if (user?.id) {
        await profileService.updateUserProfile(user.id, {
          isAvailable: newSettings?.isAvailable
        });
      }
      
      console.log('Availability updated:', newSettings);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleRequestResponse = async (requestId, response) => {
    try {
      console.log(`Request ${requestId} ${response}ed`);
      
      // Map response to database status
      const dbStatus = response === 'accept' ? 'accepted' : 'declined';
      
      // Create donor response in database
      await realtimeService.createDonorResponse(user.id, requestId, dbStatus, {
        message: response === 'accept' ? 'I can help with this emergency request' : 'Unable to help at this time',
        contactPreference: 'phone'
      });
      
      if (response === 'accept') {
        // Show success message and update the request status in the UI
        console.log('✅ Donor accepted the request successfully');
        
        // Update the request status in the UI to show it's been accepted
        setUrgentRequests(prev => prev?.map(req => 
          req?.id === requestId 
            ? { ...req, status: 'accepted', responseTime: new Date().toISOString() }
            : req
        ));
        
        // Show a success notification
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('Request Accepted!', {
            body: 'Thank you for accepting the emergency blood request. The hospital will contact you soon.',
            icon: '/favicon.ico'
          });
        }
        
        // Refresh urgent requests after a delay to get updated data from database
        setTimeout(async () => {
          try {
            const updatedRequests = await donorService.getUrgentRequests(user.id);
            setUrgentRequests(updatedRequests);
            console.log('🔄 Refreshed urgent requests after acceptance');
          } catch (error) {
            console.error('Error refreshing urgent requests:', error);
          }
        }, 2000);
      } else {
        // Remove request from list immediately
        setUrgentRequests(prev => prev?.filter(req => req?.id !== requestId));
        
        // Also refresh from database to ensure consistency
        setTimeout(async () => {
          try {
            const updatedRequests = await donorService.getUrgentRequests(user.id);
            setUrgentRequests(updatedRequests);
            console.log('🔄 Refreshed urgent requests after decline');
          } catch (error) {
            console.error('Error refreshing urgent requests:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };


  const handleLogout = () => {
    // Clear user session from localStorage
    localStorage.removeItem('userSession');
    // Clear user state
    setUser(null);
    // Navigate to login page
    navigate('/user-login');
  };

  // Function to refresh data after certificate upload
  const handleCertificateUploadComplete = () => {
    // You can add any logic here to refresh data if needed
    console.log('Certificate uploaded successfully');
  };

  // Calculate next eligibility date from real data
  const nextEligibilityDate = donorStats?.lastDonationDate 
    ? new Date(new Date(donorStats.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from last donation
    : new Date(); // Eligible now if no previous donations

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
              <p className="text-text-secondary mt-1">
                Ready to save lives today? Your blood type {user?.bloodType} is always in demand.
              </p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{donorStats?.totalDonations}</div>
              <div className="text-sm text-text-secondary">Total Donations</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">{donorStats?.livesSaved}</div>
              <div className="text-sm text-text-secondary">Lives Saved</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{urgentRequests?.length}</div>
              <div className="text-sm text-text-secondary">Active Requests</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${user?.isAvailable ? 'text-success' : 'text-text-secondary'}`}>
                {user?.isAvailable ? 'Available' : 'Unavailable'}
              </div>
              <div className="text-sm text-text-secondary">Current Status</div>
            </div>
          </div>

          {/* Real-time Connection Status */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-text-secondary">
                {realtimeConnected ? 'Connected to emergency alerts' : 'Connecting to emergency alerts...'}
              </span>
            </div>
            {newEmergencyRequest && (
              <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                <Icon name="Zap" size={16} />
                <span>New Emergency Request!</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Availability & Requests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificate Upload Section */}
            <CertificateUpload onUploadComplete={handleCertificateUploadComplete} />
            
            {/* Availability Card */}
            <AvailabilityCard 
              user={user} 
              onAvailabilityChange={handleAvailabilityChange} 
            />

            {/* Urgent Requests Panel */}
            <UrgentRequestsPanel 
              requests={urgentRequests} 
              onRequestResponse={handleRequestResponse}
              newEmergencyRequest={newEmergencyRequest}
            />

            {/* Donation History - Mobile/Tablet */}
            <div className="lg:hidden">
              <DonationHistory donations={donationHistory} />
            </div>
          </div>

          {/* Right Column - Stats & History */}
          <div className="space-y-6">
            {/* Donor Stats */}
            <DonorStats 
              stats={donorStats}
              nextEligibilityDate={nextEligibilityDate}
              lastEmergencyResponseDate={user?.last_emergency_response_date}
            />

            {/* Donation History - Desktop */}
            <div className="hidden lg:block">
              <DonationHistory donations={donationHistory} />
            </div>
          </div>
        </div>

        {/* Emergency Action Button */}
        <EmergencyActionButton 
          user={user}
          position="fixed"
          variant="floating"
        />

      </main>
    </div>
  );
};

export default DonorDashboard;