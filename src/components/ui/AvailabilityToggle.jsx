import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const AvailabilityToggle = ({ 
  isAvailable = false, 
  onToggle = () => {}, 
  disabled = false,
  className = '' 
}) => {
  const [localAvailable, setLocalAvailable] = useState(isAvailable);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setLocalAvailable(isAvailable);
  }, [isAvailable]);

  const handleToggle = async () => {
    if (disabled || isUpdating) return;

    setIsUpdating(true);
    try {
      const newStatus = !localAvailable;
      setLocalAvailable(newStatus);
      await onToggle(newStatus);
    } catch (error) {
      // Revert on error
      setLocalAvailable(!localAvailable);
      console.error('Failed to update availability:', error);
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${localAvailable ? 'bg-success/10' : 'bg-muted'}`}>
            <Icon 
              name={localAvailable ? "Heart" : "HeartOff"} 
              size={20} 
              color={localAvailable ? "var(--color-success)" : "var(--color-text-secondary)"} 
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Donation Availability
            </h3>
            <p className="text-xs text-text-secondary">
              {localAvailable 
                ? 'You are available for blood donation' 
                : 'You are currently unavailable'
              }
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={disabled || isUpdating}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            localAvailable ? 'bg-success' : 'bg-muted'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          role="switch"
          aria-checked={localAvailable}
          aria-label="Toggle donation availability"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
              localAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="Loader2" size={12} className="animate-spin text-white" />
            </div>
          )}
        </button>
      </div>
      {/* Status Indicator */}
      <div className="pl-11">
        <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
          localAvailable 
            ? 'bg-success/10 text-success' :'bg-muted text-text-secondary'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            localAvailable ? 'bg-success animate-pulse' : 'bg-text-secondary'
          }`} />
          <span>
            {localAvailable ? 'Available Now' : 'Unavailable'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityToggle;