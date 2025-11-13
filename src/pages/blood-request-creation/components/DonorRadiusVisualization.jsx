import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const DonorRadiusVisualization = ({ 
  formData, 
  onRadiusChange,
  errors = {} 
}) => {
  const [selectedRadius, setSelectedRadius] = useState(formData?.searchRadius || 10);
  const [estimatedDonors, setEstimatedDonors] = useState(0);

  const radiusOptions = [
    { value: 5, label: '5 km', description: 'Immediate vicinity' },
    { value: 10, label: '10 km', description: 'Local area' },
    { value: 25, label: '25 km', description: 'Extended area' },
    { value: 50, label: '50 km', description: 'Regional coverage' },
    { value: 100, label: '100 km', description: 'Wide coverage' }
  ];

  // Mock donor estimation based on blood type and radius
  const estimateDonors = (bloodType, radius) => {
    const bloodTypeRarity = {
      'O-': 0.067, 'O+': 0.374, 'A-': 0.063, 'A+': 0.357,
      'B-': 0.015, 'B+': 0.085, 'AB-': 0.006, 'AB+': 0.034
    };
    
    const basePopulation = Math.pow(radius, 2) * 3.14 * 100; // Rough population density
    const bloodTypePercentage = bloodTypeRarity?.[bloodType] || 0.1;
    const availabilityRate = 0.15; // 15% of people are available donors
    
    return Math.floor(basePopulation * bloodTypePercentage * availabilityRate);
  };

  useEffect(() => {
    if (formData?.bloodType && selectedRadius) {
      const estimated = estimateDonors(formData?.bloodType, selectedRadius);
      setEstimatedDonors(estimated);
    }
  }, [formData?.bloodType, selectedRadius]);

  const handleRadiusChange = (radius) => {
    setSelectedRadius(radius);
    onRadiusChange('searchRadius', radius);
  };

  const getUrgencyMultiplier = () => {
    switch (formData?.urgencyLevel) {
      case 'emergency': return 1.5;
      case 'urgent': return 1.2;
      default: return 1.0;
    }
  };

  const getEstimatedResponseTime = () => {
    const baseTime = selectedRadius * 2; // 2 minutes per km average
    const urgencyMultiplier = getUrgencyMultiplier();
    return Math.max(15, Math.floor(baseTime / urgencyMultiplier));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon name="Target" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Donor Search Radius</h2>
          <p className="text-sm text-text-secondary">Set the search area for finding compatible donors</p>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Search Radius
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {radiusOptions?.map((option) => (
              <button
                key={option?.value}
                onClick={() => handleRadiusChange(option?.value)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                  selectedRadius === option?.value
                    ? 'border-primary bg-primary/10 text-primary' :'border-border bg-card hover:border-primary/20 text-foreground'
                }`}
              >
                <div className="font-semibold">{option?.label}</div>
                <div className="text-xs text-text-secondary mt-1">{option?.description}</div>
              </button>
            ))}
          </div>
          {errors?.searchRadius && (
            <p className="text-sm text-destructive mt-2">{errors?.searchRadius}</p>
          )}
        </div>

        {/* Visual Radius Representation */}
        <div className="relative">
          <div className="bg-muted rounded-lg p-6 overflow-hidden">
            <div className="relative w-full h-48 flex items-center justify-center">
              {/* Concentric circles representing radius */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[20, 40, 60, 80]?.map((size, index) => (
                  <div
                    key={size}
                    className={`absolute rounded-full border-2 ${
                      index < radiusOptions?.findIndex(r => r?.value === selectedRadius) + 1
                        ? 'border-primary/30' :'border-border'
                    }`}
                    style={{
                      width: `${size}%`,
                      height: `${size}%`
                    }}
                  />
                ))}
              </div>
              
              {/* Center point (hospital) */}
              <div className="relative z-10 p-3 bg-destructive rounded-full">
                <Icon name="Building2" size={20} color="white" />
              </div>
              
              {/* Donor indicators */}
              {[...Array(Math.min(estimatedDonors, 12))]?.map((_, index) => {
                const angle = (index * 30) * (Math.PI / 180);
                const distance = 30 + (index % 3) * 15;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                return (
                  <div
                    key={index}
                    className="absolute p-1 bg-success rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`
                    }}
                  >
                    <Icon name="User" size={12} color="white" />
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-text-secondary">
                Visual representation of search radius from selected hospital
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {formData?.bloodType && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Users" size={16} color="var(--color-success)" />
                <h4 className="font-medium text-success">Estimated Donors</h4>
              </div>
              <p className="text-2xl font-bold text-success mt-1">{estimatedDonors}</p>
              <p className="text-xs text-text-secondary">Compatible donors in radius</p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Clock" size={16} color="var(--color-primary)" />
                <h4 className="font-medium text-primary">Response Time</h4>
              </div>
              <p className="text-2xl font-bold text-primary mt-1">{getEstimatedResponseTime()}min</p>
              <p className="text-xs text-text-secondary">Estimated arrival time</p>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Target" size={16} color="var(--color-warning)" />
                <h4 className="font-medium text-warning">Coverage Area</h4>
              </div>
              <p className="text-2xl font-bold text-warning mt-1">{selectedRadius}km</p>
              <p className="text-xs text-text-secondary">Search radius</p>
            </div>
          </div>
        )}

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={16} color="var(--color-primary)" className="mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">How Donor Matching Works</p>
              <ul className="text-text-secondary space-y-1">
                <li>• Donors within the selected radius receive instant notifications</li>
                <li>• Blood type compatibility is automatically verified</li>
                <li>• Available donors are prioritized by proximity and response time</li>
                <li>• Emergency requests get higher priority in the notification queue</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorRadiusVisualization;