/**
 * OverviewTab.jsx
 * ===============
 * The Command Center of the Opportunity Workspace.
 * Must answer "What needs my attention today?" within 5 seconds.
 * 
 * Layout: High-density bento grid
 * - Top row: North star metrics
 * - Left column: Outstanding items
 * - Right column: Company Brain & Timeline
 */

import React from 'react';
import {
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  HelpCircle,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Building2,
  User,
  Phone,
  Mail,
  ExternalLink,
  CalendarDays,
  Target,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

// Workflow stage labels
const STAGE_LABELS = {
  discovered: 'Discovered',
  qualifying: 'Qualifying',
  tendering: 'Tendering',
  submitted: 'Submitted',
  negotiation: 'Negotiation',
  awarded: 'Awarded',
  declined: 'Declined',
  lost: 'Lost',
  archived: 'Archived'
};

// Format helpers
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

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateString);
}

function getDaysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const today = new Date();
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

// Metric Card Component
function MetricCard({ label, value, subtext, icon: Icon, variant = 'default', testId }) {
  const variants = {
    default: 'border-[#262626]',
    success: 'border-emerald-500/30',
    warning: 'border-amber-500/30',
    danger: 'border-red-500/30'
  };
  
  return (
    <div 
      className={`bg-[#111111] border ${variants[variant]} rounded-xl p-5 transition-all duration-200 hover:border-white/20 hover:-translate-y-[2px]`}
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-white/30" />}
      </div>
      <p className="text-2xl font-mono tracking-tight text-white mb-1">{value}</p>
      {subtext && <p className="text-sm text-white/50">{subtext}</p>}
    </div>
  );
}

// Outstanding Item Card
function OutstandingCard({ title, items, icon: Icon, emptyText, color = 'white', testId }) {
  const colorClasses = {
    white: 'text-white/60',
    amber: 'text-amber-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400'
  };
  
  return (
    <div 
      className="bg-[#111111] border border-[#262626] rounded-xl p-5"
      data-testid={testId}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        {items.length > 0 && (
          <span className="ml-auto px-2 py-0.5 text-xs font-mono bg-white/10 rounded-full text-white/60">
            {items.length}
          </span>
        )}
      </div>
      
      {items.length === 0 ? (
        <p className="text-sm text-white/40 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 4).map((item, index) => (
            <li 
              key={index}
              className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
            >
              <div className="w-1.5 h-1.5 mt-2 rounded-full bg-white/30" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate group-hover:text-white transition-colors">
                  {item.title || item.name || item.subject}
                </p>
                {item.date && (
                  <p className="text-xs font-mono text-white/40">{formatDate(item.date)}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </li>
          ))}
          {items.length > 4 && (
            <li className="text-sm text-white/40 pl-5">+{items.length - 4} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

// Company Brain Insight Card
function BrainInsightCard({ insight, testId }) {
  return (
    <div 
      className="relative bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-5 overflow-hidden"
      data-testid={testId}
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono uppercase tracking-[0.15em] text-emerald-400/70">Company Brain</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}

// Activity Timeline Item
function ActivityItem({ event, testId }) {
  const iconMap = {
    created: CheckCircle2,
    updated: FileText,
    status_changed: Target,
    tender_created: FileText,
    tender_submitted: FileText,
    document_added: FileText,
    rfi_submitted: HelpCircle,
    communication_logged: MessageSquare,
    site_visit: MapPin,
    note_added: FileText
  };
  
  const Icon = iconMap[event.event_type] || FileText;
  
  return (
    <div className="flex gap-4 group" data-testid={testId}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center group-hover:border-white/30 transition-colors">
          <Icon className="w-3.5 h-3.5 text-white/50" />
        </div>
        <div className="w-px flex-1 bg-[#262626] mt-2" />
      </div>
      <div className="flex-1 pb-6">
        <p className="text-sm text-white/80">{event.event_title}</p>
        <p className="text-xs font-mono text-white/40 mt-1">{formatRelativeTime(event.created_at)}</p>
      </div>
    </div>
  );
}

export default function OverviewTab({ opportunity, workspaceSummary, onRefresh, session }) {
  if (!opportunity) return null;

  const daysUntilDue = getDaysUntil(opportunity.tender_due_date);
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  // Mock data for now - will be populated from workspaceSummary
  const outstandingRFIs = [];
  const pendingDocuments = [];
  const recentActivity = workspaceSummary?.recent_activity || [];

  // Sample Company Brain insights (will come from AI)
  const brainInsights = [
    "This project type typically has a 68% win rate for your team.",
    "Similar projects averaged 12% material waste—consider adding contingency.",
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="overview-tab">
      {/* Top Row: North Star Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Stage"
          value={STAGE_LABELS[opportunity.status] || 'Unknown'}
          subtext={opportunity.status === 'tendering' ? 'Active estimating' : null}
          icon={Target}
          testId="metric-stage"
        />
        <MetricCard
          label="Estimated Value"
          value={formatCurrency(opportunity.estimated_value)}
          icon={DollarSign}
          testId="metric-value"
        />
        <MetricCard
          label="Due Date"
          value={formatDate(opportunity.tender_due_date)}
          subtext={daysUntilDue !== null ? (isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`) : null}
          icon={Calendar}
          variant={isOverdue ? 'danger' : isUrgent ? 'warning' : 'default'}
          testId="metric-due"
        />
        <MetricCard
          label="Win Confidence"
          value={opportunity.confidence_percent ? `${opportunity.confidence_percent}%` : '—'}
          icon={TrendingUp}
          testId="metric-confidence"
        />
      </div>

      {/* Main Grid: Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Key Details & Outstanding Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Details Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-6" data-testid="key-details-card">
            <h3 className="text-sm font-medium text-white/80 mb-5">Key Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Client */}
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Client</p>
                <div className="space-y-2">
                  {opportunity.client_company && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Building2 className="w-4 h-4 text-white/40" />
                      <span>{opportunity.client_company}</span>
                    </div>
                  )}
                  {opportunity.client_name && (
                    <div className="flex items-center gap-2 text-white/70">
                      <User className="w-4 h-4 text-white/40" />
                      <span>{opportunity.client_name}</span>
                    </div>
                  )}
                  {opportunity.client_email && (
                    <a href={`mailto:${opportunity.client_email}`} className="flex items-center gap-2 text-white/70 hover:text-emerald-400 transition-colors">
                      <Mail className="w-4 h-4 text-white/40" />
                      <span className="truncate">{opportunity.client_email}</span>
                    </a>
                  )}
                  {opportunity.client_phone && (
                    <a href={`tel:${opportunity.client_phone}`} className="flex items-center gap-2 text-white/70 hover:text-emerald-400 transition-colors">
                      <Phone className="w-4 h-4 text-white/40" />
                      <span>{opportunity.client_phone}</span>
                    </a>
                  )}
                  {!opportunity.client_company && !opportunity.client_name && (
                    <p className="text-white/40 italic">No client assigned</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Site Location</p>
                <div className="space-y-2">
                  {opportunity.site_address ? (
                    <>
                      <div className="flex items-start gap-2 text-white/70">
                        <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
                        <div>
                          <p>{opportunity.site_address}</p>
                          <p>{opportunity.site_city}, {opportunity.site_province || 'BC'}</p>
                          {opportunity.site_postal_code && <p>{opportunity.site_postal_code}</p>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-white/40 italic">No address provided</p>
                  )}
                </div>
              </div>

              {/* Project Type */}
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Project Type</p>
                <p className="text-white/70">{opportunity.project_type || '—'}</p>
                {opportunity.work_type && (
                  <p className="text-white/50 text-sm mt-1">{opportunity.work_type.replace(/_/g, ' ')}</p>
                )}
              </div>

              {/* Trade */}
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Trade Category</p>
                <p className="text-white/70">{opportunity.trade_category || '—'}</p>
              </div>
            </div>

            {/* Scope Summary */}
            {opportunity.scope_summary && (
              <div className="mt-6 pt-6 border-t border-[#262626]">
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-2">Scope Summary</p>
                <p className="text-white/70 leading-relaxed">{opportunity.scope_summary}</p>
              </div>
            )}
          </div>

          {/* Outstanding Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OutstandingCard
              title="Outstanding RFIs"
              items={outstandingRFIs}
              icon={HelpCircle}
              emptyText="No outstanding RFIs"
              color="amber"
              testId="outstanding-rfis"
            />
            <OutstandingCard
              title="Pending Documents"
              items={pendingDocuments}
              icon={FileText}
              emptyText="No pending documents"
              testId="pending-documents"
            />
          </div>

          {/* Tender Summary */}
          {workspaceSummary?.current_tender && (
            <div className="bg-[#111111] border border-[#262626] rounded-xl p-6" data-testid="tender-summary-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/80">Current Tender</h3>
                <span className="px-2 py-1 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full">
                  v{workspaceSummary.current_tender.version_number}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-mono tracking-tight text-white">
                  {formatCurrency(workspaceSummary.current_tender.total)}
                </p>
                <span className="text-white/50">total</span>
              </div>
              <p className="text-xs font-mono text-white/40 mt-2">
                Last updated {formatRelativeTime(workspaceSummary.current_tender.updated_at)}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Company Brain & Activity */}
        <div className="space-y-6">
          {/* Company Brain Insights */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white/80">Company Brain Insights</h3>
            </div>
            {brainInsights.map((insight, index) => (
              <BrainInsightCard 
                key={index} 
                insight={insight} 
                testId={`brain-insight-${index}`}
              />
            ))}
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-5" data-testid="activity-timeline">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-white/80">Recent Activity</h3>
              <button className="text-xs text-white/50 hover:text-white transition-colors">
                View all
              </button>
            </div>
            
            {recentActivity.length === 0 ? (
              <p className="text-sm text-white/40 italic">No activity yet</p>
            ) : (
              <div>
                {recentActivity.map((event, index) => (
                  <ActivityItem 
                    key={event.id || index} 
                    event={event}
                    testId={`activity-item-${index}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
