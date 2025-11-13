import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const PatientInfoSection = ({ 
  formData, 
  onFormChange, 
  errors = {},
  bloodTypes = []
}) => {
  const handleInputChange = (field, value) => {
    onFormChange(field, value);
  };

  const getBloodTypeCompatibility = (bloodType) => {
    const compatibility = {
      'A+': { canReceive: ['A+', 'A-', 'O+', 'O-'], canDonate: ['A+', 'AB+'] },
      'A-': { canReceive: ['A-', 'O-'], canDonate: ['A+', 'A-', 'AB+', 'AB-'] },
      'B+': { canReceive: ['B+', 'B-', 'O+', 'O-'], canDonate: ['B+', 'AB+'] },
      'B-': { canReceive: ['B-', 'O-'], canDonate: ['B+', 'B-', 'AB+', 'AB-'] },
      'AB+': { canReceive: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canDonate: ['AB+'] },
      'AB-': { canReceive: ['A-', 'B-', 'AB-', 'O-'], canDonate: ['AB+', 'AB-'] },
      'O+': { canReceive: ['O+', 'O-'], canDonate: ['A+', 'B+', 'AB+', 'O+'] },
      'O-': { canReceive: ['O-'], canDonate: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }
    };
    return compatibility?.[bloodType] || { canReceive: [], canDonate: [] };
  };

  const selectedBloodType = formData?.bloodType;
  const compatibility = selectedBloodType ? getBloodTypeCompatibility(selectedBloodType) : null;

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="User" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Patient Information</h2>
          <p className="text-sm text-text-secondary">Enter patient details for blood request</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Patient Name"
          type="text"
          placeholder="Enter patient's full name"
          value={formData?.patientName || ''}
          onChange={(e) => handleInputChange('patientName', e?.target?.value)}
          error={errors?.patientName}
          required
          className="col-span-1"
        />

        <Input
          label="Age"
          type="number"
          placeholder="Enter age"
          value={formData?.age || ''}
          onChange={(e) => handleInputChange('age', e?.target?.value)}
          error={errors?.age}
          required
          min="1"
          max="120"
          className="col-span-1"
        />

        <div className="col-span-1 md:col-span-2">
          <Select
            label="Blood Type"
            placeholder="Select patient's blood type"
            options={bloodTypes}
            value={formData?.bloodType || ''}
            onChange={(value) => handleInputChange('bloodType', value)}
            error={errors?.bloodType}
            required
            className="w-full"
          />
          
          {compatibility && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-success mb-1">Compatible Donors:</p>
                  <div className="flex flex-wrap gap-1">
                    {compatibility?.canReceive?.map((type) => (
                      <span key={type} className="px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-primary mb-1">Can Help:</p>
                  <div className="flex flex-wrap gap-1">
                    {compatibility?.canDonate?.map((type) => (
                      <span key={type} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-1 md:col-span-2">
          <Input
            label="Medical Condition"
            type="text"
            placeholder="Brief description of medical condition requiring blood"
            value={formData?.medicalCondition || ''}
            onChange={(e) => handleInputChange('medicalCondition', e?.target?.value)}
            error={errors?.medicalCondition}
            description="Provide context for the blood requirement (e.g., surgery, accident, chronic condition)"
            className="w-full"
          />
        </div>

        <Input
          label="Patient ID/Hospital Number"
          type="text"
          placeholder="Enter patient ID or hospital number"
          value={formData?.patientId || ''}
          onChange={(e) => handleInputChange('patientId', e?.target?.value)}
          error={errors?.patientId}
          description="Hospital registration or patient identification number"
          className="col-span-1"
        />

        <Select
          label="Gender"
          placeholder="Select gender"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' }
          ]}
          value={formData?.gender || ''}
          onChange={(value) => handleInputChange('gender', value)}
          error={errors?.gender}
          required
          className="col-span-1"
        />
      </div>
    </div>
  );
};

export default PatientInfoSection;