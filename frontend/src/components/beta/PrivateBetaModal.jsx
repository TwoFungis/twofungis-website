/**
 * PrivateBetaModal.jsx - TradeOS Private Beta Access Modal
 * =========================================================
 * 
 * Construction-themed modal for private beta notice.
 * Intercepts public access during development phase.
 * 
 * Features:
 * - Caution tape border design
 * - Focus trapping for accessibility
 * - Keyboard navigation (Escape to close)
 * - Responsive on all devices
 * - Authorized developer access link
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Shield, Construction, HardHat } from 'lucide-react';
import { BETA_CONFIG } from '../../config/betaConfig';

const PrivateBetaModal = ({ isOpen, onClose, onDeveloperAccess }) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Handle Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Focus trapping
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    }
  }, [onClose]);

  // Lock body scroll and setup keyboard handling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus the close button on open
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-modal-title"
      aria-describedby="beta-modal-description"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#0a0a0a] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        style={{
          animation: 'modalEnter 0.3s ease-out'
        }}
      >
        {/* Caution Tape Top Border */}
        <div className="absolute -top-3 left-4 right-4 h-6 overflow-hidden rounded-t-lg">
          <div 
            className="w-[200%] h-full"
            style={{
              background: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 20px, #0a0a0a 20px, #0a0a0a 40px)',
              animation: 'cautionSlide 2s linear infinite'
            }}
          />
        </div>
        
        {/* Caution Tape Bottom Border */}
        <div className="absolute -bottom-3 left-4 right-4 h-6 overflow-hidden rounded-b-lg">
          <div 
            className="w-[200%] h-full"
            style={{
              background: 'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 20px, #0a0a0a 20px, #0a0a0a 40px)',
              animation: 'cautionSlide 2s linear infinite reverse'
            }}
          />
        </div>
        
        {/* Close Button */}
        <button
          ref={(el) => {
            closeButtonRef.current = el;
            firstFocusableRef.current = el;
          }}
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Content */}
        <div className="p-8 pt-10">
          {/* Logo and Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
                <img 
                  src="/shield-icon.png" 
                  alt="TradeOS" 
                  className="w-12 h-12"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <HardHat className="w-4 h-4 text-black" />
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <Construction className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                Development in Progress
              </span>
            </div>
          </div>
          
          {/* Title */}
          <h2 
            id="beta-modal-title"
            className="text-2xl sm:text-3xl font-bold text-white text-center mb-2"
          >
            TradeOS is Currently in
            <span className="block text-amber-400">Private Beta</span>
          </h2>
          
          {/* Subheading */}
          <p className="text-gray-400 text-center text-sm mb-6">
            Built for Builders. Being Built with Precision.
          </p>
          
          {/* Message */}
          <div 
            id="beta-modal-description"
            className="bg-[#111111] border border-[#222222] rounded-xl p-5 mb-6"
          >
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              TradeOS is currently under active development and private beta testing 
              by its development team and authorized testers.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Public registration, downloads and subscriptions are not yet available. 
              We are refining the platform, validating its performance and preparing 
              TradeOS for a professional public launch.
            </p>
            <p className="text-gray-400 text-sm italic">
              Thank you for your interest. Something powerful is being built.
            </p>
          </div>
          
          {/* Primary Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25 mb-4"
          >
            Return to Website
          </button>
          
          {/* Launch List Button (conditional) */}
          {BETA_CONFIG.showLaunchListSignup && (
            <button
              className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-xl transition-all border border-white/10 hover:border-white/20 mb-4"
            >
              Join the Launch List
            </button>
          )}
          
          {/* Developer Access Link */}
          <div className="text-center pt-4 border-t border-[#222222]">
            <button
              ref={lastFocusableRef}
              onClick={onDeveloperAccess}
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Authorized Developer Access</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes cautionSlide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-40px);
          }
        }
      `}</style>
    </div>
  );
};

export default PrivateBetaModal;
