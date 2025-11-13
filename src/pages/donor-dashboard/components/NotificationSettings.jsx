import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const NotificationSettings = ({ settings, onSettingsChange, isOpen, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSettingsChange(localSettings);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon name="Settings" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
              <p className="text-sm text-text-secondary">Customize your alert preferences</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Profile Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div>
                  <div className="font-medium text-foreground">Blood Type</div>
                  <div className="text-sm text-text-secondary">O+ (Universal Donor)</div>
                </div>
                <Button variant="ghost" size="sm" iconName="Edit">
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div>
                  <div className="font-medium text-foreground">Contact Information</div>
                  <div className="text-sm text-text-secondary">Phone, Email, Address</div>
                </div>
                <Button variant="ghost" size="sm" iconName="Edit">
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div>
                  <div className="font-medium text-foreground">Medical Information</div>
                  <div className="text-sm text-text-secondary">Conditions, Medications</div>
                </div>
                <Button variant="ghost" size="sm" iconName="Edit">
                  Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Availability Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Availability Settings</h3>
            
            <Checkbox
              label="Auto-respond to critical requests"
              description="Automatically accept critical blood requests when available"
              checked={localSettings?.autoRespondCritical}
              onChange={(e) => handleSettingChange('autoRespondCritical', e?.target?.checked)}
            />

            <Checkbox
              label="Show my location to hospitals"
              description="Allow hospitals to see your approximate location for better matching"
              checked={localSettings?.showLocation}
              onChange={(e) => handleSettingChange('showLocation', e?.target?.checked)}
            />

            <Checkbox
              label="Emergency mode"
              description="Stay available 24/7 for life-threatening emergencies"
              checked={localSettings?.emergencyMode}
              onChange={(e) => handleSettingChange('emergencyMode', e?.target?.checked)}
            />
          </div>

          {/* Emergency Notifications */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Emergency Notifications</h3>
            
            <Checkbox
              label="Critical blood requests"
              description="Receive immediate alerts for life-threatening situations"
              checked={localSettings?.criticalRequests}
              onChange={(e) => handleSettingChange('criticalRequests', e?.target?.checked)}
            />

            <Checkbox
              label="Urgent requests matching my blood type"
              description="Get notified when your specific blood type is needed"
              checked={localSettings?.urgentMatching}
              onChange={(e) => handleSettingChange('urgentMatching', e?.target?.checked)}
            />

            <Checkbox
              label="Nearby hospital requests"
              description="Alerts for requests from hospitals within your radius"
              checked={localSettings?.nearbyHospitals}
              onChange={(e) => handleSettingChange('nearbyHospitals', e?.target?.checked)}
            />
          </div>

          {/* General Notifications */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">General Notifications</h3>
            
            <Checkbox
              label="Donation reminders"
              description="Remind me when I'm eligible to donate again"
              checked={localSettings?.donationReminders}
              onChange={(e) => handleSettingChange('donationReminders', e?.target?.checked)}
            />

            <Checkbox
              label="Appointment confirmations"
              description="Confirmation and reminder messages for scheduled donations"
              checked={localSettings?.appointmentConfirmations}
              onChange={(e) => handleSettingChange('appointmentConfirmations', e?.target?.checked)}
            />

            <Checkbox
              label="Thank you messages"
              description="Receive appreciation messages from recipients"
              checked={localSettings?.thankYouMessages}
              onChange={(e) => handleSettingChange('thankYouMessages', e?.target?.checked)}
            />
          </div>

          {/* Notification Methods */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Notification Methods</h3>
            
            <Checkbox
              label="Push notifications"
              description="Instant alerts on your device"
              checked={localSettings?.pushNotifications}
              onChange={(e) => handleSettingChange('pushNotifications', e?.target?.checked)}
            />

            <Checkbox
              label="SMS notifications"
              description="Text messages for urgent requests"
              checked={localSettings?.smsNotifications}
              onChange={(e) => handleSettingChange('smsNotifications', e?.target?.checked)}
            />

            <Checkbox
              label="Email notifications"
              description="Email updates and summaries"
              checked={localSettings?.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e?.target?.checked)}
            />
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Quiet Hours</h3>
            <p className="text-sm text-text-secondary">
              Set times when you don't want to receive non-critical notifications
            </p>
            
            <Checkbox
              label="Enable quiet hours"
              description="Silence non-emergency notifications during specified times"
              checked={localSettings?.quietHoursEnabled}
              onChange={(e) => handleSettingChange('quietHoursEnabled', e?.target?.checked)}
            />

            {localSettings?.quietHoursEnabled && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-text-secondary">From:</span>
                  <span className="font-medium">{localSettings?.quietHoursStart || '22:00'}</span>
                  <span className="text-text-secondary">To:</span>
                  <span className="font-medium">{localSettings?.quietHoursEnd || '08:00'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleSave} 
            loading={isSaving}
            iconName="Check"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;