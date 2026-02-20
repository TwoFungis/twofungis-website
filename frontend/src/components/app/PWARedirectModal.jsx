import React, { useState, useEffect } from 'react';
import { X, Smartphone, Globe, ExternalLink } from 'lucide-react';

/**
 * PWA Redirect Modal
 * Shows when user opens the site in browser but has PWA installed
 * Offers choice to continue in browser or open in installed app
 */
const PWARedirectModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    
    if (isStandalone) {
      return;
    }

    // Check if PWA was just installed
    const handleInstalled = () => {
      setJustInstalled(true);
      setShowModal(true);
      localStorage.setItem('tradeos_pwa_installed', 'true');
      localStorage.setItem('tradeos_pwa_install_time', Date.now().toString());
    };

    window.addEventListener('appinstalled', handleInstalled);

    // Check if PWA is installed and user is in browser
    const checkPWAInstalled = () => {
      const pwaInstalled = localStorage.getItem('tradeos_pwa_installed') === 'true';
      const dismissedTime = localStorage.getItem('tradeos_pwa_redirect_dismissed');
      const sessionDismissed = sessionStorage.getItem('tradeos_pwa_redirect_dismissed');
      
      // Don't show if dismissed this session
      if (sessionDismissed === 'true') {
        return;
      }

      // Don't show if dismissed within last 24 hours
      if (dismissedTime) {
        const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          return;
        }
      }

      if (pwaInstalled) {
        // Small delay to let page load
        setTimeout(() => setShowModal(true), 1000);
      }
    };

    checkPWAInstalled();

    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleOpenApp = () => {
    // Try to open the PWA
    // On most platforms, opening the same URL when PWA is installed will open the PWA
    const currentUrl = window.location.href;
    
    // Mark that user chose app
    sessionStorage.setItem('tradeos_opening_pwa', 'true');
    
    // Open in new window (which should trigger PWA on supported platforms)
    // Then close this browser tab
    window.open(currentUrl, '_blank');
    
    // Close current window after short delay
    setTimeout(() => {
      window.close();
      // If window.close() doesn't work (security restrictions), show message
      setShowModal(false);
      // Show a toast or update UI to indicate they can close manually
    }, 500);
  };

  const handleStayInBrowser = () => {
    // Mark as dismissed for this session
    sessionStorage.setItem('tradeos_pwa_redirect_dismissed', 'true');
    // Also save timestamp for longer-term dismissal
    localStorage.setItem('tradeos_pwa_redirect_dismissed', Date.now().toString());
    setShowModal(false);
  };

  const handleRemindLater = () => {
    // Just dismiss for this session
    sessionStorage.setItem('tradeos_pwa_redirect_dismissed', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4 text-center">
          <button
            onClick={handleRemindLater}
            className="absolute top-4 right-4 text-gray-500 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-steel-500 to-steel-600 rounded-2xl flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {justInstalled ? 'App Installed!' : 'Open in App?'}
          </h2>
          
          <p className="text-gray-400 text-sm">
            {justInstalled 
              ? 'TradeOS has been added to your home screen. Open it for the best experience.'
              : 'TradeOS is installed on your device. Would you like to open it in the app?'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-3">
          <button
            onClick={handleOpenApp}
            className="w-full flex items-center justify-center gap-3 bg-steel-500 hover:bg-steel-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            data-testid="open-in-app-btn"
          >
            <Smartphone className="w-5 h-5" />
            Open in App
            <ExternalLink className="w-4 h-4 opacity-60" />
          </button>
          
          <button
            onClick={handleStayInBrowser}
            className="w-full flex items-center justify-center gap-3 bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors"
            data-testid="stay-in-browser-btn"
          >
            <Globe className="w-5 h-5" />
            Continue in Browser
          </button>
        </div>

        {/* Footer hint */}
        <div className="px-4 pb-4">
          <p className="text-center text-xs text-gray-500">
            The app works offline and loads faster
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWARedirectModal;
