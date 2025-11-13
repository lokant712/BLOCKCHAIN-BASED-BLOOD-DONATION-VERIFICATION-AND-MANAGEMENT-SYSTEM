import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import donorService from '../../services/donorService';

const MyDonations = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      navigate('/user-login');
      return;
    }

    // Parse user session
    const userData = JSON.parse(userSession);
    setUser(userData);

    // Load donation history
    loadDonationHistory(userData.id);
  }, [navigate]);

  const loadDonationHistory = async (userId) => {
    setIsLoading(true);
    setError('');
    
    try {
      const donationHistory = await donorService.getDonationHistory(userId);
      setDonations(donationHistory);
    } catch (error) {
      console.error('Failed to load donation history:', error);
      setError('Failed to load donation history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear user session from localStorage
    localStorage.removeItem('userSession');
    // Clear user state
    setUser(null);
    // Navigate to login page
    navigate('/user-login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'scheduled':
        return 'text-primary bg-primary/10';
      case 'cancelled':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-text-secondary bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'scheduled':
        return 'Calendar';
      case 'cancelled':
        return 'XCircle';
      default:
        return 'Clock';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading your donations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Donations</h1>
              <p className="text-text-secondary mt-1">
                Track your blood donation history and impact
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/donor-dashboard')}
              iconName="ArrowLeft"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Donations List */}
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(donation.status)}`}>
                        <div className="flex items-center space-x-2">
                          <Icon name={getStatusIcon(donation.status)} size={16} />
                          <span className="capitalize">{donation.status}</span>
                        </div>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {donation.donationId}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Hospital</div>
                        <div className="text-text-secondary">{donation.hospitalName}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Date</div>
                        <div className="text-text-secondary">{donation.date}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Blood Type</div>
                        <div className="text-text-secondary">{donation.bloodType}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Amount</div>
                        <div className="text-text-secondary">{donation.amount}ml</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground mb-1">Duration</div>
                        <div className="text-text-secondary">{donation.duration} minutes</div>
                      </div>
                    </div>

                    {donation.thankYouMessage && (
                      <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Icon name="Heart" size={16} className="text-success mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-success mb-1">Thank You Message</div>
                            <div className="text-sm text-text-secondary">{donation.thankYouMessage}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {donation.certificate && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          iconName="Download"
                        >
                          Download Certificate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Icon name="Heart" size={32} className="text-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Donations Yet</h3>
            <p className="text-text-secondary mb-6">
              You haven't made any blood donations yet. Start your life-saving journey today!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/donor-dashboard')}
                iconName="Activity"
              >
                View Available Requests
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                iconName="User"
              >
                Complete Your Profile
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {donations.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-destructive mb-1">
                {donations.length}
              </div>
              <div className="text-sm text-text-secondary">Total Donations</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {donations.reduce((sum, donation) => sum + donation.amount, 0)}ml
              </div>
              <div className="text-sm text-text-secondary">Blood Donated</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.floor(donations.reduce((sum, donation) => sum + donation.amount, 0) / 450)}
              </div>
              <div className="text-sm text-text-secondary">Lives Saved</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyDonations;

