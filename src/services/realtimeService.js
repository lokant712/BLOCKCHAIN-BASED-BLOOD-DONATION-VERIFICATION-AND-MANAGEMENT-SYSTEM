import { supabase } from '../lib/supabase';
import { calculateDistance, isValidCoordinates } from '../utils/geoUtils';

/**
 * Real-time service for managing Supabase subscriptions
 * Handles blood request notifications and donor responses
 */
class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  /**
   * Subscribe to new blood requests for a specific donor
   * Filters by blood type compatibility, availability, and distance
   * @param {string} donorId - The donor's user ID
   * @param {Function} callback - Callback function for new requests
   * @returns {Promise<Object|null>} Subscription object or null if failed
   */
  async subscribeToBloodRequests(donorId, callback) {
    try {
      console.log(`Setting up real-time subscription for donor: ${donorId}`);
      
      // Get donor's profile data for filtering
      const { data: donorProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('blood_type, latitude, longitude, availability_radius, is_available, full_name, role')
        .eq('id', donorId)
        .single();

      if (profileError) {
        console.error('Error fetching donor profile for real-time subscription:', profileError);
        return null;
      }

      console.log('Donor profile for real-time subscription:', donorProfile);

      // Check if donor is available
      if (!donorProfile.is_available) {
        console.log('Donor is not available, skipping real-time subscription');
        return null;
      }

      // Check if donor has blood type set
      if (!donorProfile.blood_type) {
        console.error('Donor blood type is not set, cannot subscribe to requests');
        return null;
      }

      console.log(`Subscribing to blood requests for blood type: ${donorProfile.blood_type}`);

      // Subscribe to blood requests matching donor's blood type
      // Note: This will show ALL compatible requests, not just ones sent to this donor
      // In a production system, you'd want to track which donors were specifically notified
      const subscription = supabase
        .channel(`blood_requests_${donorId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'blood_requests',
            filter: `blood_type=eq.${donorProfile.blood_type}`
          },
          async (payload) => {
            console.log('New blood request received:', payload);
            console.log('Request blood type:', payload.new.blood_type);
            console.log('Donor blood type:', donorProfile.blood_type);
            
            // Check if request is urgent/critical
            if (payload.new.urgency === 'critical' || payload.new.urgency === 'urgent') {
              // Get hospital details
              const { data: hospitalData, error: hospitalError } = await supabase
                .from('user_profiles')
                .select('hospital_name, address, city, state, latitude, longitude')
                .eq('id', payload.new.requester_id)
                .single();

              if (hospitalError) {
                console.error('Error fetching hospital data for real-time request:', hospitalError);
                return;
              }

              // Calculate distance if both locations are available
              let distance = null;
              if (donorProfile.latitude && donorProfile.longitude && 
                  hospitalData.latitude && hospitalData.longitude) {
                distance = calculateDistance(
                  donorProfile.latitude, donorProfile.longitude,
                  hospitalData.latitude, hospitalData.longitude
                );
              }

              // Check if request is within donor's availability radius
              if (distance && distance > donorProfile.availability_radius) {
                console.log(`Request is outside donor's radius (${distance}km > ${donorProfile.availability_radius}km)`);
                return;
              }

              // Transform the request data
              const emergencyRequest = {
                id: payload.new.id,
                bloodType: payload.new.blood_type,
                urgency: payload.new.urgency,
                hospitalName: hospitalData?.hospital_name || 'Unknown Hospital',
                distance: distance,
                timeAgo: this.getTimeAgo(payload.new.created_at),
                unitsNeeded: payload.new.units_needed,
                patientInfo: {
                  age: payload.new.patient_age,
                  condition: payload.new.patient_condition
                },
                hospitalLocation: {
                  address: hospitalData?.address,
                  city: hospitalData?.city,
                  state: hospitalData?.state
                },
                neededBy: payload.new.needed_by,
                contactPhone: payload.new.contact_phone
              };

              callback(emergencyRequest);
            }
          }
        )
        .subscribe();

      this.subscriptions.set(`blood_requests_${donorId}`, subscription);
      return subscription;
    } catch (error) {
      console.error('Error in subscribeToBloodRequests:', error);
      throw error;
    }
  }

  /**
   * Subscribe to donor responses for a specific hospital
   * @param {string} hospitalId - The hospital's user ID
   * @param {Function} callback - Callback function for new responses
   * @returns {Promise<Object|null>} Subscription object or null if failed
   */
  async subscribeToDonorResponses(hospitalId, callback) {
    try {
      console.log(`Setting up donor response subscription for hospital: ${hospitalId}`);

      // Subscribe to donor responses for this hospital's requests
      const subscription = supabase
        .channel(`donor_responses_${hospitalId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'donor_responses'
          },
          async (payload) => {
            console.log('New donor response received:', payload);

            // Get the blood request details
            const { data: requestData, error: requestError } = await supabase
              .from('blood_requests')
              .select('*')
              .eq('id', payload.new.request_id)
              .single();

            if (requestError) {
              console.error('Error fetching request data:', requestError);
              return;
            }

            // Check if this request belongs to the hospital
            if (requestData.requester_id !== hospitalId) {
              return;
            }

            // Get donor details
            const { data: donorData, error: donorError } = await supabase
              .from('user_profiles')
              .select('full_name, blood_type, phone, city, state')
              .eq('id', payload.new.donor_id)
              .single();

            if (donorError) {
              console.error('Error fetching donor data:', donorError);
              return;
            }

            // Skip 'notified' status - these are just notification records, not actual responses
            if (payload.new.status === 'notified') {
              console.log('Skipping notification record - waiting for actual donor response');
              return;
            }

            // Transform response data
            const responseData = {
              id: payload.new.id,
              requestId: payload.new.request_id,
              donorId: payload.new.donor_id,
              status: payload.new.status,
              donorName: donorData.full_name,
              donorBloodType: donorData.blood_type,
              donorPhone: donorData.phone,
              donorLocation: `${donorData.city}, ${donorData.state}`,
              message: payload.new.message,
              availableTime: payload.new.available_time,
              timestamp: payload.new.created_at,
              bloodRequest: {
                bloodType: requestData.blood_type,
                unitsNeeded: requestData.units_needed,
                urgency: requestData.urgency,
                patientAge: requestData.patient_age,
                patientCondition: requestData.patient_condition
              }
            };

            callback(responseData);
          }
        )
        .subscribe();

      this.subscriptions.set(`donor_responses_${hospitalId}`, subscription);
      return subscription;
    } catch (error) {
      console.error('Error in subscribeToDonorResponses:', error);
      throw error;
    }
  }

  /**
   * Subscribe to blood request updates for a hospital
   * @param {string} hospitalId - The hospital's user ID
   * @param {Function} callback - Callback function for updates
   * @returns {Promise<Object|null>} Subscription object or null if failed
   */
  async subscribeToRequestUpdates(hospitalId, callback) {
    try {
      console.log(`Setting up request update subscription for hospital: ${hospitalId}`);

      const subscription = supabase
        .channel(`request_updates_${hospitalId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blood_requests',
            filter: `requester_id=eq.${hospitalId}`
          },
          (payload) => {
            console.log('Blood request update received:', payload);
            callback(payload);
          }
        )
        .subscribe();

      this.subscriptions.set(`request_updates_${hospitalId}`, subscription);
      return subscription;
    } catch (error) {
      console.error('Error in subscribeToRequestUpdates:', error);
      throw error;
    }
  }

  /**
   * Create a donor response to a blood request
   * @param {string} donorId - The donor's user ID
   * @param {string} requestId - The blood request ID
   * @param {string} status - Response status ('accepted', 'declined', 'pending')
   * @param {Object} additionalData - Additional response data
   * @returns {Promise<Object>} Created response data
   */
  async createDonorResponse(donorId, requestId, status, additionalData = {}) {
    try {
      console.log(`Creating/updating donor response: donor=${donorId}, request=${requestId}, status=${status}`);

      // First, check if a response already exists for this donor and request
      const { data: existingResponse, error: checkError } = await supabase
        .from('donor_responses')
        .select('id')
        .eq('donor_id', donorId)
        .eq('request_id', requestId)
        .single();

      const responseData = {
        donor_id: donorId,
        request_id: requestId,
        status: status,
        contact_preference: additionalData.contactPreference || 'phone',
        available_time: additionalData.availableTime || new Date().toISOString(),
        message: additionalData.message || '',
        updated_at: new Date().toISOString()
      };

      let data, error;

      if (existingResponse && !checkError) {
        // Update existing response
        console.log('Updating existing donor response:', existingResponse.id);
        const result = await supabase
          .from('donor_responses')
          .update(responseData)
          .eq('id', existingResponse.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create new response
        console.log('Creating new donor response');
        const result = await supabase
          .from('donor_responses')
          .insert([{
            ...responseData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error creating/updating donor response:', error);
        throw error;
      }

      // If response was successful and it's for an emergency request, update donor's last emergency response date
      if (data && (status === 'accepted' || status === 'declined')) {
        try {
          // Check if this is an emergency request
          const { data: requestData, error: requestError } = await supabase
            .from('blood_requests')
            .select('urgency')
            .eq('id', requestId)
            .single();

          if (!requestError && requestData && (requestData.urgency === 'critical' || requestData.urgency === 'urgent')) {
            console.log('🔄 Updating donor emergency response date for 90-day cooldown');
            
            // Update the donor's last emergency response date
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ 
                last_emergency_response_date: new Date().toISOString() 
              })
              .eq('id', donorId);

            if (updateError) {
              console.error('Error updating donor emergency response date:', updateError);
            } else {
              console.log('✅ Successfully updated donor emergency response date');
            }
          }
        } catch (cooldownError) {
          console.error('Error in emergency cooldown update:', cooldownError);
        }
      }

      console.log('Donor response created/updated successfully:', data);

      // If donor accepted, create donation record and update their availability temporarily
      if (status === 'accepted') {
        await this.updateDonorAvailability(donorId, false);
        
        // Create donation record
        try {
          const { data: requestData, error: requestError } = await supabase
            .from('blood_requests')
            .select('hospital_name, hospital_address, blood_type, units_needed')
            .eq('id', requestId)
            .single();

          if (!requestError && requestData) {
            const { error: donationError } = await supabase
              .from('donations')
              .insert([{
                donor_id: donorId,
                request_id: requestId,
                hospital_name: requestData.hospital_name,
                hospital_address: requestData.hospital_address,
                donation_date: new Date().toISOString(),
                blood_type: requestData.blood_type,
                units_donated: requestData.units_needed,
                amount_ml: requestData.units_needed * 450, // Standard 450ml per unit
                status: 'completed',
                notes: 'Emergency blood donation',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);

            if (donationError) {
              console.error('Error creating donation record:', donationError);
            } else {
              console.log('✅ Successfully created donation record');
            }
          }
        } catch (donationError) {
          console.error('Error in donation creation:', donationError);
        }
      }

      return data;
    } catch (error) {
      console.error('Error in createDonorResponse:', error);
      throw error;
    }
  }

  /**
   * Update donor availability status
   * @param {string} donorId - The donor's user ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise<Object>} Updated profile data
   */
  async updateDonorAvailability(donorId, isAvailable) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          is_available: isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', donorId)
        .select()
        .single();

      if (error) {
        console.error('Error updating donor availability:', error);
        throw error;
      }

      console.log('Donor availability updated:', data);
      return data;
    } catch (error) {
      console.error('Error in updateDonorAvailability:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a specific channel
   * @param {string} key - Subscription key
   */
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(key);
      console.log(`Unsubscribed from: ${key}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
      console.log(`Unsubscribed from: ${key}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Get current active subscriptions
   * @returns {Array} Array of subscription keys
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Helper method to calculate time ago
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time ago string
   */
  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

export default new RealtimeService();

