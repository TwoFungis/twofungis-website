/**
 * TradeOS PWA Install Service
 * Handles PWA installation prompts and detection
 * 
 * Installation detection strategy:
 * 1. Primary: Check if running in standalone mode (display-mode: standalone)
 * 2. Secondary: Check iOS standalone mode (navigator.standalone)
 * 3. The beforeinstallprompt event indicates app is NOT installed
 * 4. localStorage flag is set on appinstalled event but cleared when prompt fires
 */

let deferredPrompt = null;
let installPromptFired = false;

export const PWAInstallService = {
  // Store the deferred prompt event
  init: () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67+ from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        installPromptFired = true;
        console.log('[PWA] Install prompt ready - app is NOT installed');
        
        // Clear any stale "installed" flag since prompt firing proves it's not installed
        localStorage.removeItem('tradeos_pwa_installed');
        
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('pwa-install-available'));
      });

      window.addEventListener('appinstalled', () => {
        console.log('[PWA] App was installed');
        deferredPrompt = null;
        installPromptFired = false;
        localStorage.setItem('tradeos_pwa_installed', 'true');
        localStorage.setItem('tradeos_pwa_install_time', Date.now().toString());
        window.dispatchEvent(new CustomEvent('pwa-installed'));
      });
    }
  },

  // Check if PWA install prompt is available
  isInstallAvailable: () => {
    return deferredPrompt !== null;
  },

  // Check if currently running as PWA (standalone mode)
  isRunningAsStandalone: () => {
    // Check CSS media query for standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // Check iOS Safari standalone
    if (window.navigator.standalone === true) {
      return true;
    }
    return false;
  },

  // Check if PWA is installed - use multiple signals
  isInstalled: () => {
    // If currently running in standalone mode, definitely installed
    if (PWAInstallService.isRunningAsStandalone()) {
      return true;
    }
    
    // If beforeinstallprompt fired this session, app is NOT installed
    if (installPromptFired || deferredPrompt !== null) {
      return false;
    }
    
    // Fallback to localStorage flag (set on appinstalled event)
    // This is less reliable as user may have uninstalled
    return localStorage.getItem('tradeos_pwa_installed') === 'true';
  },

  // Clear installed status (when user indicates they uninstalled)
  clearInstalledStatus: () => {
    localStorage.removeItem('tradeos_pwa_installed');
    localStorage.removeItem('tradeos_pwa_install_time');
    installPromptFired = false;
    console.log('[PWA] Install status cleared');
  },

  // Trigger the install prompt
  promptInstall: async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      // For iOS or when prompt is not available, show manual instructions
      return { outcome: 'not-available', showManualInstructions: true };
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User response to install prompt: ${outcome}`);
      
      // Clear the prompt (can only be used once)
      deferredPrompt = null;
      
      if (outcome === 'accepted') {
        installPromptFired = false;
      }
      
      return { outcome, showManualInstructions: false };
    } catch (err) {
      console.error('[PWA] Error showing install prompt:', err);
      return { outcome: 'error', showManualInstructions: true };
    }
  },

  // Get platform-specific install instructions
  getInstallInstructions: () => {
    const ua = navigator.userAgent || navigator.vendor;
    
    // iOS
    if (/iPad|iPhone|iPod/.test(ua)) {
      return {
        platform: 'ios',
        steps: [
          'Tap the Share button at the bottom of Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner'
        ]
      };
    }
    
    // Android Chrome
    if (/android/i.test(ua) && /chrome/i.test(ua)) {
      return {
        platform: 'android',
        steps: [
          'Tap the three-dot menu in the top right',
          'Tap "Add to Home Screen" or "Install App"',
          'Tap "Install" to confirm'
        ]
      };
    }
    
    // Desktop Chrome/Edge
    if (/chrome|edg/i.test(ua)) {
      return {
        platform: 'desktop',
        steps: [
          'Click the install icon in the address bar',
          'Or click the three-dot menu and select "Install TradeOS"',
          'Click "Install" to confirm'
        ]
      };
    }
    
    // Firefox
    if (/firefox/i.test(ua)) {
      return {
        platform: 'firefox',
        steps: [
          'Firefox does not support PWA install on desktop',
          'Please use Chrome, Edge, or Safari for the best experience'
        ]
      };
    }
    
    // Default
    return {
      platform: 'other',
      steps: [
        'Use the browser menu to add this app to your home screen',
        'Look for "Add to Home Screen" or "Install App" option'
      ]
    };
  }
};

// Initialize on module load
if (typeof window !== 'undefined') {
  PWAInstallService.init();
}

export default PWAInstallService;
