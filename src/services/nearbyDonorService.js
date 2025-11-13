import { supabase } from '../lib/supabase';
import { 
  calculateDistance, 
  findDonorsWithinRadius, 
  getBoundingBox, 
  checkDonorEligibility,
  isBloodTypeCompatible,
  formatDistance,
  getEstimatedTravelTime,
  isValidCoordinates
} from '../utils/geoUtils';

/**
 * Service for finding and managing nearby donors
 * Handles donor search, filtering, and notification management
 */
class NearbyDonorService {
  /**
   * Find nearby donors for a blood request
   * @param {Object} requestData - Blood request data
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results with donors and statistics
   */
  async findNearbyDonors(requestData, options = {}) {
    try {
      const {
        maxDistance = 50, // Default 50km radius
        maxResults = 20,
        includeIneligible = false,
        sortBy = 'distance' // 'distance', 'last_donation', 'total_donations'
      } = options;

      console.log('Searching for nearby donors:', {
        bloodType: requestData.bloodType,
        location: { lat: requestData.latitude, lng: requestData.longitude },
        maxDistance,
        maxResults
      });

      // Validate coordinates
      if (!isValidCoordinates(requestData.latitude, requestData.longitude)) {
        throw new Error('Invalid hospital coordinates');
      }

      // Get bounding box for efficient database query
      const boundingBox = getBoundingBox(
        requestData.latitude, 
        requestData.longitude, 
        maxDistance
      );

      // Query donors within bounding box
      const { data: donors, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          blood_type,
          latitude,
          longitude,
          is_available,
          availability_radius,
          last_donation_date,
          total_donations,
          city,
          state,
          address,
          created_at
        `)
        .eq('role', 'donor')
        .eq('is_available', true)
        .gte('latitude', boundingBox.minLat)
        .lte('latitude', boundingBox.maxLat)
        .gte('longitude', boundingBox.minLng)
        .lte('longitude', boundingBox.maxLng)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching nearby donors:', error);
        throw error;
      }

      console.log(`Found ${donors?.length || 0} donors in bounding box`);

      // Filter by blood type compatibility and distance
      const eligibleDonors = [];
      const ineligibleDonors = [];

      donors?.forEach(donor => {
        const eligibility = checkDonorEligibility(
          donor,
          requestData.bloodType,
          maxDistance,
          requestData.latitude,
          requestData.longitude
        );

        const donorWithDistance = {
          ...donor,
          distance: donor.distance,
          distanceFormatted: formatDistance(donor.distance),
          eligibility,
          travelTime: getEstimatedTravelTime(donor.distance),
          bloodTypeCompatible: isBloodTypeCompatible(donor.blood_type, requestData.bloodType)
        };

        if (eligibility.eligible) {
          eligibleDonors.push(donorWithDistance);
        } else {
          ineligibleDonors.push(donorWithDistance);
        }
      });

      // Sort eligible donors
      eligibleDonors.sort((a, b) => {
        switch (sortBy) {
          case 'last_donation':
            const aLastDonation = a.last_donation_date ? new Date(a.last_donation_date) : new Date(0);
            const bLastDonation = b.last_donation_date ? new Date(b.last_donation_date) : new Date(0);
            return bLastDonation - aLastDonation; // Most recent first
          case 'total_donations':
            return (b.total_donations || 0) - (a.total_donations || 0); // Most donations first
          case 'distance':
          default:
            return a.distance - b.distance; // Closest first
        }
      });

      // Limit results
      const results = eligibleDonors.slice(0, maxResults);
      
      if (includeIneligible) {
        results.push(...ineligibleDonors.slice(0, 5)); // Include some ineligible for reference
      }

      console.log(`Found ${results.length} nearby donors (${eligibleDonors.length} eligible)`);

      return {
        donors: results,
        eligibleCount: eligibleDonors.length,
        totalCount: donors?.length || 0,
        searchRadius: maxDistance,
        searchCenter: {
          lat: requestData.latitude,
          lng: requestData.longitude
        }
      };

    } catch (error) {
      console.error('Error in findNearbyDonors:', error);
      throw error;
    }
  }

  /**
   * Find donors for a specific blood type within radius
   * @param {string} bloodType - Required blood type
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async findDonorsByBloodType(bloodType, lat, lng, radiusKm = 25, options = {}) {
    try {
      const requestData = {
        bloodType,
        latitude: lat,
        longitude: lng
      };

      return await this.findNearbyDonors(requestData, {
        maxDistance: radiusKm,
        ...options
      });
    } catch (error) {
      console.error('Error in findDonorsByBloodType:', error);
      throw error;
    }
  }

  /**
   * Get donor statistics for an area
   * @param {number} lat - Center latitude
   * @param {number} lng - Center longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Object>} Donor statistics
   */
  async getDonorStatistics(lat, lng, radiusKm = 50) {
    try {
      const boundingBox = getBoundingBox(lat, lng, radiusKm);

      const { data: donors, error } = await supabase
        .from('user_profiles')
        .select('blood_type, is_available, last_donation_date, total_donations')
        .eq('role', 'donor')
        .gte('latitude', boundingBox.minLat)
        .lte('latitude', boundingBox.maxLat)
        .gte('longitude', boundingBox.minLng)
        .lte('longitude', boundingBox.maxLng)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching donor statistics:', error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        totalDonors: donors?.length || 0,
        availableDonors: 0,
        bloodTypeDistribution: {},
        averageDonations: 0,
        recentlyActive: 0
      };

      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      bloodTypes.forEach(type => {
        stats.bloodTypeDistribution[type] = 0;
      });

      let totalDonations = 0;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      donors?.forEach(donor => {
        if (donor.is_available) {
          stats.availableDonors++;
        }

        if (donor.blood_type) {
          stats.bloodTypeDistribution[donor.blood_type]++;
        }

        if (donor.total_donations) {
          totalDonations += donor.total_donations;
        }

        if (donor.last_donation_date && new Date(donor.last_donation_date) >= thirtyDaysAgo) {
          stats.recentlyActive++;
        }
      });

      stats.averageDonations = stats.totalDonors > 0 ? Math.round(totalDonations / stats.totalDonors) : 0;

      return stats;
    } catch (error) {
      console.error('Error in getDonorStatistics:', error);
      throw error;
    }
  }

  /**
   * Notify nearby donors about an emergency request
   * @param {Object} requestData - Blood request data
   * @param {Array} donorIds - Array of donor IDs to notify
   * @returns {Promise<Object>} Notification results
   */
  async notifyNearbyDonors(requestData, donorIds) {
    try {
      console.log(`Notifying ${donorIds.length} nearby donors about emergency request`);

      // Create donor responses for tracking
      const responses = donorIds.map(donorId => ({
        donor_id: donorId,
        request_id: requestData.id,
        status: 'pending',
        contact_preference: 'phone',
        message: 'Emergency blood request notification'
      }));

      const { data, error } = await supabase
        .from('donor_responses')
        .insert(responses);

      if (error) {
        console.error('Error creating donor responses:', error);
        throw error;
      }

      console.log(`Created ${data?.length || 0} donor response records`);

      return {
        notifiedCount: data?.length || 0,
        requestId: requestData.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in notifyNearbyDonors:', error);
      throw error;
    }
  }

  /**
   * Get donor response statistics for a request
   * @param {string} requestId - Blood request ID
   * @returns {Promise<Object>} Response statistics
   */
  async getRequestResponseStats(requestId) {
    try {
      const { data: responses, error } = await supabase
        .from('donor_responses')
        .select(`
          status,
          created_at,
          user_profiles (
            full_name,
            blood_type,
            distance
          )
        `)
        .eq('request_id', requestId);

      if (error) {
        console.error('Error fetching response stats:', error);
        throw error;
      }

      const stats = {
        totalResponses: responses?.length || 0,
        accepted: 0,
        declined: 0,
        pending: 0,
        averageResponseTime: 0,
        responsesByDistance: {
          '0-5km': 0,
          '5-10km': 0,
          '10-25km': 0,
          '25km+': 0
        }
      };

      let totalResponseTime = 0;
      let validResponseTimes = 0;

      responses?.forEach(response => {
        // Count by status
        if (response.status === 'accepted') stats.accepted++;
        else if (response.status === 'declined') stats.declined++;
        else if (response.status === 'pending') stats.pending++;

        // Calculate response time
        if (response.created_at) {
          const responseTime = new Date() - new Date(response.created_at);
          totalResponseTime += responseTime;
          validResponseTimes++;
        }

        // Count by distance (if available)
        if (response.user_profiles?.distance) {
          const distance = response.user_profiles.distance;
          if (distance <= 5) stats.responsesByDistance['0-5km']++;
          else if (distance <= 10) stats.responsesByDistance['5-10km']++;
          else if (distance <= 25) stats.responsesByDistance['10-25km']++;
          else stats.responsesByDistance['25km+']++;
        }
      });

      if (validResponseTimes > 0) {
        stats.averageResponseTime = Math.round(totalResponseTime / validResponseTimes / 1000 / 60); // in minutes
      }

      return stats;
    } catch (error) {
      console.error('Error in getRequestResponseStats:', error);
      throw error;
    }
  }

  /**
   * Check if a donor has already responded to a request
   * @param {string} donorId - Donor ID
   * @param {string} requestId - Request ID
   * @returns {Promise<Object|null>} Existing response or null
   */
  async getExistingResponse(donorId, requestId) {
    try {
      const { data, error } = await supabase
        .from('donor_responses')
        .select('*')
        .eq('donor_id', donorId)
        .eq('request_id', requestId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing response:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getExistingResponse:', error);
      throw error;
    }
  }

  /**
   * Update donor response status
   * @param {string} responseId - Response ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Updated response
   */
  async updateDonorResponse(responseId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { data, error } = await supabase
        .from('donor_responses')
        .update(updateData)
        .eq('id', responseId)
        .select()
        .single();

      if (error) {
        console.error('Error updating donor response:', error);
        throw error;
      }

      console.log('Donor response updated:', data);
      return data;
    } catch (error) {
      console.error('Error in updateDonorResponse:', error);
      throw error;
    }
  }
}

export default new NearbyDonorService();

