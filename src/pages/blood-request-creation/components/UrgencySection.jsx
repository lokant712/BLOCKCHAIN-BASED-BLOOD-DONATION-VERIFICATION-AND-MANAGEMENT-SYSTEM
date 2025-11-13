import React from 'react';
import Icon from '../../../components/AppIcon';

const UrgencySection = ({ 
  formData, 
  onFormChange, 
  errors = {} 
}) => {
  const urgencyLevels = [
    {
      value: 'emergency',
      label: 'Emergency',
      description: 'Life-threatening situation requiring immediate blood',
      responseTime: 'Within 30 minutes',
      color: 'destructive',
      bgColor: 'bg-destructive/10',
      textColor: 'text-destructive',
      borderColor: 'border-destructive',
      icon: 'AlertTriangle'
    },
    {
      value: 'urgent',
      label: 'Urgent',
      description: 'Critical need for blood within hours',
      responseTime: 'Within 2-4 hours',
      color: 'warning',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      borderColor: 'border-warning',
      icon: 'Clock'
    },
    {
      value: 'normal',
      label: 'Normal',
      description: 'Planned procedure or non-critical requirement',
      responseTime: 'Within 24 hours',
      color: 'primary',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-primary',
      icon: 'Calendar'
    }
  ];

  const handleUrgencyChange = (urgencyLevel) => {
    onFormChange('urgencyLevel', urgencyLevel);
  };

  const selectedUrgency = urgencyLevels?.find(level => level?.value === formData?.urgencyLevel);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-warning/10 rounded-lg">
          <Icon name="AlertCircle" size={20} color="var(--color-warning)" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Urgency Level</h2>
          <p className="text-sm text-text-secondary">Select the priority level for this blood request</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {urgencyLevels?.map((level) => {
          const isSelected = formData?.urgencyLevel === level?.value;
          return (
            <div
              key={level?.value}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? `${level?.borderColor} ${level?.bgColor}` 
                  : 'border-border bg-card hover:border-primary/20'
              }`}
              onClick={() => handleUrgencyChange(level?.value)}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${isSelected ? level?.bgColor : 'bg-muted'}`}>
                  <Icon 
                    name={level?.icon} 
                    size={20} 
                    color={isSelected ? `var(--color-${level?.color})` : 'var(--color-text-secondary)'} 
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isSelected ? level?.textColor : 'text-foreground'}`}>
                    {level?.label}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {level?.description}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isSelected ? `${level?.bgColor} ${level?.textColor}` : 'bg-muted text-text-secondary'
                    }`}>
                      <Icon name="Clock" size={12} className="mr-1" />
                      {level?.responseTime}
                    </span>
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className={`p-1 rounded-full ${level?.bgColor}`}>
                    <Icon name="Check" size={16} color={`var(--color-${level?.color})`} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedUrgency && (
        <div className={`p-4 rounded-lg ${selectedUrgency?.bgColor} border ${selectedUrgency?.borderColor}`}>
          <div className="flex items-center space-x-2">
            <Icon name="Info" size={16} color={`var(--color-${selectedUrgency?.color})`} />
            <p className={`text-sm font-medium ${selectedUrgency?.textColor}`}>
              {selectedUrgency?.label} Priority Selected
            </p>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Donors within your specified radius will be notified immediately. Expected response time: {selectedUrgency?.responseTime}
          </p>
        </div>
      )}
      {errors?.urgencyLevel && (
        <p className="text-sm text-destructive">{errors?.urgencyLevel}</p>
      )}
    </div>
  );
};

export default UrgencySection;