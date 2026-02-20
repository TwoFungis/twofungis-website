import React, { useState, useEffect } from 'react';
import { X, Smartphone, Globe, ExternalLink, Trash2 } from 'lucide-react';
import PWAInstallService from '../../services/PWAInstallService';

/**
 * PWA Redirect Modal
 * Shows when user opens the site in browser but has PWA installed
 * Uses PWAInstallService for reliable detection
 */
const PWARedirectModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already running in standalone mode (PWA)
    if (PWAInstallService.isRunningAsStandalone()) {
      return;
    }

    // Listen for when app is installed
    const handleInstalled = () => {
      setJustInstalled(true);
      setShowModal(true);
    };

    // Listen for install prompt (means app is NOT installed)
    const handleInstallAvailable = () => {
      // App is not installed, close modal if showing
      setShowModal(false);
    };

    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('pwa-install-available', handleInstallAvailable);

    // Check if PWA appears to be installed
    const checkPWAInstalled = () => {
      const sessionDismissed = sessionStorage.getItem('tradeos_pwa_redirect_dismissed');
      
      // Don't show if dismissed this session
      if (sessionDismissed === 'true') {
        return;
      }

      // Check localStorage dismiss time
      const dismissedTime = localStorage.getItem('tradeos_pwa_redirect_dismissed');
      if (dismissedTime) {
        const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          return;
        }
      }

      // Use service to check if installed
      // Wait a bit for beforeinstallprompt to fire first
      setTimeout(() => {
        if (PWAInstallService.isInstalled()) {
          setShowModal(true);
        }
      }, 1500);
    };

    checkPWAInstalled();

    return () => {
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleOpenApp = () => {
    const currentUrl = window.location.href;
    sessionStorage.setItem('tradeos_opening_pwa', 'true');
    window.open(currentUrl, '_blank');
    setTimeout(() => {
      window.close();
      setShowModal(false);
    }, 500);
  };

  const handleStayInBrowser = () => {
    sessionStorage.setItem('tradeos_pwa_redirect_dismissed', 'true');
    localStorage.setItem('tradeos_pwa_redirect_dismissed', Date.now().toString());
    setShowModal(false);
  };

  const handleRemindLater = () => {
    sessionStorage.setItem('tradeos_pwa_redirect_dismissed', 'true');
    setShowModal(false);
  };

  const handleNotInstalled = () => {
    // User says app is not installed - use service to clear status
    PWAInstallService.clearInstalledStatus();
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
          
          {/* Option to indicate app was uninstalled */}
          {!justInstalled && (
            <button
              onClick={handleNotInstalled}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              I uninstalled the app
            </button>
          )}
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
