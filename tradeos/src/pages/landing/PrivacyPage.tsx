import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

const PrivacyPage: React.FC = () => {
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
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p><strong>Last Updated:</strong> January 2026</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email, company information, and project data you enter into TradeOS.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve TradeOS services, process payments, and communicate with you about your account.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">4. Data Retention</h2>
          <p>We retain your data for as long as your account is active. After account deletion, data is retained for 30 days before permanent deletion.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. Contact us at support@tradeos.io for any data requests.</p>
          
          <h2 className="text-2xl font-semibold text-white mt-8">6. Contact</h2>
          <p>For privacy-related questions, contact us at support@tradeos.io.</p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
