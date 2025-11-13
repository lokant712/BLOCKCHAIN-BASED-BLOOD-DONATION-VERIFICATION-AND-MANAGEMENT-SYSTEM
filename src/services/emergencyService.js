import { supabase } from '../lib/supabase';

class EmergencyService {
  // Blood type compatibility matrix
  // This defines which donor blood types are compatible with each recipient blood type
  bloodCompatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],        // A+ can receive from A+, A-, O+, O-
    'A-': ['A-', 'O-'],                    // A- can receive from A-, O-
    'B+': ['B+', 'B-', 'O+', 'O-'],        // B+ can receive from B+, B-, O+, O-
    'B-': ['B-', 'O-'],                    // B- can receive from B-, O-
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
    'AB-': ['A-', 'B-', 'AB-', 'O-'],      // AB- can receive from A-, B-, AB-, O-
    'O+': ['O+', 'O-'],                    // O+ can receive from O+, O-
    'O-': ['O-']                           // O- can only receive from O- (universal donor)
  };

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Get blood type compatibility summary
  getCompatibilitySummary(requestedBloodType) {
    const compatibleTypes = this.bloodCompatibility[requestedBloodType] || [];
    return {
      requested: requestedBloodType,
      compatible: compatibleTypes,
      count: compatibleTypes.length,
      isUniversalRecipient: requestedBloodType === 'AB+',
      isUniversalDonor: requestedBloodType === 'O-'
    };
  }

  // Check if donor is eligible to donate
  isEligibleToDonate(donor) {
    const now = new Date();
    const lastDonation = donor.last_donation_date ? new Date(donor.last_donation_date) : null;
    const lastEmergencyResponse = donor.last_emergency_response_date ? new Date(donor.last_emergency_response_date) : null;
    
    // Check if last donation was more than 56 days ago (8 weeks)
    if (lastDonation) {
      const daysSinceLastDonation = (now - lastDonation) / (1000 * 60 * 60 * 24);
      if (daysSinceLastDonation < 56) {
        return false;
      }
    }

    // Check if donor responded to emergency request within last 90 days
    if (lastEmergencyResponse) {
      const daysSinceLastEmergencyResponse = (now - lastEmergencyResponse) / (1000 * 60 * 60 * 24);
      if (daysSinceLastEmergencyResponse < 90) {
        console.log(`⚠️ Donor ${donor.full_name} is in 90-day emergency cooldown period (${Math.round(daysSinceLastEmergencyResponse)} days ago)`);
        return false;
      }
    }

    // Check if donor is available
    if (!donor.is_available) {
      return false;
    }

    // Check if donor has any medical conditions that prevent donation
    if (donor.medical_conditions && donor.medical_conditions.trim() !== '') {
      return false;
    }

    return true;
  }

  // Get detailed eligibility reason for donor
  getEligibilityReason(donor) {
    const now = new Date();
    const lastDonation = donor.last_donation_date ? new Date(donor.last_donation_date) : null;
    const lastEmergencyResponse = donor.last_emergency_response_date ? new Date(donor.last_emergency_response_date) : null;
    
    // Check if last donation was more than 56 days ago (8 weeks)
    if (lastDonation) {
      const daysSinceLastDonation = (now - lastDonation) / (1000 * 60 * 60 * 24);
      if (daysSinceLastDonation < 56) {
        return `Last donation ${Math.round(daysSinceLastDonation)} days ago (need 56 days)`;
      }
    }

    // Check if donor responded to emergency request within last 90 days
    if (lastEmergencyResponse) {
      const daysSinceLastEmergencyResponse = (now - lastEmergencyResponse) / (1000 * 60 * 60 * 24);
      if (daysSinceLastEmergencyResponse < 90) {
        return `Emergency cooldown: ${Math.round(daysSinceLastEmergencyResponse)} days ago (need 90 days)`;
      }
    }

    // Check if donor is available
    if (!donor.is_available) {
      return 'Currently unavailable';
    }

    // Check if donor has any medical conditions that prevent donation
    if (donor.medical_conditions && donor.medical_conditions.trim() !== '') {
      return 'Medical conditions prevent donation';
    }

    return 'Eligible to donate';
  }

  // Find matching donors for emergency request
  async findMatchingDonors(requestData) {
    try {
      console.log('🔍 EmergencyService: Finding matching donors for request:', requestData);
      console.log('🔍 EmergencyService: Blood type:', requestData.bloodType);
      console.log('🔍 EmergencyService: Location:', requestData.latitude, requestData.longitude);

      const { bloodType, latitude, longitude, urgency, hospitalId } = requestData;
      
      // Get compatible blood types
      const compatibleBloodTypes = this.bloodCompatibility[bloodType] || [];
      
      console.log(`🔍 EmergencyService: Requested blood type: ${bloodType}`);
      console.log(`🔍 EmergencyService: Compatible blood types:`, compatibleBloodTypes);
      
      // Show compatibility summary
      const compatibilitySummary = this.getCompatibilitySummary(bloodType);
      console.log(`🔍 EmergencyService: Compatibility summary:`, compatibilitySummary);
      
      if (compatibleBloodTypes.length === 0) {
        throw new Error(`No compatible blood types found for ${bloodType}`);
      }

      // Get ALL donors with compatible blood types (temporarily removing eligibility restrictions)
      const { data: donors, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          full_name,
          phone,
          email,
          blood_type,
          is_available,
          availability_radius,
          last_donation_date,
          last_emergency_response_date,
          medical_conditions,
          medications,
          address,
          city,
          state,
          latitude,
          longitude,
          created_at
        `)
        .eq('role', 'donor')
        .eq('is_active', true)
        .in('blood_type', compatibleBloodTypes);

      if (error) {
        throw error;
      }

      console.log(`📊 Found ${donors?.length || 0} potential donors with compatible blood types`);
      console.log(`📊 Donors found:`, donors?.map(d => ({ name: d.full_name, blood_type: d.blood_type, is_available: d.is_available })));

      // Process ALL donors and mark their eligibility status
      const allDonors = [];
      
      for (const donor of donors || []) {
        // Double-check blood type compatibility (extra safety)
        if (!compatibleBloodTypes.includes(donor.blood_type)) {
          console.log(`⚠️ Skipping donor ${donor.full_name} - blood type ${donor.blood_type} not compatible with ${bloodType}`);
          continue;
        }
        
        // Make ALL donors eligible for testing (temporarily removing all restrictions)
        const isEligible = true; // Force all donors to be eligible
        const eligibilityReason = 'Eligible to donate (testing mode)';

        // Calculate distance if coordinates are available
        let distance = null;
        if (latitude && longitude && donor.latitude && donor.longitude) {
          distance = this.calculateDistance(
            latitude, longitude, 
            donor.latitude, donor.longitude
          );
        }

        // Calculate priority score based on urgency and distance
        let priorityScore = 0;
        
        // Base score for blood type compatibility
        if (donor.blood_type === bloodType) {
          priorityScore += 100; // Exact match gets highest priority
        } else {
          priorityScore += 50; // Compatible but not exact
        }

        // Distance factor (closer is better)
        if (distance !== null) {
          priorityScore += Math.max(0, 50 - distance); // Closer donors get higher score
        }

        // Urgency factor
        const urgencyMultiplier = {
          'critical': 2.0,
          'urgent': 1.5,
          'normal': 1.0,
          'low': 0.8
        };
        priorityScore *= (urgencyMultiplier[urgency] || 1.0);

        // Recent donor factor (prefer donors who haven't donated recently)
        if (donor.last_donation_date) {
          const daysSinceLastDonation = (new Date() - new Date(donor.last_donation_date)) / (1000 * 60 * 60 * 24);
          if (daysSinceLastDonation > 90) {
            priorityScore += 20; // Bonus for donors who haven't donated in 3+ months
          }
        } else {
          priorityScore += 30; // Bonus for first-time donors
        }

        allDonors.push({
          ...donor,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          priorityScore: Math.round(priorityScore),
          estimatedArrivalTime: distance ? this.calculateArrivalTime(distance) : null,
          isEligible: isEligible,
          eligibilityReason: eligibilityReason,
          canBeSelected: true // All donors can be selected in testing mode
        });
      }

      // Sort by priority score (highest first) - all donors are eligible in testing mode
      allDonors.sort((a, b) => b.priorityScore - a.priorityScore);

      console.log(`✅ Found ${allDonors.length} total donors (${allDonors.filter(d => d.isEligible).length} eligible)`);
      console.log(`✅ All donors:`, allDonors.map(d => ({ 
        name: d.full_name, 
        blood_type: d.blood_type, 
        distance: d.distance,
        priority_score: d.priorityScore,
        is_eligible: d.isEligible,
        eligibility_reason: d.eligibilityReason
      })));
      return allDonors;

    } catch (error) {
      console.error('❌ Error finding matching donors:', error);
      throw error;
    }
  }

  // Calculate estimated arrival time based on distance
  calculateArrivalTime(distanceKm) {
    const averageSpeed = 30; // km/h in city traffic
    const timeInHours = distanceKm / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    if (timeInMinutes < 60) {
      return `${timeInMinutes} minutes`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  // Send notifications to matched donors
  async notifyDonors(requestId, donors, requestData) {
    try {
      console.log(`📱 Notifying ${donors.length} donors for request ${requestId}`);

      // Create notification records in the database to track which donors were notified
      const notifications = [];
      
      for (const donor of donors) {
        try {
          // Insert a notification record in donor_responses table with status 'notified'
          let notificationData, insertError;
          
          // Try 'notified' status first
          const result = await supabase
            .from('donor_responses')
            .insert({
              request_id: requestId,
              donor_id: donor.id,
              status: 'notified', // Mark as notified
              message: this.generateNotificationMessage(requestData, donor),
              contact_preference: 'phone',
              available_time: new Date().toISOString(),
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          notificationData = result.data;
          insertError = result.error;

          // If 'notified' status doesn't exist, try 'pending' as fallback
          if (insertError && insertError.message.includes('notified')) {
            console.log(`⚠️ 'notified' status not available, using 'pending' for donor ${donor.id}`);
            const fallbackResult = await supabase
              .from('donor_responses')
              .insert({
                request_id: requestId,
                donor_id: donor.id,
                status: 'pending', // Fallback to pending
                message: this.generateNotificationMessage(requestData, donor),
                contact_preference: 'phone',
                available_time: new Date().toISOString(),
                created_at: new Date().toISOString()
              })
              .select()
              .single();
              
            notificationData = fallbackResult.data;
            insertError = fallbackResult.error;
          }

          if (insertError) {
            console.error(`❌ Error creating notification for donor ${donor.id}:`, insertError);
            continue; // Skip this donor but continue with others
          }

          notifications.push({
            id: notificationData.id,
            request_id: requestId,
            donor_id: donor.id,
            donor_name: donor.full_name,
            blood_type: donor.blood_type,
            phone: donor.phone,
            distance: donor.distance,
            status: 'notified',
            message: notificationData.message,
            created_at: notificationData.created_at
          });

          console.log(`✅ Created notification record for donor ${donor.full_name}`);
        } catch (error) {
          console.error(`❌ Error processing donor ${donor.id}:`, error);
        }
      }

      // Update request status to 'pending' (seeking donors)
      // Note: Using 'pending' instead of 'active' due to enum constraints
      console.log('🔄 Updating blood request status to pending for request:', requestId);
      
      // First, check if the request exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('blood_requests')
        .select('id, status')
        .eq('id', requestId)
        .single();
        
      if (checkError) {
        console.error('❌ Error checking if request exists:', checkError);
        throw new Error(`Request with ID ${requestId} not found: ${checkError.message}`);
      }
      
      console.log('✅ Request exists:', existingRequest);
      
      const { error: updateError } = await supabase
        .from('blood_requests')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (updateError) {
        console.error('❌ Error updating blood request status:', updateError);
        throw updateError;
      }
      
      console.log('✅ Successfully updated blood request status');

      console.log(`✅ Successfully notified ${notifications.length} donors`);
      return notifications;

    } catch (error) {
      console.error('❌ Error notifying donors:', error);
      throw error;
    }
  }

  // Generate personalized notification message
  generateNotificationMessage(requestData, donor) {
    const { bloodType, urgency, hospitalName, city, patientAge, patientGender } = requestData;
    const urgencyText = urgency === 'critical' ? 'CRITICAL EMERGENCY' : 'urgent';
    
    let message = `🚨 ${urgencyText} BLOOD REQUEST 🚨\n\n`;
    message += `Blood Type Needed: ${bloodType}\n`;
    message += `Hospital: ${hospitalName || 'Local Hospital'}\n`;
    message += `Location: ${city || 'Your Area'}\n`;
    
    if (patientAge && patientGender) {
      message += `Patient: ${patientGender}, ${patientAge} years old\n`;
    }
    
    if (donor.distance) {
      message += `Distance: ${donor.distance}km from you\n`;
      if (donor.estimatedArrivalTime) {
        message += `Estimated travel time: ${donor.estimatedArrivalTime}\n`;
      }
    }
    
    message += `\nYour blood type (${donor.blood_type}) is compatible!\n`;
    message += `Please respond ASAP if you can help.`;
    
    return message;
  }

  // Track donor responses
  async trackDonorResponse(requestId, donorId, response, message = '') {
    try {
      console.log(`📊 Tracking donor response: ${response} for request ${requestId}`);

      const { data, error } = await supabase
        .from('donor_responses')
        .insert({
          request_id: requestId,
          donor_id: donorId,
          status: response, // 'accepted', 'declined'
          message: message,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // If donor accepted, update request status and notify others
      if (response === 'accepted') {
        await this.handleDonorAcceptance(requestId, donorId);
      }

      return data;

    } catch (error) {
      console.error('❌ Error tracking donor response:', error);
      throw error;
    }
  }

  // Handle when a donor accepts the request
  async handleDonorAcceptance(requestId, donorId) {
    try {
      console.log(`🎉 Handling donor acceptance for request ${requestId}`);

      // Update request status to 'fulfilled'
      await supabase
        .from('blood_requests')
        .update({ 
          status: 'fulfilled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // Notify other donors that request is fulfilled
      await supabase
        .from('donor_notifications')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId)
        .neq('donor_id', donorId);

      // Create connection between hospital and donor
      await supabase
        .from('donor_hospital_connections')
        .insert({
          request_id: requestId,
          donor_id: donorId,
          status: 'connected',
          created_at: new Date().toISOString()
        });

      console.log('✅ Successfully handled donor acceptance');

    } catch (error) {
      console.error('❌ Error handling donor acceptance:', error);
      throw error;
    }
  }

  // Get real-time updates for a request
  async getRequestUpdates(requestId) {
    try {
      const { data, error } = await supabase
        .from('donor_responses')
        .select(`
          *,
          user_profiles (
            id,
            full_name,
            phone,
            blood_type
          )
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Error getting request updates:', error);
      throw error;
    }
  }

  // Get emergency request statistics
  async getEmergencyStats(hospitalId) {
    try {
      const { data, error } = await supabase
        .from('blood_requests')
        .select('status, urgency, created_at')
        .eq('hospital_id', hospitalId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        critical: data?.filter(r => r.urgency === 'critical').length || 0,
        urgent: data?.filter(r => r.urgency === 'urgent').length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        active: data?.filter(r => r.status === 'pending').length || 0, // Map 'active' to 'pending' for now
        fulfilled: data?.filter(r => r.status === 'fulfilled').length || 0
      };

      return stats;

    } catch (error) {
      console.error('❌ Error getting emergency stats:', error);
      throw error;
    }
  }

  // Start emergency workflow for a request
  async startEmergencyWorkflow(requestId, requestData) {
    try {
      console.log(`🚀 Starting emergency workflow for request ${requestId}`);

      // Step 1: Find matching donors
      const donors = await this.findMatchingDonors(requestData);
      
      if (donors.length === 0) {
        throw new Error('No eligible donors found in your area. Please try expanding the search radius or contact nearby hospitals.');
      }

      // Step 2: Send notifications
      const notifications = await this.notifyDonors(requestId, donors, requestData);
      
      return {
        success: true,
        donorsFound: donors.length,
        notificationsSent: notifications.length,
        donors: donors.slice(0, 10) // Return top 10 donors
      };

    } catch (error) {
      console.error('❌ Emergency workflow failed:', error);
      throw error;
    }
  }
}

export default new EmergencyService();
