import React from 'react';

const BrandLogo = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  };

  return (
    <div className={`${sizes[size]} ${className} bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-2xl`}>
      EB
    </div>
  );
};

export default BrandLogo;