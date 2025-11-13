import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const EmergencyActionButton = ({ 
  user = null,
  position = 'fixed',
  variant = 'floating',
  onEmergencyAction = () => {},
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmergencyAction = async () => {
    if (!user) {
      navigate('/user-login');
      return;
    }

    setIsLoading(true);
    try {
      await onEmergencyAction();
      navigate('/blood-request-creation', { 
        state: { emergency: true, priority: 'urgent' } 
      });
    } catch (error) {
      console.error('Emergency action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show for donors (they don't create requests)
  if (user && user?.role === 'donor') {
    return null;
  }

  const baseClasses = {
    floating: `${position === 'fixed' ? 'fixed bottom-6 right-6 z-50' : ''} h-14 w-14 rounded-full shadow-medical-lg hover:shadow-xl`,
    inline: 'w-full',
    compact: 'h-10 px-4'
  };

  const buttonContent = {
    floating: <Icon name="Plus" size={24} color="white" />,
    inline: (
      <div className="flex items-center space-x-2">
        <Icon name="AlertTriangle" size={20} />
        <span>Emergency Blood Request</span>
      </div>
    ),
    compact: (
      <div className="flex items-center space-x-2">
        <Icon name="Plus" size={16} />
        <span>Request</span>
      </div>
    )
  };

  return (
    <Button
      variant="destructive"
      size={variant === 'floating' ? 'icon' : variant === 'compact' ? 'sm' : 'default'}
      onClick={handleEmergencyAction}
      loading={isLoading}
      disabled={isLoading}
      className={`${baseClasses?.[variant]} ${className} transition-all duration-200 hover:scale-105 active:scale-95`}
      aria-label="Create emergency blood request"
      title="Create Emergency Blood Request"
    >
      {buttonContent?.[variant]}
    </Button>
  );
};

export default EmergencyActionButton;