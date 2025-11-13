import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DonorStats = ({ stats, nextEligibilityDate, lastEmergencyResponseDate }) => {
  const [timeUntilEligible, setTimeUntilEligible] = useState('');
  const [emergencyCooldownStatus, setEmergencyCooldownStatus] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextEligibilityDate) return;
      
      const now = new Date();
      const eligibleDate = new Date(nextEligibilityDate);
      const timeDiff = eligibleDate?.getTime() - now?.getTime();
      
      if (timeDiff <= 0) {
        setTimeUntilEligible('Eligible now!');
        return;
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        setTimeUntilEligible(`${days} days, ${hours} hours`);
      } else {
        setTimeUntilEligible(`${hours} hours`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextEligibilityDate]);

  useEffect(() => {
    const updateEmergencyCooldown = () => {
      if (!lastEmergencyResponseDate) {
        setEmergencyCooldownStatus('');
        return;
      }
      
      const now = new Date();
      const responseDate = new Date(lastEmergencyResponseDate);
      const timeDiff = now.getTime() - responseDate.getTime();
      const daysSinceResponse = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysSinceResponse < 90) {
        const daysRemaining = 90 - daysSinceResponse;
        setEmergencyCooldownStatus(`${daysRemaining} days remaining in emergency cooldown`);
      } else {
        setEmergencyCooldownStatus('');
      }
    };

    updateEmergencyCooldown();
    const interval = setInterval(updateEmergencyCooldown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastEmergencyResponseDate]);

  const statCards = [
    {
      icon: 'Heart',
      label: 'Total Donations',
      value: stats?.totalDonations,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      icon: 'Users',
      label: 'Lives Saved',
      value: stats?.livesSaved,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: 'Award',
      label: 'Donor Level',
      value: stats?.donorLevel,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards?.map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${stat?.bgColor} flex items-center justify-center mb-3`}>
              <Icon name={stat?.icon} size={20} color={`var(--color-${stat?.color?.replace('text-', '')})`} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{stat?.value}</div>
            <div className="text-sm text-text-secondary">{stat?.label}</div>
          </div>
        ))}
      </div>
      {/* Eligibility Card */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="Clock" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Next Donation Eligibility</h3>
            <p className="text-sm text-text-secondary">Based on your last donation</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary mb-1">{timeUntilEligible}</div>
            <div className="text-sm text-text-secondary">
              {nextEligibilityDate ? `Available on ${new Date(nextEligibilityDate)?.toLocaleDateString()}` : 'Calculating...'}
            </div>
          </div>
          <Button 
            variant={timeUntilEligible === 'Eligible now!' ? 'default' : 'outline'} 
            size="sm"
            disabled={timeUntilEligible !== 'Eligible now!'}
            iconName="Calendar"
          >
            Schedule
          </Button>
        </div>
      </div>

      {/* Emergency Cooldown Card */}
      {emergencyCooldownStatus && (
        <div className="bg-card border border-warning/20 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-warning/10">
              <Icon name="AlertTriangle" size={20} color="var(--color-warning)" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Emergency Cooldown</h3>
              <p className="text-sm text-text-secondary">90-day rest period after emergency response</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning mb-2">{emergencyCooldownStatus}</div>
            <p className="text-sm text-text-secondary">
              You responded to an emergency request recently. This cooldown ensures your health and safety.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorStats;