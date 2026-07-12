/**
 * TradeOS PWA Install Service v2.0
 * 
 * Provides a native-feeling installation experience across all platforms.
 * 
 * Strategy:
 * - Desktop/Android: Trigger native browser prompt immediately
 * - iOS: Present minimal visual guide (Share → Add to Home Screen)
 * - Already installed: Show "Open App" instead
 * 
 * Detection:
 * - Standalone mode (display-mode: standalone)
 * - iOS standalone (navigator.standalone)
 * - beforeinstallprompt event (indicates NOT installed)
 * - Related apps API (where available)
 */

let deferredPrompt = null;
let installPromptFired = false;
let installListeners = [];

export const PWAInstallService = {
  // Initialize event listeners
  init: () => {
    if (typeof window === 'undefined') return;
    
    // Capture the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installPromptFired = true;
      localStorage.removeItem('tradeos_pwa_installed');
      
      // Notify listeners
      PWAInstallService._notifyListeners('prompt-available');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      installPromptFired = false;
      localStorage.setItem('tradeos_pwa_installed', 'true');
      localStorage.setItem('tradeos_pwa_install_time', Date.now().toString());
      
      // Notify listeners
      PWAInstallService._notifyListeners('installed');
    });

    // Check related apps for more accurate detection
    PWAInstallService._checkRelatedApps();
  },

  // Subscribe to install events
  subscribe: (callback) => {
    installListeners.push(callback);
    return () => {
      installListeners = installListeners.filter(cb => cb !== callback);
    };
  },

  _notifyListeners: (event) => {
    installListeners.forEach(cb => cb(event));
  },

  // Check if related apps are installed (more accurate on some platforms)
  _checkRelatedApps: async () => {
    if ('getInstalledRelatedApps' in navigator) {
      try {
        const relatedApps = await navigator.getInstalledRelatedApps();
        if (relatedApps.length > 0) {
          localStorage.setItem('tradeos_pwa_installed', 'true');
        }
      } catch (e) {
        // API not supported or failed
      }
    }
  },

  // Platform detection
  getPlatform: () => {
    const ua = navigator.userAgent || navigator.vendor;
    
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      return 'ios';
    }
    if (/android/i.test(ua)) {
      return 'android';
    }
    if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(ua)) {
      return 'macos';
    }
    if (/Win32|Win64|Windows|WinCE/.test(ua)) {
      return 'windows';
    }
    return 'other';
  },

  // Check if currently running as installed PWA
  isRunningAsStandalone: () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    if (window.navigator.standalone === true) {
      return true;
    }
    // Check if opened from TWA (Trusted Web Activity)
    if (document.referrer.includes('android-app://')) {
      return true;
    }
    return false;
  },

  // Check if native install prompt is available
  isNativePromptAvailable: () => {
    return deferredPrompt !== null;
  },

  // Comprehensive installation status check
  isInstalled: () => {
    // Definitely installed if running standalone
    if (PWAInstallService.isRunningAsStandalone()) {
      return true;
    }
    
    // If prompt fired this session, NOT installed
    if (installPromptFired || deferredPrompt !== null) {
      return false;
    }
    
    // Check localStorage (less reliable, user may have uninstalled)
    return localStorage.getItem('tradeos_pwa_installed') === 'true';
  },

  // Clear installation status
  clearInstalledStatus: () => {
    localStorage.removeItem('tradeos_pwa_installed');
    localStorage.removeItem('tradeos_pwa_install_time');
    installPromptFired = false;
  },

  // Trigger native install prompt (Desktop/Android)
  triggerNativeInstall: async () => {
    if (!deferredPrompt) {
      return { success: false, reason: 'no-prompt' };
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      
      if (outcome === 'accepted') {
        installPromptFired = false;
        return { success: true, outcome: 'accepted' };
      }
      
      return { success: false, outcome: 'dismissed' };
    } catch (err) {
      return { success: false, reason: 'error', error: err };
    }
  },

  // Get the best installation method for current platform
  getInstallMethod: () => {
    const platform = PWAInstallService.getPlatform();
    
    if (PWAInstallService.isInstalled()) {
      return { method: 'already-installed', platform };
    }
    
    if (deferredPrompt) {
      return { method: 'native-prompt', platform };
    }
    
    if (platform === 'ios') {
      return { method: 'ios-manual', platform };
    }
    
    // Fallback for when prompt hasn't fired yet
    return { method: 'manual', platform };
  },

  // Get browser name for display
  getBrowserName: () => {
    const ua = navigator.userAgent;
    
    if (ua.includes('Safari') && !ua.includes('Chrome')) {
      return 'Safari';
    }
    if (ua.includes('Chrome')) {
      return 'Chrome';
    }
    if (ua.includes('Firefox')) {
      return 'Firefox';
    }
    if (ua.includes('Edg')) {
      return 'Edge';
    }
    return 'your browser';
  }
};

// Initialize on module load
if (typeof window !== 'undefined') {
  PWAInstallService.init();
}

export default PWAInstallService;
