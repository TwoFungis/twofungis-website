import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Check, Hammer, DollarSign, ListChecks } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const TRADE_TYPES = [
  'Finishing Carpentry',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Drywall',
  'Painting',
  'Flooring',
  'Roofing',
  'General Contractor',
  'Other',
];

const REGIONS = [
  'Coastal BC',
  'Vancouver Island',
  'Okanagan',
  'Fraser Valley',
  'Interior BC',
  'Northern BC',
  'Alberta',
  'Ontario',
  'Other',
];

const DEFAULT_SCOPE_ITEMS = [
  { scope_item: 'Base & Casing', unit: 'LF', default_low: 3.50, default_high: 6.00 },
  { scope_item: 'Door Installation', unit: 'EA', default_low: 85, default_high: 150 },
  { scope_item: 'Hardware Install', unit: 'EA', default_low: 25, default_high: 45 },
  { scope_item: 'Crown Moulding', unit: 'LF', default_low: 5.00, default_high: 12.00 },
  { scope_item: 'Window Trim', unit: 'EA', default_low: 45, default_high: 85 },
  { scope_item: 'Closet Shelving', unit: 'LF', default_low: 8.00, default_high: 15.00 },
  { scope_item: 'Stair Rails', unit: 'LF', default_low: 35, default_high: 75 },
  { scope_item: 'Cabinet Installation', unit: 'EA', default_low: 65, default_high: 120 },
];

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [tradeType, setTradeType] = useState('');
  const [region, setRegion] = useState('');
  const [laborProfile, setLaborProfile] = useState({
    name: 'Default',
    wage: 35,
    cpp_ei_pct: 5.95,
    worksafe_pct: 2.5,
    vacation_pct: 4,
    fuel_per_hr: 3,
    tool_wear_per_hr: 2,
    insurance_per_hr: 1.5,
    overhead_pct: 15,
    target_margin_pct: 20,
  });
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Create user profile
      await updateProfile({
        user_id: user.id,
        name: companyName,
        company_name: companyName,
        trade_type: tradeType,
        region: region,
        phone: '',
        onboarding_completed: true,
        subscription_tier: 'pro',
        stripe_customer_id: null,
      });

      // Create labor profile
      await supabase.from('labor_profiles').insert({
        user_id: user.id,
        ...laborProfile,
      });

      // Create default scope items
      const scopeItems = DEFAULT_SCOPE_ITEMS.map(item => ({
        user_id: user.id,
        ...item,
        pricing_method: 'range',
        notes: '',
      }));
      await supabase.from('scope_library').insert(scopeItems);

      navigate('/app/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 bg-steel-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">TradeOS<span className="text-steel-400">™</span></span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                s < step ? 'bg-success text-white' :
                s === step ? 'bg-steel-500 text-white' :
                'bg-charcoal-700 text-gray-500'
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-success' : 'bg-charcoal-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-steel-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-steel-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Company Info</h2>
                  <p className="text-gray-400 text-sm">Tell us about your business</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                    placeholder="Your Company Ltd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  >
                    <option value="">Select your trade</option>
                    {TRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                  >
                    <option value="">Select your region</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!companyName || !tradeType || !region}
                className="w-full mt-8 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-steel-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-steel-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Labor Costs</h2>
                  <p className="text-gray-400 text-sm">Set your base labor profile</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Wage ($)</label>
                  <input
                    type="number"
                    value={laborProfile.wage}
                    onChange={(e) => setLaborProfile({...laborProfile, wage: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">CPP/EI (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborProfile.cpp_ei_pct}
                    onChange={(e) => setLaborProfile({...laborProfile, cpp_ei_pct: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">WorkSafe (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborProfile.worksafe_pct}
                    onChange={(e) => setLaborProfile({...laborProfile, worksafe_pct: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vacation (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborProfile.vacation_pct}
                    onChange={(e) => setLaborProfile({...laborProfile, vacation_pct: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Margin (%)</label>
                  <input
                    type="number"
                    value={laborProfile.target_margin_pct}
                    onChange={(e) => setLaborProfile({...laborProfile, target_margin_pct: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Overhead (%)</label>
                  <input
                    type="number"
                    value={laborProfile.overhead_pct}
                    onChange={(e) => setLaborProfile({...laborProfile, overhead_pct: parseFloat(e.target.value) || 0})}
                    className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white focus:border-steel-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-steel-500/20 rounded-lg flex items-center justify-center">
                  <ListChecks className="w-6 h-6 text-steel-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Scope Library</h2>
                  <p className="text-gray-400 text-sm">We'll add default items to get you started</p>
                </div>
              </div>

              <div className="bg-charcoal-700 rounded-lg p-4 mb-6">
                <p className="text-gray-300 text-sm mb-4">
                  We'll create a starter scope library with common finishing items. You can edit these anytime.
                </p>
                <div className="space-y-2">
                  {DEFAULT_SCOPE_ITEMS.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.scope_item}</span>
                      <span className="text-gray-300">${item.default_low} - ${item.default_high}/{item.unit}</span>
                    </div>
                  ))}
                  <p className="text-gray-500 text-xs">+ {DEFAULT_SCOPE_ITEMS.length - 5} more items</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
