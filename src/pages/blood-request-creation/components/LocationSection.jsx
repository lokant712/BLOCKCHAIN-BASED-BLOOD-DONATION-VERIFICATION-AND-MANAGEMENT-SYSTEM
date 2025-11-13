import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const LocationSection = ({ 
  formData, 
  onFormChange, 
  errors = {},
  hospitals = []
}) => {
  const handleInputChange = (field, value) => {
    onFormChange(field, value);
  };

  const selectedHospital = hospitals?.find(h => h?.value === formData?.hospitalId);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <Icon name="MapPin" size={20} color="var(--color-secondary)" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Location Details</h2>
          <p className="text-sm text-text-secondary">Specify where the blood is needed</p>
        </div>
      </div>
      <div className="space-y-6">
        <Select
          label="Hospital/Medical Facility"
          placeholder="Select hospital or medical facility"
          options={hospitals}
          value={formData?.hospitalId || ''}
          onChange={(value) => handleInputChange('hospitalId', value)}
          error={errors?.hospitalId}
          required
          searchable
          description="Choose from verified medical facilities"
          className="w-full"
        />

        {selectedHospital && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Icon name="Shield" size={16} color="var(--color-success)" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-foreground">{selectedHospital?.label}</h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                    <Icon name="CheckCircle" size={12} className="mr-1" />
                    Verified
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{selectedHospital?.address}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-text-secondary">
                  <span className="flex items-center space-x-1">
                    <Icon name="Phone" size={12} />
                    <span>{selectedHospital?.phone}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Icon name="Clock" size={12} />
                    <span>24/7 Emergency</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Ward/Department"
            type="text"
            placeholder="e.g., Emergency Ward, ICU, Surgery"
            value={formData?.ward || ''}
            onChange={(e) => handleInputChange('ward', e?.target?.value)}
            error={errors?.ward}
            description="Specific department or ward location"
            className="col-span-1"
          />

          <Input
            label="Room Number"
            type="text"
            placeholder="e.g., Room 205, Bed 3A"
            value={formData?.roomNumber || ''}
            onChange={(e) => handleInputChange('roomNumber', e?.target?.value)}
            error={errors?.roomNumber}
            description="Room or bed number if available"
            className="col-span-1"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-medium text-foreground">Contact Person Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Contact Person Name"
              type="text"
              placeholder="Enter contact person's name"
              value={formData?.contactPersonName || ''}
              onChange={(e) => handleInputChange('contactPersonName', e?.target?.value)}
              error={errors?.contactPersonName}
              required
              description="Person to contact regarding this request"
              className="col-span-1"
            />

            <Select
              label="Relationship to Patient"
              placeholder="Select relationship"
              options={[
                { value: 'self', label: 'Self (Patient)' },
                { value: 'spouse', label: 'Spouse' },
                { value: 'parent', label: 'Parent' },
                { value: 'child', label: 'Child' },
                { value: 'sibling', label: 'Sibling' },
                { value: 'relative', label: 'Other Relative' },
                { value: 'friend', label: 'Friend' },
                { value: 'doctor', label: 'Doctor' },
                { value: 'nurse', label: 'Nurse' },
                { value: 'hospital_staff', label: 'Hospital Staff' }
              ]}
              value={formData?.relationship || ''}
              onChange={(value) => handleInputChange('relationship', value)}
              error={errors?.relationship}
              required
              className="col-span-1"
            />

            <Input
              label="Primary Phone Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData?.primaryPhone || ''}
              onChange={(e) => handleInputChange('primaryPhone', e?.target?.value)}
              error={errors?.primaryPhone}
              required
              description="Primary contact number for urgent communication"
              className="col-span-1"
            />

            <Input
              label="Alternative Phone Number"
              type="tel"
              placeholder="+1 (555) 987-6543"
              value={formData?.alternativePhone || ''}
              onChange={(e) => handleInputChange('alternativePhone', e?.target?.value)}
              error={errors?.alternativePhone}
              description="Backup contact number (optional)"
              className="col-span-1"
            />
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={16} color="var(--color-primary)" className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Location Verification</p>
              <p className="text-text-secondary">
                All hospital locations are verified for authenticity. Donors will be matched based on proximity to the selected facility. 
                Ensure contact details are accurate for immediate communication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;