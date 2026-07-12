/**
 * CommandCenter.jsx
 * =================
 * The contractor's morning briefing.
 * Answers one question: "What should I work on next?"
 * 
 * Not a dashboard. Not charts. 
 * Prioritized actions. One action per card.
 * 
 * Focus Layer Integration:
 * - Clicking an action sets the workspace focus
 * - Cards adapt based on current opportunity state
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  Send,
  Sparkles,
  Target,
  Upload,
  Building2,
  DollarSign,
  Calendar,
  User,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useWorkspace } from './WorkspaceShell';

// ============================================================
// PRIORITY LEVELS
// ============================================================

const PRIORITY = {
  CRITICAL: { color: 'border-red-500/50 bg-red-500/5', icon: 'text-red-400', dot: 'bg-red-500' },
  HIGH: { color: 'border-amber-500/50 bg-amber-500/5', icon: 'text-amber-400', dot: 'bg-amber-500' },
  MEDIUM: { color: 'border-blue-500/30 bg-blue-500/5', icon: 'text-blue-400', dot: 'bg-blue-500' },
  LOW: { color: 'border-[#262626] bg-[#111111]', icon: 'text-white/50', dot: 'bg-white/30' }
};

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatCurrency(value) {
  if (!value && value !== 0) return '—';
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

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ============================================================
// ACTION CARD COMPONENT
// ============================================================

function ActionCard({ 
  priority = 'LOW',
  title,
  subtitle,
  brainInsight,
  actionLabel,
  actionIcon: ActionIcon = ChevronRight,
  onAction,
  testId
}) {
  const config = PRIORITY[priority] || PRIORITY.LOW;
  
  return (
    <div 
      className={`
        relative border rounded-xl p-5 transition-all duration-200
        hover:border-white/30 hover:-translate-y-[2px] cursor-pointer group
        ${config.color}
      `}
      onClick={onAction}
      data-testid={testId}
    >
      {/* Priority indicator */}
      <div className={`absolute top-5 left-5 w-2 h-2 rounded-full ${config.dot}`} />
      
      {/* Content */}
      <div className="pl-5">
        <h3 className="text-sm font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-white/50 mb-3">{subtitle}</p>
        )}
        
        {/* Brain insight */}
        {brainInsight && (
          <div className="flex items-start gap-2 mb-4 p-2 -mx-2 rounded-lg bg-emerald-500/5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-400/90 leading-relaxed">{brainInsight}</p>
          </div>
        )}
        
        {/* Action */}
        <button 
          className="flex items-center gap-2 text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
        >
          <span>{actionLabel}</span>
          <ActionIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================

function StatCard({ label, value, subtext, icon: Icon, onClick, testId }) {
  return (
    <div 
      className={`
        bg-[#111111] border border-[#262626] rounded-xl p-5 
        transition-all duration-200 
        ${onClick ? 'cursor-pointer hover:border-white/20 hover:-translate-y-[2px]' : ''}
      `}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-white/30" />}
      </div>
      <p className="text-xl font-mono tracking-tight text-white">{value}</p>
      {subtext && <p className="text-xs text-white/50 mt-1">{subtext}</p>}
    </div>
  );
}

// ============================================================
// CONTACT CARD COMPONENT
// ============================================================

function ContactCard({ label, name, company, email, phone, testId }) {
  return (
    <div 
      className="bg-[#111111] border border-[#262626] rounded-xl p-5"
      data-testid={testId}
    >
      <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">{label}</p>
      
      {name || company ? (
        <div className="space-y-2">
          {company && (
            <div className="flex items-center gap-2 text-white/80">
              <Building2 className="w-4 h-4 text-white/40" />
              <span className="text-sm">{company}</span>
            </div>
          )}
          {name && (
            <div className="flex items-center gap-2 text-white/70">
              <User className="w-4 h-4 text-white/40" />
              <span className="text-sm">{name}</span>
            </div>
          )}
          {email && (
            <a 
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-white/40" />
              <span className="text-sm truncate">{email}</span>
            </a>
          )}
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors"
            >
              <Phone className="w-4 h-4 text-white/40" />
              <span className="text-sm">{phone}</span>
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-white/40 italic">Not assigned</p>
      )}
    </div>
  );
}

// ============================================================
// COMMAND CENTER COMPONENT
// ============================================================

export default function CommandCenter({ opportunity, workspaceSummary, onRefresh }) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { setActiveTab, setCurrentFocus, openPanel } = useWorkspace();
  
  if (!opportunity) return null;
  
  // Calculate metrics
  const daysUntilDue = getDaysUntil(opportunity.tender_due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
  
  // Get tender info
  const tender = workspaceSummary?.current_tender;
  const tenderTotal = tender?.total || 0;
  const estimatedValue = opportunity.estimated_value || 0;
  const completionPercent = estimatedValue > 0 
    ? Math.min(Math.round((tenderTotal / estimatedValue) * 100), 100)
    : 0;
  
  // Build action items (prioritized)
  const actionItems = [];
  
  // Check for overdue RFIs
  if (workspaceSummary?.rfi_count > 0) {
    actionItems.push({
      priority: 'CRITICAL',
      title: `${workspaceSummary.rfi_count} Outstanding RFI${workspaceSummary.rfi_count > 1 ? 's' : ''}`,
      subtitle: 'Requires response',
      brainInsight: 'Similar RFIs averaged 2-day response time',
      actionLabel: 'Review RFIs',
      onAction: () => openPanel('rfis')
    });
  }
  
  // Tender due soon
  if (opportunity.status === 'tendering' && daysUntilDue !== null) {
    actionItems.push({
      priority: isOverdue ? 'CRITICAL' : isUrgent ? 'HIGH' : 'MEDIUM',
      title: isOverdue 
        ? `Tender overdue by ${Math.abs(daysUntilDue)} days`
        : `Tender due in ${daysUntilDue} days`,
      subtitle: tender 
        ? `Estimate ${completionPercent}% complete · ${formatCurrency(tenderTotal)}`
        : 'No tender started',
      brainInsight: !tender 
        ? 'Start your estimate to track progress'
        : completionPercent < 50 
        ? 'Focus on high-value sections first'
        : null,
      actionLabel: tender ? 'Continue Estimate' : 'Start Tender',
      actionIcon: tender ? ChevronRight : FileText,
      onAction: () => {
        setActiveTab('tender');
        setCurrentFocus('estimating', { tenderId: tender?.id });
      }
    });
  }
  
  // Documents need review
  if (workspaceSummary?.document_count > 0) {
    actionItems.push({
      priority: 'LOW',
      title: `${workspaceSummary.document_count} documents uploaded`,
      subtitle: 'Review for changes',
      actionLabel: 'View Documents',
      onAction: () => openPanel('documents')
    });
  }
  
  // Qualifying stage - need more info
  if (opportunity.status === 'qualifying') {
    if (!opportunity.site_address) {
      actionItems.push({
        priority: 'HIGH',
        title: 'Site information missing',
        subtitle: 'Add address and site details',
        actionLabel: 'Add Details',
        onAction: () => setActiveTab('info')
      });
    }
    
    if (!opportunity.client_email && !opportunity.client_phone) {
      actionItems.push({
        priority: 'MEDIUM',
        title: 'Client contact missing',
        subtitle: 'Add client information',
        actionLabel: 'Add Contact',
        onAction: () => setActiveTab('info')
      });
    }
  }
  
  // Submitted - waiting for response
  if (opportunity.status === 'submitted') {
    actionItems.push({
      priority: 'MEDIUM',
      title: 'Proposal submitted',
      subtitle: tender ? `${formatCurrency(tender.total)} · Submitted ${formatRelativeTime(tender.submitted_at)}` : 'Awaiting response',
      brainInsight: 'Average response time for similar projects: 5 days',
      actionLabel: 'Log Follow-up',
      actionIcon: Phone,
      onAction: () => openPanel('communications')
    });
  }
  
  // Negotiation stage
  if (opportunity.status === 'negotiation') {
    actionItems.push({
      priority: 'HIGH',
      title: 'In negotiation',
      subtitle: 'Client may request revisions',
      actionLabel: 'Review Tender',
      onAction: () => {
        setActiveTab('tender');
        setCurrentFocus('reviewing', { tenderId: tender?.id });
      }
    });
  }
  
  // Default action if nothing else
  if (actionItems.length === 0) {
    actionItems.push({
      priority: 'LOW',
      title: 'Workspace ready',
      subtitle: 'No immediate actions required',
      actionLabel: 'View Details',
      onAction: () => setActiveTab('info')
    });
  }
  
  // Limit to top 5 actions
  const topActions = actionItems.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in" data-testid="command-center">
      {/* FOCUS SECTION - Priority Actions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-medium text-white/80">Focus</h2>
          <span className="text-xs font-mono text-white/40">What needs attention</span>
        </div>
        
        <div className="space-y-3">
          {topActions.map((action, index) => (
            <ActionCard
              key={index}
              priority={action.priority}
              title={action.title}
              subtitle={action.subtitle}
              brainInsight={action.brainInsight}
              actionLabel={action.actionLabel}
              actionIcon={action.actionIcon}
              onAction={action.onAction}
              testId={`action-${index}`}
            />
          ))}
        </div>
      </section>
      
      {/* STATS ROW */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Status"
          value={opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
          icon={Target}
          testId="stat-status"
        />
        <StatCard
          label="Value"
          value={formatCurrency(opportunity.estimated_value)}
          icon={DollarSign}
          testId="stat-value"
        />
        <StatCard
          label="Due Date"
          value={formatDate(opportunity.tender_due_date)}
          subtext={daysUntilDue !== null 
            ? (isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d remaining`)
            : null
          }
          icon={Calendar}
          testId="stat-due"
        />
        <StatCard
          label="Confidence"
          value={opportunity.confidence_percent ? `${opportunity.confidence_percent}%` : '—'}
          icon={Target}
          testId="stat-confidence"
        />
      </section>
      
      {/* TENDER STATUS (if exists) */}
      {tender && (
        <section>
          <div 
            className="bg-[#111111] border border-[#262626] rounded-xl p-6 cursor-pointer hover:border-white/20 transition-colors"
            onClick={() => setActiveTab('tender')}
            data-testid="tender-status-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-white">Current Tender</span>
                <span className="px-2 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full">
                  v{tender.version_number}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </div>
            
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-mono tracking-tight text-white">
                {formatCurrency(tender.total)}
              </span>
              <span className="text-sm text-white/50">total</span>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Estimate progress</span>
                <span className="font-mono text-white/70">{completionPercent}%</span>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* KEY CONTACTS */}
      <section>
        <h2 className="text-sm font-medium text-white/80 mb-4">Key Contacts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ContactCard
            label="Client"
            name={opportunity.client_name}
            company={opportunity.client_company}
            email={opportunity.client_email}
            phone={opportunity.client_phone}
            testId="contact-client"
          />
          <ContactCard
            label="Builder"
            name={opportunity.builder_name}
            company={opportunity.builder_company}
            email={opportunity.builder_email}
            phone={opportunity.builder_phone}
            testId="contact-builder"
          />
        </div>
      </section>
      
      {/* LOCATION */}
      {(opportunity.site_address || opportunity.site_city) && (
        <section>
          <h2 className="text-sm font-medium text-white/80 mb-4">Site Location</h2>
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
              <div>
                {opportunity.site_address && <p className="text-white/80">{opportunity.site_address}</p>}
                <p className="text-white/60">
                  {opportunity.site_city}{opportunity.site_province ? `, ${opportunity.site_province}` : ''}
                </p>
                {opportunity.site_postal_code && (
                  <p className="text-white/50 text-sm">{opportunity.site_postal_code}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
