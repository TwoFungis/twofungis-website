import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import PWARedirectModal from '../../components/app/PWARedirectModal';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signInWithMagicLink } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (useMagicLink) {
        const result = await signInWithMagicLink(email);
        if (result?.error) {
          setError(result.error.message || 'Failed to send magic link');
        } else {
          setMagicLinkSent(true);
        }
      } else {
        const result = await signIn(email, password);
        if (result?.error) {
          setError(result.error.message || 'Invalid email or password');
        } else {
          // Navigate to /app - DashboardRedirect will determine the correct landing page
          navigate('/app');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#111111] rounded-2xl p-8 border border-[#1f1f1f] text-center relative">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
            <Mail className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
          <p className="text-gray-400 mb-6">
            We sent a magic link to <strong className="text-white">{email}</strong>. Click the link to sign in.
          </p>
          <button 
            onClick={() => setMagicLinkSent(false)}
            className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Premium gradient accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-red-600/8 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-600/8 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="group">
            <div className="relative">
              <img 
                src="/shield-icon.png" 
                alt="TradeOS" 
                className="h-20 w-auto transition-transform duration-300 group-hover:scale-105" 
              />
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </Link>
          
          {/* New Tagline */}
          <div className="mt-6 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Built for Builders.
            </h1>
            <p className="text-lg text-emerald-400 font-medium mt-1">
              Intelligence for Trades.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div 
          className="bg-[#111111] rounded-2xl p-8 border border-[#1f1f1f] shadow-2xl shadow-black/50" 
          data-testid="login-form"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3" 
              data-testid="login-error"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-[#0f0f0f] transition-all duration-200 outline-none"
                  placeholder="you@company.com"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            {/* Password Field */}
            {!useMagicLink && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-[#0f0f0f] transition-all duration-200 outline-none"
                    placeholder="Enter your password"
                    required={!useMagicLink}
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
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
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
              data-testid="login-submit-btn"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {useMagicLink ? 'Send Magic Link' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Magic Link Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setUseMagicLink(!useMagicLink)}
              className="text-gray-500 hover:text-emerald-400 transition-colors text-sm font-medium"
            >
              {useMagicLink ? 'Use password instead' : 'Sign in with magic link'}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-[#1f1f1f] text-center">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link 
                to="/signup" 
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Get Started Free
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <Shield className="w-4 h-4" />
            <span>Secured by TradeOS</span>
          </div>
        </div>
      </div>
      
      {/* PWA Redirect Modal */}
      <PWARedirectModal />
    </div>
  );
};

export default LoginPage;
