import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestConfirmationModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  onConfirm,
  isSubmitting = false 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'emergency': return 'text-destructive';
      case 'urgent': return 'text-warning';
      default: return 'text-primary';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'emergency': return 'AlertTriangle';
      case 'urgent': return 'Clock';
      default: return 'Calendar';
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Navigate to appropriate dashboard after successful submission
      const userRole = localStorage.getItem('userRole') || 'hospital';
      if (userRole === 'hospital') {
        navigate('/hospital-dashboard');
      } else {
        navigate('/donor-dashboard');
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="FileCheck" size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Confirm Blood Request</h2>
                <p className="text-sm text-text-secondary">Review your request details before submission</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <Icon name="User" size={16} />
              <span>Patient Information</span>
            </h3>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Name:</span>
                  <span className="ml-2 font-medium text-foreground">{formData?.patientName}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Age:</span>
                  <span className="ml-2 font-medium text-foreground">{formData?.age} years</span>
                </div>
                <div>
                  <span className="text-text-secondary">Blood Type:</span>
                  <span className="ml-2 font-medium text-destructive">{formData?.bloodType}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Gender:</span>
                  <span className="ml-2 font-medium text-foreground capitalize">{formData?.gender}</span>
                </div>
              </div>
              {formData?.medicalCondition && (
                <div className="text-sm">
                  <span className="text-text-secondary">Condition:</span>
                  <span className="ml-2 text-foreground">{formData?.medicalCondition}</span>
                </div>
              )}
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} />
              <span>Urgency Level</span>
            </h3>
            <div className="bg-muted rounded-lg p-4">
              <div className={`flex items-center space-x-2 ${getUrgencyColor(formData?.urgencyLevel)}`}>
                <Icon name={getUrgencyIcon(formData?.urgencyLevel)} size={16} />
                <span className="font-medium capitalize">{formData?.urgencyLevel} Priority</span>
              </div>
            </div>
          </div>

          {/* Blood Requirements */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <Icon name="Droplets" size={16} />
              <span>Blood Requirements</span>
            </h3>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Component:</span>
                  <span className="ml-2 font-medium text-foreground">{formData?.bloodComponent?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Quantity:</span>
                  <span className="ml-2 font-medium text-foreground">{formData?.quantity} {formData?.unitMeasurement}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Required By:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {new Date(formData.requiredByDate)?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Cross-match:</span>
                  <span className="ml-2 font-medium text-foreground">{formData?.crossMatchStatus?.replace('_', ' ')}</span>
                </div>
              </div>
              {formData?.specialRequirements && (
                <div className="text-sm">
                  <span className="text-text-secondary">Special Requirements:</span>
                  <span className="ml-2 text-foreground">{formData?.specialRequirements}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <Icon name="MapPin" size={16} />
              <span>Location</span>
            </h3>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="text-sm">
                <span className="text-text-secondary">Hospital:</span>
                <span className="ml-2 font-medium text-foreground">{formData?.hospitalName}</span>
              </div>
              {formData?.ward && (
                <div className="text-sm">
                  <span className="text-text-secondary">Ward:</span>
                  <span className="ml-2 text-foreground">{formData?.ward}</span>
                  {formData?.roomNumber && <span className="text-foreground">, Room {formData?.roomNumber}</span>}
                </div>
              )}
              <div className="text-sm">
                <span className="text-text-secondary">Contact:</span>
                <span className="ml-2 text-foreground">{formData?.contactPersonName} ({formData?.relationship})</span>
              </div>
              <div className="text-sm">
                <span className="text-text-secondary">Phone:</span>
                <span className="ml-2 text-foreground">{formData?.primaryPhone}</span>
              </div>
            </div>
          </div>

          {/* Search Radius */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center space-x-2">
              <Icon name="Target" size={16} />
              <span>Donor Search</span>
            </h3>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm">
                <span className="text-text-secondary">Search Radius:</span>
                <span className="ml-2 font-medium text-foreground">{formData?.searchRadius} km</span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning mb-1">Important Notice</p>
                <ul className="text-text-secondary space-y-1">
                  <li>• This request will be immediately sent to compatible donors in your area</li>
                  <li>• Hospital verification may be required for emergency requests</li>
                  <li>• You will receive notifications when donors respond</li>
                  <li>• Ensure all contact information is accurate for quick communication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Review Again
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              loading={isSubmitting}
              disabled={isSubmitting}
              iconName="Send"
              iconPosition="left"
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Blood Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestConfirmationModal;