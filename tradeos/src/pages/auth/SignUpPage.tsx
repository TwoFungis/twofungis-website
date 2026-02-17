import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const SignUpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { signUp, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 bg-steel-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">TradeOS<span className="text-steel-400">™</span></span>
        </Link>

        <div className="bg-charcoal-800 rounded-2xl p-8 border border-charcoal-700">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Start Your Free Trial</h2>
          <p className="text-gray-400 text-center mb-2">7 days free, no credit card required</p>
          
          <div className="bg-steel-500/10 border border-steel-500/30 rounded-lg p-3 mb-8 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-steel-400" />
            <span className="text-steel-400 text-sm font-medium">
              {selectedPlan === 'elite' ? 'Elite' : 'Pro'} Plan Selected
            </span>
          </div>

          {error && (
            <div className="bg-risk/20 border border-risk/50 text-risk px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-steel-500 focus:ring-1 focus:ring-steel-500 transition-colors"
                  placeholder="John Smith"
                  required
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
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
            <Link to="/terms" className="text-steel-400 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-steel-400 hover:underline">Privacy Policy</Link>
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
