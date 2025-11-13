import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';


const MockCredentialsHelper = ({ onCredentialSelect = () => {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mockAccounts = [
    {
      role: 'donor',
      email: 'donor@bloodlink.com',
      password: 'donor123',
      name: 'John Smith',
      description: 'Blood donor account with donation history'
    },
    {
      role: 'hospital',
      email: 'hospital@bloodlink.com',
      password: 'hospital123',
      name: 'City General Hospital',
      description: 'Hospital account for managing blood requests'
    },
    {
      role: 'admin',
      email: 'admin@bloodlink.com',
      password: 'admin123',
      name: 'System Admin',
      description: 'Administrator account with full system access'
    }
  ];

  const getRoleIcon = (role) => {
    const icons = {
      donor: 'Heart',
      hospital: 'Building2',
      admin: 'Shield'
    };
    return icons?.[role] || 'User';
  };

  const getRoleColor = (role) => {
    const colors = {
      donor: 'var(--color-success)',
      hospital: 'var(--color-primary)',
      admin: 'var(--color-destructive)'
    };
    return colors?.[role] || 'var(--color-text-secondary)';
  };

  return (
    <div className="mt-6 p-4 bg-accent rounded-lg border border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center space-x-2">
          <Icon name="TestTube" size={16} color="var(--color-primary)" />
          <span className="text-sm font-medium text-foreground">
            Demo Credentials
          </span>
        </div>
        <Icon 
          name={isExpanded ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          color="var(--color-text-secondary)" 
        />
      </button>
      {isExpanded && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-text-secondary">
            Use these test accounts to explore different user roles:
          </p>
          
          <div className="grid gap-2">
            {mockAccounts?.map((account) => (
              <div
                key={account?.role}
                className="p-3 bg-background rounded-md border border-border hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => onCredentialSelect(account?.email, account?.password)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-muted rounded-full">
                      <Icon 
                        name={getRoleIcon(account?.role)} 
                        size={14} 
                        color={getRoleColor(account?.role)} 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {account?.role}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {account?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-text-secondary">
                      {account?.password}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {account?.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 mt-3 p-2 bg-warning/10 rounded-md">
            <Icon name="AlertTriangle" size={14} color="var(--color-warning)" />
            <p className="text-xs text-warning">
              These are demo credentials for testing purposes only
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockCredentialsHelper;