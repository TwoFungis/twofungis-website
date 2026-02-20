/**
 * TradeOS Service Worker Update Service
 * Handles checking for updates and managing service worker lifecycle
 */

let registration = null;
let updateAvailable = false;

export const ServiceWorkerUpdateService = {
  // Initialize and register service worker
  init: async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return { supported: false };
    }

    try {
      // Register service worker
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service worker update found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            updateAvailable = true;
            console.log('New service worker installed, update available');
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      });

      // Check if there's already a waiting worker
      if (registration.waiting) {
        updateAvailable = true;
        window.dispatchEvent(new CustomEvent('sw-update-available'));
      }

      // Handle controller change (after skipWaiting)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Controller changed, reloading...');
        window.location.reload();
      });

      return { supported: true, registration };
    } catch (err) {
      console.error('Service worker registration failed:', err);
      return { supported: true, error: err.message };
    }
  },

  // Check for updates manually
  checkForUpdate: async () => {
    if (!registration) {
      const result = await ServiceWorkerUpdateService.init();
      if (!result.supported || result.error) {
        return { updateAvailable: false, error: 'Service worker not available' };
      }
    }

    try {
      // Force check for updates
      await registration.update();
      
      // Check if there's a waiting worker
      if (registration.waiting) {
        updateAvailable = true;
        return { updateAvailable: true };
      }

      // Check if there's an installing worker
      if (registration.installing) {
        return { updateAvailable: true, installing: true };
      }

      return { updateAvailable: false };
    } catch (err) {
      console.error('Error checking for updates:', err);
      return { updateAvailable: false, error: err.message };
    }
  },

  // Apply the update (skip waiting)
  applyUpdate: () => {
    if (!registration || !registration.waiting) {
      console.log('No waiting service worker to activate');
      return false;
    }

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  },

  // Get current status
  getStatus: () => {
    return {
      supported: 'serviceWorker' in navigator,
      registered: !!registration,
      updateAvailable,
      active: registration?.active ? true : false,
      waiting: registration?.waiting ? true : false,
      installing: registration?.installing ? true : false
    };
  },

  // Get version info (if available in service worker)
  getVersionInfo: async () => {
    if (!navigator.serviceWorker.controller) {
      return { version: 'Unknown', buildDate: null };
    }

    try {
      // Create a message channel for the response
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );

        // Timeout after 1 second
        setTimeout(() => {
          resolve({ version: 'Current', buildDate: new Date().toISOString() });
        }, 1000);
      });
    } catch (err) {
      return { version: 'Current', buildDate: null };
    }
  }
};

// Auto-initialize when module loads
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Delay init to not block page load
  window.addEventListener('load', () => {
    ServiceWorkerUpdateService.init();
  });
}

export default ServiceWorkerUpdateService;
