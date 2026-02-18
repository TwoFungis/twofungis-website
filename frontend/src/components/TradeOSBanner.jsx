import React from 'react';
import { ArrowRight } from 'lucide-react';

const TradeOSBanner = () => {
  return (
    <a
      href="https://tradeos.ca"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-0 left-0 right-0 z-[60] block w-full py-2.5 px-4 text-center transition-all duration-300"
      style={{ 
        background: 'linear-gradient(135deg, #e8e8e8 0%, #d4d4d4 25%, #c0c0c0 50%, #d4d4d4 75%, #e8e8e8 100%)',
        borderBottom: '2px solid #5DADE2',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(93, 173, 226, 0.4)';
        e.currentTarget.style.background = 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%, #f0f0f0 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
        e.currentTarget.style.background = 'linear-gradient(135deg, #e8e8e8 0%, #d4d4d4 25%, #c0c0c0 50%, #d4d4d4 75%, #e8e8e8 100%)';
      }}
    >
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
        {/* Powered by text */}
        <span 
          className="text-sm font-medium"
          style={{ 
            color: '#555555', 
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          Powered by:
        </span>
        
        {/* Shield Logo */}
        <img 
          src="/tradeos-logo.png" 
          alt="TradeOS" 
          className="h-7 w-auto"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
        />
        
        {/* Brand Name */}
        <span 
          className="font-bold text-lg tracking-wide"
          style={{ 
            color: '#2C3E50', 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)'
          }}
        >
          TRADEOS<sup style={{ fontSize: '8px', verticalAlign: 'super' }}>™</sup>
        </span>
        
        {/* Tagline */}
        <span 
          className="text-sm hidden sm:inline font-medium"
          style={{ 
            color: '#5DADE2', 
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          Built for Builders
        </span>
        
        {/* CTA Button */}
        <span 
          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ml-2"
          style={{ 
            backgroundColor: '#5DADE2', 
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(93, 173, 226, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          Free Trial <ArrowRight size={12} strokeWidth={3} />
        </span>
      </div>
    </a>
  );
};

export default TradeOSBanner;
