import { supabase } from '../lib/supabase';

class HospitalService {
  // Get blood requests for a hospital
  async getBloodRequests(hospitalId) {
    try {
      console.log('🔍 HospitalService: Fetching blood requests for hospital ID:', hospitalId);
      
      // First, get the blood requests
      const { data: requests, error } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });

      console.log('📊 HospitalService: Raw database response:', { requests, error });
      
      if (error) {
        console.error('Error fetching blood requests:', error);
        throw error;
      }

      // If we have requests, get donor responses for each one
      let requestsWithDonorResponses = [];
      if (requests && requests.length > 0) {
        for (const request of requests) {
          // First get donor responses
          const { data: donorResponses, error: responsesError } = await supabase
            .from('donor_responses')
            .select(`
              id,
              donor_id,
              status,
              contact_preference,
              available_time,
              message,
              created_at
            `)
            .eq('request_id', request.id);

          // Then get user profiles for each donor response
          let donorResponsesWithProfiles = [];
          if (donorResponses && donorResponses.length > 0) {
            for (const response of donorResponses) {
              const { data: userProfile, error: profileError } = await supabase
                .from('user_profiles')
                .select(`
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
                `)
                .eq('id', response.donor_id)
                .single();

              if (!profileError && userProfile) {
                donorResponsesWithProfiles.push({
                  ...response,
                  user_profiles: userProfile
                });
              } else {
                console.error('Error fetching user profile for donor:', response.donor_id, profileError);
                donorResponsesWithProfiles.push(response);
              }
            }
          }

          if (responsesError) {
            console.error('Error fetching donor responses for request:', request.id, responsesError);
          }

          console.log(`📊 Donor responses for request ${request.id}:`, donorResponsesWithProfiles);
          console.log(`📊 Donor responses count:`, donorResponsesWithProfiles?.length || 0);

          // Add donor responses to the request
          requestsWithDonorResponses.push({
            ...request,
            donor_responses: donorResponsesWithProfiles || []
          });
        }
      }
      
      // Also check if there are any requests with requester_id
      const { data: requestsByRequester, error: requesterError } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('requester_id', hospitalId)
        .order('created_at', { ascending: false });
        
      console.log('📊 HospitalService: Requests by requester_id:', { requestsByRequester, requesterError });

      // Transform data to match component expectations
      const transformedRequests = (requestsWithDonorResponses || []).map(request => ({
        id: request.id,
        patientName: request.additional_notes?.includes('Patient:') 
          ? request.additional_notes.split('Patient: ')[1]?.split(' |')[0] || `Patient (${request.patient_gender || 'Unknown'}, ${request.patient_age || 'Unknown age'})`
          : `Patient (${request.patient_gender || 'Unknown'}, ${request.patient_age || 'Unknown age'})`,
        hospitalName: request.hospital_name,
        bloodType: request.blood_type,
        priority: request.urgency,
        status: request.status,
        createdAt: new Date(request.created_at),
        matchedDonors: request.donor_responses?.length || 0,
        notificationsSent: request.donor_responses?.length > 0,
        noResponsesYet: request.donor_responses?.length === 0,
        acceptedResponses: request.donor_responses?.filter(r => r.status === 'accepted').length || 0,
        declinedResponses: request.donor_responses?.filter(r => r.status === 'declined').length || 0,
        patientAge: request.patient_age,
        patientGender: request.patient_gender,
        unitsNeeded: request.units_needed,
        medicalCondition: request.patient_condition,
        contactPhone: request.contact_phone,
        emergencyContact: request.emergency_contact,
        location: `${request.hospital_address}, ${request.city}`,
        neededBy: new Date(request.needed_by),
        additionalNotes: request.additional_notes,
        unitsFulfilled: request.units_fulfilled || 0,
        expiryDate: request.expiry_date
      }));
      
      console.log('📊 HospitalService: Transformed requests:', transformedRequests);
      
      // Debug: Check if donor responses are being included
      transformedRequests.forEach((request, index) => {
        console.log(`📊 Request ${index + 1} (${request.id}):`, {
          id: request.id,
          status: request.status,
          matchedDonors: request.matchedDonors,
          notificationsSent: request.notificationsSent,
          noResponsesYet: request.noResponsesYet,
          rawDonorResponses: requestsWithDonorResponses[index]?.donor_responses
        });
      });
      
      return transformedRequests;
    } catch (error) {
      console.error('Error in getBloodRequests:', error);
      throw error;
    }
  }

  // Get blood inventory for a hospital
  async getBloodInventory(hospitalId) {
    try {
      console.log(`Fetching blood inventory for hospital: ${hospitalId}`);
      
      // Force fresh data by adding a timestamp to prevent caching
      const { data: inventory, error } = await supabase
        .from('blood_inventory')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('blood_type');

      if (error) {
        console.error('Error fetching blood inventory:', error);
        throw error;
      }

      console.log('Raw inventory data from database:', inventory);

      // Transform data to match component expectations
      const transformedInventory = (inventory || []).map(item => ({
        bloodType: item.blood_type,
        currentUnits: item.units_available || 0,
        minimumUnits: this.getMinimumUnitsForBloodType(item.blood_type),
        nextExpiry: item.expiry_date || null
      }));

      // Add missing blood types with zero inventory
      const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const existingTypes = transformedInventory.map(item => item.bloodType);
      const missingTypes = allBloodTypes.filter(type => !existingTypes.includes(type));
      
      const missingInventory = missingTypes.map(type => ({
        bloodType: type,
        currentUnits: 0,
        minimumUnits: this.getMinimumUnitsForBloodType(type),
        nextExpiry: null
      }));

      const finalInventory = [...transformedInventory, ...missingInventory];
      console.log('Final transformed inventory:', finalInventory);
      
      return finalInventory;
    } catch (error) {
      console.error('Error in getBloodInventory:', error);
      throw error;
    }
  }

  // Helper method to get minimum units for blood type
  getMinimumUnitsForBloodType(bloodType) {
    const minimums = {
      'A+': 50,
      'A-': 25,
      'B+': 40,
      'B-': 20,
      'AB+': 15,
      'AB-': 10,
      'O+': 60,
      'O-': 35
    };
    return minimums[bloodType] || 20;
  }

  // Get hospital statistics
  async getHospitalStats(hospitalId) {
    try {
      // Get total requests
      const { data: totalRequests, error: requestsError } = await supabase
        .from('blood_requests')
        .select('id, status, urgency, created_at')
        .eq('hospital_id', hospitalId);

      if (requestsError) {
        console.error('Error fetching total requests:', requestsError);
        throw requestsError;
      }

      // Get fulfilled requests
      const { data: fulfilledRequests, error: fulfilledError } = await supabase
        .from('blood_requests')
        .select('id')
        .eq('hospital_id', hospitalId)
        .eq('status', 'fulfilled');

      if (fulfilledError) {
        console.error('Error fetching fulfilled requests:', fulfilledError);
        throw fulfilledError;
      }

      // Get critical requests
      const criticalRequests = totalRequests?.filter(req => req.urgency === 'critical') || [];
      const pendingRequests = totalRequests?.filter(req => req.status === 'pending') || [];

      // Get recent requests (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRequests = totalRequests?.filter(req => 
        new Date(req.created_at) >= sevenDaysAgo
      ) || [];

      return {
        totalRequests: totalRequests?.length || 0,
        fulfilledRequests: fulfilledRequests?.length || 0,
        criticalRequests: criticalRequests?.length || 0,
        pendingRequests: pendingRequests?.length || 0,
        recentRequests: recentRequests?.length || 0,
        fulfillmentRate: totalRequests?.length > 0 
          ? Math.round((fulfilledRequests?.length / totalRequests?.length) * 100) 
          : 0
      };
    } catch (error) {
      console.error('Error in getHospitalStats:', error);
      throw error;
    }
  }

  // Get matched donors for a specific request
  async getMatchedDonors(requestId) {
    try {
      const { data: responses, error } = await supabase
        .from('donor_responses')
        .select(`
          *,
          user_profiles (
            id,
            full_name,
            phone,
            blood_type,
            is_available,
            availability_radius,
            city,
            state,
            total_donations,
            last_donation_date
          )
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matched donors:', error);
        throw error;
      }

      // Transform data to match component expectations
      return (responses || []).map(response => ({
        id: response.donor_id,
        name: response.user_profiles?.full_name || 'Unknown Donor',
        bloodType: response.user_profiles?.blood_type,
        status: response.status,
        distance: this.calculateDistance(response.user_profiles), // You'll need to implement this
        rating: 4.5, // Default rating - you can implement rating system later
        totalDonations: response.user_profiles?.total_donations || 0,
        lastDonation: this.formatLastDonation(response.user_profiles?.last_donation_date),
        phone: response.user_profiles?.phone,
        contactPreference: response.contact_preference,
        availableTime: response.available_time,
        message: response.message,
        city: response.user_profiles?.city,
        state: response.user_profiles?.state
      }));
    } catch (error) {
      console.error('Error in getMatchedDonors:', error);
      throw error;
    }
  }

  // Helper method to format last donation date
  formatLastDonation(lastDonationDate) {
    if (!lastDonationDate) return 'No previous donations';
    
    const now = new Date();
    const lastDonation = new Date(lastDonationDate);
    const diffTime = Math.abs(now - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  // Helper method to calculate distance (placeholder - you'll need to implement based on your location data)
  calculateDistance(donorProfile) {
    // This is a placeholder - you'll need to implement actual distance calculation
    // based on hospital and donor coordinates
    return Math.random() * 10; // Random distance for now
  }

  // Update blood request status
  async updateRequestStatus(requestId, status) {
    try {
      const { data, error } = await supabase
        .from('blood_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating request status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateRequestStatus:', error);
      throw error;
    }
  }

  // Update blood inventory
  async updateBloodInventory(hospitalId, bloodType, units) {
    try {
      console.log(`Updating blood inventory: hospitalId=${hospitalId}, bloodType=${bloodType}, units=${units}`);
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!user) {
        console.log('No authenticated user, trying anonymous auth...');
        await supabase.auth.signInAnonymously();
      }
      
      // Use upsert with proper conflict resolution
      const { data, error } = await supabase
        .from('blood_inventory')
        .upsert({
          hospital_id: hospitalId,
          blood_type: bloodType,
          units_available: units,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'hospital_id,blood_type'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating blood inventory:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to update blood inventory: ${error.message}`);
      }

      console.log('Blood inventory updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in updateBloodInventory:', error);
      throw error;
    }
  }

  // Create a new blood request
  async createBloodRequest(requestData) {
    try {
      console.log('🩸 HospitalService: Creating blood request with data:', requestData);
      console.log('🩸 HospitalService: Hospital ID from requestData:', requestData.hospitalId);
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🩸 HospitalService: Current authenticated user:', user);
      if (authError) {
        console.error('Authentication error:', authError);
      }
      
      // Map urgency values to match database enum
      const urgencyMapping = {
        'emergency': 'critical',    // UrgencySection.jsx uses 'emergency'
        'urgent': 'urgent',         // Both forms use 'urgent'
        'normal': 'normal',         // Both forms use 'normal'
        'critical': 'critical',     // BloodRequestCreation uses 'critical'
        'low': 'low'                // Future use
      };
      
      const mappedUrgency = urgencyMapping[requestData.urgency] || 'normal';
      console.log('Original urgency:', requestData.urgency, 'Mapped urgency:', mappedUrgency);

      const { data, error } = await supabase
        .from('blood_requests')
        .insert([{
          requester_id: requestData.hospitalId,  // Set requester_id for real-time subscriptions
          hospital_id: requestData.hospitalId,   // Keep hospital_id for hospital-specific queries
          blood_type: requestData.bloodType,
          units_needed: requestData.unitsNeeded,
          urgency: mappedUrgency,
          hospital_name: requestData.hospitalName,
          hospital_address: requestData.hospitalAddress,
          city: requestData.city,
          state: requestData.state,
          latitude: requestData.latitude,
          longitude: requestData.longitude,
          patient_age: requestData.patientAge,
          patient_gender: requestData.patientGender,
          medical_condition: requestData.medicalCondition,
          needed_by: requestData.neededBy,
          contact_phone: requestData.contactPhone,
          emergency_contact: requestData.emergencyContact,
          additional_notes: `Patient: ${requestData.patientName} | ${requestData.additionalNotes || ''}`,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating blood request:', error);
        throw new Error(`Failed to create blood request: ${error.message}`);
      }

      console.log('✅ HospitalService: Blood request created successfully:', data);
      console.log('✅ HospitalService: Created request ID:', data.id);
      console.log('✅ HospitalService: Created request hospital_id:', data.hospital_id);
      console.log('✅ HospitalService: Created request requester_id:', data.requester_id);
      return data;
    } catch (error) {
      console.error('Error in createBloodRequest:', error);
      throw error;
    }
  }

  // Get donor response statistics
  async getDonorResponseStats(requestId) {
    try {
      const { data: responses, error } = await supabase
        .from('donor_responses')
        .select('status')
        .eq('request_id', requestId);

      if (error) {
        console.error('Error fetching donor response stats:', error);
        throw error;
      }

      const stats = {
        total: responses?.length || 0,
        available: responses?.filter(r => r.status === 'accepted')?.length || 0,
        declined: responses?.filter(r => r.status === 'declined')?.length || 0,
        pending: responses?.filter(r => r.status === 'pending')?.length || 0,
        notificationsSent: responses?.length > 0, // Track if notifications were sent
        noResponsesYet: responses?.length === 0 // Track if no notifications sent yet
      };

      return stats;
    } catch (error) {
      console.error('Error in getDonorResponseStats:', error);
      throw error;
    }
  }

  // Verify inventory data in database (for debugging)
  async verifyInventoryData(hospitalId) {
    try {
      console.log(`Verifying inventory data for hospital: ${hospitalId}`);
      
      const { data: inventory, error } = await supabase
        .from('blood_inventory')
        .select('*')
        .eq('hospital_id', hospitalId);

      if (error) {
        console.error('Error verifying inventory data:', error);
        throw error;
      }

      console.log('Current inventory in database:', inventory);
      return inventory;
    } catch (error) {
      console.error('Error in verifyInventoryData:', error);
      throw error;
    }
  }
}

export default new HospitalService();
