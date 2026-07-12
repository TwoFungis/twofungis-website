/**
 * SiteNotesPanel.jsx
 * ==================
 * Contextual panel for viewing and adding site notes.
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Camera,
  Users
} from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function SiteNotesPanel({ opportunityId, session }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // TODO: Fetch site notes from API
  const siteNotes = [];

  return (
    <div className="h-full flex flex-col" data-testid="site-notes-panel">
      {/* Search and actions */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search site notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#262626] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 text-sm"
              data-testid="sites-search"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            data-testid="add-note-btn"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>
      </div>
      
      {/* Site notes list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {siteNotes.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-2">No site notes yet</p>
            <p className="text-white/30 text-sm">Record observations from site visits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {siteNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg bg-[#111111] border border-[#262626] hover:border-white/20 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {note.title}
                  </h4>
                  <span className="text-xs text-white/40">{formatDate(note.visit_date)}</span>
                </div>
                <p className="text-xs text-white/50 line-clamp-2 mb-3">{note.notes}</p>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  {note.attendees?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{note.attendees.length} attendees</span>
                    </div>
                  )}
                  {note.photo_ids?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{note.photo_ids.length} photos</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
