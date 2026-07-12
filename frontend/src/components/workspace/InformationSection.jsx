/**
 * InformationSection.jsx
 * ======================
 * Consolidated reference material section.
 * Unified view of Documents, RFIs, Communications, Site Notes.
 * 
 * Clicking an item opens it in the contextual panel.
 */

import React, { useState } from 'react';
import {
  Search,
  FileText,
  HelpCircle,
  MessageSquare,
  MapPin,
  ChevronRight,
  Filter,
  Upload,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Clock
} from 'lucide-react';
import { useWorkspace } from './WorkspaceShell';

// ============================================================
// FORMAT HELPERS
// ============================================================

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
  
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateString);
}

// ============================================================
// CATEGORY CARD COMPONENT
// ============================================================

function CategoryCard({ icon: Icon, label, count, isActive, onClick, testId }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
        ${isActive 
          ? 'bg-white/10 border-white/30 text-white' 
          : 'bg-[#111111] border-[#262626] text-white/60 hover:text-white hover:border-white/20'
        }
      `}
      data-testid={testId}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
      {count > 0 && (
        <span className="px-2 py-0.5 text-xs font-mono bg-white/10 rounded-full">{count}</span>
      )}
    </button>
  );
}

// ============================================================
// INFORMATION SECTION COMPONENT
// ============================================================

export default function InformationSection({ opportunity, workspaceSummary, onRefresh, session }) {
  const { openPanel } = useWorkspace();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!opportunity) return null;
  
  // Counts
  const docCount = workspaceSummary?.document_count || 0;
  const rfiCount = workspaceSummary?.rfi_count || 0;
  const commCount = 0; // TODO: Get from API
  const siteCount = 0; // TODO: Get from API

  return (
    <div className="space-y-6" data-testid="information-section">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search documents, RFIs, communications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#111111] border border-[#262626] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
          data-testid="info-search"
        />
      </div>
      
      {/* Category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CategoryCard
          icon={FileText}
          label="Documents"
          count={docCount}
          isActive={activeFilter === 'documents'}
          onClick={() => {
            setActiveFilter(activeFilter === 'documents' ? 'all' : 'documents');
            openPanel('documents');
          }}
          testId="cat-documents"
        />
        <CategoryCard
          icon={HelpCircle}
          label="RFIs"
          count={rfiCount}
          isActive={activeFilter === 'rfis'}
          onClick={() => {
            setActiveFilter(activeFilter === 'rfis' ? 'all' : 'rfis');
            openPanel('rfis');
          }}
          testId="cat-rfis"
        />
        <CategoryCard
          icon={MessageSquare}
          label="Communications"
          count={commCount}
          isActive={activeFilter === 'communications'}
          onClick={() => {
            setActiveFilter(activeFilter === 'communications' ? 'all' : 'communications');
            openPanel('communications');
          }}
          testId="cat-communications"
        />
        <CategoryCard
          icon={MapPin}
          label="Site Notes"
          count={siteCount}
          isActive={activeFilter === 'site-notes'}
          onClick={() => {
            setActiveFilter(activeFilter === 'site-notes' ? 'all' : 'site-notes');
            openPanel('site-notes');
          }}
          testId="cat-site-notes"
        />
      </div>
      
      {/* Key Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client & Contacts */}
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="text-sm font-medium text-white/80 mb-5">Contacts</h3>
          
          <div className="space-y-6">
            {/* Client */}
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">Client</p>
              {opportunity.client_company || opportunity.client_name ? (
                <div className="space-y-2">
                  {opportunity.client_company && (
                    <div className="flex items-center gap-2 text-white/80">
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
                    <a href={`mailto:${opportunity.client_email}`} className="flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors">
                      <Mail className="w-4 h-4 text-white/40" />
                      <span className="truncate">{opportunity.client_email}</span>
                    </a>
                  )}
                  {opportunity.client_phone && (
                    <a href={`tel:${opportunity.client_phone}`} className="flex items-center gap-2 text-white/60 hover:text-emerald-400 transition-colors">
                      <Phone className="w-4 h-4 text-white/40" />
                      <span>{opportunity.client_phone}</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-white/40 italic">No client assigned</p>
              )}
            </div>
            
            {/* Builder */}
            {(opportunity.builder_company || opportunity.builder_name) && (
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">Builder</p>
                <div className="space-y-2">
                  {opportunity.builder_company && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Building2 className="w-4 h-4 text-white/40" />
                      <span>{opportunity.builder_company}</span>
                    </div>
                  )}
                  {opportunity.builder_name && (
                    <div className="flex items-center gap-2 text-white/70">
                      <User className="w-4 h-4 text-white/40" />
                      <span>{opportunity.builder_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Architect */}
            {(opportunity.architect_company || opportunity.architect_name) && (
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">Architect</p>
                <div className="space-y-2">
                  {opportunity.architect_company && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Building2 className="w-4 h-4 text-white/40" />
                      <span>{opportunity.architect_company}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Location & Project Info */}
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="text-sm font-medium text-white/80 mb-5">Project Details</h3>
          
          <div className="space-y-6">
            {/* Location */}
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">Site Location</p>
              {opportunity.site_address ? (
                <div className="flex items-start gap-2 text-white/70">
                  <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
                  <div>
                    <p>{opportunity.site_address}</p>
                    <p>{opportunity.site_city}, {opportunity.site_province || 'BC'}</p>
                    {opportunity.site_postal_code && <p>{opportunity.site_postal_code}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-white/40 italic">No address provided</p>
              )}
            </div>
            
            {/* Project Type */}
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">Classification</p>
              <div className="space-y-2">
                {opportunity.project_type && (
                  <p className="text-white/70 capitalize">{opportunity.project_type}</p>
                )}
                {opportunity.work_type && (
                  <p className="text-white/50 text-sm capitalize">{opportunity.work_type.replace(/_/g, ' ')}</p>
                )}
                {opportunity.trade_category && (
                  <p className="text-white/50 text-sm">{opportunity.trade_category}</p>
                )}
              </div>
            </div>
            
            {/* Key Dates */}
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-white/40 mb-3">Key Dates</p>
              <div className="space-y-2">
                {opportunity.tender_due_date && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span>Due: {formatDate(opportunity.tender_due_date)}</span>
                  </div>
                )}
                {opportunity.site_visit_date && (
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span>Site Visit: {formatDate(opportunity.site_visit_date)}</span>
                  </div>
                )}
                {opportunity.project_start_date && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span>Start: {formatDate(opportunity.project_start_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scope Summary */}
      {opportunity.scope_summary && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4">Scope Summary</h3>
          <p className="text-white/70 leading-relaxed">{opportunity.scope_summary}</p>
        </div>
      )}
    </div>
  );
}
