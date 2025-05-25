import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../services/api';
import { 
  FileText, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Grid, 
  List, 
  ChevronDown,
  Search,
  SortAsc,
  SortDesc,
  Loader
} from 'lucide-react';

interface DocumentListProps {
  onSelectDocument: (document: any) => void;
}

const DocumentListIntegrated: React.FC<DocumentListProps> = ({ onSelectDocument }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('documentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Use the custom hook to fetch documents
  const { documents, loading, error } = useDocuments({
    status: filterStatus,
    documentType: filterType,
    search: searchQuery
  });

  // Handle document selection
  const handleSelectDocument = (document: any) => {
    setSelectedDocument(document.id);
    onSelectDocument(document);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply sorting
  const sortedDocuments = [...documents].sort((a, b) => {
    // Handle sorting
    if (a[sortField] === null) return 1;
    if (b[sortField] === null) return -1;
    
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'paid':
        return <span className="status-paid">Paid</span>;
      case 'unpaid':
        return <span className="status-unpaid">Unpaid</span>;
      case 'overdue':
        return <span className="status-overdue">Overdue</span>;
      default:
        return <span className="status-pending">Pending</span>;
    }
  };

  // Document type icon component
  const DocumentTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'invoice':
        return <FileCheck size={18} className="text-primary-500" />;
      case 'contract':
        return <FileText size={18} className="text-secondary-500" />;
      case 'reminder':
        return <AlertTriangle size={18} className="text-warning-500" />;
      default:
        return <FileText size={18} className="text-secondary-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={16} />
            <input
              type="text"
              placeholder="Search documents..."
              className="form-input pl-9 py-1.5 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button className="btn btn-outline py-1.5 text-sm flex items-center">
              <Filter size={16} className="mr-1" />
              Filter
              <ChevronDown size={16} className="ml-1" />
            </button>
            {/* Filter dropdown would go here */}
          </div>
          
          <div className="flex border border-secondary-200 dark:border-secondary-700 rounded-md">
            <button
              className={`p-1.5 ${viewMode === 'list' ? 'bg-secondary-100 dark:bg-secondary-700' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-secondary-100 dark:bg-secondary-700' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader size={32} className="animate-spin text-primary-500" />
          <span className="ml-2 text-secondary-600 dark:text-secondary-400">Loading documents...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 text-danger-800 dark:text-danger-300 p-4 rounded-md">
          <p>Error loading documents: {error}</p>
          <button className="btn btn-outline text-danger-600 dark:text-danger-400 mt-2">Retry</button>
        </div>
      )}

      {/* Document List */}
      {!loading && !error && viewMode === 'list' && (
        <div className="table-container bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    {sortField === 'title' && (
                      sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('sender')}
                >
                  <div className="flex items-center">
                    Sender
                    {sortField === 'sender' && (
                      sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('documentDate')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'documentDate' && (
                      sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center">
                    Due Date
                    {sortField === 'dueDate' && (
                      sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedDocuments.map((doc) => (
                <tr 
                  key={doc.id} 
                  className={`hover:bg-secondary-50 dark:hover:bg-secondary-800 cursor-pointer ${selectedDocument === doc.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  onClick={() => handleSelectDocument(doc)}
                >
                  <td className="pl-4">
                    <DocumentTypeIcon type={doc.documentType} />
                  </td>
                  <td>{doc.title}</td>
                  <td>{doc.sender}</td>
                  <td>{doc.documentDate}</td>
                  <td>{doc.dueDate || '-'}</td>
                  <td>{doc.amount ? `$${doc.amount.toFixed(2)}` : '-'}</td>
                  <td><StatusBadge status={doc.status} /></td>
                </tr>
              ))}
              {sortedDocuments.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary-500">
                    No documents found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`document-card ${selectedDocument === doc.id ? 'document-card-selected' : ''}`}
              onClick={() => handleSelectDocument(doc)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <DocumentTypeIcon type={doc.documentType} />
                  <h3 className="ml-2 font-medium truncate">{doc.title}</h3>
                </div>
                <StatusBadge status={doc.status} />
              </div>
              
              <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                {doc.sender}
              </div>
              
              <div className="flex justify-between text-xs text-secondary-500 dark:text-secondary-500 mb-2">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  {doc.documentDate}
                </div>
                {doc.amount && (
                  <div className="font-medium">${doc.amount.toFixed(2)}</div>
                )}
              </div>
              
              <div className="flex flex-wrap mt-2">
                {doc.tags && doc.tags.map((tag: string, index: number) => (
                  <span key={index} className="tag bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {sortedDocuments.length === 0 && !loading && (
            <div className="col-span-full empty-state">
              <div className="empty-state-icon">
                <FileText />
              </div>
              <p className="empty-state-text">No documents found matching your criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentListIntegrated;
