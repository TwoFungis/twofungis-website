import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, MapPin, Briefcase, Shield, ShieldCheck, Star, ChevronDown, Users, Filter, X, ExternalLink,
  Phone, Mail, Globe, ArrowLeft, Calendar, DollarSign, Clock, MessageSquare, Send, Wrench, Building2,
  UserPlus, CheckCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Verification Badge Component
const VerificationBadge = ({ level, size = 'md' }) => {
  const badges = {
    0: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Not Verified', icon: Shield },
    1: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Identity', icon: ShieldCheck },
    2: { color: 'text-teal-400', bg: 'bg-teal-500/20', label: 'Trade', icon: ShieldCheck },
    3: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Insured', icon: ShieldCheck },
    4: { color: 'text-warning', bg: 'bg-warning/20', label: 'Verified', icon: ShieldCheck }
  };

  const badge = badges[level] || badges[0];
  const Icon = badge.icon;
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className="group/badge relative inline-flex items-center pointer-events-none">
      <div className={`${badge.bg} ${badge.color} p-1 rounded-full`}>
        <Icon className={sizeClasses} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-charcoal-900 text-white text-xs rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {level === 4 ? 'TradeOS Verified Contractor' : `Level ${level}: ${badge.label} Verified`}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-charcoal-900" />
      </div>
    </div>
  );
};

// Contractor Card Component
const ContractorCard = ({ contractor, onClick }) => {
  const { 
    company_name, 
    trade, 
    region, 
    bio, 
    years_experience, 
    accepting_work, 
    verification_level, 
    rating_average, 
    rating_count,
    profile_image_url 
  } = contractor;

  return (
    <div 
      onClick={onClick}
      className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-5 hover:border-steel-500/50 transition-all hover:shadow-lg hover:shadow-steel-500/10 cursor-pointer group"
      data-testid="contractor-card"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-charcoal-700 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 ring-steel-500/50 transition-all">
          {profile_image_url ? (
            <img src={profile_image_url} alt={company_name} className="w-full h-full object-cover" />
          ) : (
            <Briefcase className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-steel-400 transition-colors">{company_name}</h3>
            <VerificationBadge level={verification_level} size="sm" />
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {trade}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {region}
            </span>
          </div>

          {bio && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-3">{bio}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              {rating_count > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {rating_average.toFixed(1)} ({rating_count})
                </span>
              )}
              {years_experience > 0 && (
                <span className="text-gray-500">{years_experience}+ years</span>
              )}
            </div>
            
            {accepting_work ? (
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">Accepting Work</span>
            ) : (
              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">Not Available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Contractor Detail Modal/View
const ContractorDetail = ({ contractor, onClose, onConnect }) => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    project_type: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const handleContact = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const response = await fetch(`${API_URL}/api/marketplace/contractor/${contractor.user_id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: contractor.user_id,
          ...contactForm
        })
      });
      
      if (response.ok) {
        setSent(true);
      }
    } catch (error) {
      console.error('Error sending contact:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 w-full max-w-4xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-charcoal-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-charcoal-700 flex items-center justify-center overflow-hidden">
                {contractor.profile_image_url ? (
                  <img src={contractor.profile_image_url} alt={contractor.company_name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">{contractor.company_name}</h2>
                  <VerificationBadge level={contractor.verification_level} size="md" />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {contractor.trade}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {contractor.region}
                  </span>
                  {contractor.years_experience > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {contractor.years_experience}+ years
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {contractor.rating_count > 0 && (
                    <span className="flex items-center gap-1 text-warning text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      {contractor.rating_average?.toFixed(1)} ({contractor.rating_count} reviews)
                    </span>
                  )}
                  {contractor.accepting_work ? (
                    <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">Accepting Work</span>
                  ) : (
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">Not Available</span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-charcoal-700 rounded-lg transition-colors"
              data-testid="close-contractor-detail"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-charcoal-700">
          {['about', 'services', 'jobs', 'contact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? 'text-steel-400 border-b-2 border-steel-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {contractor.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-300 leading-relaxed">{contractor.bio}</p>
                </div>
              )}
              
              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                {contractor.phone_public && (
                  <a 
                    href={`tel:${contractor.phone_public}`}
                    className="flex items-center gap-3 p-4 bg-charcoal-700/50 rounded-xl hover:bg-charcoal-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-steel-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-white font-medium">{contractor.phone_public}</p>
                    </div>
                  </a>
                )}
                {contractor.email_public && (
                  <a 
                    href={`mailto:${contractor.email_public}`}
                    className="flex items-center gap-3 p-4 bg-charcoal-700/50 rounded-xl hover:bg-charcoal-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-steel-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-white font-medium">{contractor.email_public}</p>
                    </div>
                  </a>
                )}
                {contractor.website_url && (
                  <a 
                    href={contractor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-charcoal-700/50 rounded-xl hover:bg-charcoal-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-steel-500/20 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-steel-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      <p className="text-white font-medium truncate">{contractor.website_url.replace(/^https?:\/\//, '')}</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Connect Button */}
              <button
                onClick={onConnect}
                className="w-full bg-steel-500/20 hover:bg-steel-500/30 text-steel-400 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Connect with {contractor.company_name}
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Services Offered</h3>
              {contractor.services && contractor.services.length > 0 ? (
                contractor.services.map((service, index) => (
                  <div key={service.id || index} className="bg-charcoal-700/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{service.title}</h4>
                      {service.price_type === 'fixed' && service.price_amount && (
                        <span className="text-success font-medium">${service.price_amount}</span>
                      )}
                      {service.price_type === 'hourly' && service.price_amount && (
                        <span className="text-success font-medium">${service.price_amount}/hr</span>
                      )}
                      {service.price_type === 'quote' && (
                        <span className="text-gray-400 text-sm">Get Quote</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{service.description}</p>
                    {service.service_areas && service.service_areas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {service.service_areas.map((area, i) => (
                          <span key={i} className="text-xs bg-charcoal-600 text-gray-300 px-2 py-1 rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-charcoal-700/30 rounded-xl">
                  <Wrench className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No services listed yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Open Job Posts</h3>
              {contractor.job_posts && contractor.job_posts.length > 0 ? (
                contractor.job_posts.map((job, index) => (
                  <div key={job.id || index} className="bg-charcoal-700/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{job.title}</h4>
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full capitalize">{job.status}</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.trade_required}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      {(job.budget_min || job.budget_max) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.budget_min && job.budget_max 
                            ? `$${job.budget_min.toLocaleString()} - $${job.budget_max.toLocaleString()}`
                            : job.budget_max 
                              ? `Up to $${job.budget_max.toLocaleString()}`
                              : `From $${job.budget_min.toLocaleString()}`
                          }
                        </span>
                      )}
                      {job.timeline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {job.timeline}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-charcoal-700/30 rounded-xl">
                  <Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No open jobs posted</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Send a Message</h3>
              {sent ? (
                <div className="text-center py-12 bg-success/10 rounded-xl border border-success/30">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-white mb-2">Message Sent!</h4>
                  <p className="text-gray-400">Your message has been sent to {contractor.company_name}. They'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                        className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Project Type</label>
                      <select
                        value={contactForm.project_type}
                        onChange={(e) => setContactForm({...contactForm, project_type: e.target.value})}
                        className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500"
                      >
                        <option value="">Select type...</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="renovation">Renovation</option>
                        <option value="new_construction">New Construction</option>
                        <option value="repair">Repair/Maintenance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:ring-1 focus:ring-steel-500 resize-none"
                      placeholder="Describe your project or inquiry..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Page
const ContractorsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [minVerification, setMinVerification] = useState(0);
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [trades, setTrades] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Selected contractor for detail view
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [tradesRes, regionsRes] = await Promise.all([
          fetch(`${API_URL}/api/marketplace/trades`),
          fetch(`${API_URL}/api/marketplace/regions`)
        ]);
        
        if (tradesRes.ok) {
          const data = await tradesRes.json();
          setTrades(data.trades || []);
        }
        if (regionsRes.ok) {
          const data = await regionsRes.json();
          setRegions(data.regions || []);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    
    fetchFilters();
  }, []);

  // Fetch contractors
  useEffect(() => {
    const fetchContractors = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20'
        });
        
        if (selectedTrade) params.append('trade', selectedTrade);
        if (selectedRegion) params.append('region', selectedRegion);
        if (minVerification > 0) params.append('min_verification', minVerification.toString());
        if (acceptingOnly) params.append('accepting_only', 'true');
        
        const response = await fetch(`${API_URL}/api/marketplace/contractors?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          setContractors(data.contractors || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContractors();
  }, [selectedTrade, selectedRegion, minVerification, acceptingOnly, page]);

  // Load contractor detail
  const loadContractorDetail = async (contractor) => {
    console.log('loadContractorDetail called with:', contractor);
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/api/marketplace/contractor/${contractor.user_id}/full`);
      console.log('API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Setting selectedContractor:', data);
        setSelectedContractor(data);
      } else {
        // Fallback to basic data if full endpoint fails
        console.log('API failed, using fallback data');
        setSelectedContractor(contractor);
      }
    } catch (error) {
      console.error('Error loading contractor detail:', error);
      setSelectedContractor(contractor);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter contractors by search term (client-side)
  const filteredContractors = contractors.filter(c => 
    !searchTerm || 
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.trade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setSelectedTrade('');
    setSelectedRegion('');
    setMinVerification(0);
    setAcceptingOnly(false);
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = selectedTrade || selectedRegion || minVerification > 0 || acceptingOnly;

  const handleConnect = () => {
    // Redirect to signup to connect
    navigate('/signup?intent=connect');
  };

  return (
    <div className="min-h-screen bg-charcoal-900">
      {/* Header */}
      <header className="bg-charcoal-800 border-b border-charcoal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="text-2xl font-bold text-white" data-testid="marketplace-logo">
                TradeOS<span className="text-warning">™</span>
              </Link>
              <p className="text-gray-400 text-sm mt-1">Contractor Marketplace</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-white px-4 py-2 font-medium transition-colors"
                data-testid="login-btn"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                data-testid="signup-btn"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-charcoal-800 to-charcoal-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find Verified Contractors
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Browse TradeOS verified contractors across Canada. Every contractor is vetted for identity, trade credentials, and insurance.
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company, trade, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-charcoal-700 border border-charcoal-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-steel-500 text-white'
                : 'bg-charcoal-700 text-gray-300 hover:bg-charcoal-600'
            }`}
            data-testid="filter-toggle"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {[selectedTrade, selectedRegion, minVerification > 0, acceptingOnly].filter(Boolean).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setAcceptingOnly(!acceptingOnly)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              acceptingOnly
                ? 'bg-success/20 text-success border border-success/50'
                : 'bg-charcoal-700 text-gray-300 hover:bg-charcoal-600'
            }`}
          >
            Accepting Work
          </button>

          <button
            onClick={() => setMinVerification(minVerification === 4 ? 0 : 4)}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              minVerification === 4
                ? 'bg-warning/20 text-warning border border-warning/50'
                : 'bg-charcoal-700 text-gray-300 hover:bg-charcoal-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Fully Verified
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}

          <div className="ml-auto text-sm text-gray-400">
            <Users className="w-4 h-4 inline mr-1" />
            {total} contractor{total !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4 mb-6 grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Trade</label>
              <select
                value={selectedTrade}
                onChange={(e) => { setSelectedTrade(e.target.value); setPage(1); }}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-white focus:border-steel-500"
              >
                <option value="">All Trades</option>
                {trades.map(trade => (
                  <option key={trade} value={trade}>{trade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => { setSelectedRegion(e.target.value); setPage(1); }}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-white focus:border-steel-500"
              >
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Verification Level</label>
              <select
                value={minVerification}
                onChange={(e) => { setMinVerification(parseInt(e.target.value)); setPage(1); }}
                className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-2 text-white focus:border-steel-500"
              >
                <option value="0">Any Level</option>
                <option value="1">Level 1+ (Identity)</option>
                <option value="2">Level 2+ (Trade)</option>
                <option value="3">Level 3+ (Insured)</option>
                <option value="4">Level 4 (Full)</option>
              </select>
            </div>
          </div>
        )}

        {/* Verification Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <span className="text-gray-500">Verification:</span>
          {[
            { level: 1, label: 'Identity' },
            { level: 2, label: 'Trade' },
            { level: 3, label: 'Insured' },
            { level: 4, label: 'Full' }
          ].map(({ level, label }) => (
            <div key={level} className="flex items-center gap-1.5">
              <VerificationBadge level={level} size="sm" />
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading contractors...</p>
          </div>
        ) : filteredContractors.length === 0 ? (
          <div className="text-center py-12 bg-charcoal-800 rounded-xl border border-charcoal-700">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No contractors found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or search term.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-steel-400 hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredContractors.map((contractor, index) => (
              <ContractorCard 
                key={contractor.user_id || index} 
                contractor={contractor} 
                onClick={() => loadContractorDetail(contractor)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-charcoal-700 text-white rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-400">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-4 py-2 bg-charcoal-700 text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-charcoal-800 border-t border-charcoal-700 py-12 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Are you a contractor?</h2>
          <p className="text-gray-400 mb-6">
            Join TradeOS to get listed in our marketplace, post jobs, offer services, and connect with other contractors.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-warning hover:bg-warning/90 text-charcoal-900 px-6 py-3 rounded-lg font-bold transition-colors"
            data-testid="cta-signup"
          >
            Get Started Free
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-charcoal-900 border-t border-charcoal-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TradeOS™. Built for Builders.</p>
        </div>
      </footer>

      {/* Contractor Detail Modal */}
      {selectedContractor && (
        <ContractorDetail 
          contractor={selectedContractor} 
          onClose={() => setSelectedContractor(null)}
          onConnect={handleConnect}
        />
      )}

      {/* Loading Detail Overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-charcoal-800 rounded-xl p-6 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-steel-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white">Loading contractor details...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorsPage;
