import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import hospitalService from '../../../services/hospitalService';

const EmergencyRequestForm = ({ onSubmit, onCancel, hospitalData }) => {
  const [formData, setFormData] = useState({
    bloodType: '',
    unitsNeeded: 1,
    urgency: 'critical',
    patientName: '',
    patientAge: '',
    patientGender: '',
    medicalCondition: '',
    contactPhone: hospitalData?.phone || '',
    emergencyContact: '',
    additionalNotes: '',
    neededBy: '',
    hospitalName: hospitalData?.hospitalName || hospitalData?.name || '',
    hospitalAddress: hospitalData?.address || '',
    city: hospitalData?.city || '',
    state: hospitalData?.state || '',
    latitude: hospitalData?.latitude || null,
    longitude: hospitalData?.longitude || null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bloodTypes = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const urgencyLevels = [
    { value: 'critical', label: 'Critical - Life-threatening emergency' },
    { value: 'urgent', label: 'Urgent - Needed within hours' },
    { value: 'normal', label: 'Normal - Scheduled procedure' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.bloodType) newErrors.bloodType = 'Blood type is required';
    if (!formData.unitsNeeded || formData.unitsNeeded < 1) newErrors.unitsNeeded = 'At least 1 unit is required';
    if (!formData.urgency) newErrors.urgency = 'Urgency level is required';
    if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!formData.patientAge || formData.patientAge < 0 || formData.patientAge > 120) newErrors.patientAge = 'Valid age is required';
    if (!formData.patientGender) newErrors.patientGender = 'Patient gender is required';
    if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Contact phone is required';
    if (!formData.neededBy) newErrors.neededBy = 'Needed by date/time is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        ...formData,
        hospitalId: hospitalData?.id,
        neededBy: new Date(formData.neededBy).toISOString()
      };
      
      const result = await hospitalService.createBloodRequest(requestData);
      await onSubmit(result);
    } catch (error) {
      console.error('Error creating emergency request:', error);
      setErrors({ submit: error.message || 'Failed to create emergency request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Icon name="AlertTriangle" size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Emergency Blood Request</h2>
            <p className="text-sm text-gray-600">Create an urgent blood request to find compatible donors</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Blood Type and Units */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Type Required *
            </label>
            <Select
              value={formData.bloodType}
              onChange={(value) => handleInputChange('bloodType', value)}
              options={bloodTypes}
              placeholder="Select blood type"
              error={errors.bloodType}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Units Needed *
            </label>
            <Input
              type="number"
              value={formData.unitsNeeded}
              onChange={(e) => handleInputChange('unitsNeeded', parseInt(e.target.value))}
              min="1"
              max="10"
              placeholder="Number of units"
              error={errors.unitsNeeded}
            />
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level *
          </label>
          <Select
            value={formData.urgency}
            onChange={(value) => handleInputChange('urgency', value)}
            options={urgencyLevels}
            placeholder="Select urgency level"
            error={errors.urgency}
          />
          {formData.urgency && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(formData.urgency)}`}>
                {urgencyLevels.find(level => level.value === formData.urgency)?.label}
              </span>
            </div>
          )}
        </div>

        {/* Patient Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name *
              </label>
              <Input
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Full name"
                error={errors.patientName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <Input
                type="number"
                value={formData.patientAge}
                onChange={(e) => handleInputChange('patientAge', parseInt(e.target.value))}
                min="0"
                max="120"
                placeholder="Age in years"
                error={errors.patientAge}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <Select
                value={formData.patientGender}
                onChange={(value) => handleInputChange('patientGender', value)}
                options={genderOptions}
                placeholder="Select gender"
                error={errors.patientGender}
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Condition
            </label>
            <Input
              value={formData.medicalCondition}
              onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
              placeholder="e.g., Emergency surgery, Trauma, etc."
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone *
              </label>
              <Input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="+1-555-0123"
                error={errors.contactPhone}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <Input
                type="tel"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Alternative contact number"
              />
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timing</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Needed By *
            </label>
            <Input
              type="datetime-local"
              value={formData.neededBy}
              onChange={(e) => handleInputChange('neededBy', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              error={errors.neededBy}
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Any additional information about the request..."
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <Icon name="AlertCircle" size={20} className="text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
          >
            {isSubmitting ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                Creating Request...
              </>
            ) : (
              <>
                <Icon name="Zap" size={16} className="mr-2" />
                Create Emergency Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmergencyRequestForm;
