import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, Plus, Search, Upload, File, FileText, Image, 
  Download, Trash2, Eye, MoreVertical, FolderPlus, Grid, List
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// File type icons
const FILE_ICONS = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileText,
  xlsx: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  default: File
};

const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
};

const DocumentsPage = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [currentFolder]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/documents?folder=${currentFolder || ''}`, {
        headers: { 'Authorization': `Bearer ${user?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Demo data
      setFolders([
        { id: 'contracts', name: 'Contracts', document_count: 12 },
        { id: 'permits', name: 'Permits & Licenses', document_count: 8 },
        { id: 'insurance', name: 'Insurance', document_count: 4 },
        { id: 'receipts', name: 'Receipts', document_count: 45 },
      ]);
      setDocuments([
        { id: '1', name: 'Smith Residence Contract.pdf', type: 'contract', size: 245000, uploaded_at: '2026-02-15', project_name: 'Smith Residence' },
        { id: '2', name: 'Building Permit BC-2026-001.pdf', type: 'permit', size: 125000, uploaded_at: '2026-02-10', project_name: 'Smith Residence' },
        { id: '3', name: 'Liability Insurance Certificate.pdf', type: 'insurance', size: 180000, uploaded_at: '2026-01-15' },
        { id: '4', name: 'Materials Receipt Feb 15.jpg', type: 'receipt', size: 890000, uploaded_at: '2026-02-15', project_name: 'Johnson Reno' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6" data-testid="documents-page">
      {/* Header with Shield */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/shield-icon.png" alt="" className="w-8 h-8 opacity-80" />
          <div>
            <h1 className="text-2xl font-bold text-charcoal-800">Document Vault</h1>
            <p className="text-charcoal-600 text-sm mt-1">Securely store and organize project documents</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-steel-500 hover:bg-steel-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            data-testid="upload-document-btn"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Breadcrumb & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={() => setCurrentFolder(null)}
            className={`text-gray-400 hover:text-white ${!currentFolder ? 'text-white font-medium' : ''}`}
          >
            All Documents
          </button>
          {currentFolder && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-white font-medium">{folders.find(f => f.id === currentFolder)?.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-charcoal-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-charcoal-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
        />
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-steel-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading documents...</p>
        </div>
      ) : (
        <>
          {/* Folders Grid */}
          {!currentFolder && filteredFolders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4 hover:border-steel-500/50 transition-all text-left group"
                >
                  <FolderOpen className="w-10 h-10 text-steel-400 mb-3 group-hover:text-steel-300" />
                  <h3 className="text-white font-medium mb-1">{folder.name}</h3>
                  <p className="text-sm text-gray-400">{folder.document_count} documents</p>
                </button>
              ))}
              <button
                className="bg-charcoal-800/50 rounded-xl border border-dashed border-charcoal-600 p-4 hover:border-steel-500/50 transition-all text-left group flex flex-col items-center justify-center"
              >
                <FolderPlus className="w-10 h-10 text-gray-500 mb-3 group-hover:text-steel-400" />
                <span className="text-gray-400 group-hover:text-white">New Folder</span>
              </button>
            </div>
          )}

          {/* Documents */}
          {filteredDocuments.length === 0 ? (
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-8 text-center">
              <File className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
              <p className="text-gray-400">Upload your first document to get started.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.name);
                return (
                  <div
                    key={doc.id}
                    className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-4 hover:border-steel-500/50 transition-all group"
                  >
                    <div className="aspect-square bg-charcoal-700 rounded-lg flex items-center justify-center mb-3">
                      <FileIcon className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-white text-sm font-medium truncate mb-1" title={doc.name}>{doc.name}</h3>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-white p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white p-1">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-risk p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-charcoal-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-700">
                  {filteredDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.name);
                    return (
                      <tr key={doc.id} className="hover:bg-charcoal-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-white">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{doc.project_name || '—'}</td>
                        <td className="px-6 py-4 text-gray-400">{formatFileSize(doc.size)}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-gray-400 hover:text-white p-1">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-white p-1">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-white p-1">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { setShowUploadModal(false); fetchDocuments(); }}
          user={user}
        />
      )}
    </div>
  );
};

// Upload Document Modal Component
const UploadDocumentModal = ({ onClose, onSuccess, user }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folder, setFolder] = useState('');
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setIsUploading(true);
    try {
      // For now, just simulate upload since we need Supabase Storage setup
      // In production, you'd upload to Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Upload functionality requires Supabase Storage bucket to be configured. Files would be uploaded to: documents/' + (folder || 'root'));
      onSuccess();
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="upload-document-modal">
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 w-full max-w-md">
        <div className="p-6 border-b border-charcoal-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upload Documents</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Folder (optional)</label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-2 text-white focus:border-steel-500 focus:outline-none"
            >
              <option value="">Root folder</option>
              <option value="contracts">Contracts</option>
              <option value="permits">Permits & Licenses</option>
              <option value="insurance">Insurance</option>
              <option value="receipts">Receipts</option>
            </select>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-charcoal-600 rounded-xl p-8 text-center cursor-pointer hover:border-steel-500/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
            <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-white font-medium">Click to select files</p>
            <p className="text-gray-500 text-sm mt-1">PDF, Images, Word, Excel</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">{selectedFiles.length} file(s) selected:</p>
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-charcoal-700 rounded px-3 py-2 text-sm">
                  <File className="w-4 h-4 text-gray-500" />
                  <span className="text-white truncate flex-1">{file.name}</span>
                  <span className="text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-charcoal-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors border border-charcoal-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="flex-1 bg-steel-500 hover:bg-steel-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            data-testid="confirm-upload-btn"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
