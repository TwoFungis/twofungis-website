import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase,
  Calculator, 
  Users,
  Calendar,
  Brain,
  FileText, 
  Receipt,
  Target,
  DollarSign,
  Store,
  UsersRound,
  BarChart3, 
  Cpu,
  Check,
  ChevronRight,
  Shield,
  Star,
  Download,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import PWAInstallModal from '../../components/app/PWAInstallModal';
import PWAInstallService from '../../services/PWAInstallService';

// Background images
const IMAGES = {
  hero: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/s7loht5o_istockphoto-1494480364-612x612.jpg',
  features: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/oi2sq5qa_iStock-911225858-2048x1365.jpg',
  cta: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/vgvhz8qu_istockphoto-170961867-612x612.jpg'
};

const LandingPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showPWAModal, setShowPWAModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    setIsAppInstalled(PWAInstallService.isInstalled());
    
    // Listen for installation events
    const unsubscribe = PWAInstallService.subscribe((event) => {
      if (event === 'installed') {
        setIsAppInstalled(true);
      } else if (event === 'prompt-available') {
        setIsAppInstalled(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const handleCTAClick = (e) => {
    if (user) {
      e.preventDefault();
      setShowPWAModal(true);
    }
  };

  const handleDownloadClick = () => {
    if (isAppInstalled) {
      // If already installed, navigate to the app
      navigate('/app/command-center');
    } else {
      setShowPWAModal(true);
    }
  };

  const handlePWAModalClose = () => {
    setShowPWAModal(false);
  };

  const features = [
    {
      icon: Briefcase,
      title: 'Project Management',
      description: 'Track every job from bid to completion. Real-time status updates, team coordination, and deadline management.'
    },
    {
      icon: Calculator,
      title: 'Commercial Estimating',
      description: 'Build accurate estimates with material costs, labor rates, and markup calculations. Win more profitable bids.'
    },
    {
      icon: Users,
      title: 'Client & CRM',
      description: 'Manage leads, client communications, and project history. Build lasting relationships that drive referrals.'
    },
    {
      icon: Calendar,
      title: 'Scheduling',
      description: 'Coordinate crews, equipment, and deliveries. Keep every project on track with visual timelines.'
    },
    {
      icon: Brain,
      title: 'Company Brain AI',
      description: 'Your AI-powered business assistant. Get insights, suggestions, and automated workflows that save hours.'
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Store contracts, permits, plans, and receipts. Everything organized, searchable, and accessible anywhere.'
    },
    {
      icon: Receipt,
      title: 'Invoicing',
      description: 'Create and send professional invoices from milestones. Auto-numbering, payment tracking, and reminders.'
    },
    {
      icon: DollarSign,
      title: 'Expenses',
      description: 'Capture receipts, categorize costs, and allocate expenses to projects. Tax-ready bookkeeping built in.'
    },
    {
      icon: Target,
      title: 'Milestones',
      description: 'Set payment milestones, track completion, and trigger invoices automatically when work is approved.'
    },
    {
      icon: Store,
      title: 'Marketplace',
      description: 'Connect with verified contractors, subcontractors, and suppliers across Canada.'
    },
    {
      icon: UsersRound,
      title: 'Team Management',
      description: 'Manage roles, permissions, and access levels. Keep your team aligned and accountable.'
    },
    {
      icon: BarChart3,
      title: 'Business Intelligence',
      description: 'Real-time dashboards, profitability reports, and cash flow forecasting. Make data-driven decisions.'
    }
  ];

  const plans = [
    {
      name: 'Pro',
      price: '$69',
      period: '/month',
      description: 'For growing contractors getting organized.',
      features: [
        'Unlimited projects',
        'Estimating & invoicing',
        'Expense tracking',
        'Milestone management',
        'Document vault (5GB)',
        'Basic reporting',
        'Email support'
      ]
    },
    {
      name: 'Elite',
      price: '$99',
      period: '/month',
      description: 'For established contractors scaling up.',
      popular: true,
      features: [
        'Everything in Pro',
        'Company Brain AI',
        'Advanced analytics',
        'Document vault (50GB)',
        'Team management',
        'Priority support',
        'API access'
      ]
    }
  ];

  const testimonials = [
    {
      quote: "TradeOS changed how we run our entire operation. We went from spreadsheets to a single system that handles everything.",
      author: "Mike D.",
      title: "General Contractor, ON"
    },
    {
      quote: "The estimating and invoicing alone saved us 20 hours a week. Now we can focus on actually building.",
      author: "Sarah M.",
      title: "Renovation Specialist, BC"
    },
    {
      quote: "Finally, software built by people who understand how contractors work. This is how we run our business now.",
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
                data-testid="get-started-btn"
              >
                Get Started Free
              </Link>
              <button 
                onClick={handleDownloadClick}
                className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-lg font-medium transition-all border border-white/10 hover:border-white/20 flex items-center gap-2"
                data-testid="download-app-btn"
              >
                {isAppInstalled ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Open App
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download App
                  </>
                )}
              </button>
            </nav>
            <div className="md:hidden flex items-center gap-2">
              <Link to="/login" className="text-gray-400 hover:text-white px-3 py-2 text-sm">Login</Link>
              <Link 
                to="/signup" 
                onClick={handleCTAClick}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5"
              >
                Get Started
              </Link>
              <button 
                onClick={handleDownloadClick}
                className="bg-white/5 text-white p-2 rounded-lg border border-white/10"
                data-testid="download-app-mobile-btn"
              >
                {isAppInstalled ? (
                  <ExternalLink className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 min-h-[90vh] flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${IMAGES.hero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/85 to-[#0a0a0a]"></div>
        </div>
        
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="TradeOS" 
                className="h-44 sm:h-56 lg:h-64 w-auto drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-emerald-400 font-medium text-lg mb-2">
              The Operating System for Canadian Contractors
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
              Run Your Entire Business.
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-400">
              One Platform.
            </p>
          </div>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Projects. Estimating. Scheduling. Invoicing. Documents. CRM. AI. 
            Everything you need to run your contracting business.
          </p>
          
          <p className="text-base text-gray-400 mb-10 max-w-2xl mx-auto">
            Stop juggling spreadsheets and disconnected tools. TradeOS brings your entire operation under one roof — 
            so you can focus on building, not paperwork.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              onClick={handleCTAClick}
              className="group bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              data-testid="hero-cta-btn"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={handleDownloadClick}
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
              data-testid="hero-download-btn"
            >
              {isAppInstalled ? (
                <>
                  <ExternalLink className="w-5 h-5" />
                  Open App
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download App
                </>
              )}
            </button>
          </div>
          
          <p className="text-gray-500 text-sm mt-6">
            No credit card required. Free 14-day trial.
          </p>
          
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
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Setup in minutes</span>
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
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-medium mb-2">Complete Platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From first estimate to final payment. TradeOS handles every aspect of your contracting operation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Command Center Highlight */}
          <div className="mt-12 bg-gradient-to-r from-emerald-500/10 via-[#111111] to-[#111111] rounded-xl border border-emerald-500/20 p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cpu className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Command Center</h3>
                <p className="text-gray-400">
                  Enterprise command center for multi-project operations. Real-time oversight, team management, 
                  and strategic business intelligence — all in one powerful dashboard.
                </p>
              </div>
              <Link 
                to="/signup"
                className="flex-shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-medium mb-2">Simple Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Plans That Scale With You
            </h2>
            <p className="text-gray-400">
              No per-user fees. No hidden costs. Just straightforward pricing.
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
            <p className="text-emerald-400 font-medium mb-2">Trusted by Contractors</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built by Builders. For Builders.
            </h2>
            <p className="text-gray-400">
              Hear from contractors who&apos;ve transformed their operations with TradeOS.
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
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <img src="/shield-icon.png" alt="" className="w-16 h-16 mx-auto mb-6 opacity-20" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Run Your Business Like a Pro?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Join hundreds of Canadian contractors who&apos;ve switched to TradeOS. 
            Start your free trial today — no credit card required.
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
                <p className="text-gray-500 text-sm">The Operating System for Contractors</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@tradeos.ca" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} TradeOS™. All rights reserved. Built in Canada.</p>
          </div>
        </div>
      </footer>

      <PWAInstallModal isOpen={showPWAModal} onClose={handlePWAModalClose} />
    </div>
  );
};

export default LandingPage;
