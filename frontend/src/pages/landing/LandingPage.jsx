import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Zap,
  Check,
  ChevronRight,
  Shield,
  DollarSign,
  Flag,
  Receipt,
  Calculator,
  Star,
  Download
} from 'lucide-react';
import { LogoLink } from '../../components/ui/Logo';
import { useAuthStore } from '../../store/authStore';
import PWAInstallModal from '../../components/app/PWAInstallModal';
import PWAInstallService from '../../services/PWAInstallService';

// Background images
const IMAGES = {
  hero: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/s7loht5o_istockphoto-1494480364-612x612.jpg',
  features: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/oi2sq5qa_iStock-911225858-2048x1365.jpg',
  pricing: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/us5n0ifu_stock-photo-construction-site-with-crane-and-building.jpg',
  cta: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/vgvhz8qu_istockphoto-170961867-612x612.jpg'
};

const LandingPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showPWAModal, setShowPWAModal] = useState(false);

  // Handle CTA click - if logged in, show PWA prompt; otherwise go to signup
  const handleCTAClick = (e) => {
    if (user) {
      e.preventDefault();
      // User is logged in, trigger PWA install
      setShowPWAModal(true);
    }
    // If not logged in, Link will navigate to /signup naturally
  };

  const handlePWAModalClose = () => {
    setShowPWAModal(false);
    // Stay on current page after PWA modal closes
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Margin Intelligence',
      description: 'Know your real profit on every project. Live cost tracking, expense allocation, and forecast margins before you lose money.'
    },
    {
      icon: Flag,
      title: 'Milestone Discipline',
      description: 'Clear workflow from draft to paid. Auto-invoice when approved. Lock edits once invoiced. Stay in control.'
    },
    {
      icon: FileText,
      title: 'Change Order Control',
      description: 'Capture scope changes before they cost you. Track approvals, impact on margin, and bill correctly every time.'
    },
    {
      icon: Receipt,
      title: 'Invoice & Receivables',
      description: 'Create invoices from milestones or change orders. Auto-numbering, payment terms, and status tracking. Get paid faster.'
    },
    {
      icon: Calculator,
      title: 'Tax-Ready Bookkeeping',
      description: 'Categorized expenses, receipt capture, tax summary views. Quarterly projections ready for your accountant.'
    },
    {
      icon: BarChart3,
      title: 'Project Reports',
      description: 'Profit by project, revenue by month, expense breakdowns. Export to PDF. Clear data for better decisions.'
    }
  ];

  const plans = [
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For growing trades getting organized.',
      features: [
        'Unlimited projects',
        'Estimates & invoicing',
        'Expense tracking',
        'Milestone management',
        'Change order tracking',
        'Document vault (5GB)',
        'Basic reports'
      ]
    },
    {
      name: 'Elite',
      price: '$49',
      period: '/month',
      description: 'For established trades scaling up.',
      popular: true,
      features: [
        'Everything in Pro',
        'AI Copilot assistant',
        'Advanced analytics',
        'Document vault (25GB)',
        'Priority support',
        'Custom branding',
        'API access'
      ]
    }
  ];

  const testimonials = [
    {
      quote: "Finally, a tool that gets how contractors work. I know my margin before the job even starts now.",
      author: "Mike D.",
      title: "General Contractor, ON"
    },
    {
      quote: "TradeOS saved my bacon on change orders. I was leaking profit and didn't even know it.",
      author: "Sarah M.",
      title: "Renovation Specialist, BC"
    },
    {
      quote: "The milestone workflow keeps my invoicing on track. I get paid faster and nothing slips through.",
      author: "James R.",
      title: "Electrical Contractor, AB"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3">
              <img src="/shield-icon.png" alt="TradeOS" className="h-12 w-auto" />
              <span className="text-xl font-bold text-white tracking-tight hidden sm:block">
                TRADEOS<span className="text-emerald-400 align-super text-xs">™</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Reviews</a>
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Login</Link>
              <Link 
                to="/signup" 
                onClick={handleCTAClick}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
                data-testid="download-app-btn"
              >
                <Download className="w-4 h-4" />
                Get Started Free
              </Link>
            </nav>
            <div className="md:hidden flex items-center gap-2">
              <Link to="/login" className="text-gray-400 hover:text-white px-3 py-2 text-sm">Login</Link>
              <Link 
                to="/signup" 
                onClick={handleCTAClick}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${IMAGES.hero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/85 to-[#0a0a0a]"></div>
        </div>
        
        {/* Accent gradients */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-red-600/8 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="TradeOS - Built for Builders" 
                className="h-44 sm:h-56 lg:h-64 w-auto drop-shadow-2xl"
              />
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
            </div>
          </div>
          
          {/* New Tagline */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
              Built for Builders.
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-400">
              Intelligence for Trades.
            </p>
          </div>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Know your margin. Control your projects. Get paid faster.
          </p>
          
          <p className="text-base text-gray-400 mb-10 max-w-2xl mx-auto">
            The contractor operating system that gives you clarity on every project, control over every dollar, and execution that protects your profit.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              onClick={handleCTAClick}
              className="group bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              data-testid="hero-cta-btn"
            >
              <Download className="w-5 h-5" />
              Get Started Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features" 
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/10 hover:border-white/20"
            >
              See Features
            </a>
          </div>
          
          <p className="text-gray-500 text-sm mt-6">
            No credit card required. Cancel anytime.
          </p>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>$2M+ tracked</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative bg-[#0f0f0f]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{ backgroundImage: `url(${IMAGES.features})` }}
        />
        {/* Shield decoration */}
        <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none hidden lg:block">
          <img src="/shield-icon.png" alt="" className="w-32 h-32" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-[0.03] pointer-events-none hidden lg:block">
          <img src="/shield-icon.png" alt="" className="w-32 h-32" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/shield-icon.png" alt="" className="w-10 h-10 opacity-30" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Control. Clarity. Execution.
              </h2>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every feature built to protect your margin and keep your projects on track.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-[#111111] backdrop-blur-sm rounded-xl border border-[#1f1f1f] p-6 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400">
              Choose the plan that fits your operation. No hidden fees.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`bg-[#111111] rounded-xl border p-8 ${
                  plan.popular 
                    ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' 
                    : 'border-[#1f1f1f]'
                }`}
              >
                {plan.popular && (
                  <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  onClick={handleCTAClick}
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-[#1a1a1a] hover:bg-[#222222] text-white border border-[#2a2a2a]'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Get Started Free
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trusted by Canadian Trades
            </h2>
            <p className="text-gray-400">
              Hear from contractors who&apos;ve taken control of their business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-[#111111] rounded-xl border border-[#1f1f1f] p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="text-white font-medium">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${IMAGES.cta})` }}
        >
          <div className="absolute inset-0 bg-[#0a0a0a]/95"></div>
        </div>
        
        {/* Accent gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <img src="/shield-icon.png" alt="" className="w-16 h-16 mx-auto mb-6 opacity-20" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Take Control of Your Projects
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Stop losing money on jobs you thought were profitable. Start your free trial and see your true margins.
          </p>
          <Link
            to="/signup"
            onClick={handleCTAClick}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Get Started Free
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            No credit card required. Full access to all features.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src="/shield-icon.png" alt="TradeOS" className="h-10 w-auto" />
              <div>
                <span className="text-lg font-bold text-white">TRADEOS<span className="text-emerald-400 align-super text-xs">™</span></span>
                <p className="text-gray-500 text-sm">Built for Builders.</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@tradeos.ca" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} TradeOS™. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* PWA Install Modal - Shown when logged-in user clicks CTA */}
      <PWAInstallModal isOpen={showPWAModal} onClose={handlePWAModalClose} />
    </div>
  );
};

export default LandingPage;
