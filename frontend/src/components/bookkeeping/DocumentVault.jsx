import React, { useState, useCallback, useRef } from 'react';
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  FileImage,
  File,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreVertical,
  X,
  Check,
  Loader2,
  Receipt,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DOCUMENT_TYPES = [
  { id: 'receipt', label: 'Receipts', icon: Receipt, color: 'text-green-400' },
  { id: 'invoice', label: 'Invoices', icon: FileText, color: 'text-blue-400' },
  { id: 'quote', label: 'Quotes', icon: FileSpreadsheet, color: 'text-purple-400' },
  { id: 'contract', label: 'Contracts', icon: FileCheck, color: 'text-orange-400' },
  { id: 'other', label: 'Other', icon: File, color: 'text-gray-400' }
];

const DocumentVault = ({ userId, onDocumentSelect }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch documents from Supabase Storage
  const fetchDocuments = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.log('Documents table may not exist:', error.message);
        setDocuments([]);
      } else {
        setDocuments(data || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (files, docType) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const uploadedDocs = [];

    for (const file of files) {
      try {
        // Upload to Supabase Storage
        const fileName = `${userId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Save metadata to database
        const docRecord = {
          user_id: userId,
          file_name: file.name,
          file_type: docType,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('documents')
          .insert(docRecord);

        if (!dbError) {
          uploadedDocs.push(docRecord);
        }
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }

    setUploading(false);
    setShowUploadModal(false);
    fetchDocuments();
  };

  const deleteDocument = async (doc) => {
    if (!window.confirm('Delete this document?')) return;
    
    try {
      // Delete from storage
      const filePath = doc.file_url.split('/documents/')[1];
      if (filePath) {
        await supabase.storage.from('documents').remove([filePath]);
      }
      
      // Delete from database
      await supabase.from('documents').delete().eq('id', doc.id);
      
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocTypeInfo = (type) => {
    return DOCUMENT_TYPES.find(t => t.id === type) || DOCUMENT_TYPES[4];
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedType !== 'all' && doc.file_type !== selectedType) return false;
    if (searchQuery && !doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group documents by type for summary
  const docCounts = DOCUMENT_TYPES.reduce((acc, type) => {
    acc[type.id] = documents.filter(d => d.file_type === type.id).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6" data-testid="document-vault">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-steel-400" />
            Document Vault
          </h2>
          <p className="text-gray-400 text-sm">Store and organize your business documents</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          data-testid="upload-document-btn"
        >
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedType === 'all' 
              ? 'bg-steel-500 text-white' 
              : 'bg-charcoal-700 text-gray-400 hover:text-white'
          }`}
        >
          All ({documents.length})
        </button>
        {DOCUMENT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              selectedType === type.id 
                ? 'bg-steel-500 text-white' 
                : 'bg-charcoal-700 text-gray-400 hover:text-white'
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.label} ({docCounts[type.id] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-steel-500"
        />
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-steel-500 animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Documents Yet</h3>
          <p className="text-gray-400 mb-6">
            Upload invoices, contracts, quotes, and other business documents.
          </p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const typeInfo = getDocTypeInfo(doc.file_type);
            const TypeIcon = typeInfo.icon;
            
            return (
              <div 
                key={doc.id}
                className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4 hover:border-charcoal-600 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center ${typeInfo.color}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate" title={doc.file_name}>
                      {doc.file_name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </a>
                  <a
                    href={doc.file_url}
                    download={doc.file_name}
                    className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => deleteDocument(doc)}
                    className="bg-charcoal-700 hover:bg-risk/20 hover:text-risk text-gray-400 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          onUpload={handleFileUpload}
          onClose={() => setShowUploadModal(false)}
          uploading={uploading}
        />
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ onUpload, onClose, uploading }) => {
  const [selectedType, setSelectedType] = useState('receipt');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmit = () => {
    if (files.length > 0) {
      onUpload(files, selectedType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-charcoal-700">
          <h2 className="text-lg font-semibold text-white">Upload Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Document Type</label>
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                    selectedType === type.id
                      ? 'border-steel-500 bg-steel-500/10'
                      : 'border-charcoal-600 hover:border-charcoal-500'
                  }`}
                >
                  <type.icon className={`w-5 h-5 ${type.color}`} />
                  <span className="text-white text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Select Files</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-charcoal-600 rounded-xl p-6 text-center cursor-pointer hover:border-steel-500/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              />
              <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-white text-sm">Click to select files</p>
              <p className="text-gray-500 text-xs mt-1">PDF, Images, Word docs</p>
            </div>
            
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300 bg-charcoal-700 rounded px-3 py-2">
                    <FileText className="w-4 h-4" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-charcoal-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Upload ({files.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentVault;
