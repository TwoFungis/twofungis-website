import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check, ChevronRight } from 'lucide-react';
import PWAInstallService from '../../services/PWAInstallService';

const PWAInstallModal = ({ isOpen, onClose }) => {
  const [installStatus, setInstallStatus] = useState('idle'); // idle, prompting, success, manual
  const [instructions, setInstructions] = useState(null);

  useEffect(() => {
    if (isOpen) {
      handleInstall();
    }
  }, [isOpen]);

  const handleInstall = async () => {
    // Check if already installed
    if (PWAInstallService.isInstalled()) {
      setInstallStatus('success');
      return;
    }

    // Try to show install prompt
    setInstallStatus('prompting');
    const result = await PWAInstallService.promptInstall();

    if (result.outcome === 'accepted') {
      setInstallStatus('success');
    } else if (result.showManualInstructions) {
      setInstallStatus('manual');
      setInstructions(PWAInstallService.getInstallInstructions());
    } else {
      // User dismissed prompt
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-charcoal-800 rounded-2xl border border-charcoal-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="pwa-install-modal"
      >
        {/* Success State */}
        {installStatus === 'success' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">App Installed!</h2>
            <p className="text-gray-400 mb-6">
              TradeOS is now on your device. Access it anytime from your home screen.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Prompting State */}
        {installStatus === 'prompting' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Download className="w-10 h-10 text-steel-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Installing TradeOS</h2>
            <p className="text-gray-400">
              Please accept the install prompt to add TradeOS to your device...
            </p>
          </div>
        )}

        {/* Manual Instructions State */}
        {installStatus === 'manual' && instructions && (
          <>
            <div className="p-6 border-b border-charcoal-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-steel-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Install TradeOS</h2>
                  <p className="text-sm text-gray-500">Add to your home screen</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-400 mb-4">
                Follow these steps to install the app:
              </p>
              
              <div className="space-y-3">
                {instructions.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-charcoal-700/50 rounded-lg p-3">
                    <div className="w-6 h-6 bg-steel-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-white text-sm">{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full mt-6 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Got it
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Idle/Initial State */}
        {installStatus === 'idle' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-steel-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Download Free App</h2>
            <p className="text-gray-400 mb-6">
              Get TradeOS on your device for the best experience. Works offline, fast, and always available.
            </p>
            <button
              onClick={handleInstall}
              className="w-full bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Install Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallModal;
