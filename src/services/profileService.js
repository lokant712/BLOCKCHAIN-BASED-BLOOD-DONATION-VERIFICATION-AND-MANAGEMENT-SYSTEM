import { supabase } from '../lib/supabase';

class ProfileService {
  // Get user profile
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

      console.log('Loaded profile data:', profile);
      return profile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      // Filter out undefined/null values to avoid database errors
      const updateData = {};
      
      if (profileData.fullName !== undefined) updateData.full_name = profileData.fullName;
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;
      
      // Handle blood type - ensure it's null for hospitals or empty strings
      if (profileData.bloodType !== undefined) {
        updateData.blood_type = profileData.bloodType && profileData.bloodType.trim() !== '' 
          ? profileData.bloodType 
          : null;
      }
      
      // Handle date fields - convert empty strings to null
      if (profileData.dateOfBirth !== undefined) {
        updateData.date_of_birth = profileData.dateOfBirth && profileData.dateOfBirth.trim() !== '' 
          ? profileData.dateOfBirth 
          : null;
      }
      
      // Handle gender - ensure it's null for hospitals or empty strings
      if (profileData.gender !== undefined) {
        updateData.gender = profileData.gender && profileData.gender.trim() !== '' 
          ? profileData.gender 
          : null;
      }
      if (profileData.address !== undefined) updateData.address = profileData.address;
      if (profileData.city !== undefined) updateData.city = profileData.city;
      if (profileData.state !== undefined) updateData.state = profileData.state;
      if (profileData.zipCode !== undefined) updateData.zip_code = profileData.zipCode;
      if (profileData.isAvailable !== undefined) updateData.is_available = profileData.isAvailable;
      if (profileData.hospitalName !== undefined) updateData.hospital_name = profileData.hospitalName;
      if (profileData.hospitalLicense !== undefined) updateData.hospital_license = profileData.hospitalLicense;
      if (profileData.medicalConditions !== undefined) updateData.medical_conditions = profileData.medicalConditions;
      if (profileData.medications !== undefined) updateData.medications = profileData.medications;
      
      // Handle last donation date - convert empty strings to null
      if (profileData.lastDonationDate !== undefined) {
        updateData.last_donation_date = profileData.lastDonationDate && profileData.lastDonationDate.trim() !== '' 
          ? profileData.lastDonationDate 
          : null;
      }
      
      updateData.updated_at = new Date().toISOString();

      console.log('Updating profile with data:', updateData);
      console.log('User role:', profileData.role || 'unknown');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  // Update user authentication data (email, password)
  async updateUserAuth(userId, authData) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: authData.email,
        password: authData.password,
        data: {
          full_name: authData.fullName,
          role: authData.role
        }
      });

      if (error) {
        console.error('Error updating user auth:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserAuth:', error);
      throw error;
    }
  }

  // Generate gender-based avatar URL (placeholder for future implementation)
  generateGenderBasedAvatar(gender) {
    // This could be expanded to use actual avatar services like Gravatar, DiceBear, etc.
    const avatarMap = {
      male: 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=b6e3f4',
      female: 'https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=f0abfc',
      other: 'https://api.dicebear.com/7.x/avataaars/svg?seed=other&backgroundColor=c4b5fd',
      default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=9ca3af'
    };
    
    return avatarMap[gender?.toLowerCase()] || avatarMap.default;
  }

  // Reset to gender-based avatar
  async resetToGenderAvatar(userId) {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture_url: null })
        .eq('id', userId);

      if (updateError) {
        console.error('Error resetting to gender avatar:', updateError);
        throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error in resetToGenderAvatar:', error);
      throw error;
    }
  }

  // Get user's donation statistics
  async getUserStats(userId) {
    try {
      const { data: donations, error } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', userId)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      const totalDonations = donations?.length || 0;
      const totalBloodDonated = donations?.reduce((sum, donation) => sum + (donation.amount_ml || 450), 0) || 0;
      const livesSaved = Math.floor(totalBloodDonated / 450);

      return {
        totalDonations,
        totalBloodDonated,
        livesSaved,
        lastDonationDate: donations?.[0]?.donation_date || null
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return null;
    }
  }
}

export default new ProfileService();
  