import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const AlternativeActions = () => {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-300 mb-4">
        Don't have an account?{' '}
        <Link 
          to="/user-registration" 
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Create one here
        </Link>
      </p>
    </div>
  );
};

export default AlternativeActions;