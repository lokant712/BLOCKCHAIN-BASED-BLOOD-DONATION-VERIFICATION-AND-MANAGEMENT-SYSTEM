import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import VideoBackground from '../../components/ui/VideoBackground';

const UserRegistration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodType: '',
    hospitalName: '',
    hospitalLicense: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});

  const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.role) newErrors.role = 'Please select your account type';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'Please accept the terms and conditions';

    // Role-specific validations
    if (formData.role === 'donor' && !formData.bloodType) {
      newErrors.bloodType = 'Blood type is required for donors';
    }
    if (formData.role === 'hospital' && !formData.hospitalName) {
      newErrors.hospitalName = 'Hospital name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: formData.role,
            phone: formData.phone,
            blood_type: formData.bloodType || null,
            hospital_name: formData.hospitalName || null
          }
        }
      });

      if (authError) {
        setErrors({ submit: authError.message || 'Registration failed. Please try again.' });
        return;
      }

      if (!authData.user) {
        setErrors({ submit: 'Registration failed. Please try again.' });
        return;
      }

      // Email confirmation is disabled, so we can proceed directly

      // Create user profile in the database
      const profileData = {
        id: authData.user.id,
        email: formData.email,
        full_name: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        phone: formData.phone,
        blood_type: formData.bloodType || null,
        hospital_name: formData.hospitalName || null,
        hospital_license: formData.hospitalLicense || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating profile with data:', profileData);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails - user can still log in
      }

      // Create user session
      const userSession = {
        id: authData.user.id,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
        isAvailable: formData.role === 'donor' ? true : undefined,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('userSession', JSON.stringify(userSession));

      // Navigate to appropriate dashboard
      const dashboardRoutes = {
        donor: '/donor-dashboard',
        hospital: '/hospital-dashboard'
      };

      navigate(dashboardRoutes[formData.role] || '/donor-dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Account - BloodLink</title>
        <meta name="description" content="Join BloodLink community as a donor or hospital. Create your account to start saving lives through blood donation." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Video Background */}
        <VideoBackground videoSrc="/assets/BACKGROUND.mp4" blur="md" overlay="dark" />
        
        {/* Background Pattern - Optional overlay effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100/10 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-100/10 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-rose-100/10 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative w-full max-w-lg z-10">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-2xl shadow-blue-500/50">
                <Icon name="Droplets" size={32} color="white" />
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                BloodLink
              </h1>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2 drop-shadow-md">
              Create Your Account
            </h2>
            <p className="text-gray-200 drop-shadow-sm">
              Join our community to save lives
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange({ target: { name: 'role', value: 'donor' } })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.role === 'donor'
                        ? 'border-blue-500 bg-blue-500/20 text-white backdrop-blur-sm'
                        : 'border-white/20 hover:border-white/40 text-gray-300 bg-white/5 backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon name="Heart" size={20} />
                      <span className="font-medium">Donor</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange({ target: { name: 'role', value: 'hospital' } })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.role === 'hospital'
                        ? 'border-blue-500 bg-blue-500/20 text-white backdrop-blur-sm'
                        : 'border-white/20 hover:border-white/40 text-gray-300 bg-white/5 backdrop-blur-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon name="Building2" size={20} />
                      <span className="font-medium">Hospital</span>
                    </div>
                  </button>
                </div>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-300">{errors.role}</p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-300">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-300">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-300">{errors.phone}</p>
                )}
              </div>

              {/* Blood Type (for donors) */}
              {formData.role === 'donor' && (
                <div>
                  <label htmlFor="bloodType" className="block text-sm font-medium text-white mb-1">
                    Blood Type
                  </label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800 text-white">Select your blood type</option>
                    {bloodTypeOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.bloodType && (
                    <p className="mt-1 text-sm text-red-300">{errors.bloodType}</p>
                  )}
                </div>
              )}

              {/* Hospital Name (for hospitals) */}
              {formData.role === 'hospital' && (
                <div>
                  <label htmlFor="hospitalName" className="block text-sm font-medium text-white mb-1">
                    Hospital Name
                  </label>
                  <input
                    id="hospitalName"
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                    placeholder="City General Hospital"
                  />
                  {errors.hospitalName && (
                    <p className="mt-1 text-sm text-red-300">{errors.hospitalName}</p>
                  )}
                </div>
              )}

              {/* Hospital License (for hospitals) */}
              {formData.role === 'hospital' && (
                <div>
                  <label htmlFor="hospitalLicense" className="block text-sm font-medium text-white mb-1">
                    Hospital License Number
                  </label>
                  <input
                    id="hospitalLicense"
                    type="text"
                    name="hospitalLicense"
                    value={formData.hospitalLicense}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                    placeholder="Enter license number"
                  />
                </div>
              )}

              {/* Address Fields */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-white mb-1">
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-white mb-1">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-white mb-1">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-white mb-1">
                  ZIP Code
                </label>
                <input
                  id="zipCode"
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                  placeholder="10001"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-300">{errors.password}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} size={20} />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-300">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-white/20 rounded mt-1 bg-white/10"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-300">{errors.agreeToTerms}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={20} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={20} />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              {/* Error Display */}
              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-red-300" />
                    <p className="text-sm text-red-200">{errors.submit}</p>
                  </div>
                </div>
              )}
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-300">
                Already have an account?{' '}
                <Link 
                  to="/user-login" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400 drop-shadow-md">
              © {new Date().getFullYear()} BloodLink. Connecting lives through blood donation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserRegistration;