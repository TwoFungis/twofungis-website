import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, User, Briefcase, FileText, Building2, 
  CheckCircle, Clock, Upload, ArrowRight, ExternalLink, AlertCircle,
  Award, CreditCard, Phone, Mail, Camera
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Verification levels explained
const VERIFICATION_LEVELS = [
  {
    level: 1,
    name: 'Identity Verified',
    color: 'blue',
    icon: User,
    description: 'Basic identity verification confirms you are who you say you are.',
    requirements: [
      { text: 'Valid government-issued ID', type: 'document' },
      { text: 'Selfie matching your ID', type: 'photo' },
      { text: 'Phone number verification', type: 'verify' }
    ],
    benefits: [
      'Blue verification badge on your profile',
      'Increased trust from potential clients',
      'Access to basic marketplace features'
    ]
  },
  {
    level: 2,
    name: 'Trade Certified',
    color: 'teal',
    icon: Briefcase,
    description: 'Confirms your trade qualifications and professional credentials.',
    requirements: [
      { text: 'Trade license or journeyman certificate', type: 'document' },
      { text: 'Business registration (if applicable)', type: 'document' },
      { text: 'Proof of 2+ years experience', type: 'verify' }
    ],
    benefits: [
      'Teal trade badge on your profile',
      'Priority listing in search results',
      'Ability to post verified job opportunities'
    ]
  },
  {
    level: 3,
    name: 'Insured Contractor',
    color: 'green',
    icon: Shield,
    description: 'Verifies you carry proper liability insurance for your trade.',
    requirements: [
      { text: 'General liability insurance certificate', type: 'document' },
      { text: 'Workers compensation (if applicable)', type: 'document' },
      { text: 'Insurance must be current and valid', type: 'verify' }
    ],
    benefits: [
      'Green insurance badge on your profile',
      'Featured in "Insured Contractors" filter',
      'Higher trust score with clients'
    ]
  },
  {
    level: 4,
    name: 'TradeOS Verified',
    color: 'warning',
    icon: Award,
    description: 'The highest level of verification - fully vetted by TradeOS.',
    requirements: [
      { text: 'All Level 1-3 requirements completed', type: 'verify' },
      { text: 'Background check clearance', type: 'verify' },
      { text: 'Reference verification (3 clients)', type: 'verify' },
      { text: 'Maintain active TradeOS subscription', type: 'subscription' }
    ],
    benefits: [
      'Gold TradeOS Verified badge',
      'Top placement in all searches',
      'Exclusive access to premium job leads',
      'TradeOS guarantee badge for clients'
    ]
  }
];

const VerificationCenter = () => {
  const { user, profile } = useAuthStore();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [submittedDocs, setSubmittedDocs] = useState([]);

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_URL}/api/marketplace/profile/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentLevel(data.verification?.level || 0);
          setVerificationStatus(data.verification);
          setSubmittedDocs(data.verification?.submitted_documents || []);
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [user?.id]);

  const handleDocumentUpload = async (levelNum, docType) => {
    // In production, this would open a file picker and upload to storage
    // For now, we'll mark it as pending review
    setUploadingFor(`${levelNum}-${docType}`);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Submit verification request
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_URL}/api/marketplace/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          level: levelNum,
          document_type: docType,
          status: 'pending_review'
        })
      });

      if (response.ok) {
        setSubmittedDocs(prev => [...prev, { level: levelNum, type: docType, status: 'pending' }]);
      }
    } catch (error) {
      console.error('Error submitting document:', error);
    } finally {
      setUploadingFor(null);
    }
  };

  const getDocStatus = (levelNum, docType) => {
    const doc = submittedDocs.find(d => d.level === levelNum && d.type === docType);
    return doc?.status || 'not_submitted';
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
      teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
      warning: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/50' }
    };
    return colors[color] || colors.blue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="verification-center">
      {/* Header */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-steel-400" />
              Verification Center
            </h1>
            <p className="text-gray-400 mt-1">
              Get verified to build trust with clients and unlock marketplace features
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Level</p>
            <div className="flex items-center gap-2 mt-1">
              {currentLevel === 0 ? (
                <span className="text-gray-500 font-medium">Not Verified</span>
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColorClasses(VERIFICATION_LEVELS[currentLevel - 1].color).bg}`}>
                    <Shield className={`w-4 h-4 ${getColorClasses(VERIFICATION_LEVELS[currentLevel - 1].color).text}`} />
                  </div>
                  <span className={`font-semibold ${getColorClasses(VERIFICATION_LEVELS[currentLevel - 1].color).text}`}>
                    Level {currentLevel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Verification Progress</span>
            <span className="text-sm text-gray-400">{currentLevel}/4 Levels</span>
          </div>
          <div className="h-2 bg-charcoal-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-teal-500 via-green-500 to-warning transition-all duration-500"
              style={{ width: `${(currentLevel / 4) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {VERIFICATION_LEVELS.map((level, idx) => (
              <div 
                key={idx}
                className={`flex flex-col items-center ${idx + 1 <= currentLevel ? getColorClasses(level.color).text : 'text-gray-600'}`}
              >
                <div className={`w-3 h-3 rounded-full ${idx + 1 <= currentLevel ? getColorClasses(level.color).bg : 'bg-charcoal-700'}`} />
                <span className="text-xs mt-1 hidden sm:block">{level.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Levels */}
      <div className="space-y-4">
        {VERIFICATION_LEVELS.map((level, idx) => {
          const isUnlocked = idx === 0 || currentLevel >= idx;
          const isComplete = currentLevel > idx;
          const isCurrent = currentLevel === idx;
          const colorClasses = getColorClasses(level.color);
          const Icon = level.icon;

          return (
            <div 
              key={idx}
              className={`bg-charcoal-800 rounded-xl border p-6 transition-all ${
                isComplete 
                  ? `${colorClasses.border} ${colorClasses.bg}` 
                  : isCurrent 
                    ? 'border-steel-500/50' 
                    : 'border-charcoal-700'
              } ${!isUnlocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Level Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isComplete ? colorClasses.bg : 'bg-charcoal-700'
                }`}>
                  {isComplete ? (
                    <CheckCircle className={`w-7 h-7 ${colorClasses.text}`} />
                  ) : (
                    <Icon className={`w-7 h-7 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-semibold ${isComplete ? colorClasses.text : 'text-white'}`}>
                      Level {level.level}: {level.name}
                    </h3>
                    {isComplete && (
                      <span className={`text-xs ${colorClasses.bg} ${colorClasses.text} px-2 py-0.5 rounded-full`}>
                        Completed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-steel-500/20 text-steel-400 px-2 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                    {!isUnlocked && (
                      <span className="text-xs bg-charcoal-700 text-gray-500 px-2 py-0.5 rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4">{level.description}</p>

                  {/* Requirements */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Requirements
                      </h4>
                      <ul className="space-y-2">
                        {level.requirements.map((req, reqIdx) => {
                          const docStatus = getDocStatus(level.level, req.text);
                          
                          return (
                            <li key={reqIdx} className="flex items-center gap-2 text-sm">
                              {docStatus === 'approved' ? (
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              ) : docStatus === 'pending' ? (
                                <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
                              )}
                              <span className={docStatus === 'approved' ? 'text-gray-300' : 'text-gray-400'}>
                                {req.text}
                              </span>
                              
                              {isUnlocked && !isComplete && req.type === 'document' && docStatus !== 'approved' && (
                                <button
                                  onClick={() => handleDocumentUpload(level.level, req.text)}
                                  disabled={uploadingFor === `${level.level}-${req.text}`}
                                  className="ml-auto text-xs bg-charcoal-700 hover:bg-charcoal-600 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                                >
                                  {uploadingFor === `${level.level}-${req.text}` ? (
                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  ) : docStatus === 'pending' ? (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      Pending
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3 h-3" />
                                      Upload
                                    </>
                                  )}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Benefits
                      </h4>
                      <ul className="space-y-2">
                        {level.benefits.map((benefit, benIdx) => (
                          <li key={benIdx} className="flex items-start gap-2 text-sm text-gray-400">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isComplete ? 'text-success' : 'text-gray-600'}`} />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA */}
                  {isCurrent && !isComplete && (
                    <div className="mt-4 pt-4 border-t border-charcoal-700">
                      <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                        Start Level {level.level} Verification
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-steel-400" />
          Need Help with Verification?
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-charcoal-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Document Guidelines</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• All documents must be clear and legible</li>
              <li>• PDFs or high-quality images accepted</li>
              <li>• Documents must not be expired</li>
              <li>• Name must match your TradeOS profile</li>
            </ul>
          </div>
          <div className="bg-charcoal-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Review Timeline</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Level 1: Usually within 24 hours</li>
              <li>• Level 2: 2-3 business days</li>
              <li>• Level 3: 2-3 business days</li>
              <li>• Level 4: 5-7 business days</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <a 
            href="mailto:support@tradeos.ca" 
            className="text-steel-400 hover:text-steel-300 text-sm flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            support@tradeos.ca
          </a>
          <span className="text-gray-600">|</span>
          <a 
            href="tel:+1-888-TRADEOS" 
            className="text-steel-400 hover:text-steel-300 text-sm flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            1-888-TRADEOS
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerificationCenter;
