import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const BasicInfoForm = ({ formData, onChange, errors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const handleInputChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="User" size={20} />
          <span>Personal Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            placeholder="Enter your first name"
            value={formData?.firstName || ''}
            onChange={(e) => handleInputChange('firstName', e?.target?.value)}
            error={errors?.firstName}
            required
          />
          
          <Input
            label="Last Name"
            type="text"
            placeholder="Enter your last name"
            value={formData?.lastName || ''}
            onChange={(e) => handleInputChange('lastName', e?.target?.value)}
            error={errors?.lastName}
            required
          />
          
          <Input
            label="Date of Birth"
            type="date"
            value={formData?.dateOfBirth || ''}
            onChange={(e) => handleInputChange('dateOfBirth', e?.target?.value)}
            error={errors?.dateOfBirth}
            required
          />
          
          <Select
            label="Gender"
            options={genderOptions}
            value={formData?.gender || ''}
            onChange={(value) => handleInputChange('gender', value)}
            error={errors?.gender}
            placeholder="Select gender"
            required
          />
        </div>
      </div>
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="Phone" size={20} />
          <span>Contact Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData?.email || ''}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            error={errors?.email}
            description="We'll send verification code to this email"
            required
          />
          
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData?.phone || ''}
            onChange={(e) => handleInputChange('phone', e?.target?.value)}
            error={errors?.phone}
            description="Required for emergency notifications"
            required
          />
        </div>
      </div>
      {/* Medical Information */}
      {formData?.role === 'donor' && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
            <Icon name="Heart" size={20} />
            <span>Medical Information</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Blood Type"
              options={bloodTypeOptions}
              value={formData?.bloodType || ''}
              onChange={(value) => handleInputChange('bloodType', value)}
              error={errors?.bloodType}
              placeholder="Select your blood type"
              required
            />
            
            <Input
              label="Weight (kg)"
              type="number"
              placeholder="Enter weight in kg"
              value={formData?.weight || ''}
              onChange={(e) => handleInputChange('weight', e?.target?.value)}
              error={errors?.weight}
              min="40"
              max="200"
              description="Minimum 50kg required for donation"
            />
          </div>
        </div>
      )}
      {/* Account Security */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="Lock" size={20} />
          <span>Account Security</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData?.password || ''}
              onChange={(e) => handleInputChange('password', e?.target?.value)}
              error={errors?.password}
              description="At least 8 characters with numbers and symbols"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-text-secondary hover:text-foreground"
            >
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
          
          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData?.confirmPassword || ''}
              onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
              error={errors?.confirmPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-text-secondary hover:text-foreground"
            >
              <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoForm;