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
  Sparkles,
  Image,
  SwitchCamera
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReceiptScanner = ({ onExpenseExtracted, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  // Start camera stream
  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      setError(null);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Try uploading an image instead.');
      }
    }
  };

  // Switch between front and back camera
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Switch camera error:', err);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], 'receipt-capture.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        setPreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

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

  const resetScanner = () => {
    setExtractedData(null);
    setFile(null);
    setPreview(null);
    setError(null);
    stopCamera();
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
              <p className="text-sm text-gray-400">Take a photo or upload a receipt</p>
            </div>
          </div>
          <button 
            onClick={() => { stopCamera(); onClose(); }}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Camera View */}
          {showCamera && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay guides */}
                <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                </div>
                
                {/* Switch camera button */}
                <button
                  onClick={switchCamera}
                  className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-steel-500 hover:bg-steel-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!preview && !showCamera && (
            <div className="space-y-4">
              {/* Camera Button */}
              <button
                onClick={startCamera}
                className="w-full bg-steel-500 hover:bg-steel-600 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-3"
              >
                <Camera className="w-6 h-6" />
                Take Photo of Receipt
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-charcoal-600" />
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-charcoal-600" />
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-charcoal-600 rounded-xl p-6 text-center cursor-pointer hover:border-steel-500/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {/* Also add capture attribute for mobile */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-charcoal-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-white font-medium mb-1">Upload from Gallery</p>
                <p className="text-gray-400 text-sm">Drop image here or click to browse</p>
                <p className="text-gray-500 text-xs mt-2">JPEG, PNG, or WEBP • Max 10MB</p>
              </div>
            </div>
          )}

          {/* Preview & Actions */}
          {preview && !extractedData && !showCamera && (
            <div className="space-y-4">
              <div className="relative bg-charcoal-700 rounded-xl overflow-hidden">
                <img 
                  src={preview} 
                  alt="Receipt preview" 
                  className="max-h-64 w-auto mx-auto"
                />
                <button
                  onClick={resetScanner}
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
                  onClick={resetScanner}
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
                <p className="text-risk font-medium">Error</p>
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
