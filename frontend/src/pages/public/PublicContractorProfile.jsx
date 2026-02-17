import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Building, 
  MapPin, 
  Star, 
  Award, 
  Briefcase,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  ArrowLeft,
  Shield,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PublicContractorProfile = () => {
  const { contractorId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractor, setContractor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);

  useEffect(() => {
    const fetchContractor = async () => {
      if (!contractorId) {
        setError('Contractor not found');
        setLoading(false);
        return;
      }

      try {
        // Fetch contractor profile
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .select('*')
          .eq('user_id', contractorId)
          .single();

        if (profileError || !profileData) {
          throw new Error('Contractor not found');
        }

        setContractor(profileData);

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('contractor_reviews')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (reviewsData) {
          setReviews(reviewsData);
        }

        // Fetch completed projects count
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', contractorId)
          .eq('status', 'completed');

        setCompletedProjects(count || 0);

      } catch (err) {
        console.error('Error fetching contractor:', err);
        setError(err.message || 'Failed to load contractor profile');
      } finally {
        setLoading(false);
      }
    };

    fetchContractor();
  }, [contractorId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD', 
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-steel-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-charcoal-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Contractor Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This profile does not exist or is not public.'}</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-steel-400 hover:text-steel-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = contractor.rating_avg || 0;
  const ratingCount = contractor.rating_count || 0;

  return (
    <div className="min-h-screen bg-charcoal-900" data-testid="public-contractor-profile">
      {/* Header */}
      <header className="bg-charcoal-800 border-b border-charcoal-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to TradeOS
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl bg-charcoal-700 flex items-center justify-center overflow-hidden">
                {contractor.avatar_url ? (
                  <img src={contractor.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 lg:w-16 lg:h-16 text-gray-500" />
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {contractor.name || 'Contractor'}
                </h1>
                {contractor.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-steel-500/20 text-steel-400 rounded-full text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </span>
                )}
              </div>
              
              {contractor.company_name && (
                <p className="text-gray-400 flex items-center gap-2 mt-2 text-lg">
                  <Building className="w-5 h-5" />
                  {contractor.company_name}
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-5 h-5 ${star <= avgRating ? 'text-warning fill-warning' : 'text-gray-600'}`} 
                    />
                  ))}
                  <span className="text-white font-semibold ml-2 text-lg">{avgRating.toFixed(1)}</span>
                  <span className="text-gray-500">({ratingCount} reviews)</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
                {contractor.trade_type && (
                  <span className="px-3 py-1 bg-steel-500/20 text-steel-400 rounded-full">
                    {contractor.trade_type}
                  </span>
                )}
                {contractor.region && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {contractor.region}
                  </span>
                )}
                {contractor.years_experience > 0 && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    {contractor.years_experience} years experience
                  </span>
                )}
                <span className="flex items-center gap-1 text-gray-400">
                  <Briefcase className="w-4 h-4" />
                  {completedProjects} completed projects
                </span>
              </div>

              {/* Bio */}
              {contractor.bio && (
                <p className="text-gray-300 mt-6 leading-relaxed">
                  {contractor.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills & Certifications */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Skills */}
          {contractor.skills && contractor.skills.length > 0 && (
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-steel-400" />
                Skills & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {contractor.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-steel-500/20 text-steel-400 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {contractor.certifications && contractor.certifications.length > 0 && (
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-steel-400" />
                Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {contractor.certifications.map((cert) => (
                  <span key={cert} className="px-3 py-1.5 bg-success/20 text-success rounded-full text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service Areas */}
        {contractor.service_areas && contractor.service_areas.length > 0 && (
          <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 mt-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-steel-400" />
              Service Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {contractor.service_areas.map((area) => (
                <span key={area} className="px-3 py-1.5 bg-charcoal-700 text-gray-300 rounded-full text-sm">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
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
                      {review.project_name && (
                        <p className="text-sm text-gray-500">{review.project_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'text-warning fill-warning' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(review.created_at).toLocaleDateString('en-CA', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-charcoal-700/30 rounded-xl">
              <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No reviews yet</p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="bg-steel-500/10 border border-steel-500/30 rounded-xl p-6 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Interested in working with {contractor.name?.split(' ')[0] || 'this contractor'}?</h3>
              <p className="text-gray-400 text-sm">Post your project on TradeOS and invite them to bid</p>
            </div>
            <Link
              to="/signup?role=customer"
              className="bg-steel-500 hover:bg-steel-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Post a Project
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Profile powered by <Link to="/" className="text-steel-400 hover:text-steel-300">TradeOS</Link></p>
        </div>
      </div>
    </div>
  );
};

export default PublicContractorProfile;
