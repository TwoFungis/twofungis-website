/**
 * Placeholder Tabs for Opportunity Workspace
 * ==========================================
 * These will be fully implemented in future iterations.
 * Each tab maintains the workspace design language.
 */

import React from 'react';
import {
  DollarSign,
  FileText,
  MessageSquare,
  HelpCircle,
  MapPin,
  CalendarDays,
  Activity,
  Sparkles,
  Construction,
  Clock
} from 'lucide-react';

// Placeholder component for tabs under construction
function PlaceholderTab({ title, icon: Icon, description, testId }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" data-testid={testId}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center">
        <Icon className="w-8 h-8 text-white/30" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <p className="text-white/50 max-w-md leading-relaxed">{description}</p>
      <div className="mt-8 flex items-center gap-2 text-white/30">
        <Construction className="w-4 h-4" />
        <span className="text-sm font-mono">Coming soon</span>
      </div>
    </div>
  );
}

export function EstimateTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Estimate"
      icon={DollarSign}
      description="Build detailed cost estimates with labor, materials, equipment, and subcontractor costs. Connect to the Production Library for accurate production rates."
      testId="estimate-tab"
    />
  );
}

export function ProposalTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Proposal"
      icon={FileText}
      description="Generate professional proposals from your estimate. Include scope of work, terms, and conditions. Export as PDF for client delivery."
      testId="proposal-tab"
    />
  );
}

export function DocumentsTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Documents"
      icon={FileText}
      description="Manage all project documents including drawings, specifications, addendums, and contracts. Track versions and revisions."
      testId="documents-tab"
    />
  );
}

export function CommunicationsTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Communications"
      icon={MessageSquare}
      description="Log all communications related to this opportunity. Track emails, phone calls, meetings, and site visits in one place."
      testId="communications-tab"
    />
  );
}

export function RFIsTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="RFIs"
      icon={HelpCircle}
      description="Manage Requests for Information. Track questions to architects, engineers, and clients. Log responses and their impact on the project."
      testId="rfis-tab"
    />
  );
}

export function SiteNotesTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Site Notes"
      icon={MapPin}
      description="Record observations from site visits. Document existing conditions, access points, and potential challenges. Attach photos directly."
      testId="site-notes-tab"
    />
  );
}

export function ScheduleTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Schedule"
      icon={CalendarDays}
      description="Plan project timelines and milestones. Track key dates including tender submission, site visits, and project start."
      testId="schedule-tab"
    />
  );
}

export function ActivityTimelineTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <PlaceholderTab
      title="Activity Timeline"
      icon={Activity}
      description="Complete history of this opportunity. Every document, communication, tender revision, and status change is recorded here."
      testId="activity-timeline-tab"
    />
  );
}

export function CompanyBrainTab({ opportunity, workspaceSummary, onRefresh, session }) {
  return (
    <div className="py-12" data-testid="company-brain-tab">
      <div className="max-w-2xl mx-auto">
        {/* Brain Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">Company Brain</h2>
          <p className="text-white/50 leading-relaxed">
            Your operations intelligence—quietly surfacing insights from past projects 
            to make every estimate smarter.
          </p>
        </div>

        {/* Sample Insights */}
        <div className="space-y-4">
          <InsightCard
            title="Similar Project Match"
            content="This project closely resembles 'East Peak Building B' completed in 2024. Consider reviewing that estimate for reference pricing."
            confidence={87}
          />
          <InsightCard
            title="Production Rate Suggestion"
            content="Your team's historical drywall hanging rate for commercial projects averages 52 sheets/day. The industry standard is 45 sheets/day."
            confidence={92}
          />
          <InsightCard
            title="Risk Detection"
            content="Projects in this postal code have historically required 15% more travel time. Consider adjusting your travel costs."
            confidence={78}
          />
        </div>

        <p className="text-center text-white/30 text-sm mt-10 font-mono">
          <Clock className="w-4 h-4 inline mr-2" />
          Company Brain learns from every completed project
        </p>
      </div>
    </div>
  );
}

function InsightCard({ title, content, confidence }) {
  return (
    <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-medium text-white/90">{title}</h4>
        </div>
        {confidence && (
          <span className="text-xs font-mono text-emerald-400/70">{confidence}% match</span>
        )}
      </div>
      <p className="text-sm text-white/70 leading-relaxed">{content}</p>
    </div>
  );
}
