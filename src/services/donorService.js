import { supabase } from '../lib/supabase';

class DonorService {
  // Get donor statistics
  async getDonorStats(userId) {
    try {
      // Get user profile first to check blood type
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('blood_type')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return this.getDefaultStats();
      }

      // Get total donations count
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', userId)
        .eq('status', 'completed');

      if (donationsError) {
        console.error('Error fetching donations:', donationsError);
        // Don't return default stats, continue with 0 values
      }

      // Get active requests for the donor's blood type (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeRequests, error: requestsError } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('blood_type', userProfile.blood_type)
        .in('status', ['pending', 'active'])
        .gte('created_at', thirtyDaysAgo);

      if (requestsError) {
        console.error('Error fetching active requests:', requestsError);
        // Continue with 0 values
      }

      // Calculate real stats from actual data
      const totalDonations = donations?.length || 0;
      const livesSaved = totalDonations; // Each donation saves a life
      const activeRequestsCount = activeRequests?.length || 0;

      // Determine donor level based on real donations
      let donorLevel = 'New Donor';
      if (totalDonations >= 20) donorLevel = 'Platinum';
      else if (totalDonations >= 10) donorLevel = 'Gold';
      else if (totalDonations >= 5) donorLevel = 'Silver';
      else if (totalDonations >= 1) donorLevel = 'Bronze';

      // Get last donation date for eligibility calculation
      const lastDonation = donations && donations.length > 0 
        ? donations.sort((a, b) => new Date(b.donation_date || b.created_at) - new Date(a.donation_date || a.created_at))[0]
        : null;

      return {
        totalDonations,
        livesSaved,
        activeRequests: activeRequestsCount,
        donorLevel,
        isNewDonor: totalDonations === 0,
        lastDonationDate: lastDonation ? (lastDonation.donation_date || lastDonation.created_at) : null
      };
    } catch (error) {
      console.error('Error in getDonorStats:', error);
      return this.getDefaultStats();
    }
  }

  // Get donation history
  async getDonationHistory(userId) {
    try {
      const { data: donations, error } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching donation history:', error);
        return [];
      }

      return donations?.map(donation => ({
        id: donation.id,
        hospitalName: donation.hospital_name || 'Unknown Hospital',
        date: new Date(donation.donation_date || donation.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        bloodType: donation.blood_type || 'Unknown',
        amount: donation.amount_ml || 450,
        status: donation.status,
        donationId: donation.id,
        certificate: donation.certificate_url ? true : false,
        thankYouMessage: donation.thank_you_message || 'Thank you for your life-saving donation!'
      })) || [];
    } catch (error) {
      console.error('Error in getDonationHistory:', error);
      return [];
    }
  }

  // Get urgent requests for donor's blood type
  async getUrgentRequests(userId) {
    try {
      console.log('🔍 Fetching urgent requests for donor:', userId);
      
      // Get user's blood type
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('blood_type')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return [];
      }

      console.log('👤 User blood type:', userProfile.blood_type);

      // Get requests where this specific donor has been notified
      console.log('🔍 Donor service: Fetching requests where donor was specifically notified');
      
      const { data: requests, error } = await supabase
        .from('blood_requests')
        .select(`
          *,
          user_profiles!blood_requests_requester_id_fkey (
            hospital_name,
            address,
            city,
            state
          ),
          donor_responses!inner (
            id,
            status,
            message,
            created_at
          )
        `)
        .eq('donor_responses.donor_id', userId)
        .eq('status', 'active')
        .in('donor_responses.status', ['notified', 'pending']) // Only show requests that need response
        .order('urgency', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching urgent requests:', error);
        return [];
      }

      console.log('📋 Found requests:', requests?.length || 0);

      return requests?.map(request => ({
        id: request.id,
        bloodType: request.blood_type,
        urgency: request.urgency,
        hospitalName: request.user_profiles?.hospital_name || 'Unknown Hospital',
        distance: Math.floor(Math.random() * 10) + 1, // Mock distance for now
        timeAgo: this.getTimeAgo(request.created_at),
        unitsNeeded: request.units_needed,
        patientInfo: {
          age: request.patient_age,
          condition: request.patient_condition
        }
      })) || [];
    } catch (error) {
      console.error('Error in getUrgentRequests:', error);
      return [];
    }
  }

  // Get user profile with additional info
  async getUserProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Get next donation eligibility date
  async getNextEligibilityDate(userId) {
    try {
      // Get the most recent completed donation
      const { data: lastDonation, error } = await supabase
        .from('donations')
        .select('donation_date')
        .eq('donor_id', userId)
        .eq('status', 'completed')
        .order('donation_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching last donation:', error);
        return null; // No previous donations, eligible now
      }

      if (!lastDonation) {
        return null; // No previous donations, eligible now
      }

      // Calculate next eligibility date (90 days from last donation)
      const lastDonationDate = new Date(lastDonation.donation_date);
      const nextEligibilityDate = new Date(lastDonationDate);
      nextEligibilityDate.setDate(nextEligibilityDate.getDate() + 90); // 90 days is the cooldown period

      return nextEligibilityDate;
    } catch (error) {
      console.error('Error in getNextEligibilityDate:', error);
      return null;
    }
  }


  // Helper methods
  getDefaultStats() {
    return {
      totalDonations: 0,
      livesSaved: 0,
      activeRequests: 0,
      donorLevel: 'New Donor',
      isNewDonor: true
    };
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }
}

export default new DonorService();
