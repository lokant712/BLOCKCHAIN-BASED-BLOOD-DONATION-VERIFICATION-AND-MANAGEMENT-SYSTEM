import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import NotificationBadge from './NotificationBadge';

const RoleBasedMenu = ({ 
  user, 
  orientation = 'horizontal', 
  onItemClick = () => {},
  className = '' 
}) => {
  const location = useLocation();

  const menuConfig = {
    donor: [
      {
        label: 'Dashboard',
        path: '/donor-dashboard',
        icon: 'LayoutDashboard',
        description: 'View your donation history and status'
      },
      {
        label: 'Find Requests',
        path: '/find-requests',
        icon: 'Search',
        description: 'Browse urgent blood requests near you',
        badge: { count: 5, variant: 'urgent' }
      },
      {
        label: 'My Donations',
        path: '/my-donations',
        icon: 'Heart',
        description: 'Track your donation history'
      },
      {
        label: 'Availability',
        path: '/availability-settings',
        icon: 'Clock',
        description: 'Manage your donation availability'
      }
    ],
    hospital: [
      {
        label: 'Dashboard',
        path: '/hospital-dashboard',
        icon: 'LayoutDashboard',
        description: 'Hospital overview and statistics'
      },
      {
        label: 'Create Request',
        path: '/blood-request-creation',
        icon: 'Plus',
        description: 'Submit urgent blood requests',
        urgent: true
      },
      {
        label: 'Active Requests',
        path: '/active-requests',
        icon: 'Activity',
        description: 'Monitor ongoing blood requests',
        badge: { count: 3, variant: 'warning' }
      },
      {
        label: 'Donor Network',
        path: '/donor-network',
        icon: 'Users',
        description: 'Browse available donors'
      },
      {
        label: 'Inventory',
        path: '/blood-inventory',
        icon: 'Package',
        description: 'Manage blood bank inventory'
      }
    ],
    admin: [
      {
        label: 'Dashboard',
        path: '/admin-dashboard',
        icon: 'LayoutDashboard',
        description: 'System overview and analytics'
      },
      {
        label: 'User Management',
        path: '/user-management',
        icon: 'Users',
        description: 'Manage users and permissions'
      },
      {
        label: 'Request Monitoring',
        path: '/request-monitoring',
        icon: 'Monitor',
        description: 'Monitor all blood requests',
        badge: { count: 12, variant: 'primary' }
      },
      {
        label: 'System Settings',
        path: '/system-settings',
        icon: 'Settings',
        description: 'Configure system parameters'
      },
      {
        label: 'Reports',
        path: '/reports',
        icon: 'BarChart3',
        description: 'Generate system reports'
      }
    ]
  };

  const menuItems = user ? menuConfig?.[user?.role] || [] : [];

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const handleItemClick = (item) => {
    onItemClick(item);
  };

  if (!user || menuItems?.length === 0) {
    return null;
  }

  const baseClasses = orientation === 'horizontal' ?'flex space-x-1' :'flex flex-col space-y-1';

  const itemClasses = orientation === 'horizontal' ?'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200' :'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 w-full';

  return (
    <nav className={`${baseClasses} ${className}`} role="navigation" aria-label="Main navigation">
      {menuItems?.map((item) => (
        <Link
          key={item?.path}
          to={item?.path}
          className={`${itemClasses} ${
            isActivePath(item?.path)
              ? 'bg-primary text-primary-foreground'
              : item?.urgent
              ? 'text-destructive hover:bg-destructive/10' :'text-text-secondary hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => handleItemClick(item)}
          aria-current={isActivePath(item?.path) ? 'page' : undefined}
          title={item?.description}
        >
          <Icon name={item?.icon} size={orientation === 'horizontal' ? 16 : 20} />
          <span>{item?.label}</span>
          {item?.badge && (
            <NotificationBadge 
              count={item?.badge?.count} 
              variant={item?.badge?.variant}
              className="ml-auto"
            />
          )}
        </Link>
      ))}
    </nav>
  );
};

export default RoleBasedMenu;