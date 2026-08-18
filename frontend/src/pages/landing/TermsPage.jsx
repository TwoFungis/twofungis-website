import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import PRICING from '../../config/pricingConfig';

const TermsPage = () => {
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
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-lg">Last updated: January 2026</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using TradeOS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>TradeOS is a contractor operating system that provides tools for project management, estimating, change order tracking, labor cost calculation, and production logging for trades, subcontractors, and general contractors.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Account Registration</h2>
            <p>To use TradeOS, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years of age</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Subscription and Billing</h2>
            <p>TradeOS offers the following subscription plans:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Pro Plan:</strong> {PRICING.plans.PRO.displayPrice}/month - Core features for managing projects</li>
              <li><strong>Elite Plan:</strong> {PRICING.plans.ELITE.displayPrice}/month - Advanced reporting and priority support</li>
            </ul>
            <p className="mt-4">All plans include a 30-day free trial. Subscriptions auto-renew monthly unless cancelled. You may cancel at any time from your account settings.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service only for lawful purposes</li>
              <li>Not share your account with unauthorized users</li>
              <li>Maintain accurate records of your business data</li>
              <li>Not attempt to reverse engineer or compromise the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Data Ownership</h2>
            <p>You retain ownership of all data you enter into TradeOS. We will not share, sell, or use your business data for any purpose other than providing the service, unless required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Limitation of Liability</h2>
            <p>TradeOS is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for the service in the past 12 months.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Termination</h2>
            <p>We reserve the right to terminate or suspend your account for violation of these terms. Upon termination, your data will be retained for 30 days before deletion.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of significant changes via email or through the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:legal@tradeos.io" className="text-steel-400 hover:text-steel-300">legal@tradeos.io</a></p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
