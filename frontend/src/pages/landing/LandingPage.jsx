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
  Building2
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-charcoal-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal-900/95 backdrop-blur-sm border-b border-charcoal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-steel-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TradeOS<span className="text-steel-400">™</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
              <Link 
                to="/signup" 
                className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            TradeOS<span className="text-steel-400">™</span>
          </h1>
          <p className="text-2xl sm:text-3xl text-steel-400 font-semibold mb-8">
            Built for Builders.
          </p>
          <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            The contractor operating system that helps trades, subs, and small GCs know their margin, control change orders, and run profitable projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/signup" 
              className="bg-steel-500 hover:bg-steel-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              data-testid="hero-cta-btn"
            >
              Start 7-Day Free Trial
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a 
              href="#features" 
              className="bg-charcoal-700 hover:bg-charcoal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors border border-charcoal-600"
            >
              See Features
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-6">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Value Props */}
      <section id="features" className="py-20 px-4 bg-charcoal-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Run Your Trade Like a Business
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to quote accurately, track profitability, and get paid for every change order.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, title: 'Know Your Margin', desc: 'Real-time profit tracking on every project. No surprises at the end.' },
              { icon: FileText, title: 'Control Change Orders', desc: 'Track, approve, and invoice COs before they slip through the cracks.' },
              { icon: BarChart3, title: 'Track Production', desc: 'Daily logs that show your crew efficiency and project progress.' },
              { icon: Zap, title: 'Quote Faster', desc: 'Build professional quotes in minutes with your scope library.' },
            ].map((item, i) => (
              <div key={i} className="bg-charcoal-700 rounded-xl p-6 border border-charcoal-600" data-testid={`feature-card-${i}`}>
                <div className="w-12 h-12 bg-steel-500/20 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-steel-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Built for Your Trade
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Whether you're a finishing carpenter, electrician, plumber, or general contractor — TradeOS speaks your language.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Subcontractors', desc: 'Track costs, manage COs, and know your true margin on every job.' },
              { icon: Building2, title: 'Trade Contractors', desc: 'Run multiple projects, crews, and quotes from one dashboard.' },
              { icon: Shield, title: 'Small GCs', desc: 'Manage subs, track production, and deliver projects profitably.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-xl bg-charcoal-800 border border-charcoal-700">
                <div className="w-16 h-16 bg-steel-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-steel-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-charcoal-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Start with a 7-day free trial. No credit card required.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pro Plan */}
            <div className="bg-charcoal-700 rounded-2xl p-8 border border-charcoal-600" data-testid="pro-plan-card">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$39</span>
                  <span className="text-gray-400">/month</span>
                </div>
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
                    <Check className="w-5 h-5 text-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup?plan=pro" 
                className="block w-full bg-charcoal-600 hover:bg-charcoal-500 text-white py-3 rounded-lg font-semibold text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-steel-500/10 rounded-2xl p-8 border-2 border-steel-500 relative" data-testid="elite-plan-card">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-steel-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Elite</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$59</span>
                  <span className="text-gray-400">/month</span>
                </div>
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
                    <Check className="w-5 h-5 text-steel-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup?plan=elite" 
                className="block w-full bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-lg font-semibold text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            Trusted by Contractors
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "Finally, software that understands how trades actually work. My margins are up 12% since using TradeOS.", name: "Mike R.", role: "Finishing Contractor" },
              { quote: "The change order tracking alone paid for itself in the first month. No more unpaid extras.", name: "Sarah T.", role: "Electrical Sub" },
              { quote: "I can quote a job in 10 minutes now instead of 2 hours. Game changer for our estimating.", name: "Dave K.", role: "Small GC" },
            ].map((testimonial, i) => (
              <div key={i} className="bg-charcoal-800 rounded-xl p-6 border border-charcoal-700">
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
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
      <section id="faq" className="py-20 px-4 bg-charcoal-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              { q: "Do I need any training to use TradeOS?", a: "No. TradeOS is designed for contractors, not accountants. If you can fill out a timesheet, you can use TradeOS. Most users are up and running in under 10 minutes." },
              { q: "Can I use it on my phone?", a: "Absolutely. TradeOS is mobile-first. Enter daily logs, check project status, and send quotes right from your phone on the job site." },
              { q: "What if I need to cancel?", a: "Cancel anytime from your account settings. No contracts, no cancellation fees. Your data stays available for 30 days after cancellation." },
              { q: "Is my data secure?", a: "Yes. We use bank-level encryption and your data is stored securely. Each user only sees their own projects and information." },
              { q: "Can I import existing projects?", a: "Yes. You can manually add existing projects or contact support for help migrating larger datasets." },
              { q: "What's the difference between Pro and Elite?", a: "Pro includes all core features for running projects. Elite adds advanced reporting, KPI tracking, and priority support for contractors who want deeper insights." },
            ].map((item, i) => (
              <div key={i} className="bg-charcoal-700 rounded-xl p-6 border border-charcoal-600">
                <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Run Your Trade Profitably?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join contractors who are taking control of their margins with TradeOS.
          </p>
          <Link 
            to="/signup" 
            className="inline-flex items-center gap-2 bg-steel-500 hover:bg-steel-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Start Your Free Trial
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-charcoal-700">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-steel-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TradeOS<span className="text-steel-400">™</span></span>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="mailto:support@tradeos.io" className="hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-gray-500 text-sm">© 2026 TradeOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
