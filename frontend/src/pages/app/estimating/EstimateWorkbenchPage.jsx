/**
 * EstimateWorkbenchPage.jsx - Estimate Workbench Landing
 * =======================================================
 * 
 * Phase 2 of the Estimate Workbench Architecture.
 * This is a placeholder that will become the 3-panel estimate builder.
 * 
 * For now, shows a coming soon message with navigation to other Estimating pages.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Library, 
  Layers, 
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const EstimateWorkbenchPage = () => {
  const navigate = useNavigate();
  
  const quickLinks = [
    {
      title: 'Production Library',
      description: 'Browse and manage your production standards',
      icon: Library,
      color: 'emerald',
      path: '/app/estimating/library'
    },
    {
      title: 'Assemblies',
      description: 'Create reusable groups of standards',
      icon: Layers,
      color: 'purple',
      path: '/app/estimating/assemblies'
    },
    {
      title: 'Templates',
      description: 'Estimate templates for common projects',
      icon: FileText,
      color: 'cyan',
      path: '/app/estimating/templates'
    }
  ];
  
  return (
    <div className="min-h-full p-4 lg:p-8 overflow-x-hidden" data-testid="estimate-workbench-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Estimate Workbench</h1>
            <p className="text-sm text-neutral-400">Build estimates from your production library</p>
          </div>
        </div>
      </div>
      
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 lg:p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider rounded-full mb-3">
              Phase 2 Coming Soon
            </span>
            <h2 className="text-xl font-semibold text-white mb-2">
              3-Panel Estimate Builder
            </h2>
            <p className="text-neutral-400 mb-4 max-w-2xl">
              The Estimate Workbench will feature a powerful 3-panel layout: 
              browse your Production Library on the left, build your estimate in the center, 
              and see a live summary on the right. Drag-and-drop standards, adjust quantities, 
              override pricing, and export professional PDFs.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-neutral-500">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Drag-and-drop from library
              </span>
              <span className="flex items-center gap-2 text-neutral-500">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Inline quantity editing
              </span>
              <span className="flex items-center gap-2 text-neutral-500">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Live totals
              </span>
              <span className="flex items-center gap-2 text-neutral-500">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                PDF export (jsPDF)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="mb-8">
        <h3 className="text-sm uppercase tracking-wider font-medium text-neutral-500 mb-4">
          Get Started
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`group flex flex-col items-start p-5 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-${link.color}-500/50 transition-all text-left min-h-[140px]`}
                data-testid={`quick-link-${link.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-10 h-10 bg-${link.color}-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-${link.color}-500/20 transition-colors`}>
                  <Icon className={`w-5 h-5 text-${link.color}-400`} strokeWidth={1.5} />
                </div>
                <h4 className="text-base font-medium text-white mb-1">
                  {link.title}
                </h4>
                <p className="text-sm text-neutral-500 mb-3 flex-1">
                  {link.description}
                </p>
                <span className={`flex items-center gap-1 text-sm text-${link.color}-400 group-hover:gap-2 transition-all`}>
                  Open <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Workflow Diagram */}
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-sm uppercase tracking-wider font-medium text-neutral-500 mb-4">
          Estimating Workflow
        </h3>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-2 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Library className="w-4 h-4" />
            Production Standards
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-600 rotate-90 lg:rotate-0 ml-6 lg:ml-0" />
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Layers className="w-4 h-4" />
            Assemblies
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-600 rotate-90 lg:rotate-0 ml-6 lg:ml-0" />
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <FileText className="w-4 h-4" />
            Templates
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-600 rotate-90 lg:rotate-0 ml-6 lg:ml-0" />
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Calculator className="w-4 h-4" />
            Estimate
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateWorkbenchPage;
