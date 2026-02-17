import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

export const stripePromise = loadStripe(stripePublicKey);

export const PRICING = {
  pro: {
    name: 'Pro',
    price: 39,
    priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID || '',
    features: [
      'Unlimited Projects',
      'Quote Builder with PDF Export',
      'Change Order Manager',
      'Labor Cost Engine',
      'Production Logs',
      'Dashboard Analytics',
      'Email Support',
    ],
  },
  elite: {
    name: 'Elite',
    price: 59,
    priceId: process.env.REACT_APP_STRIPE_ELITE_PRICE_ID || '',
    features: [
      'Everything in Pro',
      'Advanced Reports & KPIs',
      'Monthly Performance Summaries',
      'Overrun Warnings',
      'Production Analytics',
      'Priority Support',
      'Early Access to Features',
    ],
  },
};

export const createCheckoutSession = async (priceId: string, customerId?: string) => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, customerId }),
  });
  return response.json();
};

export const createPortalSession = async (customerId: string) => {
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  return response.json();
};
