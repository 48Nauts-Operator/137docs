import React, { useState, useEffect } from 'react';
import { useDocument, documentApi, API_BASE_URL, settingsApi, useTenants } from '../../services/api';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Edit, 
  Trash2, 
  Tag as TagIcon,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building,
  CheckCircle,
  XCircle,
  Loader,
  Brain,
  Sparkles,
  Zap,
  X,
  Save,
  Lightbulb,
  BarChart3,
  UserCheck
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

interface DocumentPreviewIntegratedProps {
  documentId: number | null;
}

const DocumentPreviewIntegrated: React.FC<DocumentPreviewIntegratedProps> = ({ documentId }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // LLM processing state
  const [llmStatus, setLlmStatus] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingTenant, setIsExtractingTenant] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Use the custom hook to fetch document details
  const { document, loading, error } = useDocument(documentId);
  
  // Get tenants for recipient dropdown
  const { tenants, loading: tenantsLoading } = useTenants();
  
  // Local form state for editing
  const [formData, setFormData] = useState({
    title: '',
    documentType: '',
    documentDate: '',
    dueDate: '',
    amount: '',
    currency: '',
    status: '',
    sender: '',
    recipient: '',
  });
  
  // Fetch document tags and LLM status
  useEffect(() => {
    const fetchTags = async () => {
      if (documentId) {
        try {
          const tagData = await documentApi.getDocumentTags(documentId);
          setTags(tagData);
        } catch (err) {
          console.error('Error fetching tags:', err);
        }
      }
    };
    
    const fetchLlmStatus = async () => {
      try {
        const status = await settingsApi.getLlmStatus();
        setLlmStatus(status);
      } catch (err) {
        console.error('Error fetching LLM status:', err);
      }
    };
    
    fetchTags();
    fetchLlmStatus();
  }, [documentId]);
  
  // Populate form when document loads or changes
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        documentType: document.documentType || '',
        documentDate: document.documentDate ? document.documentDate.substring(0, 10) : '',
        dueDate: document.dueDate ? document.dueDate.substring(0, 10) : '',
        amount: document.amount !== null && document.amount !== undefined ? String(document.amount) : '',
        currency: document.currency || '',
        status: document.status || '',
        sender: document.sender || '',
        recipient: document.recipient || '',
      });
    }
  }, [document]);
  
  // Handle adding a new tag
  const handleAddTag = async () => {
    if (!newTag.trim() || !documentId) return;
    
    setIsAddingTag(true);
    try {
      await documentApi.addTagToDocument(documentId, newTag.trim());
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    } catch (err) {
      console.error('Error adding tag:', err);
    } finally {
      setIsAddingTag(false);
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = async (tag: string) => {
    if (!documentId) return;
    
    try {
      await documentApi.removeTagFromDocument(documentId, tag);
      setTags(tags.filter(t => t !== tag));
    } catch (err) {
      console.error('Error removing tag:', err);
    }
  };

  // Handle change for form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!documentId) return;
    const payload = {
      title: formData.title,
      documentType: formData.documentType,
      documentDate: formData.documentDate,
      dueDate: formData.dueDate,
      amount: formData.amount ? parseFloat(formData.amount) : '',
      currency: formData.currency,
      status: formData.status,
      sender: formData.sender,
      recipient: formData.recipient,
    };
    const updated = await documentApi.updateDocument(documentId, payload);
    if (updated) {
      // Optimistically update local state and document details
      setIsEditing(false);
      setFormData((prev) => ({ ...prev }));
      // Force re-fetch optional
      window.dispatchEvent(new Event('documentsRefresh'));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (document) {
      setFormData({
        title: document.title || '',
        documentType: document.documentType || '',
        documentDate: document.documentDate ? document.documentDate.substring(0, 10) : '',
        dueDate: document.dueDate ? document.dueDate.substring(0, 10) : '',
        amount: document.amount !== null && document.amount !== undefined ? String(document.amount) : '',
        currency: document.currency || '',
        status: document.status || '',
        sender: document.sender || '',
        recipient: document.recipient || '',
      });
    }
  };

  // LLM processing functions
  const handleProcessDocument = async () => {
    if (!documentId || !llmStatus?.enabled) return;
    
    setIsProcessing(true);
    try {
      const result = await settingsApi.processDocument(documentId, false);
      if (result.status === 'success') {
        // Refresh document data
        window.dispatchEvent(new Event('documentsRefresh'));
        alert('Document processed successfully!');
      } else {
        alert(`Processing failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error processing document:', err);
      alert('Error processing document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!documentId || !llmStatus?.enabled) return;
    
    setIsSuggestingTags(true);
    try {
      const result = await settingsApi.suggestTags(documentId);
      if (result.status === 'success' && result.suggested_tags) {
        // Add suggested tags to the current tags
        const newTags = result.suggested_tags.filter((tag: string) => !tags.includes(tag));
        if (newTags.length > 0) {
          for (const tag of newTags) {
            await documentApi.addTagToDocument(documentId, tag);
          }
          setTags([...tags, ...newTags]);
          alert(`Added ${newTags.length} suggested tags!`);
        } else {
          alert('No new tags to suggest');
        }
      } else {
        alert('No tags suggested');
      }
    } catch (err) {
      console.error('Error suggesting tags:', err);
      alert('Error suggesting tags');
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!documentId || !llmStatus?.enabled) return;
    
    setIsAnalyzing(true);
    try {
      const result = await settingsApi.analyzeDocument(documentId);
      if (result.status === 'success' && result.analysis) {
        setAnalysis(result.analysis);
        setActiveTab('analysis');
      } else {
        alert('Analysis failed');
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
      alert('Error analyzing document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractTenant = async () => {
    if (!documentId || !llmStatus?.enabled) return;
    
    setIsExtractingTenant(true);
    try {
      const result = await settingsApi.extractTenant(documentId);
      if (result.status === 'success') {
        // Refresh document data and tenants
        window.dispatchEvent(new Event('documentsRefresh'));
        
        // Show success message with details
        const action = result.action === 'created' ? 'Created new tenant' : 
                      result.action === 'found' ? 'Found existing tenant' : 'Updated tenant';
        alert(`${action}: ${result.tenant.alias}\n${result.message}`);
        
        // Update form data if in edit mode
        if (isEditing && result.tenant) {
          setFormData(prev => ({
            ...prev,
            recipient: result.tenant.alias
          }));
        }
      } else {
        alert(`Tenant extraction failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Error extracting tenant:', err);
      alert('Error extracting tenant information');
    } finally {
      setIsExtractingTenant(false);
    }
  };

  if (!documentId) {
    return (
      <div className="document-preview flex items-center justify-center h-full">
        <div className="text-center p-8">
          <FileText size={48} className="mx-auto text-secondary-300 mb-4" />
          <h3 className="text-xl font-medium text-secondary-600 dark:text-secondary-400">
            Select a document to preview
          </h3>
          <p className="text-secondary-500 dark:text-secondary-500 mt-2">
            Choose a document from the list to view its details
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="document-preview flex items-center justify-center h-full">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading document details...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="document-preview flex items-center justify-center h-full">
        <div className="text-center p-8">
          <XCircle size={48} className="mx-auto text-danger-500 mb-4" />
          <h3 className="text-xl font-medium text-danger-600 dark:text-danger-400">
            Error loading document
          </h3>
          <p className="text-secondary-500 dark:text-secondary-500 mt-2">
            {error || "Document not found"}
          </p>
          <button className="btn btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Calculate days until due or overdue
  const getDueDateStatus = () => {
    if (!document.dueDate) return null;
    
    const dueDate = new Date(document.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, className: 'text-danger-600 dark:text-danger-400' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'text-warning-600 dark:text-warning-400' };
    } else {
      return { text: `Due in ${diffDays} days`, className: 'text-secondary-600 dark:text-secondary-400' };
    }
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div className="document-preview h-full flex flex-col">
      <div className="document-preview-header">
        <h2 className="text-lg font-medium">{document.title}</h2>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              {/* LLM Actions */}
              {llmStatus?.enabled && (
                <>
                  <button 
                    className="p-1.5 rounded-md hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400" 
                    title="Process with AI"
                    onClick={handleProcessDocument}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader size={18} className="animate-spin" /> : <Brain size={18} />}
                  </button>
                  <button 
                    className="p-1.5 rounded-md hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400" 
                    title="Suggest Tags"
                    onClick={handleSuggestTags}
                    disabled={isSuggestingTags}
                  >
                    {isSuggestingTags ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                  <button 
                    className="p-1.5 rounded-md hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400" 
                    title="Analyze Document"
                    onClick={handleAnalyzeDocument}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
                  </button>
                  <button 
                    className="p-1.5 rounded-md hover:bg-primary-100 dark:hover:bg-primary-700 text-primary-600 dark:text-primary-400" 
                    title="Smart Recipient - Extract and assign tenant"
                    onClick={handleExtractTenant}
                    disabled={isExtractingTenant}
                  >
                    {isExtractingTenant ? <Loader size={18} className="animate-spin" /> : <UserCheck size={18} />}
                  </button>
                  <div className="border-l border-secondary-300 dark:border-secondary-600 mx-1"></div>
                </>
              )}
              
              <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Download">
                <Download size={18} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Print">
                <Printer size={18} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Share">
                <Share2 size={18} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Edit" onClick={() => setIsEditing(true)}>
                <Edit size={18} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 text-danger-500" title="Delete">
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button className="p-1.5 rounded-md hover:bg-success-100 dark:hover:bg-success-700 text-success-600" title="Save" onClick={handleSave}>
                Save
              </button>
              <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Cancel" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-secondary-200 dark:border-secondary-700">
        <nav className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'preview'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'related'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
            }`}
            onClick={() => setActiveTab('related')}
          >
            Related
          </button>
          {llmStatus?.enabled && analysis && (
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'analysis'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
              onClick={() => setActiveTab('analysis')}
            >
              <Brain size={16} className="inline mr-1" />
              Analysis
            </button>
          )}
        </nav>
      </div>

      <div className="document-preview-content flex-1 overflow-y-auto px-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* ID (read-only) */}
            <div className="space-y-1">
              <div className="text-xs text-secondary-500 dark:text-secondary-400">Document ID</div>
              <div>{document.id}</div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <div className="text-xs text-secondary-500 dark:text-secondary-400">Invoice Number</div>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input w-full text-gray-900 dark:text-gray-400"
                />
              ) : (
                <div>{document.title}</div>
              )}
            </div>

            {isEditing && (
            <>
            {/* Document metadata grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Document Type */}
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Document Type</div>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="form-select w-full text-gray-900 dark:text-gray-400"
                >
                  <option value="">Select type</option>
                  <option value="invoice">Invoice</option>
                  <option value="reminder">Reminder</option>
                  <option value="tax">Tax</option>
                  <option value="letter">Letter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Document Date */}
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Document Date</div>
                <input
                  type="date"
                  name="documentDate"
                  value={formData.documentDate}
                  onChange={handleChange}
                  className="form-input w-full text-gray-900 dark:text-gray-400"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Due Date</div>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="form-input w-full text-gray-900 dark:text-gray-400"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Amount</div>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className="form-input w-full text-gray-900 dark:text-gray-400"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Currency</div>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="form-select w-full text-gray-900 dark:text-gray-400"
                >
                  <option value="">Select</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CHF">CHF</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <div className="text-xs text-secondary-500 dark:text-secondary-400">Status</div>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select w-full text-gray-900 dark:text-gray-400"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sender */}
            <div className="space-y-1">
              <div className="text-xs text-secondary-500 dark:text-secondary-400">Sender</div>
              <input
                type="text"
                name="sender"
                value={formData.sender}
                onChange={handleChange}
                className="form-input w-full text-gray-900 dark:text-gray-400"
              />
            </div>

            {/* Recipient */}
            <div className="space-y-1">
              <div className="text-xs text-secondary-500 dark:text-secondary-400">Recipient</div>
              <select
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
                className="form-select w-full text-gray-900 dark:text-gray-400"
              >
                <option value="">Select recipient...</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.alias}>
                    {tenant.alias} ({tenant.type === 'company' ? 'Company' : 'Individual'})
                  </option>
                ))}
              </select>
              {tenantsLoading && (
                <div className="text-xs text-secondary-500">Loading tenant options...</div>
              )}
            </div>
            </>
            )}

            {/* Status section (view mode only) */}
            {!isEditing && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <StatusBadge status={document.status} className="inline-flex items-center" />
              </div>
              {dueDateStatus && (
                <span className={`text-sm ${dueDateStatus.className}`}>
                  {dueDateStatus.text}
                </span>
              )}
            </div>
            )}

            {/* Document metadata (view mode only) */}
            {!isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Document Type</div>
                <div className="flex items-center">
                  <FileText size={16} className="mr-1.5 text-secondary-500" />
                  <span className="capitalize">{document.documentType}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-secondary-500 dark:text-secondary-400">Document Date</div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1.5 text-secondary-500" />
                  <span>{formatDate(document.documentDate)}</span>
                </div>
              </div>
              
              {document.dueDate && (
                <div className="space-y-1">
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Due Date</div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1.5 text-secondary-500" />
                    <span>{formatDate(document.dueDate)}</span>
                  </div>
                </div>
              )}
              
              {document.amount && (
                <div className="space-y-1">
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">Amount</div>
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-1.5 text-secondary-500" />
                    <span>{`${document.currency || ''} ${document.amount.toFixed(2)}`}</span>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Sender/recipient info (view mode only) */}
            {!isEditing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Sender</div>
                <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md">
                  <div className="flex items-center">
                    <Building size={16} className="mr-1.5 text-secondary-500" />
                    <span className="font-medium">{document.sender}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Recipient</div>
                <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md">
                  <div className="flex items-center">
                    {/* Find the tenant that matches the document recipient */}
                    {(() => {
                      const matchingTenant = tenants.find(t => t.alias === document.recipient);
                      if (matchingTenant) {
                        return (
                          <>
                            {matchingTenant.type === 'company' ? (
                              <Building size={16} className="mr-1.5 text-blue-500" />
                            ) : (
                              <User size={16} className="mr-1.5 text-green-500" />
                            )}
                            <div>
                              <span className="font-medium">{matchingTenant.alias}</span>
                              <div className="text-xs text-secondary-500">{matchingTenant.name}</div>
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <User size={16} className="mr-1.5 text-secondary-500" />
                            <span className="font-medium">{document.recipient || 'Unknown Recipient'}</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center">
                <TagIcon size={16} className="mr-1.5" />
                Tags
              </div>
              <div className="flex flex-wrap">
                {tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="tag bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300 flex items-center"
                  >
                    {tag}
                    <button 
                      className="ml-1 text-secondary-500 hover:text-danger-500"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                
                {isAddingTag ? (
                  <span className="tag bg-secondary-50 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400">
                    <Loader size={12} className="animate-spin mr-1" />
                    Adding...
                  </span>
                ) : (
                  <div className="flex items-center">
                    <input
                      type="text"
                      className="form-input py-0.5 px-2 text-xs w-24"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag();
                        }
                      }}
                    />
                    <button 
                      className="ml-1 p-1 text-primary-500 hover:text-primary-700"
                      onClick={handleAddTag}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full">
            {documentId ? (
              <iframe
                title="Document preview"
                src={`${API_BASE_URL}/documents/${documentId}/file?api_key=test-api-key`}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary-500">No document selected</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Related Documents</h3>
            <div className="space-y-2">
              <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Previous Invoice #2023-042</div>
                    <div className="text-sm text-secondary-500">April 15, 2023</div>
                  </div>
                  <span className="status-paid">Paid</span>
                </div>
              </div>
              <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Contract Agreement</div>
                    <div className="text-sm text-secondary-500">January 10, 2023</div>
                  </div>
                  <span className="badge badge-secondary">Contract</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && analysis && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Brain size={20} className="text-primary-600" />
              <h3 className="text-lg font-medium">AI Analysis</h3>
            </div>
            
            {analysis.summary && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Summary</h4>
                <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md">
                  <p className="text-sm">{analysis.summary}</p>
                </div>
              </div>
            )}

            {analysis.key_points && analysis.key_points.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Key Points</h4>
                <div className="space-y-2">
                  {analysis.key_points.map((point: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.entities && analysis.entities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Named Entities</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.entities.map((entity: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.sentiment && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Sentiment</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    analysis.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
                  </span>
                </div>
              </div>
            )}

            {analysis.action_items && analysis.action_items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Action Items</h4>
                <div className="space-y-2">
                  {analysis.action_items.map((item: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreviewIntegrated;
