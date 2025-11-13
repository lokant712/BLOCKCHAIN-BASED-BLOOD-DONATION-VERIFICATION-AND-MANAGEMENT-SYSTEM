/**
 * Notification service for handling browser notifications and SMS
 * Provides real-time alerts for emergency blood requests and donor responses
 */
class NotificationService {
  constructor() {
    this.permission = null;
    this.initializePermissions();
  }

  /**
   * Initialize notification permissions
   */
  async initializePermissions() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show emergency blood request notification to donors
   * @param {Object} requestData - Emergency request data
   */
  async showEmergencyRequestNotification(requestData) {
    try {
      // Request permission if not already granted
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted, skipping notification');
        return;
      }

      const notification = new Notification('🚨 Emergency Blood Request', {
        body: `${requestData.bloodType} blood needed urgently at ${requestData.hospitalName}. ${requestData.unitsNeeded} units required.`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `emergency-request-${requestData.id}`,
        requireInteraction: true,
        actions: [
          {
            action: 'accept',
            title: 'Accept',
            icon: '/assets/images/accept-icon.png'
          },
          {
            action: 'decline',
            title: 'Decline',
            icon: '/assets/images/decline-icon.png'
          }
        ],
        data: {
          requestId: requestData.id,
          type: 'emergency_request',
          ...requestData
        }
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Dispatch custom event for handling in the app
        window.dispatchEvent(new CustomEvent('emergency-notification-clicked', {
          detail: { request: requestData }
        }));
      };

      // Handle notification actions (Accept/Decline buttons)
      notification.onaction = (event) => {
        window.focus();
        notification.close();
        
        // Dispatch custom event for handling actions
        window.dispatchEvent(new CustomEvent('emergency-notification-action', {
          detail: { 
            request: requestData, 
            action: event.action 
          }
        }));
      };

      // Auto-close notification after 30 seconds
      setTimeout(() => {
        notification.close();
      }, 30000);

      console.log('Emergency request notification shown:', requestData.id);
    } catch (error) {
      console.error('Error showing emergency request notification:', error);
    }
  }

  /**
   * Show donor response notification to hospitals
   * @param {Object} responseData - Donor response data
   */
  async showDonorResponseNotification(responseData) {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted, skipping notification');
        return;
      }

      // Only show notifications for actual donor responses (accepted/declined), not pending notifications
      if (responseData.status === 'pending') {
        console.log('Skipping notification for pending status - waiting for actual donor response');
        return;
      }

      const statusEmoji = responseData.status === 'accepted' ? '✅' : '❌';
      const statusText = responseData.status === 'accepted' ? 'accepted' : 'declined';

      const notification = new Notification(`${statusEmoji} Donor Response`, {
        body: `${responseData.donorName} has ${statusText} your ${responseData.bloodRequest.bloodType} blood request.`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `donor-response-${responseData.id}`,
        requireInteraction: true,
        data: {
          responseId: responseData.id,
          type: 'donor_response',
          ...responseData
        }
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Dispatch custom event for handling in the app
        window.dispatchEvent(new CustomEvent('donor-response-notification-clicked', {
          detail: { response: responseData }
        }));
      };

      // Auto-close notification after 15 seconds
      setTimeout(() => {
        notification.close();
      }, 15000);

      console.log('Donor response notification shown:', responseData.id);
    } catch (error) {
      console.error('Error showing donor response notification:', error);
    }
  }

  /**
   * Show generic notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} options - Additional notification options
   */
  async showNotification(title, body, options = {}) {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted, skipping notification');
        return;
      }

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds if no timeout specified
      const timeout = options.timeout || 10000;
      setTimeout(() => {
        notification.close();
      }, timeout);

      console.log('Generic notification shown:', title);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Send SMS notification (placeholder for future SMS integration)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<boolean>} Success status
   */
  async sendSMS(phoneNumber, message) {
    try {
      // This is a placeholder for SMS integration
      // You can integrate with services like Twilio, AWS SNS, etc.
      console.log(`SMS to ${phoneNumber}: ${message}`);
      
      // Example integration with a hypothetical SMS service:
      // const response = await fetch('/api/send-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phoneNumber, message })
      // });
      // return response.ok;

      return true; // Placeholder return
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Send emergency SMS to donor
   * @param {string} phoneNumber - Donor's phone number
   * @param {Object} requestData - Emergency request data
   */
  async sendEmergencySMS(phoneNumber, requestData) {
    const message = `🚨 EMERGENCY BLOOD REQUEST 🚨\n\n` +
      `Blood Type: ${requestData.bloodType}\n` +
      `Hospital: ${requestData.hospitalName}\n` +
      `Units Needed: ${requestData.unitsNeeded}\n` +
      `Urgency: ${requestData.urgency.toUpperCase()}\n` +
      `Contact: ${requestData.contactPhone}\n\n` +
      `Please respond ASAP if you can help!`;

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send donor response SMS to hospital
   * @param {string} phoneNumber - Hospital contact number
   * @param {Object} responseData - Donor response data
   */
  async sendResponseSMS(phoneNumber, responseData) {
    const statusText = responseData.status === 'accepted' ? 'ACCEPTED' : 'DECLINED';
    const message = `Donor Response: ${statusText}\n\n` +
      `Donor: ${responseData.donorName}\n` +
      `Blood Type: ${responseData.donorBloodType}\n` +
      `Request: ${responseData.bloodRequest.bloodType} - ${responseData.bloodRequest.unitsNeeded} units\n` +
      `Phone: ${responseData.donorPhone}\n` +
      `Status: ${statusText}`;

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Check if notifications are supported
   * @returns {boolean} True if supported
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Get current permission status
   * @returns {string} Permission status
   */
  getPermissionStatus() {
    return this.permission;
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    // This is a placeholder - there's no direct way to clear all notifications
    // The browser handles notification cleanup automatically
    console.log('Clearing all notifications (placeholder)');
  }
}

export default new NotificationService();