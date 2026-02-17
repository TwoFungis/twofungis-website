import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  FileImage,
  Trash2,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BulkReceiptUpload = ({ onComplete, onClose }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(f => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      return validTypes.includes(f.type) && f.size <= 10 * 1024 * 1024;
    });

    // Create preview URLs
    const filesWithPreview = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending', // pending, processing, success, error
      result: null,
      error: null
    }));

    setFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const processAllReceipts = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    const processedResults = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i);
      
      // Update file status to processing
      setFiles(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'processing' };
        return updated;
      });

      try {
        const formData = new FormData();
        formData.append('file', files[i].file);
        formData.append('region', 'CA');

        const response = await fetch(`${API_URL}/api/bookkeeping/scan-receipt`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.expense) {
          setFiles(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'success', result: data.expense };
            return updated;
          });
          processedResults.push({ success: true, expense: data.expense, fileName: files[i].file.name });
        } else {
          setFiles(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: 'error', error: data.error || 'Scan failed' };
            return updated;
          });
          processedResults.push({ success: false, error: data.error, fileName: files[i].file.name });
        }
      } catch (err) {
        setFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'error', error: 'Network error' };
          return updated;
        });
        processedResults.push({ success: false, error: 'Network error', fileName: files[i].file.name });
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResults(processedResults);
    setCurrentIndex(-1);
    setProcessing(false);
  };

  const handleComplete = () => {
    const successfulExpenses = files
      .filter(f => f.status === 'success' && f.result)
      .map(f => f.result);
    
    if (onComplete) {
      onComplete(successfulExpenses);
    }
  };

  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const allProcessed = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-steel-500/20 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-steel-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bulk Receipt Upload</h2>
              <p className="text-sm text-gray-400">Upload multiple receipts at once</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Area */}
          <div
            onClick={() => !processing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              processing ? 'border-charcoal-600 opacity-50 cursor-not-allowed' : 'border-charcoal-600 hover:border-steel-500/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={processing}
            />
            <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Drop receipts here or click to browse</p>
            <p className="text-gray-500 text-sm">JPEG, PNG, or WEBP • Max 10MB each</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">{files.length} receipt(s) selected</p>
                {allProcessed && (
                  <p className="text-sm">
                    <span className="text-success">{successCount} scanned</span>
                    {errorCount > 0 && <span className="text-risk ml-2">{errorCount} failed</span>}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {files.map((item, index) => (
                  <div 
                    key={index} 
                    className={`relative bg-charcoal-700 rounded-lg overflow-hidden border ${
                      item.status === 'success' ? 'border-success' :
                      item.status === 'error' ? 'border-risk' :
                      item.status === 'processing' ? 'border-steel-500' :
                      'border-charcoal-600'
                    }`}
                  >
                    <img 
                      src={item.preview} 
                      alt={`Receipt ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    
                    {/* Status Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      item.status === 'processing' ? 'bg-black/50' :
                      item.status === 'success' ? 'bg-success/20' :
                      item.status === 'error' ? 'bg-risk/20' : ''
                    }`}>
                      {item.status === 'processing' && (
                        <Loader2 className="w-6 h-6 text-steel-400 animate-spin" />
                      )}
                      {item.status === 'success' && (
                        <Check className="w-6 h-6 text-success" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="w-6 h-6 text-risk" />
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    {item.status === 'pending' && !processing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute top-1 right-1 bg-charcoal-800/80 text-white p-1 rounded hover:bg-risk transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    
                    {/* Extracted Amount */}
                    {item.status === 'success' && item.result && (
                      <div className="absolute bottom-0 left-0 right-0 bg-charcoal-900/90 px-2 py-1">
                        <p className="text-success text-xs font-medium truncate">
                          ${item.result.total_amount?.toFixed(2)} - {item.result.vendor_name}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {processing && (
            <div className="bg-charcoal-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-5 h-5 text-steel-400 animate-spin" />
                <p className="text-white font-medium">Scanning receipts with AI...</p>
              </div>
              <div className="h-2 bg-charcoal-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-steel-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / files.length) * 100}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Processing {currentIndex + 1} of {files.length}...
              </p>
            </div>
          )}

          {/* Results Summary */}
          {allProcessed && successCount > 0 && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-success" />
                <p className="text-success font-medium">
                  {successCount} receipt(s) scanned successfully!
                </p>
              </div>
              <p className="text-gray-400 text-sm">
                Total extracted: ${files
                  .filter(f => f.status === 'success' && f.result)
                  .reduce((sum, f) => sum + (f.result.total_amount || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-charcoal-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          
          {!allProcessed ? (
            <button
              onClick={processAllReceipts}
              disabled={processing || files.length === 0}
              className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              data-testid="process-bulk-btn"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Scan All ({files.length})
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-1 bg-success hover:bg-success/80 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Add {successCount} Expense(s)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkReceiptUpload;
