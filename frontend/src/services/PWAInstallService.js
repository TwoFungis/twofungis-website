/**
 * TradeOS PWA Install Service
 * Handles PWA installation prompts and detection
 */

let deferredPrompt = null;

export const PWAInstallService = {
  // Store the deferred prompt event
  init: () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67+ from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        console.log('PWA install prompt ready');
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('pwa-install-available'));
      });

      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
        localStorage.setItem('tradeos_pwa_installed', 'true');
        window.dispatchEvent(new CustomEvent('pwa-installed'));
      });
    }
  },

  // Check if PWA install is available
  isInstallAvailable: () => {
    return deferredPrompt !== null;
  },

  // Check if already installed
  isInstalled: () => {
    // Check if in standalone mode (PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    // Check iOS standalone
    if (window.navigator.standalone === true) {
      return true;
    }
    // Check localStorage flag
    if (localStorage.getItem('tradeos_pwa_installed') === 'true') {
      return true;
    }
    return false;
  },

  // Trigger the install prompt
  promptInstall: async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      // For iOS or when prompt is not available, show manual instructions
      return { outcome: 'not-available', showManualInstructions: true };
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // Clear the prompt (can only be used once)
      deferredPrompt = null;
      
      return { outcome, showManualInstructions: false };
    } catch (err) {
      console.error('Error showing install prompt:', err);
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
