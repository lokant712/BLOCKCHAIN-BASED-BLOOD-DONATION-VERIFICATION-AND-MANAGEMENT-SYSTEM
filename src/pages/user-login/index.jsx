import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import LoginForm from './components/LoginForm';
import AlternativeActions from './components/AlternativeActions';
import VideoBackground from '../../components/ui/VideoBackground';

const UserLogin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const userData = JSON.parse(userSession);
      setUser(userData);
      
      // Redirect to appropriate dashboard
      const roleRoutes = {
        donor: '/donor-dashboard',
        hospital: '/hospital-dashboard',
        admin: '/hospital-dashboard'
      };
      navigate(roleRoutes?.[userData?.role] || '/donor-dashboard');
    }
  }, [navigate]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  return (
    <>
      <Helmet>
        <title>Sign In - BloodLink | Connect to Save Lives</title>
        <meta name="description" content="Sign in to BloodLink - Connect with blood donors and hospitals for life-saving donations." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Video Background */}
        <VideoBackground videoSrc="/assets/BACKGROUND.mp4" blur="md" overlay="dark" />
        
        {/* Background Pattern - Optional overlay effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative w-full max-w-md z-10">
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
              Welcome Back
            </h2>
            <p className="text-gray-200 drop-shadow-sm">
              Sign in to continue saving lives
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            <LoginForm onLogin={handleLogin} />
            
            <div className="mt-6">
              <AlternativeActions />
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-2">
                <Icon name="Info" size={16} className="text-blue-400" />
                <p className="text-sm text-gray-200">
                  Use your registered email and password to sign in. 
                  <Link to="/user-registration" className="text-blue-400 underline ml-1 hover:text-blue-300">
                    Create an account
                  </Link> if you don't have one.
                </p>
              </div>
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

export default UserLogin;