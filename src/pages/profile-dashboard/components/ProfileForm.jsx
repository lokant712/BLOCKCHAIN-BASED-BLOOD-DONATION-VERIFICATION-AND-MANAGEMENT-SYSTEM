import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProfileForm = ({ 
  user, 
  profile, 
  isEditing, 
  isSaving, 
  errors, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodType: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isAvailable: true,
    // Hospital-specific fields
    hospitalName: '',
    hospitalLicense: '',
    // Medical fields for donors
    medicalConditions: '',
    medications: '',
    lastDonationDate: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (profile) {
      console.log('Setting form data from profile:', profile);
      setFormData({
        fullName: profile.full_name || user?.name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        bloodType: user?.role === 'hospital' ? null : (profile.blood_type || ''),
        dateOfBirth: user?.role === 'hospital' ? null : (profile.date_of_birth || ''),
        gender: user?.role === 'hospital' ? null : (profile.gender || ''),
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zip_code || '',
        isAvailable: profile.is_available ?? true,
        hospitalName: profile.hospital_name || '',
        hospitalLicense: profile.hospital_license || '',
        medicalConditions: user?.role === 'hospital' ? null : (profile.medical_conditions || ''),
        medications: user?.role === 'hospital' ? null : (profile.medications || ''),
        lastDonationDate: user?.role === 'hospital' ? null : (profile.last_donation_date || '')
      });
    }
  }, [profile, user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Common required fields for both roles
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Donor-specific validation
    if (user?.role === 'donor') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.bloodType) {
        newErrors.bloodType = 'Blood type is required for donors';
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
      if (!formData.gender) {
        newErrors.gender = 'Gender is required';
      }
    }

    // Hospital-specific validation
    if (user?.role === 'hospital') {
      if (!formData.hospitalName.trim()) {
        newErrors.hospitalName = 'Hospital name is required';
      }
      if (!formData.hospitalLicense.trim()) {
        newErrors.hospitalLicense = 'Hospital license is required';
      }
    }

    // Phone validation
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const bloodTypeOptions = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];


  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon name="User" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? 'Edit Profile' : 'Profile Information'}
          </h2>
          <p className="text-sm text-text-secondary">
            {isEditing ? 'Update your personal information' : 'View your profile details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
            {user?.role === 'hospital' ? 'Hospital Information' : 'Basic Information'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email - shown for both roles */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={true} // Email cannot be changed from profile
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted cursor-not-allowed"
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-text-secondary mt-1">
                Contact support to change your email address
              </p>
            </div>

            {/* Phone - shown for both roles */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  formErrors.phone ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                placeholder="+1 (555) 123-4567"
              />
              {formErrors.phone && (
                <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
              )}
            </div>

            {/* Donor-specific fields */}
            {user?.role === 'donor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      formErrors.fullName ? 'border-destructive' : 'border-border'
                    } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.fullName && (
                    <p className="text-sm text-destructive mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Blood Type *
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      formErrors.bloodType ? 'border-destructive' : 'border-border'
                    } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  >
                    <option value="">Select blood type</option>
                    {bloodTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formErrors.bloodType && (
                    <p className="text-sm text-destructive mt-1">{formErrors.bloodType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      formErrors.dateOfBirth ? 'border-destructive' : 'border-border'
                    } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="text-sm text-destructive mt-1">{formErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      formErrors.gender ? 'border-destructive' : 'border-border'
                    } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.gender && (
                    <p className="text-sm text-destructive mt-1">{formErrors.gender}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
            Address Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  formErrors.address ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.city ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.state ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.zipCode ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hospital-specific fields - shown prominently for hospitals */}
        {user?.role === 'hospital' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
              Hospital Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.hospitalName ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="General Hospital"
                />
                {formErrors.hospitalName && (
                  <p className="text-sm text-destructive mt-1">{formErrors.hospitalName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hospital License *
                </label>
                <input
                  type="text"
                  name="hospitalLicense"
                  value={formData.hospitalLicense}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.hospitalLicense ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="HL-12345"
                />
                {formErrors.hospitalLicense && (
                  <p className="text-sm text-destructive mt-1">{formErrors.hospitalLicense}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Donor-specific fields */}
        {user?.role === 'donor' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
              Donor Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
                />
                <label className="text-sm font-medium text-foreground">
                  Available for donations
                </label>
              </div>

            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Medical Conditions
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.medicalConditions ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="List any medical conditions (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Current Medications
                </label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    formErrors.medications ? 'border-destructive' : 'border-border'
                  } ${!isEditing ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="List current medications (optional)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              iconName={isSaving ? "Loader2" : "Save"}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileForm;

