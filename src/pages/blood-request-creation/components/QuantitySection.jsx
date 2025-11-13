import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const QuantitySection = ({ 
  formData, 
  onFormChange, 
  errors = {} 
}) => {
  const handleInputChange = (field, value) => {
    onFormChange(field, value);
  };

  const bloodComponents = [
    { value: 'whole_blood', label: 'Whole Blood', description: 'Complete blood with all components' },
    { value: 'red_blood_cells', label: 'Red Blood Cells (RBC)', description: 'Packed red blood cells' },
    { value: 'platelets', label: 'Platelets', description: 'Platelet concentrate' },
    { value: 'plasma', label: 'Plasma', description: 'Fresh frozen plasma' },
    { value: 'cryoprecipitate', label: 'Cryoprecipitate', description: 'Clotting factor concentrate' }
  ];

  const unitMeasurements = [
    { value: 'units', label: 'Units', description: 'Standard blood units (450ml each)' },
    { value: 'ml', label: 'Milliliters (ml)', description: 'Volume in milliliters' },
    { value: 'bags', label: 'Bags', description: 'Number of blood bags' }
  ];

  const getEstimatedVolume = () => {
    const quantity = parseInt(formData?.quantity) || 0;
    const measurement = formData?.unitMeasurement;
    
    if (measurement === 'units') {
      return `${quantity * 450} ml`;
    } else if (measurement === 'bags') {
      return `${quantity * 450} ml (assuming 450ml per bag)`;
    } else if (measurement === 'ml') {
      return `${quantity} ml`;
    }
    return '';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-success/10 rounded-lg">
          <Icon name="Droplets" size={20} color="var(--color-success)" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Blood Quantity & Requirements</h2>
          <p className="text-sm text-text-secondary">Specify the amount and type of blood needed</p>
        </div>
      </div>
      <div className="space-y-6">
        <Select
          label="Blood Component Type"
          placeholder="Select blood component needed"
          options={bloodComponents}
          value={formData?.bloodComponent || ''}
          onChange={(value) => handleInputChange('bloodComponent', value)}
          error={errors?.bloodComponent}
          required
          description="Choose the specific blood component required"
          className="w-full"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Quantity"
            type="number"
            placeholder="Enter quantity needed"
            value={formData?.quantity || ''}
            onChange={(e) => handleInputChange('quantity', e?.target?.value)}
            error={errors?.quantity}
            required
            min="1"
            max="20"
            description="Number of units/bags/volume needed"
            className="col-span-1"
          />

          <Select
            label="Unit of Measurement"
            placeholder="Select measurement unit"
            options={unitMeasurements}
            value={formData?.unitMeasurement || ''}
            onChange={(value) => handleInputChange('unitMeasurement', value)}
            error={errors?.unitMeasurement}
            required
            className="col-span-1"
          />
        </div>

        {formData?.quantity && formData?.unitMeasurement && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="Calculator" size={16} color="var(--color-primary)" />
              <h4 className="font-medium text-foreground">Estimated Volume</h4>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Total estimated volume: <span className="font-medium text-foreground">{getEstimatedVolume()}</span>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-md font-medium text-foreground">Additional Requirements</h3>
          
          <div className="space-y-4">
            <Input
              label="Special Requirements"
              type="text"
              placeholder="e.g., CMV negative, irradiated, leukoreduced"
              value={formData?.specialRequirements || ''}
              onChange={(e) => handleInputChange('specialRequirements', e?.target?.value)}
              error={errors?.specialRequirements}
              description="Any special processing or compatibility requirements"
              className="w-full"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Required By Date"
                type="datetime-local"
                value={formData?.requiredByDate || ''}
                onChange={(e) => handleInputChange('requiredByDate', e?.target?.value)}
                error={errors?.requiredByDate}
                required
                description="When the blood is needed"
                className="col-span-1"
              />

              <Select
                label="Cross-Match Status"
                placeholder="Select cross-match requirement"
                options={[
                  { value: 'required', label: 'Cross-match Required', description: 'Full compatibility testing needed' },
                  { value: 'emergency', label: 'Emergency Release', description: 'Type-specific without cross-match' },
                  { value: 'completed', label: 'Already Cross-matched', description: 'Compatible donor already identified' }
                ]}
                value={formData?.crossMatchStatus || ''}
                onChange={(value) => handleInputChange('crossMatchStatus', value)}
                error={errors?.crossMatchStatus}
                required
                className="col-span-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-medium text-foreground">Additional Notes</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Additional Information
            </label>
            <textarea
              placeholder="Any additional information that might help donors or medical staff..."
              value={formData?.additionalNotes || ''}
              onChange={(e) => handleInputChange('additionalNotes', e?.target?.value)}
              className="w-full min-h-[100px] px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical"
              rows={4}
            />
            <p className="text-xs text-text-secondary">
              Include any relevant medical history, allergies, or special circumstances
            </p>
          </div>
        </div>

        <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">Important Guidelines</p>
              <ul className="text-text-secondary space-y-1">
                <li>• Standard blood unit = 450ml (approximately 1 pint)</li>
                <li>• Emergency requests are prioritized but require medical verification</li>
                <li>• Cross-matching typically takes 45-60 minutes for safety</li>
                <li>• Special requirements may limit available donor pool</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantitySection;