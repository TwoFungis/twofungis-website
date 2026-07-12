/**
 * OpportunitiesPage.jsx
 * =====================
 * List view for all opportunities in the organization.
 * Pipeline overview with filtering and quick actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Target,
  TrendingUp,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Stage configuration
const STAGES = [
  { id: 'discovered', label: 'Discovered', color: 'bg-blue-500' },
  { id: 'qualifying', label: 'Qualifying', color: 'bg-amber-500' },
  { id: 'tendering', label: 'Tendering', color: 'bg-purple-500' },
  { id: 'submitted', label: 'Submitted', color: 'bg-cyan-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'awarded', label: 'Awarded', color: 'bg-emerald-500' },
];

const STAGE_CONFIG = {
  discovered: { label: 'Discovered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  qualifying: { label: 'Qualifying', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  tendering: { label: 'Tendering', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  submitted: { label: 'Submitted', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  awarded: { label: 'Awarded', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  declined: { label: 'Declined', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  lost: { label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  archived: { label: 'Archived', color: 'bg-zinc-600/20 text-zinc-500 border-zinc-600/30' }
};

function formatCurrency(value) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric'
  });
}

function getDaysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const today = new Date();
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

// Opportunity Card Component
function OpportunityCard({ opportunity, onClick }) {
  const stage = STAGE_CONFIG[opportunity.status] || STAGE_CONFIG.discovered;
  const daysUntil = getDaysUntil(opportunity.tender_due_date);
  const isUrgent = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;
  const isOverdue = daysUntil !== null && daysUntil < 0;

  return (
    <div
      onClick={onClick}
      className="bg-[#111111] border border-[#262626] rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-white/20 hover:-translate-y-[2px] group"
      data-testid={`opportunity-card-${opportunity.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${stage.color}`}>
          {stage.label}
        </span>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
      </div>

      <h3 className="text-base font-medium text-white mb-1 truncate group-hover:text-emerald-400 transition-colors">
        {opportunity.name}
      </h3>
      
      <p className="text-xs font-mono text-white/40 mb-4">
        {opportunity.reference_number || 'No reference'}
      </p>

      <div className="space-y-2 text-sm">
        {(opportunity.client_company || opportunity.client_name) && (
          <div className="flex items-center gap-2 text-white/60">
            <Building2 className="w-3.5 h-3.5 text-white/40" />
            <span className="truncate">{opportunity.client_company || opportunity.client_name}</span>
          </div>
        )}
        
        {opportunity.site_city && (
          <div className="flex items-center gap-2 text-white/60">
            <MapPin className="w-3.5 h-3.5 text-white/40" />
            <span>{opportunity.site_city}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#262626]">
        <span className="font-mono text-lg text-white">
          {formatCurrency(opportunity.estimated_value)}
        </span>
        
        {opportunity.tender_due_date && (
          <span className={`text-xs font-mono ${
            isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white/50'
          }`}>
            {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil !== null ? `${daysUntil}d` : formatDate(opportunity.tender_due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// Pipeline Stats Bar
function PipelineStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Active Pipeline</p>
        <p className="text-2xl font-mono text-white">{stats.active_pipeline?.count || 0}</p>
        <p className="text-sm text-white/50">{formatCurrency(stats.active_pipeline?.value)}</p>
      </div>
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">In Tendering</p>
        <p className="text-2xl font-mono text-white">{stats.by_status?.tendering?.count || 0}</p>
        <p className="text-sm text-white/50">{formatCurrency(stats.by_status?.tendering?.value)}</p>
      </div>
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Submitted</p>
        <p className="text-2xl font-mono text-white">{stats.by_status?.submitted?.count || 0}</p>
        <p className="text-sm text-white/50">{formatCurrency(stats.by_status?.submitted?.value)}</p>
      </div>
      <div className="bg-[#111111] border border-emerald-500/30 rounded-xl p-5">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-emerald-400/70 mb-2">Awarded</p>
        <p className="text-2xl font-mono text-emerald-400">{stats.by_status?.awarded?.count || 0}</p>
        <p className="text-sm text-emerald-400/70">{formatCurrency(stats.by_status?.awarded?.value)}</p>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Fetch opportunities
  const fetchOpportunities = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      
      // Fetch list
      const statusFilter = filter === 'active' 
        ? '' 
        : filter === 'all' 
        ? ''
        : `&status=${filter}`;
      
      const response = await fetch(`${API_URL}/api/opportunities?limit=50${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch opportunities');
      
      const data = await response.json();
      
      // Filter for active only if needed
      let filtered = data.opportunities || [];
      if (filter === 'active') {
        filtered = filtered.filter(opp => 
          ['discovered', 'qualifying', 'tendering', 'submitted', 'negotiation'].includes(opp.status)
        );
      }
      
      setOpportunities(filtered);

      // Fetch stats
      const statsResponse = await fetch(`${API_URL}/api/opportunities/stats/pipeline`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, filter]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Filter opportunities by search
  const filteredOpportunities = opportunities.filter(opp => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      opp.name?.toLowerCase().includes(searchLower) ||
      opp.client_company?.toLowerCase().includes(searchLower) ||
      opp.client_name?.toLowerCase().includes(searchLower) ||
      opp.reference_number?.toLowerCase().includes(searchLower) ||
      opp.site_city?.toLowerCase().includes(searchLower)
    );
  });

  // Handle create new
  const handleCreate = () => {
    // For now, navigate to a create form (to be implemented)
    // This will be replaced with a modal or dedicated page
    navigate('/app/opportunities/new');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="opportunities-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#262626]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Opportunities</h1>
              <p className="text-white/50 text-sm mt-1">Manage your pipeline from discovery to project</p>
            </div>
            
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
              data-testid="create-opportunity-btn"
            >
              <Plus className="w-4 h-4" />
              New Opportunity
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#262626] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
                data-testid="search-input"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-[#111111] border border-[#262626] rounded-lg p-1">
              {['active', 'all', 'awarded', 'lost'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filter === f
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                  data-testid={`filter-${f}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-[#111111] border border-[#262626] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
                data-testid="view-grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
                data-testid="view-list"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* Stats */}
        <PipelineStats stats={stats} />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
            <p className="text-white/70">{error}</p>
            <button
              onClick={fetchOpportunities}
              className="mt-4 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredOpportunities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-white/30" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">
              {search ? 'No matches found' : 'No opportunities yet'}
            </h2>
            <p className="text-white/50 mb-6 max-w-md">
              {search 
                ? 'Try adjusting your search or filters'
                : 'Create your first opportunity to start building your pipeline'
              }
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Opportunity
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filteredOpportunities.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onClick={() => navigate(`/app/opportunities/${opp.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
