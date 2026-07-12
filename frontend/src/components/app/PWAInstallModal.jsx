import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Smartphone, Share, Plus, ExternalLink } from 'lucide-react';
import PWAInstallService from '../../services/PWAInstallService';

/**
 * TradeOS PWA Install Modal v2.0
 * 
 * Design Philosophy:
 * - One-click experience when possible (native prompt)
 * - Minimal, visual iOS guide (not walls of text)
 * - Premium feel across all platforms
 * - "That was easy" user sentiment
 */

// iOS Share icon (SF Symbols style)
const IOSShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <path d="M4 14v5a2 2 0 002 2h12a2 2 0 002-2v-5" />
  </svg>
);

// iOS Add to Home Screen icon
const IOSAddIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const PWAInstallModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('checking'); // checking, installing, success, ios-guide, error
  const [platform, setPlatform] = useState(null);

  // Handle the installation flow
  const handleInstall = useCallback(async () => {
    setStatus('checking');
    
    // Small delay for smooth transition
    await new Promise(r => setTimeout(r, 300));
    
    const installMethod = PWAInstallService.getInstallMethod();
    setPlatform(installMethod.platform);
    
    // Already installed - show success and offer to open
    if (installMethod.method === 'already-installed') {
      setStatus('already-installed');
      return;
    }
    
    // Native prompt available (Desktop Chrome/Edge, Android Chrome)
    if (installMethod.method === 'native-prompt') {
      setStatus('installing');
      const result = await PWAInstallService.triggerNativeInstall();
      
      if (result.success) {
        setStatus('success');
      } else if (result.outcome === 'dismissed') {
        // User dismissed - close modal
        onClose();
      } else {
        // Fallback to manual instructions
        setStatus('manual');
      }
      return;
    }
    
    // iOS requires manual Share → Add to Home Screen
    if (installMethod.method === 'ios-manual') {
      setStatus('ios-guide');
      return;
    }
    
    // Other platforms - show manual instructions
    setStatus('manual');
  }, [onClose]);

  // Start installation when modal opens
  useEffect(() => {
    if (isOpen) {
      handleInstall();
    } else {
      // Reset state when closed
      setStatus('checking');
    }
  }, [isOpen, handleInstall]);

  // Listen for successful installation
  useEffect(() => {
    const unsubscribe = PWAInstallService.subscribe((event) => {
      if (event === 'installed') {
        setStatus('success');
      }
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-sm bg-zinc-900 sm:rounded-2xl rounded-t-2xl border-t sm:border border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="pwa-install-modal"
      >
        {/* Checking State - Brief loading */}
        {status === 'checking' && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-zinc-400 text-sm">Preparing installation...</p>
          </div>
        )}

        {/* Installing State - Waiting for prompt response */}
        {status === 'installing' && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Installing TradeOS</h2>
            <p className="text-zinc-400 text-sm text-center">
              Confirm the installation in your browser...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">TradeOS Installed</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Added to your device. Launch anytime.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium transition-colors"
              data-testid="pwa-install-done"
            >
              Done
            </button>
          </div>
        )}

        {/* Already Installed State */}
        {status === 'already-installed' && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Already Installed</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              TradeOS is on your device.
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  // Attempt to open the PWA
                  window.location.href = '/app/command-center';
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                data-testid="pwa-open-app"
              >
                <ExternalLink className="w-4 h-4" />
                Open App
              </button>
              <button
                onClick={onClose}
                className="w-full text-zinc-400 hover:text-white py-2 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* iOS Guide - Clean, Visual, Minimal */}
        {status === 'ios-guide' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <img 
                  src="/icon-192x192.png" 
                  alt="TradeOS" 
                  className="w-10 h-10 rounded-xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div>
                  <h2 className="font-semibold text-white">Install TradeOS</h2>
                  <p className="text-xs text-zinc-500">Add to Home Screen</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                data-testid="pwa-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Steps */}
            <div className="p-6 space-y-4">
              {/* Step 1 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <IOSShareIcon />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Tap Share</p>
                  <p className="text-zinc-500 text-sm">At the bottom of Safari</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-medium">
                  1
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-700/50 flex items-center justify-center flex-shrink-0">
                  <IOSAddIcon />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Add to Home Screen</p>
                  <p className="text-zinc-500 text-sm">Scroll down and tap</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-medium">
                  2
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 font-semibold">
                  Add
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Tap Add</p>
                  <p className="text-zinc-500 text-sm">In the top right corner</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-medium">
                  3
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={onClose}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </>
        )}

        {/* Manual Instructions (non-iOS fallback) */}
        {status === 'manual' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Install TradeOS</h2>
                <p className="text-xs text-zinc-500">Add to your device</p>
              </div>
              <button 
                onClick={onClose} 
                className="ml-auto p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
              <p className="text-zinc-300 text-sm leading-relaxed">
                Look for the <span className="text-white font-medium">install icon</span> in your browser&apos;s address bar, or open the browser menu and select <span className="text-white font-medium">&quot;Install TradeOS&quot;</span> or <span className="text-white font-medium">&quot;Add to Home Screen&quot;</span>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Installation Failed</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Please try again or use your browser&apos;s install option.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallModal;
