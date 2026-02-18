import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LogoLink } from '../../components/ui/Logo';

const SignUpPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await signUp(email, password);
      console.log('Signup result:', result);
      
      if (result?.error) {
        setError(result.error.message || 'Failed to create account');
        setIsSubmitting(false);
      } else {
        // If user data is returned, they're automatically signed in
        if (result?.data?.user) {
          console.log('User created, redirecting to onboarding');
          // Redirect to onboarding
          navigate('/onboarding');
        } else {
          console.log('No user data, showing success message');
          setSuccess(true);
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700 text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Account Created!</h2>
          <p className="text-gray-400 mb-6">
            Your account has been created successfully. You can now sign in.
          </p>
          <Link 
            to="/login"
            className="inline-block bg-steel-500 hover:bg-steel-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-12 relative">
      {/* Background Shield Watermark */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]"
      >
        <img src="/shield-icon.png" alt="" className="w-96 h-96 object-contain" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src="/shield-icon.png" alt="TradeOS" className="h-20 w-auto" />
          </Link>
        </div>

        <div className="bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700" data-testid="signup-form">
          <h2 className="text-2xl font-bold text-white mb-2 text-center italic">Start Your Free Trial</h2>
          <p className="text-gray-400 text-center mb-2">30 days free, no credit card required</p>
          <p className="text-steel-400 text-center text-sm mb-8 capitalize">
            Selected Plan: <strong>{selectedPlan}</strong>
          </p>

          {error && (
            <div className="bg-risk/20 border border-risk/50 text-risk px-4 py-3 rounded-lg mb-6 text-sm" data-testid="signup-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="you@company.com"
                  required
                  data-testid="signup-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="••••••••"
                  required
                  data-testid="signup-password-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="••••••••"
                  required
                  data-testid="signup-confirm-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              data-testid="signup-submit-btn"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-gray-500 text-xs text-center mt-6">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-steel-400 hover:text-steel-300">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-steel-400 hover:text-steel-300">Privacy Policy</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-charcoal-600 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-steel-400 hover:text-steel-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
