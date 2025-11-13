import React from 'react';

const NotificationBadge = ({ 
  count = 0, 
  variant = 'primary', 
  showZero = false, 
  maxCount = 99,
  className = '' 
}) => {
  if (!showZero && count === 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count?.toString();

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    urgent: 'bg-destructive text-destructive-foreground animate-pulse',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    secondary: 'bg-secondary text-secondary-foreground'
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full min-w-[1.25rem] h-5 ${variantClasses?.[variant]} ${className}`}
      aria-label={`${count} notifications`}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;