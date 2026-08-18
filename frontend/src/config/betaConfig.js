/**
 * Private Beta Configuration
 * ==========================
 * 
 * TradeOS Private Beta Mode
 * 
 * When PRIVATE_BETA_MODE is true:
 * - Public registration is disabled
 * - Public Stripe checkout is disabled
 * - All public access buttons show the beta modal
 * - Only authorized developers can log in
 * 
 * Set to false when ready for public launch.
 */

// Environment variable with fallback to true (beta mode by default)
export const PRIVATE_BETA_MODE = process.env.REACT_APP_PRIVATE_BETA_MODE !== 'false';

// Feature flags for granular control
export const BETA_CONFIG = {
  // Master switch for private beta mode
  enabled: PRIVATE_BETA_MODE,
  
  // Disable public registration
  allowPublicRegistration: !PRIVATE_BETA_MODE,
  
  // Disable public Stripe checkout
  allowPublicCheckout: !PRIVATE_BETA_MODE,
  
  // Show launch list signup (only if you have a form ready)
  showLaunchListSignup: false,
  
  // Marketing mode - show prices but disable purchase
  pricingPreviewMode: PRIVATE_BETA_MODE
};

export default BETA_CONFIG;
