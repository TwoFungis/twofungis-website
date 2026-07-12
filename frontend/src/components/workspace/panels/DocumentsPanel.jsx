/**
 * DocumentsPanel.jsx
 * ==================
 * Contextual panel for viewing and managing documents.
 * Slides up from the dock when activated.
 */

import React, { useState } from 'react';
import {
  Search,
  Upload,
  FileText,
  Image,
  File,
  ChevronRight,
  Download,
  ExternalLink,
  Folder,
  Filter
} from 'lucide-react';

// Document type icons
const DOC_ICONS = {
  drawing: FileText,
  specification: FileText,
  addendum: FileText,
  photo: Image,
  contract: File,
  other: File
};

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric'
  });
}

export default function DocumentsPanel({ opportunityId, session }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  
  // TODO: Fetch documents from API
  const documents = [];

  return (
    <div className="h-full flex flex-col" data-testid="documents-panel">
      {/* Search and actions */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#262626] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 text-sm"
              data-testid="docs-search"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            data-testid="upload-btn"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
        
        {/* Type filter */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto">
          {['all', 'drawings', 'specs', 'photos', 'other'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Documents list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">No documents yet</p>
            <p className="text-white/30 text-sm">Upload drawings, specs, and other project files</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = DOC_ICONS[doc.document_type] || File;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate group-hover:text-white transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {doc.file_type?.toUpperCase()} · {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-white/40 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-white/40 hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
