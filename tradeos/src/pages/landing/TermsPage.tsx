import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-charcoal-900">
      <header className="border-b border-charcoal-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-steel-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TradeOS<span className="text-steel-400">™</span></span>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p><strong>Last Updated:</strong> January 2026</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
          <p>By using TradeOS, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">2. Service Description</h2>
          <p>TradeOS is a contractor management platform for project tracking, estimating, and business operations.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">3. Account Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account and all activities under your account.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">4. Payment Terms</h2>
          <p>Subscription fees are billed monthly. You may cancel at any time and will retain access until the end of your billing period.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">5. Limitation of Liability</h2>
          <p>TradeOS is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">6. Modifications</h2>
          <p>We may modify these terms at any time. Continued use constitutes acceptance of modified terms.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">7. Contact</h2>
          <p>For questions about these terms, contact us at support@tradeos.io.</p>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
