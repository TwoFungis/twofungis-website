import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Receipt, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Camera,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReceiptScanner = ({ onExpenseExtracted, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a JPEG, PNG, or WEBP image');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setExtractedData(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const event = { target: { files: [droppedFile] } };
      handleFileSelect(event);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const scanReceipt = async () => {
    if (!file) return;

    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('region', 'CA'); // Default to Canada

      const response = await fetch(`${API_URL}/api/bookkeeping/scan-receipt`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.expense) {
        setExtractedData(data.expense);
      } else {
        setError(data.error || 'Failed to scan receipt');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to connect to scanning service');
    } finally {
      setScanning(false);
    }
  };

  const confirmExpense = () => {
    if (extractedData && onExpenseExtracted) {
      onExpenseExtracted(extractedData);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: extractedData?.currency || 'CAD' 
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-steel-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-steel-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Receipt Scanner</h2>
              <p className="text-sm text-gray-400">Upload a receipt to auto-extract expense data</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Area */}
          {!preview && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-charcoal-600 rounded-xl p-8 text-center cursor-pointer hover:border-steel-500/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 bg-charcoal-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-white font-medium mb-2">Drop your receipt here</p>
              <p className="text-gray-400 text-sm">or click to browse</p>
              <p className="text-gray-500 text-xs mt-2">JPEG, PNG, or WEBP • Max 10MB</p>
            </div>
          )}

          {/* Preview & Actions */}
          {preview && !extractedData && (
            <div className="space-y-4">
              <div className="relative bg-charcoal-700 rounded-xl overflow-hidden">
                <img 
                  src={preview} 
                  alt="Receipt preview" 
                  className="max-h-64 w-auto mx-auto"
                />
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-charcoal-800/80 text-white p-1.5 rounded-lg hover:bg-charcoal-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={scanReceipt}
                disabled={scanning}
                className="w-full bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                data-testid="scan-receipt-btn"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scanning with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Scan Receipt
                  </>
                )}
              </button>
            </div>
          )}

          {/* Extracted Data */}
          {extractedData && (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-success font-medium">Receipt scanned successfully!</p>
                  <p className="text-gray-400 text-sm">Confidence: {extractedData.confidence}%</p>
                </div>
              </div>

              {/* Extracted Fields */}
              <div className="bg-charcoal-700/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Vendor</p>
                    <p className="text-white font-medium">{extractedData.vendor_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Date</p>
                    <p className="text-white font-medium">{extractedData.receipt_date || 'Unknown'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Subtotal</p>
                    <p className="text-white font-medium">{formatCurrency(extractedData.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Tax ({extractedData.tax_type || 'N/A'})</p>
                    <p className="text-white font-medium">{formatCurrency(extractedData.tax_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Total</p>
                    <p className="text-xl font-bold text-steel-400">{formatCurrency(extractedData.total_amount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Category</p>
                    <p className="text-white font-medium">{extractedData.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Payment</p>
                    <p className="text-white font-medium">{extractedData.payment_method || 'Unknown'}</p>
                  </div>
                </div>

                {extractedData.description && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-1">Description</p>
                    <p className="text-gray-300 text-sm">{extractedData.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setExtractedData(null);
                    setFile(null);
                    setPreview(null);
                  }}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Scan Another
                </button>
                <button
                  onClick={confirmExpense}
                  className="flex-1 bg-success hover:bg-success/80 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  data-testid="confirm-expense-btn"
                >
                  <Check className="w-5 h-5" />
                  Add Expense
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-risk/10 border border-risk/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-risk flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-risk font-medium">Scan Failed</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
