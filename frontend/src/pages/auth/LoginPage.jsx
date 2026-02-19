import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LogoLink } from '../../components/ui/Logo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          navigate('/app/dashboard');
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
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700 text-center">
          <div className="w-16 h-16 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-steel-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
          <p className="text-gray-400 mb-6">
            We sent a magic link to <strong className="text-white">{email}</strong>. Click the link to sign in.
          </p>
          <button 
            onClick={() => setMagicLinkSent(false)}
            className="text-steel-400 hover:text-steel-300 transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 relative">
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

        <div className="bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700" data-testid="login-form">
          <h2 className="text-2xl font-bold text-white mb-1 text-center italic">Welcome Back</h2>
          <p className="text-gray-400 text-center text-sm mb-1">Sign in to your account</p>
          <p className="text-steel-400 text-center text-xs font-medium mb-6">Built for Builders. Financial intelligence for small trades.</p>

          {error && (
            <div className="bg-risk/20 border border-risk/50 text-risk px-4 py-3 rounded-lg mb-6 text-sm" data-testid="login-error">
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
                  data-testid="login-email-input"
                />
              </div>
            </div>

            {!useMagicLink && (
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
                    required={!useMagicLink}
                    data-testid="login-password-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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

          <div className="mt-6 text-center">
            <button
              onClick={() => setUseMagicLink(!useMagicLink)}
              className="text-steel-400 hover:text-steel-300 transition-colors text-sm"
            >
              {useMagicLink ? 'Use password instead' : 'Sign in with magic link'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-charcoal-600 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-steel-400 hover:text-steel-300 font-medium transition-colors">
                Start free trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
