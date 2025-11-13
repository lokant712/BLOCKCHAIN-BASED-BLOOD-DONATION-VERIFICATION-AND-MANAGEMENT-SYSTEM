import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

import AvailabilityToggle from '../../../components/ui/AvailabilityToggle';

const AvailabilityCard = ({ user, onAvailabilityChange }) => {
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);

  const handleToggle = async (newStatus) => {
    setIsAvailable(newStatus);
    onAvailabilityChange({ isAvailable: newStatus });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${isAvailable ? 'bg-success/10' : 'bg-muted'}`}>
            <Icon 
              name={isAvailable ? "Heart" : "HeartOff"} 
              size={24} 
              color={isAvailable ? "var(--color-success)" : "var(--color-text-secondary)"} 
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Donation Status</h2>
            <p className="text-sm text-text-secondary">
              {isAvailable ? 'Ready to help save lives' : 'Currently unavailable'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isAvailable 
            ? 'bg-success/10 text-success' :'bg-muted text-text-secondary'
        }`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </div>
      </div>

      <AvailabilityToggle
        isAvailable={isAvailable}
        onToggle={handleToggle}
        className="mb-4"
      />

      {isAvailable && (
        <div className="mt-4 p-4 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Heart" size={16} color="var(--color-success)" />
            <span className="text-sm font-medium text-success">Ready to Help</span>
          </div>
          <p className="text-sm text-text-secondary">
            You'll receive notifications for urgent blood requests in your area.
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCard;