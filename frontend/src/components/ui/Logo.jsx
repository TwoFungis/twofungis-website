import React from 'react';
import { Link } from 'react-router-dom';

// Logo component with different size variants
export const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { img: 'h-8', text: 'text-lg' },
    md: { img: 'h-10', text: 'text-xl' },
    lg: { img: 'h-12', text: 'text-2xl' },
    xl: { img: 'h-16', text: 'text-3xl' },
  };

  const { img, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo.png" 
        alt="TradeOS" 
        className={`${img} w-auto object-contain`}
      />
      {showText && (
        <span className={`${text} font-bold text-white tracking-tight`}>
          TRADEOS<span className="text-steel-400 align-super text-xs">™</span>
        </span>
      )}
    </div>
  );
};

// Logo as a link to home
export const LogoLink = ({ size = 'md', showText = true, className = '' }) => {
  return (
    <Link to="/" className={className}>
      <Logo size={size} showText={showText} />
    </Link>
  );
};

// Icon-only version (for small spaces like mobile nav)
export const LogoIcon = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  };

  return (
    <img 
      src="/logo.png" 
      alt="TradeOS" 
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;
