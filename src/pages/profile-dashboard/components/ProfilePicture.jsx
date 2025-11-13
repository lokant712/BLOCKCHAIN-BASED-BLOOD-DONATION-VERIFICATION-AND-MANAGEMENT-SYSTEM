import React from 'react';
import Icon from '../../../components/AppIcon';

const ProfilePicture = ({ user, profile }) => {
  const getAvatarForUser = (user, profile) => {
    // Hospital users get hospital-specific avatar
    if (user?.role === 'hospital') {
      return {
        icon: 'Building2',
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        label: 'Hospital Avatar',
        description: 'Hospital Profile'
      };
    }
    
    // Donor users get gender-based avatar
    const gender = profile?.gender;
    switch (gender?.toLowerCase()) {
      case 'male':
        return {
          icon: 'User',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          label: 'Male Avatar',
          description: 'Male Donor'
        };
      case 'female':
        return {
          icon: 'User',
          bgColor: 'bg-pink-500',
          textColor: 'text-white',
          label: 'Female Avatar',
          description: 'Female Donor'
        };
      case 'other':
      case 'prefer_not_to_say':
        return {
          icon: 'User',
          bgColor: 'bg-purple-500',
          textColor: 'text-white',
          label: 'Other Avatar',
          description: 'Other Donor'
        };
      default:
        return {
          icon: 'User',
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          label: 'Default Avatar',
          description: 'Donor Profile'
        };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatar = getAvatarForUser(user, profile);

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon name="User" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Profile Avatar</h3>
          <p className="text-sm text-text-secondary">
            {user?.role === 'hospital' ? 'Hospital profile avatar' : 'Your avatar based on gender'}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Profile Avatar Display */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
            {profile?.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt={`${user?.name}'s profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${avatar.bgColor}`}>
                <Icon 
                  name={avatar.icon} 
                  size={48} 
                  color="white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Current Avatar Info */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{avatar.label}</p>
          <p className="text-xs text-text-secondary">
            {user?.role === 'hospital' 
              ? `Hospital: ${profile?.hospital_name || 'Not set'}`
              : `Gender: ${profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'}`
            }
          </p>
        </div>

        {/* Info Message */}
        <div className="w-full p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="Info" size={16} className="text-primary" />
            <p className="text-sm text-primary">
              {user?.role === 'hospital' 
                ? 'Hospital avatar is automatically assigned based on your account type.'
                : 'Avatar automatically updates when you change your gender in the profile form below.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePicture;