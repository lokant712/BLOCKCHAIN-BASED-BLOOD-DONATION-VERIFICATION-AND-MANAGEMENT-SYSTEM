// Utility script to fix existing user data issues
import { supabase } from '../lib/supabase';

export const fixExistingUserData = async () => {
  try {
    console.log('Checking existing user profiles...');
    
    // Get all user profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log(`Found ${profiles?.length || 0} user profiles`);
    
    // Check each profile for missing address data
    profiles?.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`, {
        id: profile.id,
        full_name: profile.full_name,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zip_code,
        hasAddress: !!(profile.address || profile.city || profile.state || profile.zip_code)
      });
    });
    
    // Find profiles with missing address data
    const profilesWithMissingAddress = profiles?.filter(profile => 
      !profile.address && !profile.city && !profile.state && !profile.zip_code
    );
    
    console.log(`Found ${profilesWithMissingAddress?.length || 0} profiles with missing address data`);
    
    return {
      totalProfiles: profiles?.length || 0,
      profilesWithMissingAddress: profilesWithMissingAddress?.length || 0,
      profiles: profiles
    };
    
  } catch (error) {
    console.error('Error in fixExistingUserData:', error);
    return null;
  }
};

// Function to update a specific user's address data
export const updateUserAddress = async (userId, addressData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        address: addressData.address || null,
        city: addressData.city || null,
        state: addressData.state || null,
        zip_code: addressData.zipCode || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user address:', error);
      throw error;
    }
    
    console.log('Successfully updated user address:', data);
    return data;
    
  } catch (error) {
    console.error('Error in updateUserAddress:', error);
    throw error;
  }
};

