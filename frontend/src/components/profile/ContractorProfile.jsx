import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Building, 
  MapPin, 
  Star, 
  Award, 
  Briefcase,
  Image as ImageIcon,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const skillOptions = [
  'Finishing Carpentry', 'Rough Carpentry', 'Framing', 'Trim Work', 'Cabinet Installation',
  'Flooring', 'Tile Work', 'Drywall', 'Painting', 'Electrical', 'Plumbing', 'HVAC',
  'Roofing', 'Siding', 'Concrete', 'Masonry', 'Welding', 'Project Management'
];

const certificationOptions = [
  'Licensed Contractor', 'Journeyman Carpenter', 'Master Electrician', 'Master Plumber',
  'OSHA 30', 'OSHA 10', 'First Aid Certified', 'Red Seal', 'LEED Certified',
  'Lead-Safe Certified', 'Asbestos Awareness', 'Scaffolding Certified'
];

const ContractorProfile = () => {
  const { user, profile, updateProfile, fetchProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    bio: '',
    trade_type: '',
    years_experience: 0,
    skills: [],
    certifications: [],
    service_areas: [],
    phone: '',
    region: ''
  });

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        company_name: profile.company_name || '',
        bio: profile.bio || '',
        trade_type: profile.trade_type || '',
        years_experience: profile.years_experience || 0,
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        service_areas: profile.service_areas || [],
        phone: profile.phone || '',
        region: profile.region || ''
      });
      setPortfolioImages(profile.portfolio_urls || []);
    }
  }, [profile]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('contractor_reviews')
        .select('*')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!fetchError && data) {
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }, [user]);

  // Fetch completed projects for portfolio
  const fetchCompletedProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, client_gc, contract_value, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!fetchError && data) {
        setCompletedProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
    fetchCompletedProjects();
  }, [fetchReviews, fetchCompletedProjects]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateProfile({
        ...formData,
        portfolio_urls: portfolioImages
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }

      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleCertification = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const addServiceArea = (area) => {
    if (area && !formData.service_areas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, area]
      }));
    }
  };

  const removeServiceArea = (area) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== area)
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  const avgRating = profile?.rating_avg || 0;
  const ratingCount = profile?.rating_count || 0;

  return (
    <div className="space-y-6" data-testid="contractor-profile">
      {/* Profile Header */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl bg-charcoal-700 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 lg:w-16 lg:h-16 text-gray-500" />
              )}
            </div>
            {isEditing && (
              <button className="mt-2 w-full text-xs text-steel-400 hover:text-steel-300 flex items-center justify-center gap-1">
                <Upload className="w-3 h-3" />
                Upload Photo
              </button>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-2xl font-bold text-white bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-1 w-full max-w-md"
                    placeholder="Your Name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {profile?.name || 'Your Name'}
                    {profile?.verified && (
                      <CheckCircle2 className="w-5 h-5 text-steel-400" title="Verified Contractor" />
                    )}
                  </h1>
                )}
                
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="text-gray-400 bg-charcoal-700 border border-charcoal-600 rounded-lg px-3 py-1 mt-2 w-full max-w-md"
                    placeholder="Company Name"
                  />
                ) : (
                  <p className="text-gray-400 flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4" />
                    {profile?.company_name || 'Your Company'}
                  </p>
                )}
              </div>

              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isEditing 
                    ? 'bg-success hover:bg-success/80 text-white'
                    : 'bg-charcoal-700 hover:bg-charcoal-600 text-white'
                }`}
                data-testid="edit-profile-btn"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </>
                )}
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-5 h-5 ${star <= avgRating ? 'text-warning fill-warning' : 'text-gray-600'}`} 
                  />
                ))}
                <span className="text-white font-medium ml-2">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({ratingCount} reviews)</span>
              </div>
              
              {profile?.trade_type && (
                <span className="px-3 py-1 bg-steel-500/20 text-steel-400 rounded-full text-sm">
                  {profile.trade_type}
                </span>
              )}
              
              {profile?.region && (
                <span className="flex items-center gap-1 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  {profile.region}
                </span>
              )}
            </div>

            {/* Bio */}
            <div className="mt-4">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 h-24 resize-none"
                  placeholder="Tell potential clients about yourself and your work..."
                />
              ) : (
                <p className="text-gray-300">
                  {profile?.bio || 'Add a bio to tell clients about your experience and expertise.'}
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                      className="w-12 bg-charcoal-700 border border-charcoal-600 rounded px-2 py-1 text-white text-center"
                    />
                  ) : (
                    profile?.years_experience || 0
                  )} years experience
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">{completedProjects.length} completed projects</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-risk/20 border border-risk/50 text-risk p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isEditing && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setIsEditing(false);
                // Reset form
                if (profile) {
                  setFormData({
                    name: profile.name || '',
                    company_name: profile.company_name || '',
                    bio: profile.bio || '',
                    trade_type: profile.trade_type || '',
                    years_experience: profile.years_experience || 0,
                    skills: profile.skills || [],
                    certifications: profile.certifications || [],
                    service_areas: profile.service_areas || [],
                    phone: profile.phone || '',
                    region: profile.region || ''
                  });
                }
              }}
              className="text-gray-400 hover:text-white px-4 py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Skills & Certifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-steel-400" />
            Skills & Expertise
          </h2>
          
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.skills.includes(skill)
                      ? 'bg-steel-500 text-white'
                      : 'bg-charcoal-700 text-gray-400 hover:bg-charcoal-600'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile?.skills || []).length > 0 ? (
                profile.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No skills added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-steel-400" />
            Certifications
          </h2>
          
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {certificationOptions.map((cert) => (
                <button
                  key={cert}
                  onClick={() => toggleCertification(cert)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.certifications.includes(cert)
                      ? 'bg-success text-white'
                      : 'bg-charcoal-700 text-gray-400 hover:bg-charcoal-600'
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile?.certifications || []).length > 0 ? (
                profile.certifications.map((cert) => (
                  <span key={cert} className="px-3 py-1.5 bg-success/20 text-success rounded-full text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {cert}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No certifications added yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Service Areas */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-steel-400" />
          Service Areas
        </h2>
        
        {isEditing ? (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a service area (city, region)..."
                className="flex-1 bg-charcoal-700 border border-charcoal-600 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addServiceArea(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  addServiceArea(input.value);
                  input.value = '';
                }}
                className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.service_areas.map((area) => (
                <span key={area} className="px-3 py-1.5 bg-charcoal-700 text-gray-300 rounded-full text-sm flex items-center gap-2">
                  {area}
                  <button onClick={() => removeServiceArea(area)} className="text-gray-500 hover:text-risk">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(profile?.service_areas || []).length > 0 ? (
              profile.service_areas.map((area) => (
                <span key={area} className="px-3 py-1.5 bg-charcoal-700 text-gray-300 rounded-full text-sm">
                  {area}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No service areas added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Portfolio / Completed Projects */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-steel-400" />
            Work Portfolio
          </h2>
          {completedProjects.length > 0 && (
            <span className="text-sm text-gray-400">{completedProjects.length} completed projects</span>
          )}
        </div>
        
        {completedProjects.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {completedProjects.map((project) => (
              <div 
                key={project.id} 
                className="bg-charcoal-700/50 rounded-lg p-4 hover:bg-charcoal-700 transition-colors"
              >
                <h4 className="font-medium text-white truncate">{project.name}</h4>
                <p className="text-sm text-gray-400 truncate">{project.client_gc || 'Private Client'}</p>
                <p className="text-sm text-steel-400 mt-2">{formatCurrency(project.contract_value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-charcoal-700/30 rounded-xl border border-charcoal-700 border-dashed">
            <Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Complete projects to build your portfolio</p>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-steel-400" />
            Client Reviews
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${star <= avgRating ? 'text-warning fill-warning' : 'text-gray-600'}`} 
                />
              ))}
            </div>
            <span className="text-white font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({ratingCount})</span>
          </div>
        </div>
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-charcoal-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">{review.client_name || 'Client'}</p>
                    <p className="text-sm text-gray-500">{review.project_name || 'Project'}</p>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= review.rating ? 'text-warning fill-warning' : 'text-gray-600'}`} 
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-300 text-sm">{review.comment}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-charcoal-700/30 rounded-xl border border-charcoal-700 border-dashed">
            <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No reviews yet</p>
            <p className="text-gray-500 text-xs mt-1">Complete projects and ask clients for reviews</p>
          </div>
        )}
      </div>

      {/* Public Profile Link */}
      <div className="bg-steel-500/10 border border-steel-500/30 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-steel-400 font-medium">Your Public Profile</p>
          <p className="text-sm text-gray-400">Share this link with potential clients</p>
        </div>
        <a
          href={`/contractor/${user?.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View Profile
        </a>
      </div>
    </div>
  );
};

export default ContractorProfile;
