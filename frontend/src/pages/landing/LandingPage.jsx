import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Zap,
  Check,
  ChevronRight,
  Shield,
  Users,
  Building2,
  Star
} from 'lucide-react';
import { Logo, LogoLink } from '../../components/ui/Logo';

// Background images - Professional construction imagery
const IMAGES = {
  hero: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/hxw9loph_download.jpg', // Hardhat & handshake
  features: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/gbtzud36_images%20%285%29.jpg', // Wood framing with sun
  pricing: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/xyykd9dt_images%20%282%29.jpg', // Building under construction with crane
  cta: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/ylasd6tj_istockphoto-170961867-612x612.jpg', // Two workers discussing
  testimonials: 'https://customer-assets.emergentagent.com/job_a1f6d561-54ac-4bcc-bc40-125db753bb76/artifacts/zhomofq8_images.jpg' // Contractor with blueprints
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-charcoal-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <LogoLink size="sm" showText={false} />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Reviews</a>
              <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">FAQ</a>
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Login</Link>
              <Link 
                to="/signup" 
                className="bg-steel-500 hover:bg-steel-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-steel-500/25"
                data-testid="start-trial-btn"
              >
                Start Free Trial
              </Link>
            </nav>
            <Link 
              to="/signup" 
              className="md:hidden bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Start Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${IMAGES.hero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/80 via-charcoal-900/85 to-charcoal-900"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Logo centered */}
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.png" 
              alt="TradeOS - Built for Builders" 
              className="h-36 sm:h-44 lg:h-52 w-auto drop-shadow-2xl"
            />
          </div>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            The contractor operating system that helps trades, subs, and small GCs know their margin, control change orders, and run profitable projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="group bg-steel-500 hover:bg-steel-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-steel-500/30 flex items-center justify-center gap-2"
              data-testid="hero-cta-btn"
            >
              Start 7-Day Free Trial
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features" 
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/10 hover:border-white/20 backdrop-blur-sm"
            >
              See Features
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-8">No credit card required • Cancel anytime</p>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-12 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>500+ contractors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props / Features */}
      <section id="features" className="relative py-24 px-4">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.features})` }}
        >
          <div className="absolute inset-0 bg-charcoal-800/90"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm font-medium mb-4">
              FEATURES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Run Your Trade Like a Business
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Everything you need to quote accurately, track profitability, and get paid for every change order.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: 'Know Your Margin', desc: 'Real-time profit tracking on every project. No surprises at the end.', color: 'from-emerald-500/20 to-transparent' },
              { icon: FileText, title: 'Control Change Orders', desc: 'Track, approve, and invoice COs before they slip through the cracks.', color: 'from-amber-500/20 to-transparent' },
              { icon: BarChart3, title: 'Track Production', desc: 'Daily logs that show your crew efficiency and project progress.', color: 'from-blue-500/20 to-transparent' },
              { icon: Zap, title: 'Quote Faster', desc: 'Build professional quotes in minutes with your scope library.', color: 'from-purple-500/20 to-transparent' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group relative bg-charcoal-700/50 backdrop-blur-sm rounded-2xl p-6 border border-charcoal-600/50 hover:border-steel-500/50 transition-all hover:-translate-y-1 hover:shadow-xl"
                data-testid={`feature-card-${i}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-steel-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-steel-500/30 transition-colors">
                    <item.icon className="w-6 h-6 text-steel-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm font-medium mb-4">
              WHO IT'S FOR
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Built for Your Trade
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Whether you're a finishing carpenter, electrician, plumber, or general contractor — TradeOS speaks your language.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Subcontractors', desc: 'Track costs, manage COs, and know your true margin on every job.' },
              { icon: Building2, title: 'Trade Contractors', desc: 'Run multiple projects, crews, and quotes from one dashboard.' },
              { icon: Shield, title: 'Small GCs', desc: 'Manage subs, track production, and deliver projects profitably.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-gradient-to-b from-charcoal-800 to-charcoal-800/50 border border-charcoal-700 hover:border-charcoal-600 transition-colors">
                <div className="w-20 h-20 bg-gradient-to-br from-steel-500/20 to-steel-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-10 h-10 text-steel-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-24 px-4">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.pricing})` }}
        >
          <div className="absolute inset-0 bg-charcoal-800/88"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm font-medium mb-4">
              PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 text-lg">
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pro Plan */}
            <div className="bg-charcoal-700/50 backdrop-blur-sm rounded-3xl p-8 border border-charcoal-600/50 hover:border-charcoal-500/50 transition-all" data-testid="pro-plan-card">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">$39</span>
                  <span className="text-gray-400 text-lg">/month</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">Everything you need to run your trade</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited Projects',
                  'Quote Builder + PDF Export',
                  'Change Order Manager',
                  'Labor Cost Engine',
                  'Production Logs',
                  'Dashboard Analytics',
                  'Email Support',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup?plan=pro" 
                className="block w-full bg-charcoal-600 hover:bg-charcoal-500 text-white py-4 rounded-xl font-semibold text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="relative bg-gradient-to-b from-steel-500/10 to-steel-500/5 backdrop-blur-sm rounded-3xl p-8 border-2 border-steel-500/50 hover:border-steel-500 transition-all" data-testid="elite-plan-card">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-steel-500 to-steel-400 text-white text-sm font-semibold px-5 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Elite</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">$59</span>
                  <span className="text-gray-400 text-lg">/month</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">For contractors who want deeper insights</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Pro',
                  'Advanced Reports & KPIs',
                  'Monthly Performance Summaries',
                  'Overrun Warnings',
                  'Production Analytics',
                  'Priority Support',
                  'Early Access to Features',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-steel-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-steel-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup?plan=elite" 
                className="block w-full bg-steel-500 hover:bg-steel-400 text-white py-4 rounded-xl font-semibold text-center transition-all hover:shadow-lg hover:shadow-steel-500/25"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-24 px-4">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.testimonials})` }}
        >
          <div className="absolute inset-0 bg-charcoal-900/88"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm font-medium mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Trusted by Contractors
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "Finally, software that understands how trades actually work. My margins are up 12% since using TradeOS.", name: "Mike R.", role: "Finishing Contractor", rating: 5 },
              { quote: "The change order tracking alone paid for itself in the first month. No more unpaid extras.", name: "Sarah T.", role: "Electrical Sub", rating: 5 },
              { quote: "I can quote a job in 10 minutes now instead of 2 hours. Game changer for our estimating.", name: "Dave K.", role: "Small GC", rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="bg-charcoal-800/50 backdrop-blur-sm rounded-2xl p-8 border border-charcoal-700/50 hover:border-charcoal-600/50 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 bg-charcoal-800">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm font-medium mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Do I need any training to use TradeOS?", a: "No. TradeOS is designed for contractors, not accountants. If you can fill out a timesheet, you can use TradeOS. Most users are up and running in under 10 minutes." },
              { q: "Can I use it on my phone?", a: "Absolutely. TradeOS is mobile-first. Enter daily logs, check project status, and send quotes right from your phone on the job site." },
              { q: "What if I need to cancel?", a: "Cancel anytime from your account settings. No contracts, no cancellation fees. Your data stays available for 30 days after cancellation." },
              { q: "Is my data secure?", a: "Yes. We use bank-level encryption and your data is stored securely. Each user only sees their own projects and information." },
              { q: "Can I import existing projects?", a: "Yes. You can manually add existing projects or contact support for help migrating larger datasets." },
              { q: "What's the difference between Pro and Elite?", a: "Pro includes all core features for running projects. Elite adds advanced reporting, KPI tracking, and priority support for contractors who want deeper insights." },
            ].map((item, i) => (
              <div key={i} className="bg-charcoal-700/50 rounded-2xl p-6 border border-charcoal-600/50 hover:border-charcoal-500/50 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3">{item.q}</h3>
                <p className="text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.cta})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/95 to-charcoal-900"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Run Your Trade Profitably?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join contractors who are taking control of their margins with TradeOS.
          </p>
          <Link 
            to="/signup" 
            className="group inline-flex items-center gap-2 bg-steel-500 hover:bg-steel-400 text-white px-10 py-5 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-steel-500/30"
          >
            Start Your Free Trial
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-gray-500 text-sm mt-6">No credit card required • 7-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-charcoal-900 border-t border-charcoal-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo size="sm" showText={false} />
            <div className="flex items-center gap-8 text-gray-400 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="mailto:info@twofungis.ca" className="hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-gray-600 text-sm">© 2026 TradeOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
