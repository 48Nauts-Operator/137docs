import React, { useState } from 'react';
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
  SortDesc
} from 'lucide-react';

// Mock document data
const mockDocuments = [
  {
    id: 1,
    title: 'Invoice #2023-001',
    sender: 'Acme Corporation',
    documentDate: '2023-05-15',
    dueDate: '2023-06-15',
    amount: 1250.00,
    documentType: 'invoice',
    status: 'paid',
    tags: ['business', 'paid', '2023']
  },
  {
    id: 2,
    title: 'Electricity Bill May 2023',
    sender: 'Power Company',
    documentDate: '2023-05-20',
    dueDate: '2023-06-10',
    amount: 142.50,
    documentType: 'invoice',
    status: 'unpaid',
    tags: ['utility', 'monthly']
  },
  {
    id: 3,
    title: 'Contract Renewal',
    sender: 'Office Space Inc.',
    documentDate: '2023-05-18',
    dueDate: '2023-06-30',
    amount: null,
    documentType: 'contract',
    status: 'pending',
    tags: ['business', 'important', 'contract']
  },
  {
    id: 4,
    title: 'Internet Service Invoice',
    sender: 'FastNet Provider',
    documentDate: '2023-05-22',
    dueDate: '2023-06-05',
    amount: 89.99,
    documentType: 'invoice',
    status: 'overdue',
    tags: ['utility', 'monthly']
  },
  {
    id: 5,
    title: 'Insurance Policy',
    sender: 'Secure Insurance Co.',
    documentDate: '2023-04-30',
    dueDate: null,
    amount: null,
    documentType: 'document',
    status: 'processed',
    tags: ['insurance', 'important']
  }
];

interface DocumentListProps {
  onSelectDocument: (document: any) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onSelectDocument }) => {
  const [documents, setDocuments] = useState(mockDocuments);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('documentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Apply filters and sorting
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      // Apply status filter
      if (filterStatus && doc.status !== filterStatus) return false;
      
      // Apply type filter
      if (filterType && doc.documentType !== filterType) return false;
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.sender.toLowerCase().includes(query) ||
          doc.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
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

      {/* Document List */}
      {viewMode === 'list' ? (
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
              {filteredAndSortedDocuments.map((doc) => (
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
              {filteredAndSortedDocuments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary-500">
                    No documents found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDocuments.map((doc) => (
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
                {doc.tags.map((tag, index) => (
                  <span key={index} className="tag bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {filteredAndSortedDocuments.length === 0 && (
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

export default DocumentList;
