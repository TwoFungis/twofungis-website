/**
 * WorkspaceNav.jsx
 * ================
 * Persistent horizontal navigation for the Opportunity Workspace.
 * Each tab feels like entering another room in the same workspace.
 * 
 * Design: Clean, minimal tabs with subtle indicators for items needing attention
 */

import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WorkspaceNav({ tabs, activeTab, onTabChange, workspaceSummary }) {
  const scrollRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  // Get badge count for tabs that need attention
  const getBadgeCount = (tabId) => {
    if (!workspaceSummary) return null;
    
    switch (tabId) {
      case 'rfis':
        return workspaceSummary.rfi_count > 0 ? workspaceSummary.rfi_count : null;
      case 'documents':
        return workspaceSummary.document_count > 0 ? workspaceSummary.document_count : null;
      default:
        return null;
    }
  };

  return (
    <nav className="sticky top-[105px] z-30 bg-[#0a0a0a] border-b border-[#262626]" data-testid="workspace-nav">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 relative">
        {/* Left scroll indicator */}
        {showLeftScroll && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-start pl-2 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a] to-transparent"
            data-testid="nav-scroll-left"
          >
            <ChevronLeft className="w-5 h-5 text-white/50" />
          </button>
        )}

        {/* Tabs container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = getBadgeCount(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                  transition-all duration-200 rounded-lg
                  ${isActive 
                    ? 'text-white bg-white/5' 
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive && tab.id === 'brain' ? 'text-emerald-400' : ''}`} />
                <span>{tab.label}</span>
                
                {/* Badge for counts */}
                {badgeCount && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-mono bg-white/10 rounded-full">
                    {badgeCount}
                  </span>
                )}
                
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll indicator */}
        {showRightScroll && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-end pr-2 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a] to-transparent"
            data-testid="nav-scroll-right"
          >
            <ChevronRight className="w-5 h-5 text-white/50" />
          </button>
        )}
      </div>
    </nav>
  );
}
