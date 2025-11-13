import React from 'react';
import Icon from '../../../components/AppIcon';

const ProfileStats = ({ stats, userRole }) => {
  if (!stats) return null;

  const getDonorStats = () => [
    {
      icon: 'Heart',
      label: 'Total Donations',
      value: stats.totalDonations,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      icon: 'Users',
      label: 'Lives Saved',
      value: stats.livesSaved,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: 'Droplets',
      label: 'Blood Donated',
      value: `${stats.totalBloodDonated}ml`,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  const getHospitalStats = () => [
    {
      icon: 'Activity',
      label: 'Blood Requests',
      value: '0', // This would come from blood_requests table
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: 'Users',
      label: 'Donors Connected',
      value: '0', // This would come from donor_responses table
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: 'Heart',
      label: 'Lives Helped',
      value: '0', // This would come from completed donations
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  const statCards = userRole === 'donor' ? getDonorStats() : getHospitalStats();

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon name="BarChart3" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Your Statistics</h3>
          <p className="text-sm text-text-secondary">
            {userRole === 'donor' ? 'Your donation impact' : 'Your hospital impact'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {statCards.map((stat, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <Icon name={stat.icon} size={20} color={`var(--color-${stat.color.replace('text-', '')})`} />
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Badge for Donors */}
      {userRole === 'donor' && stats.totalDonations > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-warning/10 to-success/10 border border-warning/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-lg bg-warning/20">
              <Icon name="Trophy" size={16} color="var(--color-warning)" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Donation Milestone</div>
              <div className="text-xs text-text-secondary">
                {stats.totalDonations === 1 && 'First donation completed! 🎉'}
                {stats.totalDonations === 5 && 'Reached 5 donations! 🏆'}
                {stats.totalDonations === 10 && 'Reached 10 donations! 🥇'}
                {stats.totalDonations >= 20 && 'Reached 20+ donations! 💎'}
                {![1, 5, 10].includes(stats.totalDonations) && stats.totalDonations < 20 && 
                  `${stats.totalDonations} donations completed!`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement for New Donors */}
      {userRole === 'donor' && stats.totalDonations === 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-success/10 border border-primary/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-lg bg-primary/20">
              <Icon name="Heart" size={16} color="var(--color-primary)" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Ready to Save Lives!</div>
              <div className="text-xs text-text-secondary">
                Make your first donation and start your life-saving journey
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileStats;

