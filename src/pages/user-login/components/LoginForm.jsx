import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useAuth } from '../../../contexts/AuthContext';

const LoginForm = ({ onLogin = () => {} }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    rememberMe: !!localStorage.getItem('rememberedEmail')
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData?.password?.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Use Supabase authentication
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setErrors({
          general: error.message || 'Invalid email or password. Please check your credentials and try again.'
        });
        return;
      }

      if (!data?.user) {
        setErrors({
          general: 'Login failed. Please try again.'
        });
        return;
      }

      // Handle remember me
      if (formData?.rememberMe) {
        localStorage.setItem('rememberedEmail', formData?.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Get user profile from Supabase to determine role
      // For now, we'll use a simple approach - you can enhance this later
      const userRole = data.user.user_metadata?.role || 'donor';
      const userName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0];

      // Store user session
      const userSession = {
        id: data.user.id,
        email: data.user.email,
        name: userName,
        role: userRole,
        isAvailable: userRole === 'donor' ? true : undefined,
        loginTime: new Date()?.toISOString()
      };
      
      localStorage.setItem('userSession', JSON.stringify(userSession));
      
      // Call parent callback
      onLogin(userSession);

      // Navigate based on role
      const roleRoutes = {
        donor: '/donor-dashboard',
        hospital: '/hospital-dashboard',
        admin: '/hospital-dashboard' // Admins use hospital dashboard for now
      };

      navigate(roleRoutes?.[userRole] || '/donor-dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'Login failed. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData?.email}
          onChange={handleInputChange}
          required
          autoComplete="email"
          className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
        />
        {errors?.email && (
          <p className="mt-1 text-sm text-red-300">{errors?.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter your password"
            value={formData?.password}
            onChange={handleInputChange}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 pr-12 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white/10 text-white placeholder:text-gray-400 backdrop-blur-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
          </button>
        </div>
        {errors?.password && (
          <p className="mt-1 text-sm text-red-300">{errors?.password}</p>
        )}
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData?.rememberMe}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-white/20 rounded bg-white/10"
          />
          <span className="ml-2 text-sm text-gray-300">Remember me</span>
        </label>
        <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Forgot password?
        </a>
      </div>

      {/* General Error Message */}
      {errors?.general && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-red-300" />
            <p className="text-sm text-red-200">{errors?.general}</p>
          </div>
        </div>
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
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <Icon name="LogIn" size={20} />
            <span>Sign In</span>
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;