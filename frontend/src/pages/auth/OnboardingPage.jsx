import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, User, Briefcase, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../../components/ui/Logo';

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    trade_type: '',
    region: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const { updateProfile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const tradeTypes = [
    'Finishing Carpentry',
    'Electrical',
    'Plumbing',
    'HVAC',
    'Drywall',
    'Painting',
    'Flooring',
    'Roofing',
    'Concrete',
    'General Contractor',
    'Other'
  ];

  const regions = [
    'British Columbia',
    'Alberta',
    'Saskatchewan',
    'Manitoba',
    'Ontario',
    'Quebec',
    'Nova Scotia',
    'New Brunswick',
    'Newfoundland',
    'PEI',
    'Northwest Territories',
    'Yukon',
    'Nunavut',
    'Other'
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.company_name)) {
      setError('Please fill in all fields');
      return;
    }
    if (step === 2 && !formData.trade_type) {
      setError('Please select your trade');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!formData.region) {
      setError('Please select your region');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await updateProfile({
        ...formData,
        user_role: 'contractor', // Set user as contractor
        onboarding_completed: true
      });
      if (result?.error) {
        // Handle specific errors with user-friendly messages
        const errorMsg = result.error.message || '';
        if (errorMsg.includes('Session expired') || errorMsg.includes('authenticated')) {
          setError('Your session has expired. Please refresh the page and try again.');
        } else if (errorMsg.includes('body stream') || errorMsg.includes('Connection error')) {
          // Retry once on connection errors
          console.log('Connection error, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await updateProfile({
            ...formData,
            user_role: 'contractor',
            onboarding_completed: true
          });
          if (retryResult?.error) {
            setError('Connection issue. Please check your internet and try again.');
          } else {
            navigate('/app/dashboard');
            return;
          }
        } else {
          setError(errorMsg || 'Failed to save profile');
        }
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      if (err.message?.includes('body stream')) {
        setError('Connection issue. Please check your internet and try again.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="flex justify-center mb-8">
          <Logo size="lg" showText={false} />
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s < step ? 'bg-success text-white' : 
                s === step ? 'bg-steel-500 text-white' : 
                'bg-charcoal-700 text-gray-500'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 ${s < step ? 'bg-success' : 'bg-charcoal-700'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700" data-testid="onboarding-form">
          {error && (
            <div className="bg-risk/20 border border-risk/50 text-risk px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-steel-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Let's get started</h2>
                <p className="text-gray-400">Tell us about yourself</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="John Smith"
                  data-testid="onboarding-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="Smith Construction Ltd."
                  data-testid="onboarding-company-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="(555) 123-4567"
                  data-testid="onboarding-phone-input"
                />
              </div>
            </div>
          )}

          {/* Step 2: Trade Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-steel-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">What's your trade?</h2>
                <p className="text-gray-400">This helps us customize your experience</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tradeTypes.map((trade) => (
                  <button
                    key={trade}
                    onClick={() => setFormData({ ...formData, trade_type: trade })}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      formData.trade_type === trade 
                        ? 'bg-steel-500/20 border-steel-500 text-white' 
                        : 'bg-charcoal-700 border-charcoal-600 text-gray-400 hover:border-charcoal-500'
                    }`}
                    data-testid={`trade-option-${trade.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Region */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-steel-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Where do you operate?</h2>
                <p className="text-gray-400">Select your primary region</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setFormData({ ...formData, region })}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      formData.region === region 
                        ? 'bg-steel-500/20 border-steel-500 text-white' 
                        : 'bg-charcoal-700 border-charcoal-600 text-gray-400 hover:border-charcoal-500'
                    }`}
                    data-testid={`region-option-${region.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                data-testid="onboarding-next-btn"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                data-testid="onboarding-complete-btn"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
