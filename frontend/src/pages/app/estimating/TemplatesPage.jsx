/**
 * TemplatesPage.jsx - Estimate Templates Management
 * ===================================================
 * 
 * Templates are reusable estimate configurations for common project types.
 * Example: "Standard Residential Door Package" pre-populates an estimate.
 * 
 * Future milestone - shows coming soon for now.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Library, Layers } from 'lucide-react';

const TemplatesPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-full p-4 lg:p-8 overflow-x-hidden" data-testid="templates-page">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/app/estimating')}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Estimating
      </button>
      
      {/* Coming Soon State */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
        </div>
        
        <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-wider rounded-full mb-4">
          Coming Soon
        </span>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Estimate Templates
        </h1>
        
        <p className="text-neutral-400 max-w-md mb-6">
          Templates save time by pre-populating estimates with your most common configurations.
          Create templates for residential, commercial, or specialty project types.
        </p>
        
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 max-w-lg">
          <h3 className="text-sm font-medium text-white mb-3">
            Template Hierarchy
          </h3>
          <div className="flex flex-col items-center gap-3 text-sm text-neutral-400">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Library className="w-4 h-4" />
              Production Standards
            </div>
            <span className="text-neutral-600">builds into</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Layers className="w-4 h-4" />
              Assemblies
            </div>
            <span className="text-neutral-600">combine into</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <FileText className="w-4 h-4" />
              Templates
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate('/app/estimating/library')}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
          >
            <Library className="w-4 h-4" />
            Browse Library
          </button>
          <button
            onClick={() => navigate('/app/estimating/assemblies')}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4" />
            View Assemblies
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
