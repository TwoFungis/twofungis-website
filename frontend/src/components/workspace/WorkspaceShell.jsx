/**
 * WorkspaceShell.jsx
 * ==================
 * The universal workspace container for TradeOS.
 * Implements the panel-first operating system design.
 * 
 * Architecture V2 + Focus Layer + Workspace Memory
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ HEADER                                                       │
 * ├────────────────────────────────────────────────┬─────────────┤
 * │                                                │             │
 * │  PRIMARY WORKSPACE                             │  TIMELINE   │
 * │  [Tab 1] [Tab 2] [Tab 3]                       │  (Persistent)│
 * │                                                │             │
 * │  ╔════════════════════════════════════════╗   │             │
 * │  ║  FOCUS AREA (Current Work)             ║   │             │
 * │  ╚════════════════════════════════════════╝   │             │
 * │                                                │             │
 * │  💡 Ambient Brain Suggestion                   │             │
 * │                                                │             │
 * ├────────────────────────────────────────────────┴─────────────┤
 * │  PANEL DOCK: [Documents] [RFIs] [Comms] [Sites] [+ Pin]      │
 * └──────────────────────────────────────────────────────────────┘
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

// ============================================================
// WORKSPACE CONTEXT
// ============================================================
// Provides focus state, panel management, and memory to all children

const WorkspaceContext = createContext(null);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceShell');
  }
  return context;
}

// ============================================================
// WORKSPACE MEMORY
// ============================================================
// Persists workspace state to localStorage

function getWorkspaceMemory(workspaceId) {
  try {
    const stored = localStorage.getItem(`tradeos_workspace_${workspaceId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setWorkspaceMemory(workspaceId, state) {
  try {
    localStorage.setItem(`tradeos_workspace_${workspaceId}`, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

// ============================================================
// WORKSPACE SHELL COMPONENT
// ============================================================

export default function WorkspaceShell({
  workspaceId,           // Unique ID for memory persistence (e.g., "opportunity_abc123")
  workspaceType,         // Type for consistent behavior (e.g., "opportunity", "project")
  header,                // Header component (receives workspace context)
  tabs,                  // Array of { id, label, icon, component }
  timeline,              // Timeline component
  dockPanels,            // Array of { id, label, icon, component, badge }
  defaultTab,            // Default active tab
  defaultFocus,          // Default focus state
  children               // Optional additional content
}) {
  // ============================================================
  // STATE
  // ============================================================
  
  // Load saved state from memory
  const savedState = getWorkspaceMemory(workspaceId);
  
  // Active tab (Command Center, Tender, Information)
  const [activeTab, setActiveTab] = useState(savedState?.activeTab || defaultTab || tabs[0]?.id);
  
  // Current focus (what the user is actively working on)
  const [focus, setFocus] = useState(savedState?.focus || defaultFocus || null);
  
  // Timeline visibility
  const [timelineVisible, setTimelineVisible] = useState(savedState?.timelineVisible ?? true);
  
  // Timeline filter
  const [timelineFilter, setTimelineFilter] = useState(savedState?.timelineFilter || 'all');
  
  // Active dock panel (only one at a time)
  const [activeDockPanel, setActiveDockPanel] = useState(null);
  
  // Dock panel height (collapsed, half, full)
  const [dockPanelHeight, setDockPanelHeight] = useState('half');
  
  // Pinned panels (user preference)
  const [pinnedPanels, setPinnedPanels] = useState(savedState?.pinnedPanels || []);
  
  // Expanded sections memory (for estimate sections, etc.)
  const [expandedSections, setExpandedSections] = useState(savedState?.expandedSections || {});
  
  // ============================================================
  // MEMORY PERSISTENCE
  // ============================================================
  
  // Save state changes to memory
  useEffect(() => {
    const state = {
      activeTab,
      focus,
      timelineVisible,
      timelineFilter,
      pinnedPanels,
      expandedSections,
      lastVisited: new Date().toISOString()
    };
    setWorkspaceMemory(workspaceId, state);
  }, [workspaceId, activeTab, focus, timelineVisible, timelineFilter, pinnedPanels, expandedSections]);
  
  // ============================================================
  // FOCUS MANAGEMENT
  // ============================================================
  
  // Set the current focus (what user is working on)
  const setCurrentFocus = useCallback((focusType, focusData = {}) => {
    setFocus({ type: focusType, ...focusData, timestamp: Date.now() });
  }, []);
  
  // Clear focus (return to neutral state)
  const clearFocus = useCallback(() => {
    setFocus(null);
  }, []);
  
  // ============================================================
  // PANEL MANAGEMENT
  // ============================================================
  
  // Open a dock panel
  const openPanel = useCallback((panelId) => {
    setActiveDockPanel(panelId);
    setDockPanelHeight('half');
  }, []);
  
  // Close the active dock panel
  const closePanel = useCallback(() => {
    setActiveDockPanel(null);
  }, []);
  
  // Toggle panel height
  const togglePanelHeight = useCallback(() => {
    setDockPanelHeight(current => current === 'half' ? 'full' : 'half');
  }, []);
  
  // Pin/unpin a panel
  const togglePinPanel = useCallback((panelId) => {
    setPinnedPanels(current => 
      current.includes(panelId)
        ? current.filter(id => id !== panelId)
        : [...current, panelId]
    );
  }, []);
  
  // ============================================================
  // SECTION MEMORY
  // ============================================================
  
  // Toggle section expanded state
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(current => ({
      ...current,
      [sectionId]: !current[sectionId]
    }));
  }, []);
  
  // Check if section is expanded
  const isSectionExpanded = useCallback((sectionId) => {
    return expandedSections[sectionId] ?? true; // Default expanded
  }, [expandedSections]);
  
  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  
  const contextValue = {
    // Identity
    workspaceId,
    workspaceType,
    
    // Navigation
    activeTab,
    setActiveTab,
    
    // Focus Layer
    focus,
    setCurrentFocus,
    clearFocus,
    
    // Timeline
    timelineVisible,
    setTimelineVisible,
    timelineFilter,
    setTimelineFilter,
    
    // Panels
    activeDockPanel,
    openPanel,
    closePanel,
    dockPanelHeight,
    togglePanelHeight,
    pinnedPanels,
    togglePinPanel,
    
    // Section Memory
    expandedSections,
    toggleSection,
    isSectionExpanded
  };
  
  // ============================================================
  // RENDER
  // ============================================================
  
  // Find active tab component
  const activeTabConfig = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveTabComponent = activeTabConfig?.component;
  
  // Find active dock panel component
  const activePanelConfig = dockPanels?.find(p => p.id === activeDockPanel);
  const ActivePanelComponent = activePanelConfig?.component;
  
  // Sort dock panels: pinned first, then by order
  const sortedDockPanels = dockPanels ? [
    ...dockPanels.filter(p => pinnedPanels.includes(p.id)),
    ...dockPanels.filter(p => !pinnedPanels.includes(p.id))
  ] : [];

  return (
    <WorkspaceContext.Provider value={contextValue}>
      <div 
        className="min-h-screen bg-[#0a0a0a] flex flex-col"
        data-testid="workspace-shell"
        data-workspace-type={workspaceType}
        data-workspace-id={workspaceId}
      >
        {/* WORKSPACE HEADER */}
        {header}
        
        {/* MAIN WORKSPACE AREA */}
        <div className="flex-1 flex overflow-hidden">
          {/* PRIMARY WORKSPACE */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* TAB BAR */}
            <div className="border-b border-[#262626] bg-[#0a0a0a]">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
                <div className="flex items-center gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          relative flex items-center gap-2 px-5 py-4 text-sm font-medium
                          transition-all duration-200
                          ${isActive 
                            ? 'text-white' 
                            : 'text-white/50 hover:text-white/80'
                          }
                        `}
                        data-testid={`tab-${tab.id}`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{tab.label}</span>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
                {ActiveTabComponent && <ActiveTabComponent />}
              </div>
            </div>
          </div>
          
          {/* TIMELINE PANEL (Persistent Right Side) */}
          {timeline && (
            <div 
              className={`
                border-l border-[#262626] bg-[#0a0a0a] transition-all duration-300
                ${timelineVisible ? 'w-72' : 'w-0'}
              `}
            >
              {timelineVisible && (
                <div className="h-full overflow-hidden flex flex-col">
                  {/* Timeline Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                    <span className="text-xs font-mono uppercase tracking-[0.15em] text-white/50">
                      Timeline
                    </span>
                    <button
                      onClick={() => setTimelineVisible(false)}
                      className="p-1 text-white/40 hover:text-white transition-colors"
                      data-testid="collapse-timeline"
                    >
                      <PanelRightClose className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Timeline Content */}
                  <div className="flex-1 overflow-y-auto">
                    {timeline}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Timeline Toggle (when collapsed) */}
          {timeline && !timelineVisible && (
            <button
              onClick={() => setTimelineVisible(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[#111111] border border-[#262626] rounded-lg text-white/50 hover:text-white hover:border-white/30 transition-all z-20"
              data-testid="expand-timeline"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* DOCK PANEL (Slides up from bottom) */}
        {activeDockPanel && ActivePanelComponent && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-30"
              onClick={closePanel}
            />
            
            {/* Panel */}
            <div 
              className={`
                fixed bottom-0 left-0 right-0 z-40
                bg-[#0d0d0d] border-t border-[#262626]
                transition-all duration-300 ease-out
                ${dockPanelHeight === 'full' ? 'h-[85vh]' : 'h-[50vh]'}
              `}
              data-testid={`dock-panel-${activeDockPanel}`}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  {activePanelConfig.icon && (
                    <activePanelConfig.icon className="w-4 h-4 text-white/50" />
                  )}
                  <span className="text-sm font-medium text-white">
                    {activePanelConfig.label}
                  </span>
                  {activePanelConfig.badge && (
                    <span className="px-2 py-0.5 text-xs font-mono bg-white/10 rounded-full text-white/60">
                      {activePanelConfig.badge}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Pin button */}
                  <button
                    onClick={() => togglePinPanel(activeDockPanel)}
                    className={`p-1.5 rounded transition-colors ${
                      pinnedPanels.includes(activeDockPanel)
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-white/40 hover:text-white'
                    }`}
                    data-testid="pin-panel"
                    title={pinnedPanels.includes(activeDockPanel) ? 'Unpin' : 'Pin to dock'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  
                  {/* Expand/collapse */}
                  <button
                    onClick={togglePanelHeight}
                    className="p-1.5 text-white/40 hover:text-white transition-colors"
                    data-testid="toggle-panel-height"
                  >
                    {dockPanelHeight === 'full' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Close */}
                  <button
                    onClick={closePanel}
                    className="p-1.5 text-white/40 hover:text-white transition-colors"
                    data-testid="close-panel"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Panel Content */}
              <div className="h-full overflow-y-auto pb-16">
                <ActivePanelComponent />
              </div>
            </div>
          </>
        )}
        
        {/* PANEL DOCK BAR */}
        {sortedDockPanels.length > 0 && (
          <div className="border-t border-[#262626] bg-[#0a0a0a]">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
              <div className="flex items-center gap-1 py-2 overflow-x-auto">
                {sortedDockPanels.map((panel) => {
                  const Icon = panel.icon;
                  const isPinned = pinnedPanels.includes(panel.id);
                  const isActive = activeDockPanel === panel.id;
                  
                  return (
                    <button
                      key={panel.id}
                      onClick={() => isActive ? closePanel() : openPanel(panel.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                        transition-all duration-200 whitespace-nowrap
                        ${isActive 
                          ? 'bg-white/10 text-white' 
                          : isPinned
                          ? 'bg-emerald-500/5 text-white/70 hover:text-white hover:bg-white/5 border border-emerald-500/20'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                        }
                      `}
                      data-testid={`dock-${panel.id}`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{panel.label}</span>
                      {panel.badge && (
                        <span className={`
                          px-1.5 py-0.5 text-xs font-mono rounded-full
                          ${isActive ? 'bg-white/20' : 'bg-white/10'}
                        `}>
                          {panel.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Additional children */}
        {children}
      </div>
    </WorkspaceContext.Provider>
  );
}
