import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';

interface DocumentPreviewProps {
  document: any | null;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!document) {
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
          <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Download">
            <Download size={18} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Print">
            <Printer size={18} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Share">
            <Share2 size={18} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700" title="Edit">
            <Edit size={18} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700 text-danger-500" title="Delete">
            <Trash2 size={18} />
          </button>
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
        </nav>
      </div>

      <div className="document-preview-content flex-1 overflow-y-auto">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Status section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  document.status === 'paid' ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300' :
                  document.status === 'overdue' ? 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-300' :
                  'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300'
                }`}>
                  {document.status === 'paid' ? (
                    <CheckCircle size={16} className="mr-1" />
                  ) : document.status === 'overdue' ? (
                    <XCircle size={16} className="mr-1" />
                  ) : null}
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </span>
              </div>
              {dueDateStatus && (
                <span className={`text-sm ${dueDateStatus.className}`}>
                  {dueDateStatus.text}
                </span>
              )}
            </div>

            {/* Document metadata */}
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
                    <span>${document.amount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sender/recipient info */}
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
                    <User size={16} className="mr-1.5 text-secondary-500" />
                    <span className="font-medium">Your Company</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center">
                <TagIcon size={16} className="mr-1.5" />
                Tags
              </div>
              <div className="flex flex-wrap">
                {document.tags.map((tag: string, index: number) => (
                  <span key={index} className="tag bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300">
                    {tag}
                  </span>
                ))}
                <button className="tag bg-secondary-50 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400 border border-dashed border-secondary-300 dark:border-secondary-600">
                  + Add Tag
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <FileText size={48} className="mx-auto text-secondary-300 mb-4" />
              <h3 className="text-xl font-medium text-secondary-600 dark:text-secondary-400">
                Document Preview
              </h3>
              <p className="text-secondary-500 dark:text-secondary-500 mt-2">
                Document preview would be displayed here
              </p>
            </div>
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
      </div>
    </div>
  );
};

export default DocumentPreview;
