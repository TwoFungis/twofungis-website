/**
 * Production Library Import Wizard
 * ==================================
 * 
 * This is NOT a CSV importer.
 * This is the onboarding experience for the Company's Knowledge Engine.
 * It should feel like importing years of company experience into TradeOS.
 * 
 * Workflow:
 * 1. Initialize Production Library
 * 2. Download TradeOS CSV Template (optional)
 * 3. Drag & Drop CSV
 * 4. Preview Import
 * 5. Validation Report
 * 6. Resolve Errors (if any)
 * 7. Import Summary → Production Library Ready
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Library,
  Layers,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Zap,
  Brain,
  BarChart3,
  PackageOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ============================================
// STEP INDICATOR
// ============================================
const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isComplete
                    ? 'bg-emerald-500 text-black'
                    : isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500'
                      : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${isComplete ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// STEP 1: INITIALIZE LIBRARY
// ============================================
const InitializeStep = ({ seedStatus, onInitialize, initializing, onNext }) => {
  const isSeeded = seedStatus?.is_seeded;
  const hasSchemaError = seedStatus?.schema_error;
  const counts = seedStatus?.counts || {};
  
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Database className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Initialize Production Library</h2>
        <p className="text-zinc-400">
          Before importing your company knowledge, we need to set up the foundational structure.
          This creates the default Knowledge Domains, Service Categories, and Measurement Units.
        </p>
      </div>
      
      {hasSchemaError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Database Migration Required</h3>
              <p className="text-sm text-zinc-400 mb-4">
                The Production Library tables do not exist in your database. 
                An administrator needs to run the database migration first.
              </p>
              <div className="bg-zinc-900/80 rounded-lg p-3 font-mono text-xs text-zinc-300">
                /app/migrations/015_production_library_foundation.sql
              </div>
              <p className="text-xs text-zinc-500 mt-3">
                Contact your system administrator to apply this migration to your Supabase database.
              </p>
            </div>
          </div>
        </div>
      ) : isSeeded ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-2">Production Library Initialized</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Your library foundation is ready. You can proceed to import your production knowledge.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <div className="text-xl font-bold text-emerald-400">{counts.knowledge_domains || 0}</div>
                  <div className="text-xs text-zinc-500">Domains</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <div className="text-xl font-bold text-emerald-400">{counts.service_categories || 0}</div>
                  <div className="text-xs text-zinc-500">Categories</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <div className="text-xl font-bold text-emerald-400">{counts.production_items || 0}</div>
                  <div className="text-xs text-zinc-500">Items</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-2">Library Not Initialized</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Your Production Library needs to be initialized before you can import data.
                This is a one-time setup that creates the foundational structure.
              </p>
              <div className="text-xs text-zinc-500 mb-4">
                This will create:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>14 Knowledge Domains (Finish Carpentry, Doors & Hardware, etc.)</li>
                  <li>11 Service Categories (Residential, Commercial, etc.)</li>
                  <li>Standard Measurement Units</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-center gap-4">
        {hasSchemaError ? (
          <button
            disabled
            className="bg-zinc-700 text-zinc-400 cursor-not-allowed font-semibold px-8 py-3 rounded-lg flex items-center gap-2"
          >
            <Database className="w-5 h-5" />
            Migration Required
          </button>
        ) : !isSeeded ? (
          <button
            onClick={onInitialize}
            disabled={initializing}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black font-semibold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
            data-testid="initialize-library-btn"
          >
            {initializing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Initialize Production Library
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
            data-testid="continue-to-template-btn"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// STEP 2: DOWNLOAD TEMPLATE
// ============================================
const TemplateStep = ({ template, onDownload, downloading, onNext, onBack }) => {
  const columns = template?.columns || [];
  
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileSpreadsheet className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">TradeOS CSV Template</h2>
        <p className="text-zinc-400">
          Download the official template to ensure your data imports correctly.
          The template includes example rows to guide your formatting.
        </p>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden max-w-3xl mx-auto">
        <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Template Columns</h3>
          <p className="text-sm text-zinc-500">All your production items should follow this exact structure</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {columns.map((col, i) => (
              <div 
                key={col}
                className={`flex items-center gap-2 text-sm ${
                  i < 4 ? 'text-emerald-400' : 'text-zinc-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  i < 4 ? 'bg-emerald-500' : 'bg-zinc-600'
                }`} />
                {col}
                {i < 4 && <span className="text-[10px] text-emerald-600">(required)</span>}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
            <h4 className="text-xs font-medium text-zinc-400 mb-2">VALID MEASUREMENT UNITS</h4>
            <div className="flex flex-wrap gap-2">
              {(template?.valid_measurement_units || ['EA', 'LF', 'SF', 'LS', 'DAY', 'HR', 'SET', 'KIT', 'PAIR', 'COST']).map(unit => (
                <span key={unit} className="px-2 py-1 bg-zinc-900 rounded text-xs text-zinc-300 font-mono">
                  {unit}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
          data-testid="download-template-btn"
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download CSV Template
            </>
          )}
        </button>
        <button
          onClick={onNext}
          className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
        >
          Skip
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// STEP 3: UPLOAD CSV
// ============================================
const UploadStep = ({ onFileSelect, uploading, selectedFile, onNext, onBack }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    } else {
      toast.error('Please drop a CSV file');
    }
  }, [onFileSelect]);
  
  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);
  
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Upload className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Upload Your Production Data</h2>
        <p className="text-zinc-400">
          Drag and drop your CSV file or click to browse.
          Your file will be validated before import.
        </p>
      </div>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`max-w-xl mx-auto border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/50'
        }`}
        data-testid="file-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 mx-auto animate-spin" />
            <p className="text-zinc-400">Validating your file...</p>
          </div>
        ) : selectedFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-sm text-zinc-500">
                {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <p className="text-white font-medium">Drop your CSV file here</p>
              <p className="text-sm text-zinc-500">or click to browse</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        {selectedFile && (
          <button
            onClick={onNext}
            disabled={uploading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black font-semibold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
            data-testid="validate-file-btn"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Validate & Preview
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// STEP 4 & 5: PREVIEW & VALIDATION
// ============================================
const PreviewStep = ({ validationResults, onBack, onNext, onReupload }) => {
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  
  const results = validationResults?.results || {};
  const errors = results.errors || [];
  const warnings = results.warnings || [];
  const preview = results.preview || [];
  const canImport = validationResults?.can_import;
  const validationPassed = validationResults?.validation_passed;
  
  const displayedErrors = showAllErrors ? errors : errors.slice(0, 5);
  const displayedWarnings = showAllWarnings ? warnings : warnings.slice(0, 3);
  
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className={`w-16 h-16 ${validationPassed ? 'bg-emerald-500/20' : 'bg-amber-500/20'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
          {validationPassed ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {validationPassed ? 'Validation Passed' : 'Validation Report'}
        </h2>
        <p className="text-zinc-400">
          {validationPassed 
            ? 'Your file is ready to import. Review the preview below.'
            : `Found ${errors.length} error${errors.length !== 1 ? 's' : ''} that need to be fixed before importing.`
          }
        </p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{results.total_rows || 0}</div>
          <div className="text-xs text-zinc-500">Total Rows</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{results.valid_rows || 0}</div>
          <div className="text-xs text-emerald-600">Valid</div>
        </div>
        <div className={`rounded-lg p-4 text-center ${errors.length > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-zinc-900 border border-zinc-800'}`}>
          <div className={`text-2xl font-bold ${errors.length > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{results.error_rows || 0}</div>
          <div className={`text-xs ${errors.length > 0 ? 'text-red-600' : 'text-zinc-500'}`}>Errors</div>
        </div>
        <div className={`rounded-lg p-4 text-center ${warnings.length > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-zinc-900 border border-zinc-800'}`}>
          <div className={`text-2xl font-bold ${warnings.length > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{results.warning_rows || 0}</div>
          <div className={`text-xs ${warnings.length > 0 ? 'text-amber-600' : 'text-zinc-500'}`}>Warnings</div>
        </div>
      </div>
      
      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden max-w-4xl mx-auto">
          <div className="bg-red-500/10 px-6 py-4 border-b border-red-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-red-400">Errors ({errors.length})</h3>
            </div>
            <span className="text-xs text-red-400">Must be fixed before import</span>
          </div>
          <div className="divide-y divide-red-500/10">
            {displayedErrors.map((error, i) => (
              <div key={i} className="px-6 py-4 hover:bg-red-500/5 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono bg-red-500/20 text-red-400 px-2 py-1 rounded">
                    Row {error.row}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{error.column}</span>
                      {error.value && (
                        <span className="text-xs text-zinc-500 font-mono truncate max-w-[150px]">
                          &quot;{error.value}&quot;
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-red-300">{error.issue}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      <span className="text-emerald-500">Fix:</span> {error.recommended_fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.length > 5 && (
            <button
              onClick={() => setShowAllErrors(!showAllErrors)}
              className="w-full py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              {showAllErrors ? 'Show Less' : `Show All ${errors.length} Errors`}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllErrors ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
      
      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden max-w-4xl mx-auto">
          <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-amber-400">Warnings ({warnings.length})</h3>
            </div>
            <span className="text-xs text-amber-400">Import will proceed with warnings</span>
          </div>
          <div className="divide-y divide-amber-500/10">
            {displayedWarnings.map((warning, i) => (
              <div key={i} className="px-6 py-4 hover:bg-amber-500/5 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                    {warning.row === 'N/A' ? 'Info' : `Row ${warning.row}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{warning.column}</span>
                    </div>
                    <p className="text-sm text-amber-300">{warning.issue}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      <span className="text-emerald-500">Suggestion:</span> {warning.recommended_fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {warnings.length > 3 && (
            <button
              onClick={() => setShowAllWarnings(!showAllWarnings)}
              className="w-full py-3 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2"
            >
              {showAllWarnings ? 'Show Less' : `Show All ${warnings.length} Warnings`}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllWarnings ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
      
      {/* Preview Table */}
      {preview.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden max-w-5xl mx-auto">
          <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Preview (First {Math.min(preview.length, 20)} Items)</h3>
            <span className="text-xs text-zinc-500">{results.valid_rows} items ready to import</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Code</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Domain</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Unit</th>
                  <th className="text-right px-4 py-3 text-zinc-400 font-medium">Std Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {preview.slice(0, 10).map((item, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-400">{item.production_code}</span>
                    </td>
                    <td className="px-4 py-3 text-white">{item.production_name}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.knowledge_domain}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded">{item.measurement_unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {item.standard_rate ? `$${item.standard_rate.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 10 && (
            <div className="px-6 py-3 bg-zinc-800/30 text-center text-xs text-zinc-500">
              +{preview.length - 10} more items
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        {!validationPassed && (
          <button
            onClick={onReupload}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-3 rounded-lg transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Fix & Re-upload
          </button>
        )}
        {canImport && (
          <button
            onClick={onNext}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
            data-testid="proceed-to-import-btn"
          >
            {validationPassed ? 'Import Production Items' : 'Import Valid Items Only'}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// STEP 6 & 7: IMPORT & SUMMARY
// ============================================
const ImportStep = ({ importing, importResults, onBrowseLibrary, onCreateAssembly, onStartOver }) => {
  const results = importResults?.results || {};
  const totalImported = (results.created || 0) + (results.updated || 0);
  
  if (importing) {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-3">Importing Your Knowledge</h2>
          <p className="text-zinc-400">
            Building your Production Library...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-100" />
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-200" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Sparkles className="w-10 h-10 text-emerald-400" />
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-black" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Production Library Ready</h2>
        <p className="text-zinc-400 text-lg">
          You&apos;ve successfully imported your company&apos;s production knowledge into TradeOS.
        </p>
      </div>
      
      {/* Import Summary */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-8 max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-emerald-400 mb-6 text-center">Import Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Library className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalImported}</div>
            <div className="text-xs text-zinc-500">Production Items</div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Layers className="w-7 h-7 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{results.created || 0}</div>
            <div className="text-xs text-zinc-500">Created</div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">{results.updated || 0}</div>
            <div className="text-xs text-zinc-500">Updated</div>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white">{results.errors || 0}</div>
            <div className="text-xs text-zinc-500">Errors</div>
          </div>
        </div>
      </div>
      
      {/* AI Insight */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Company Brain is Learning</h4>
            <p className="text-sm text-zinc-400">
              Your production knowledge is now available to Company Brain. As you complete projects,
              the AI will learn from actuals vs estimates to improve future recommendations.
            </p>
          </div>
        </div>
      </div>
      
      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onBrowseLibrary}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          data-testid="browse-library-btn"
        >
          <Library className="w-5 h-5" />
          Browse Production Library
        </button>
        <button
          onClick={onCreateAssembly}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Layers className="w-5 h-5" />
          Create First Assembly
        </button>
        <button
          onClick={onStartOver}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Import More
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN IMPORT WIZARD COMPONENT
// ============================================
const ImportWizard = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [seedStatus, setSeedStatus] = useState(null);
  const [template, setTemplate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  
  // Loading states
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const steps = [
    { id: 'initialize', label: 'Initialize' },
    { id: 'template', label: 'Template' },
    { id: 'upload', label: 'Upload' },
    { id: 'validate', label: 'Validate' },
    { id: 'import', label: 'Import' }
  ];
  
  // Get auth headers
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`
    };
  }, []);
  
  // Check seed status on mount
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/production-library/seed/status`, { headers });
        if (response.ok) {
          const data = await response.json();
          setSeedStatus(data);
          
          // If already seeded, also fetch template
          if (data.is_seeded) {
            const templateRes = await fetch(`${API_URL}/api/production-library/import/template/download`, { headers });
            if (templateRes.ok) {
              const templateData = await templateRes.json();
              setTemplate(templateData.template);
            }
          }
        }
      } catch (error) {
        console.error('Error checking seed status:', error);
        toast.error('Failed to check library status');
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkStatus();
  }, [getAuthHeaders]);
  
  // Initialize library
  const handleInitialize = async () => {
    setInitializing(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/production-library/seed`, {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Refresh status to verify initialization succeeded
        const statusRes = await fetch(`${API_URL}/api/production-library/seed/status`, { headers });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setSeedStatus(statusData);
          
          // Verify initialization actually worked
          if (statusData.schema_error) {
            toast.error('Database migration required. Please contact your administrator.');
            return;
          }
          
          if (!statusData.is_seeded) {
            toast.error('Initialization failed. The server reported success but no data was created. Please contact support.');
            return;
          }
          
          toast.success('Production Library initialized successfully');
          
          // Fetch template
          const templateRes = await fetch(`${API_URL}/api/production-library/import/template/download`, { headers });
          if (templateRes.ok) {
            const templateData = await templateRes.json();
            setTemplate(templateData.template);
          }
        }
      } else {
        const error = await response.json();
        
        // Check for schema error
        if (error.detail?.includes('tables do not exist') || error.detail?.includes('migration')) {
          toast.error('Database migration required. Please run the migration file first.');
          // Refresh status to show schema error UI
          const statusRes = await fetch(`${API_URL}/api/production-library/seed/status`, { headers });
          if (statusRes.ok) {
            setSeedStatus(await statusRes.json());
          }
        } else {
          toast.error(error.detail || 'Failed to initialize library');
        }
      }
    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Failed to initialize library. Please try again.');
    } finally {
      setInitializing(false);
    }
  };
  
  // Download template
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      if (template?.csv_content) {
        const blob = new Blob([template.csv_content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tradeos_production_items_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Template downloaded');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setValidationResults(null);
  };
  
  // Validate file
  const handleValidate = async () => {
    if (!selectedFile) return;
    
    setValidating(true);
    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch(`${API_URL}/api/production-library/import/validate`, {
        method: 'POST',
        headers: { 'Authorization': headers.Authorization },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success === false && data.error === 'library_not_initialized') {
          toast.error(data.message);
          setCurrentStep(0);
          return;
        }
        
        setValidationResults(data);
        setCurrentStep(3);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating:', error);
      toast.error('Failed to validate file');
    } finally {
      setValidating(false);
    }
  };
  
  // Commit import
  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImporting(true);
    setCurrentStep(4);
    
    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch(`${API_URL}/api/production-library/import/commit?update_existing=false`, {
        method: 'POST',
        headers: { 'Authorization': headers.Authorization },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setImportResults(data);
        toast.success(data.message || 'Import completed successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Import failed');
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Failed to import data');
      setCurrentStep(3);
    } finally {
      setImporting(false);
    }
  };
  
  // Reset wizard
  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setValidationResults(null);
    setImportResults(null);
  };
  
  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <PackageOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Import Production Knowledge</h1>
            <p className="text-sm text-zinc-500">Company Knowledge Engine</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Step Indicator */}
      {currentStep < 4 && <StepIndicator steps={steps} currentStep={currentStep} />}
      
      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && (
          <InitializeStep
            seedStatus={seedStatus}
            onInitialize={handleInitialize}
            initializing={initializing}
            onNext={() => setCurrentStep(1)}
          />
        )}
        
        {currentStep === 1 && (
          <TemplateStep
            template={template}
            onDownload={handleDownloadTemplate}
            downloading={downloading}
            onNext={() => setCurrentStep(2)}
            onBack={() => setCurrentStep(0)}
          />
        )}
        
        {currentStep === 2 && (
          <UploadStep
            onFileSelect={handleFileSelect}
            uploading={validating}
            selectedFile={selectedFile}
            onNext={handleValidate}
            onBack={() => setCurrentStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <PreviewStep
            validationResults={validationResults}
            onBack={() => setCurrentStep(2)}
            onNext={handleImport}
            onReupload={() => {
              setSelectedFile(null);
              setValidationResults(null);
              setCurrentStep(2);
            }}
          />
        )}
        
        {currentStep === 4 && (
          <ImportStep
            importing={importing}
            importResults={importResults}
            onBrowseLibrary={() => {
              if (onComplete) onComplete();
            }}
            onCreateAssembly={() => {
              toast.info('Assembly creation coming soon');
            }}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default ImportWizard;
