import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-charcoal-900">
      <header className="bg-charcoal-800 border-b border-charcoal-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-steel-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TradeOS<span className="text-steel-400">™</span></span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-lg">Last updated: January 2026</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>TradeOS collects information you provide directly, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, company name)</li>
              <li>Project and business data you enter into the platform</li>
              <li>Payment information processed securely through Stripe</li>
              <li>Usage data and analytics to improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain the TradeOS service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important service updates and notifications</li>
              <li>Improve and personalize your experience</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data is encrypted in transit and at rest</li>
              <li>Access controls and authentication protocols</li>
              <li>Regular security audits and updates</li>
              <li>Secure cloud infrastructure with Supabase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Upon account deletion or cancellation, your data will be retained for 30 days before permanent deletion, allowing you to reactivate if needed.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Contact Us</h2>
            <p>For any privacy-related questions, contact us at <a href="mailto:privacy@tradeos.io" className="text-steel-400 hover:text-steel-300">privacy@tradeos.io</a></p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
