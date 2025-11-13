import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Header = ({ user = null, onLogout = () => {} }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: user?.role === 'donor' ? '/donor-dashboard' : '/hospital-dashboard',
      icon: 'LayoutDashboard',
      roles: ['donor', 'hospital', 'admin']
    },
    {
      label: 'Create Request',
      path: '/blood-request-creation',
      icon: 'Plus',
      roles: ['hospital', 'admin'],
      urgent: true
    },
    {
      label: 'My Donations',
      path: '/my-donations',
      icon: 'Heart',
      roles: ['donor']
    },
    {
      label: 'Chat Assistant',
      path: '/chatbot',
      icon: 'MessageCircle',
      roles: ['donor', 'hospital', 'admin']
    }
  ];

  const getVisibleNavItems = () => {
    if (!user) return [];
    return navigationItems?.filter(item => 
      item?.roles?.includes(user?.role)
    )?.slice(0, 4);
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface shadow-medical">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Icon name="Droplets" size={20} color="white" />
          </div>
          <span className="text-xl font-semibold text-primary">BloodLink</span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex ml-8 space-x-1">
            {getVisibleNavItems()?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActivePath(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : item?.urgent
                    ? 'text-destructive hover:bg-destructive/10' :'text-text-secondary hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon name={item?.icon} size={16} />
                <span>{item?.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>

              {/* Availability Toggle (Donors only) */}
              {user?.role === 'donor' && (
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">Available:</span>
                  <button
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      user?.isAvailable ? 'bg-success' : 'bg-muted'
                    }`}
                    onClick={() => {}}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        user?.isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Profile Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProfileToggle}
                  className="flex items-center space-x-2"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="User" size={16} color="var(--color-primary)" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                  <Icon name="ChevronDown" size={16} />
                </Button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-medical-lg z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Icon name="User" size={16} className="mr-2" />
                        Profile
                      </Link>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="LogOut" size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={handleMobileMenuToggle}
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/user-login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/user-registration">
                <Button variant="default" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <nav className="px-4 py-2 space-y-1">
            {getVisibleNavItems()?.map((item) => (
              <Link
                key={item?.path}
                to={item?.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActivePath(item?.path)
                    ? 'bg-primary text-primary-foreground'
                    : item?.urgent
                    ? 'text-destructive hover:bg-destructive/10' :'text-text-secondary hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon name={item?.icon} size={20} />
                <span>{item?.label}</span>
              </Link>
            ))}

            {/* Mobile Availability Toggle for Donors */}
            {user?.role === 'donor' && (
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center space-x-3">
                  <Icon name="Activity" size={20} />
                  <span className="text-sm font-medium">Available for Donation</span>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    user?.isAvailable ? 'bg-success' : 'bg-muted'
                  }`}
                  onClick={() => {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      user?.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;