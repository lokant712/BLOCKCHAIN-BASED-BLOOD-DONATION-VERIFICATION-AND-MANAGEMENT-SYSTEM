import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UrgentRequestsPanel = ({ requests, onRequestResponse, newEmergencyRequest }) => {
  const [respondingTo, setRespondingTo] = useState(null);

  const handleResponse = async (requestId, response) => {
    setRespondingTo(requestId);
    try {
      await onRequestResponse(requestId, response);
    } finally {
      setRespondingTo(null);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-destructive';
      case 'urgent': return 'text-warning';
      default: return 'text-primary';
    }
  };

  const getUrgencyBg = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive/10 border-destructive/20';
      case 'urgent': return 'bg-warning/10 border-warning/20';
      default: return 'bg-primary/10 border-primary/20';
    }
  };

  if (requests?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon name="Search" size={20} color="var(--color-primary)" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Urgent Requests</h2>
        </div>
        <div className="text-center py-8">
          <Icon name="Heart" size={48} color="var(--color-text-secondary)" className="mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary">No urgent requests matching your blood type right now.</p>
          <p className="text-sm text-text-secondary mt-1">We'll notify you when help is needed!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Icon name="AlertTriangle" size={20} color="var(--color-destructive)" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Urgent Requests</h2>
            <p className="text-sm text-text-secondary">{requests?.length} requests need your help</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="w-3 h-3 bg-destructive rounded-full"></div>
        </div>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {requests?.map((request) => {
          const isNewRequest = newEmergencyRequest?.id === request?.id;
          return (
            <div 
              key={request?.id} 
              className={`p-4 border rounded-lg transition-all duration-500 ${
                isNewRequest 
                  ? 'border-red-500 bg-red-50 shadow-lg animate-pulse' 
                  : getUrgencyBg(request?.urgency)
              }`}
            >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg font-bold text-foreground">{request?.bloodType}</span>
                  <span className={`text-sm font-medium uppercase ${getUrgencyColor(request?.urgency)}`}>
                    {request?.urgency}
                  </span>
                  {isNewRequest && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-foreground mb-1">{request?.hospitalName}</h3>
                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <Icon name="MapPin" size={14} />
                    <span>{request?.distance} km away</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Clock" size={14} />
                    <span>{request?.timeAgo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <Icon name="Users" size={16} color="var(--color-text-secondary)" />
                <span className="text-sm text-text-secondary">{request?.unitsNeeded} units</span>
              </div>
            </div>

            {request?.patientInfo && (
              <div className="mb-3 p-3 bg-background/50 rounded-md">
                <p className="text-sm text-text-secondary">
                  <strong>Patient:</strong> {request?.patientInfo?.age} years old, {request?.patientInfo?.condition}
                </p>
              </div>
            )}

            {request?.status === 'accepted' ? (
              <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <Icon name="Check" size={16} color="var(--color-green-600)" />
                <span className="text-sm font-medium text-green-800">Request Accepted</span>
                <span className="text-xs text-green-600">
                  {request?.responseTime ? new Date(request.responseTime).toLocaleTimeString() : ''}
                </span>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleResponse(request?.id, 'accept')}
                  loading={respondingTo === request?.id}
                  disabled={respondingTo !== null}
                  iconName="Check"
                  iconPosition="left"
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResponse(request?.id, 'decline')}
                  disabled={respondingTo !== null}
                  iconName="X"
                  iconPosition="left"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default UrgentRequestsPanel;