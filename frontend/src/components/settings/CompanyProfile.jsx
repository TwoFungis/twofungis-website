/**
 * CompanyProfile.jsx - Company Profile Settings Component
 * =========================================================
 * 
 * Estimate Workbench v1.1 - Phase 1: Company Profile & Estimate Header
 * 
 * Manages company information for estimates and PDFs:
 * - Company Logo (upload/change/remove)
 * - Company Name, Legal Name, Address, City, Province, Postal Code, Country
 * - Phone, Email, Website
 * - GST Number, WCB Number, General Liability Insurance, Business License
 * - Default Estimator, Pricing Profile, GST %, Contingency %, Markup %, Quote Validity
 * - Default Terms & Conditions
 * 
 * Data stored in localStorage until Supabase tables provisioned.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Upload,
  Save,
  Loader2,
  Image,
  X,
  Phone,
  Mail,
  Globe,
  FileText,
  User,
  Percent,
  Shield,
  HardHat,
  Calendar,
  BadgeDollarSign,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

// LocalStorage key
const COMPANY_PROFILE_KEY = 'tradeos_company_profile';

// Pricing profiles available
const PRICING_PROFILES = ['Low', 'Standard', 'Premium'];

// Default company profile structure
const defaultCompanyProfile = {
  // Company Information
  logo: null, // Base64 encoded image
  name: '',
  legal_name: '', // Optional
  address: '',
  city: '',
  province: '',
  postal_code: '',
  country: 'Canada',
  phone: '',
  email: '',
  website: '',
  // Business Information
  gst_number: '',
  wcb_number: '',
  gl_insurance: '',
  business_license: '', // Optional
  // Defaults
  default_estimator: '',
  default_pricing_profile: 'Standard',
  default_gst_rate: 5,
  default_contingency: 10,
  default_markup: 15,
  default_quote_validity: 30, // days
  default_terms: `• Labour only unless noted.\n• Materials by others unless specified.\n• Pricing valid for 30 days.\n• Subject to final drawings and specifications.\n• Excludes permits unless noted.`
};

// Load from localStorage
const loadCompanyProfile = () => {
  try {
    const stored = localStorage.getItem(COMPANY_PROFILE_KEY);
    if (stored) {
      return { ...defaultCompanyProfile, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load company profile:', e);
  }
  return defaultCompanyProfile;
};

// Save to localStorage
const saveCompanyProfile = (profile) => {
  try {
    localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch (e) {
    console.error('Failed to save company profile:', e);
    return false;
  }
};

// Export for use in other components
export const getCompanyProfile = loadCompanyProfile;

const CompanyProfile = () => {
  const [profile, setProfile] = useState(defaultCompanyProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);
  
  // Load on mount
  useEffect(() => {
    setProfile(loadCompanyProfile());
  }, []);
  
  // Track changes
  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  
  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      toast.error('Logo must be under 500KB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      updateField('logo', event.target.result);
      toast.success('Logo uploaded');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };
  
  // Remove logo
  const handleRemoveLogo = () => {
    updateField('logo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Save profile
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate async save
    setTimeout(() => {
      if (saveCompanyProfile(profile)) {
        toast.success('Company profile saved');
        setHasChanges(false);
      } else {
        toast.error('Failed to save profile');
      }
      setIsSaving(false);
    }, 500);
  };
  
  return (
    <div className="space-y-6" data-testid="company-profile-settings">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Company Profile</h2>
            <p className="text-sm text-neutral-500">Used on estimates and PDFs</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black font-medium rounded-lg transition-colors"
          data-testid="save-company-profile-btn"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Profile
        </button>
      </div>
      
      {/* Logo Upload */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Company Logo
        </label>
        <div className="flex items-start gap-4">
          {/* Logo Preview */}
          <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-xl flex items-center justify-center overflow-hidden">
            {profile.logo ? (
              <img 
                src={profile.logo} 
                alt="Company Logo" 
                className="w-full h-full object-contain"
              />
            ) : (
              <Image className="w-10 h-10 text-neutral-600" />
            )}
          </div>
          
          {/* Upload Controls */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Logo
            </label>
            {profile.logo && (
              <button
                onClick={handleRemoveLogo}
                className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <p className="text-xs text-neutral-500 mt-2">
              PNG, JPG or SVG. Max 500KB. Recommended: 200x100px
            </p>
          </div>
        </div>
      </div>
      
      {/* Company Information */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Company Name *</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Your Company Name"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-name-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Legal Company Name <span className="text-neutral-600">(optional)</span></label>
            <input
              type="text"
              value={profile.legal_name}
              onChange={(e) => updateField('legal_name', e.target.value)}
              placeholder="Legal Entity Name Ltd."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-legal-name-input"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs text-neutral-500 mb-1">Street Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Main Street"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-address-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="City"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-city-input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Province/State</label>
              <select
                value={profile.province}
                onChange={(e) => updateField('province', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                data-testid="company-province-select"
              >
                <option value="">Select</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Postal Code</label>
              <input
                type="text"
                value={profile.postal_code}
                onChange={(e) => updateField('postal_code', e.target.value.toUpperCase())}
                placeholder="A1A 1A1"
                maxLength={7}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 uppercase"
                data-testid="company-postal-input"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Country</label>
            <select
              value={profile.country}
              onChange={(e) => updateField('country', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              data-testid="company-country-select"
            >
              <option value="Canada">Canada</option>
              <option value="United States">United States</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-phone-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="info@company.com"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-email-input"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Website
            </label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://www.company.com"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="company-website-input"
            />
          </div>
        </div>
      </div>
      
      {/* Business Numbers */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">GST/HST Number</label>
            <input
              type="text"
              value={profile.gst_number}
              onChange={(e) => updateField('gst_number', e.target.value)}
              placeholder="123456789 RT0001"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="gst-number-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <HardHat className="w-3 h-3" /> WCB Number
            </label>
            <input
              type="text"
              value={profile.wcb_number}
              onChange={(e) => updateField('wcb_number', e.target.value)}
              placeholder="WCB-123456"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="wcb-number-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> General Liability Insurance
            </label>
            <input
              type="text"
              value={profile.gl_insurance}
              onChange={(e) => updateField('gl_insurance', e.target.value)}
              placeholder="Policy #12345678"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="gl-insurance-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Business License <span className="text-neutral-600">(optional)</span></label>
            <input
              type="text"
              value={profile.business_license}
              onChange={(e) => updateField('business_license', e.target.value)}
              placeholder="BL-2024-12345"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="business-license-input"
            />
          </div>
        </div>
      </div>
      
      {/* Estimating Defaults */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
          <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
          Estimating Defaults
        </h3>
        <p className="text-xs text-neutral-500 mb-4">These settings automatically populate all new estimates</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Default Estimator
            </label>
            <input
              type="text"
              value={profile.default_estimator}
              onChange={(e) => updateField('default_estimator', e.target.value)}
              placeholder="Your Name"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              data-testid="default-estimator-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Default Pricing Profile</label>
            <select
              value={profile.default_pricing_profile}
              onChange={(e) => updateField('default_pricing_profile', e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              data-testid="default-pricing-profile-select"
            >
              {PRICING_PROFILES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Quote Validity (days)
            </label>
            <input
              type="number"
              value={profile.default_quote_validity}
              onChange={(e) => updateField('default_quote_validity', parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
              data-testid="default-quote-validity-input"
            />
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Default Markup %</label>
            <div className="relative">
              <input
                type="number"
                value={profile.default_markup}
                onChange={(e) => updateField('default_markup', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.5"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 pr-8 text-white focus:outline-none focus:border-emerald-500/50"
                data-testid="default-markup-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Default GST Rate %</label>
            <div className="relative">
              <input
                type="number"
                value={profile.default_gst_rate}
                onChange={(e) => updateField('default_gst_rate', parseFloat(e.target.value) || 0)}
                min="0"
                max="15"
                step="0.5"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 pr-8 text-white focus:outline-none focus:border-emerald-500/50"
                data-testid="default-gst-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Default Contingency %</label>
            <div className="relative">
              <input
                type="number"
                value={profile.default_contingency}
                onChange={(e) => updateField('default_contingency', parseFloat(e.target.value) || 0)}
                min="0"
                max="50"
                step="0.5"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 pr-8 text-white focus:outline-none focus:border-emerald-500/50"
                data-testid="default-contingency-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Default Terms & Conditions */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Default Terms & Conditions
        </h3>
        <textarea
          value={profile.default_terms}
          onChange={(e) => updateField('default_terms', e.target.value)}
          rows={6}
          placeholder="Enter your standard terms and conditions..."
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 resize-none text-sm"
          data-testid="default-terms-textarea"
        />
        <p className="text-xs text-neutral-500 mt-2">
          These will appear in the Clarifications section of new estimates
        </p>
      </div>
      
      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <p className="text-amber-400 text-sm">You have unsaved changes</p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Now
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;
