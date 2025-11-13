import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DonationHistory = ({ donations }) => {
  const [expandedDonation, setExpandedDonation] = useState(null);

  const toggleExpanded = (donationId) => {
    setExpandedDonation(expandedDonation === donationId ? null : donationId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'scheduled': return 'text-primary';
      case 'cancelled': return 'text-destructive';
      default: return 'text-text-secondary';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'completed': return 'bg-success/10';
      case 'scheduled': return 'bg-primary/10';
      case 'cancelled': return 'bg-destructive/10';
      default: return 'bg-muted';
    }
  };

  if (donations?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="History" size={20} color="var(--color-primary)" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Donation History</h2>
        </div>
        <div className="text-center py-8">
          <Icon name="Calendar" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary">No donation history yet.</p>
          <p className="text-sm text-text-secondary mt-1">Your donation journey will appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="History" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Donation History</h2>
            <p className="text-sm text-text-secondary">{donations?.length} total donations</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" iconName="Download">
          Export
        </Button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {donations?.map((donation, index) => (
          <div key={donation?.id} className="relative">
            {/* Timeline line */}
            {index < donations?.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
            )}
            
            <div className="flex items-start space-x-4 p-4 hover:bg-accent/50 rounded-lg transition-colors">
              {/* Timeline dot */}
              <div className={`w-3 h-3 rounded-full mt-2 ${
                donation?.status === 'completed' ? 'bg-success' : 
                donation?.status === 'scheduled' ? 'bg-primary' : 'bg-destructive'
              }`}></div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-foreground">{donation?.hospitalName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(donation?.status)} ${getStatusColor(donation?.status)}`}>
                      {donation?.status}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(donation?.id)}
                    iconName={expandedDonation === donation?.id ? "ChevronUp" : "ChevronDown"}
                  >
                  </Button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-text-secondary mb-2">
                  <div className="flex items-center space-x-1">
                    <Icon name="Calendar" size={14} />
                    <span>{donation?.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Droplets" size={14} />
                    <span>{donation?.bloodType}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Activity" size={14} />
                    <span>{donation?.amount} ml</span>
                  </div>
                </div>

                {expandedDonation === donation?.id && (
                  <div className="mt-3 p-3 bg-background/50 rounded-md space-y-3">
                    {donation?.certificate && (
                      <div className="flex items-center justify-between p-2 bg-success/10 rounded border border-success/20">
                        <div className="flex items-center space-x-2">
                          <Icon name="Award" size={16} color="var(--color-success)" />
                          <span className="text-sm font-medium text-success">Certificate Available</span>
                        </div>
                        <Button variant="ghost" size="xs" iconName="Download">
                          Download
                        </Button>
                      </div>
                    )}

                    {donation?.thankYouMessage && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon name="Heart" size={16} color="var(--color-primary)" />
                          <span className="text-sm font-medium text-primary">Thank You Message</span>
                        </div>
                        <p className="text-sm text-text-secondary italic">"{donation?.thankYouMessage}"</p>
                      </div>
                    )}

                    <div className="text-sm">
                      <div>
                        <span className="text-text-secondary">Donation ID:</span>
                        <span className="ml-2 font-mono text-foreground">{donation?.donationId}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationHistory;