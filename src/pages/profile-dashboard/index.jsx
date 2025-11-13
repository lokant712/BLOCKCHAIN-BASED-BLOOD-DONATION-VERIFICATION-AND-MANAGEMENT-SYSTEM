import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProfileForm from './components/ProfileForm';
import ProfileStats from './components/ProfileStats';
import ProfilePicture from './components/ProfilePicture';
import profileService from '../../services/profileService';
import { fixExistingUserData } from '../../utils/fixExistingUserData';

const ProfileDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

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

    // Load profile data
    loadProfileData(userData.id);
  }, [navigate]);

  const loadProfileData = async (userId) => {
    setIsLoading(true);
    try {
      console.log('Loading profile data for user:', userId);
      
      const [profileData, statsData] = await Promise.all([
        profileService.getUserProfile(userId),
        profileService.getUserStats(userId)
      ]);

      console.log('Profile data loaded:', profileData);
      console.log('Stats data loaded:', statsData);

      // Debug: Check if address data is missing
      if (profileData && (!profileData.address && !profileData.city && !profileData.state && !profileData.zip_code)) {
        console.warn('⚠️ Address data is missing for this user profile');
        console.log('Full profile data:', profileData);
        
        // Run diagnostic on all user data
        const diagnosticResult = await fixExistingUserData();
        console.log('Diagnostic result:', diagnosticResult);
      }

      setProfile(profileData);
      setUserStats(statsData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      setErrors({ general: `Failed to load profile data: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (formData) => {
    setIsSaving(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Update profile in database
      const updatedProfile = await profileService.updateUserProfile(user.id, formData);
      
      // Update user session if name changed
      if (formData.fullName !== user.name) {
        const updatedUser = {
          ...user,
          name: formData.fullName
        };
        localStorage.setItem('userSession', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setErrors({ 
        general: error.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setSuccessMessage('');
  };

  const handleLogout = () => {
    // Clear user session from localStorage
    localStorage.removeItem('userSession');
    // Clear user state
    setUser(null);
    // Navigate to login page
    navigate('/user-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
              <p className="text-text-secondary mt-1">
                Manage your personal information and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  iconName="Edit"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={20} className="text-success" />
                <p className="text-success font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-destructive" />
                <p className="text-destructive font-medium">{errors.general}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Picture & Stats */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <ProfilePicture 
              user={user}
              profile={profile}
            />

            {/* Profile Stats */}
            {userStats && (
              <ProfileStats 
                stats={userStats}
                userRole={user?.role}
              />
            )}
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <ProfileForm
              user={user}
              profile={profile}
              isEditing={isEditing}
              isSaving={isSaving}
              errors={errors}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileDashboard;

