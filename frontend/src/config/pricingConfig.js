/**
 * TradeOS Pricing Configuration
 * ==============================
 * 
 * SINGLE SOURCE OF TRUTH for all pricing across the application.
 * 
 * APPROVED PRICES (as of August 2026):
 * - Pro: $69 CAD/month
 * - Elite: $99 CAD/month
 * - Lifetime Elite: $599 CAD one-time
 * 
 * All customer-facing components should import from this file.
 * DO NOT hardcode prices elsewhere in the application.
 */

export const PRICING = {
  currency: 'CAD',
  currencySymbol: '$',
  billingInterval: 'month',
  
  plans: {
    PRO: {
      id: 'pro',
      name: 'Pro',
      price: 69,
      displayPrice: '$69',
      period: '/month',
      description: 'For growing contractors getting organized.',
      features: [
        'Unlimited projects',
        'Estimating & invoicing',
        'Expense tracking',
        'Milestone management',
        'Document vault (5GB)',
        'Basic reporting',
        'Email support'
      ]
    },
    ELITE: {
      id: 'elite',
      name: 'Elite',
      price: 99,
      displayPrice: '$99',
      period: '/month',
      description: 'For established contractors scaling up.',
      popular: true,
      features: [
        'Everything in Pro',
        'Company Brain AI',
        'Advanced analytics',
        'Document vault (50GB)',
        'Team management',
        'Priority support',
        'API access'
      ]
    },
    LIFETIME_ELITE: {
      id: 'lifetime_elite',
      name: 'Lifetime Elite',
      price: 599,
      displayPrice: '$599',
      period: ' one-time',
      description: 'Founding member lifetime access.',
      isOneTime: true,
      features: [
        'All Elite features forever',
        'No monthly payments',
        'Founding member badge',
        'Priority roadmap input'
      ]
    }
  }
};

// Helper functions
export const getProPrice = () => PRICING.plans.PRO.price;
export const getElitePrice = () => PRICING.plans.ELITE.price;
export const getLifetimePrice = () => PRICING.plans.LIFETIME_ELITE.price;

export const formatPrice = (price, showCurrency = true) => {
  return showCurrency ? `${PRICING.currencySymbol}${price}` : `${price}`;
};

export const getPlanByName = (name) => {
  const upperName = name?.toUpperCase();
  return PRICING.plans[upperName] || null;
};

export default PRICING;
