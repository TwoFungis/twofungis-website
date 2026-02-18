import React from 'react';
import { ArrowRight } from 'lucide-react';

const TradeOSBanner = () => {
  return (
    <a
      href="https://tradeos.ca"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full py-2 px-4 text-center transition-all duration-300 hover:shadow-lg"
      style={{ 
        backgroundColor: '#1a1a2e',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 164, 55, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
        <span className="text-white text-sm font-medium" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          Powered by
        </span>
        <span 
          className="font-bold text-base"
          style={{ color: '#d4a437', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}
        >
          TradeOS
        </span>
        <span className="text-gray-400 text-sm hidden sm:inline" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          — The OS for Canadian Contractors
        </span>
        <span 
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
          style={{ 
            backgroundColor: '#d4a437', 
            color: '#1a1a2e',
            fontFamily: 'Open Sans, sans-serif'
          }}
        >
          Try Free <ArrowRight size={12} />
        </span>
      </div>
    </a>
  );
};

export default TradeOSBanner;
