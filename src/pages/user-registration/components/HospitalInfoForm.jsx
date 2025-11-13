import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const HospitalInfoForm = ({ formData, onChange, errors }) => {
  const hospitalTypeOptions = [
    { value: 'government', label: 'Government Hospital' },
    { value: 'private', label: 'Private Hospital' },
    { value: 'charitable', label: 'Charitable Hospital' },
    { value: 'specialty', label: 'Specialty Hospital' },
    { value: 'blood-bank', label: 'Blood Bank' }
  ];

  const handleInputChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Hospital Details */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="Building2" size={20} />
          <span>Hospital Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Hospital Name"
            type="text"
            placeholder="Enter hospital name"
            value={formData?.hospitalName || ''}
            onChange={(e) => handleInputChange('hospitalName', e?.target?.value)}
            error={errors?.hospitalName}
            required
          />
          
          <Select
            label="Hospital Type"
            options={hospitalTypeOptions}
            value={formData?.hospitalType || ''}
            onChange={(value) => handleInputChange('hospitalType', value)}
            error={errors?.hospitalType}
            placeholder="Select hospital type"
            required
          />
          
          <Input
            label="License Number"
            type="text"
            placeholder="Enter medical license number"
            value={formData?.licenseNumber || ''}
            onChange={(e) => handleInputChange('licenseNumber', e?.target?.value)}
            error={errors?.licenseNumber}
            description="Government issued medical license"
            required
          />
          
          <Input
            label="Registration Number"
            type="text"
            placeholder="Enter hospital registration number"
            value={formData?.registrationNumber || ''}
            onChange={(e) => handleInputChange('registrationNumber', e?.target?.value)}
            error={errors?.registrationNumber}
            required
          />
        </div>
      </div>
      {/* Contact Person */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="UserCheck" size={20} />
          <span>Contact Person Details</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Person Name"
            type="text"
            placeholder="Enter contact person name"
            value={formData?.contactPersonName || ''}
            onChange={(e) => handleInputChange('contactPersonName', e?.target?.value)}
            error={errors?.contactPersonName}
            required
          />
          
          <Input
            label="Designation"
            type="text"
            placeholder="e.g., Blood Bank Manager"
            value={formData?.designation || ''}
            onChange={(e) => handleInputChange('designation', e?.target?.value)}
            error={errors?.designation}
            required
          />
          
          <Input
            label="Contact Phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData?.contactPhone || ''}
            onChange={(e) => handleInputChange('contactPhone', e?.target?.value)}
            error={errors?.contactPhone}
            description="Direct line for blood requests"
            required
          />
          
          <Input
            label="Emergency Phone"
            type="tel"
            placeholder="+1 (555) 987-6543"
            value={formData?.emergencyPhone || ''}
            onChange={(e) => handleInputChange('emergencyPhone', e?.target?.value)}
            error={errors?.emergencyPhone}
            description="24/7 emergency contact"
            required
          />
        </div>
      </div>
      {/* Address Information */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="MapPin" size={20} />
          <span>Hospital Address</span>
        </h3>
        
        <div className="space-y-4">
          <Input
            label="Street Address"
            type="text"
            placeholder="Enter complete street address"
            value={formData?.streetAddress || ''}
            onChange={(e) => handleInputChange('streetAddress', e?.target?.value)}
            error={errors?.streetAddress}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              type="text"
              placeholder="Enter city"
              value={formData?.city || ''}
              onChange={(e) => handleInputChange('city', e?.target?.value)}
              error={errors?.city}
              required
            />
            
            <Input
              label="State"
              type="text"
              placeholder="Enter state"
              value={formData?.state || ''}
              onChange={(e) => handleInputChange('state', e?.target?.value)}
              error={errors?.state}
              required
            />
            
            <Input
              label="ZIP Code"
              type="text"
              placeholder="Enter ZIP code"
              value={formData?.zipCode || ''}
              onChange={(e) => handleInputChange('zipCode', e?.target?.value)}
              error={errors?.zipCode}
              required
            />
          </div>
        </div>
      </div>
      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <Icon name="Info" size={20} />
          <span>Additional Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bed Capacity"
            type="number"
            placeholder="Enter total bed capacity"
            value={formData?.bedCapacity || ''}
            onChange={(e) => handleInputChange('bedCapacity', e?.target?.value)}
            error={errors?.bedCapacity}
            min="1"
          />
          
          <Input
            label="Blood Bank Capacity (Units)"
            type="number"
            placeholder="Enter blood storage capacity"
            value={formData?.bloodBankCapacity || ''}
            onChange={(e) => handleInputChange('bloodBankCapacity', e?.target?.value)}
            error={errors?.bloodBankCapacity}
            min="1"
            description="Total units that can be stored"
          />
        </div>
      </div>
    </div>
  );
};

export default HospitalInfoForm;