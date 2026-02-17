import React from 'react';
import { Calculator, Plus, FileText } from 'lucide-react';

const EstimatingPage = () => {
  return (
    <div className="space-y-6" data-testid="estimating-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Estimating</h1>
          <p className="text-gray-400">Create and manage quotes for your projects</p>
        </div>
        <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          New Quote
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
        <Calculator className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Quote Builder</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Build professional quotes in minutes with your scope library. Set pricing tiers, add line items, and export to PDF.
        </p>
        <button className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Create Your First Quote
        </button>
      </div>

      {/* Feature preview */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-2">Scope Library</h3>
          <p className="text-gray-400 text-sm">Save and reuse common scope items with preset pricing ranges.</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-2">Pricing Tiers</h3>
          <p className="text-gray-400 text-sm">Set spec, custom, and luxury pricing for flexible quoting.</p>
        </div>
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
          <h3 className="font-semibold text-white mb-2">PDF Export</h3>
          <p className="text-gray-400 text-sm">Generate professional PDF quotes with your branding.</p>
        </div>
      </div>
    </div>
  );
};

export default EstimatingPage;
