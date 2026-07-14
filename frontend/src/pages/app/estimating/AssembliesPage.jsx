/**
 * AssembliesPage.jsx - Production Assemblies Management
 * ======================================================
 * 
 * Assemblies are reusable groups of production standards.
 * Example: "Door Installation Assembly" includes door hang, hardware, casing, etc.
 * 
 * Future milestone - shows coming soon for now.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Library } from 'lucide-react';

const AssembliesPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-full p-4 lg:p-8 overflow-x-hidden" data-testid="assemblies-page">
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
        <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Layers className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
        </div>
        
        <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium uppercase tracking-wider rounded-full mb-4">
          Coming Soon
        </span>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Production Assemblies
        </h1>
        
        <p className="text-neutral-400 max-w-md mb-6">
          Assemblies let you group related production standards together.
          Build a door installation assembly that includes the door hang, hardware install, casing, and trim.
        </p>
        
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 max-w-lg">
          <h3 className="text-sm font-medium text-white mb-3">
            Assembly Workflow
          </h3>
          <div className="space-y-2 text-sm text-neutral-400 text-left">
            <p>1. Create an Assembly (e.g., "Door Installation - Single")</p>
            <p>2. Add Production Standards from your library</p>
            <p>3. Set default quantities for each standard</p>
            <p>4. Use the assembly in estimates - one click adds all items</p>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => navigate('/app/estimating/library')}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
          >
            <Library className="w-4 h-4" />
            Browse Production Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssembliesPage;
