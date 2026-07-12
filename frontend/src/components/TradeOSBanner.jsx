import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * "Powered by TradeOS" banner — matches current tradeos.ca identity.
 * Palette: near-black background · emerald/teal accent · white text hierarchy.
 * Represents the Two Fungis × TradeOS ecosystem relationship (not an ad).
 */
const TradeOSBanner = () => {
  return (
    <a
      href="https://tradeos.ca"
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed top-0 left-0 right-0 z-[60] block w-full text-white transition-all duration-[250ms] ease-out"
      style={{
        background: 'linear-gradient(90deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 24px -6px rgba(16, 185, 129, 0.35)';
        e.currentTarget.style.borderBottomColor = 'rgba(16, 185, 129, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderBottomColor = 'rgba(16, 185, 129, 0.18)';
      }}
      data-testid="tradeos-banner"
      aria-label="Powered by TradeOS — Launch TradeOS"
    >
      <div className="container mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
        {/* Left: Shield + wordmark + subtitle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="https://customer-assets.emergentagent.com/job_find-twofungis/artifacts/r3qg54zl_image%20%283%29.png"
            alt=""
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain flex-shrink-0 transition-transform duration-[250ms] group-hover:scale-105"
          />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
            <span className="text-[13px] sm:text-sm font-semibold tracking-tight text-white whitespace-nowrap">
              Powered by{' '}
              <span
                className="font-bold"
                style={{
                  background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '0.01em',
                }}
              >
                TradeOS
              </span>
            </span>
            <span className="hidden md:inline text-[12px] text-gray-400 truncate">
              The Operating System for Canadian Contractors
            </span>
          </div>
        </div>

        {/* Right: Premium CTA */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-[12px] sm:text-[13px] font-semibold text-white shadow-sm flex-shrink-0 transition-all duration-[250ms] group-hover:shadow-[0_0_16px_rgba(16,185,129,0.55)] group-hover:-translate-y-[1px]"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
          }}
        >
          <span className="whitespace-nowrap">Launch TradeOS</span>
          <ArrowRight size={14} strokeWidth={2.5} className="transition-transform duration-[250ms] group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
};

export default TradeOSBanner;
