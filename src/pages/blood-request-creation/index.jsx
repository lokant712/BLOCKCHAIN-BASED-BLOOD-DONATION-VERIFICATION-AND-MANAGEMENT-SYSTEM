import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import hospitalService from '../../services/hospitalService';

const BloodRequestCreation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    bloodType: '',
    gender: '',
    medicalCondition: '',
    urgencyLevel: location?.state?.emergency ? 'critical' : 'urgent',
    unitsNeeded: '',
    neededBy: '',
    contactPhone: '',
    additionalNotes: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencyLevels = [
    { value: 'critical', label: 'Critical', description: 'Life-threatening emergency' },
    { value: 'urgent', label: 'Urgent', description: 'Needed within hours' },
    { value: 'normal', label: 'Normal', description: 'Scheduled procedure' }
  ];

  useEffect(() => {
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      navigate('/user-login');
      return;
    }

    // Parse user session
    const userData = JSON.parse(userSession);
    setCurrentUser(userData);

    // Pre-fill form if coming from emergency state
    if (location?.state?.emergency) {
      setFormData(prev => ({
        ...prev,
        urgencyLevel: 'critical',
        neededBy: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16) // 2 hours from now
      }));
    }
  }, [navigate, location?.state]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientName?.trim()) newErrors.patientName = 'Patient name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.medicalCondition?.trim()) newErrors.medicalCondition = 'Medical condition is required';
    if (!formData.unitsNeeded) newErrors.unitsNeeded = 'Units needed is required';
    if (!formData.neededBy) newErrors.neededBy = 'Needed by date is required';
    if (!formData.contactPhone?.trim()) newErrors.contactPhone = 'Contact phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const requestData = {
        hospitalId: currentUser.id,
        bloodType: formData.bloodType,
        unitsNeeded: parseInt(formData.unitsNeeded),
        urgency: formData.urgencyLevel,
        hospitalName: currentUser.hospitalName || currentUser.name || 'Hospital',
        hospitalAddress: currentUser.address || 'Hospital Address',
        city: currentUser.city || 'City',
        state: currentUser.state || 'State',
        latitude: currentUser.latitude || null,
        longitude: currentUser.longitude || null,
        patientName: formData.patientName,
        patientAge: parseInt(formData.age),
        patientGender: formData.gender,
        patientCondition: formData.medicalCondition,
        neededBy: formData.neededBy,
        contactPhone: formData.contactPhone,
        emergencyContact: formData.contactPhone, // Use same phone as emergency contact
        additionalNotes: formData.additionalNotes
      };

      await hospitalService.createBloodRequest(requestData);
      
      setSuccessMessage('Blood request submitted successfully! Donors in your area will be notified immediately.');
      
      // Reset form
      setFormData({
        patientName: '',
        age: '',
        bloodType: '',
        gender: '',
        medicalCondition: '',
        urgencyLevel: 'urgent',
        unitsNeeded: '',
        neededBy: '',
        contactPhone: '',
        additionalNotes: ''
      });
      
    } catch (error) {
      console.error('Failed to submit request:', error);
      setErrors({ 
        general: error.message || 'Failed to submit request. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/user-login');
  };


  return (
    <div className="min-h-screen bg-background">
      <Header user={currentUser} onLogout={handleLogout} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <Icon name="Plus" size={24} color="var(--color-destructive)" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Blood Request</h1>
              <p className="text-text-secondary">Submit a blood request to find compatible donors</p>
            </div>
          </div>

          {/* Emergency Banner */}
          {location?.state?.emergency && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
              <div className="flex items-center space-x-3">
                <Icon name="AlertTriangle" size={20} color="var(--color-destructive)" />
                <div>
                  <p className="font-medium text-destructive">Emergency Request Mode</p>
                  <p className="text-sm text-text-secondary">This request will be prioritized and sent immediately to available donors</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="CheckCircle" size={20} className="text-success" />
              <p className="text-success font-medium">{successMessage}</p>
                  </div>
                </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={20} className="text-destructive" />
              <p className="text-destructive font-medium">{errors.general}</p>
              </div>
          </div>
        )}

        {/* Simple Form */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="User" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Blood Request Details</h2>
              <p className="text-sm text-text-secondary">Enter the essential information for your blood request</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Patient Name *
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => handleFormChange('patientName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.patientName ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Enter patient's full name"
              />
              {errors.patientName && (
                <p className="text-sm text-destructive mt-1">{errors.patientName}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Age *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleFormChange('age', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.age ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Enter age"
                min="1"
                max="120"
              />
              {errors.age && (
                <p className="text-sm text-destructive mt-1">{errors.age}</p>
              )}
            </div>

            {/* Blood Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Blood Type *
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) => handleFormChange('bloodType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.bloodType ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.bloodType && (
                <p className="text-sm text-destructive mt-1">{errors.bloodType}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.gender ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-sm text-destructive mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Medical Condition */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Medical Condition *
              </label>
              <input
                type="text"
                value={formData.medicalCondition}
                onChange={(e) => handleFormChange('medicalCondition', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.medicalCondition ? 'border-destructive' : 'border-border'
                }`}
                placeholder="e.g., Emergency surgery, Trauma, etc."
              />
              {errors.medicalCondition && (
                <p className="text-sm text-destructive mt-1">{errors.medicalCondition}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Urgency Level *
              </label>
              <select
                value={formData.urgencyLevel}
                onChange={(e) => handleFormChange('urgencyLevel', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.urgencyLevel ? 'border-destructive' : 'border-border'
                }`}
              >
                {urgencyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
              {errors.urgencyLevel && (
                <p className="text-sm text-destructive mt-1">{errors.urgencyLevel}</p>
              )}
            </div>

            {/* Units Needed */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Units Needed *
              </label>
              <input
                type="number"
                value={formData.unitsNeeded}
                onChange={(e) => handleFormChange('unitsNeeded', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.unitsNeeded ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Number of units"
                min="1"
                max="10"
              />
              {errors.unitsNeeded && (
                <p className="text-sm text-destructive mt-1">{errors.unitsNeeded}</p>
              )}
            </div>

            {/* Needed By */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Needed By *
              </label>
              <input
                type="datetime-local"
                value={formData.neededBy}
                onChange={(e) => handleFormChange('neededBy', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.neededBy ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors.neededBy && (
                <p className="text-sm text-destructive mt-1">{errors.neededBy}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.contactPhone ? 'border-destructive' : 'border-border'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.contactPhone && (
                <p className="text-sm text-destructive mt-1">{errors.contactPhone}</p>
              )}
            </div>

            {/* Additional Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleFormChange('additionalNotes', e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Any additional information or special requirements..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-border">
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              variant={formData.urgencyLevel === 'critical' ? 'destructive' : 'default'}
              iconName={isSubmitting ? 'Loader2' : 'Send'}
              iconPosition="right"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodRequestCreation;