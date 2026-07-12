import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Check, Download, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LogoLink } from '../../components/ui/Logo';
import PWAInstallModal from '../../components/app/PWAInstallModal';
import PWAInstallService from '../../services/PWAInstallService';

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const SignUpPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPWAModal, setShowPWAModal] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  // Initialize PWA service
  useEffect(() => {
    PWAInstallService.init();
  }, []);

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    setError('');
    
    // Get current URL for redirect
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/auth/google/callback`;
    
    // Redirect to Emergent Google Auth
    window.location.href = `https://auth.emergentagent.com/?redirect_url=${encodeURIComponent(redirectUrl)}`;
  };

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
          console.log('User created, showing PWA install prompt');
          // Show PWA install prompt before redirecting
          setShowPWAModal(true);
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

  const handlePWAModalClose = () => {
    setShowPWAModal(false);
    // Redirect to onboarding after PWA modal
    navigate('/onboarding');
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
      {/* PWA Install Modal */}
      <PWAInstallModal isOpen={showPWAModal} onClose={handlePWAModalClose} />
      
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
          <h2 className="text-2xl font-bold text-white mb-2 text-center italic">Download Free App</h2>
          <p className="text-gray-400 text-center mb-2">30 days free trial included</p>
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="••••••••"
                  required
                  data-testid="signup-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  data-testid="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="••••••••"
                  required
                  data-testid="signup-confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  data-testid="confirm-password-toggle"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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
                  <Download className="w-5 h-5" />
                  Create Account & Download
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal-600"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-charcoal-800 px-4 text-gray-500">or continue with</span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-3 border border-gray-200 hover:shadow-lg"
            data-testid="google-signup-btn"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                Sign up with Google
              </>
            )}
          </button>

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
