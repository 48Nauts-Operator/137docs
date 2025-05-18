import React, { useState, useEffect } from 'react';
import { useDocuments, documentApi } from '../../services/api';
import { 
  FileText, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  SortAsc,
  SortDesc,
  Loader,
  MoreVertical
} from 'lucide-react';
import DataTable, { Column } from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';

interface DocumentListProps {
  onSelectDocument: (document: any) => void;
}

const DocumentListIntegrated: React.FC<DocumentListProps> = ({ onSelectDocument }) => {
  const [viewMode] = useState<'list'>('list'); // always list view
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<string>('documentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActions, setShowActions] = useState<boolean>(false);
  
  // Use the custom hook to fetch documents
  const { documents, loading, error } = useDocuments({
    status: filterStatus,
    search: searchQuery
  });

  // Handle document selection
  const handleSelectDocument = (document: any) => {
    setSelectedDocument(document.id);
    onSelectDocument(document);
  };

  // Toggle checkbox
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await documentApi.deleteDocument(id);
    }
    setSelectedIds(new Set());
    setSearchQuery((q) => q + " ");
  };

  const bulkUpdateStatus = async (status: string) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await documentApi.updateDocumentStatus(id, status);
    }
    setSelectedIds(new Set());
    setSearchQuery((q) => q + " ");
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

  // Filter by year segment then sort
  const filteredDocs = documents.filter((doc: any) => {
    const dateStr = doc.documentDate || doc.created_at || doc.due_date;
    if (!dateStr) return false;
    const year = new Date(dateStr).getFullYear();
    return year >= 2023;
  });

  const sortedDocuments = [...filteredDocs].sort((a, b) => {
    // Handle sorting
    if (a[sortField] === null) return 1;
    if (b[sortField] === null) return -1;
    
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Listen to external refresh events
  useEffect(() => {
    const refresh = () => setSearchQuery((q) => q + ' ');
    window.addEventListener('documentsRefresh', refresh);
    return () => window.removeEventListener('documentsRefresh', refresh);
  }, []);

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

  // Year segment menu
  const nowYear = new Date().getFullYear();
  const yearOptions = [nowYear, nowYear - 1, nowYear - 2, 'Archive'] as const;
  type YearSegment = typeof yearOptions[number];
  const [yearSegment, setYearSegment] = useState<YearSegment>(nowYear);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
        {/* Year tabs */}
        <div className="flex items-center space-x-4">
          {yearOptions.map((y) => (
            <button
              key={y.toString()}
              onClick={() => setYearSegment(y)}
              className={`text-sm font-medium px-3 py-1 rounded-md ${yearSegment === y ? 'bg-primary-600 text-white' : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
            >
              {y === 'Archive' ? 'Archive' : y}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="relative">
            <button
              className="p-1.5 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
              onClick={() => setShowActions((s) => !s)}
              title="Bulk actions"
            >
              <MoreVertical size={18} />
            </button>
            {showActions && (
              <div
                className="absolute right-0 mt-2 w-40 bg-white dark:bg-secondary-800 shadow-lg rounded-md z-50"
              >
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  onClick={() => {
                    deleteSelected();
                    setShowActions(false);
                  }}
                >
                  Delete ({selectedIds.size})
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  onClick={() => {
                    window.print();
                    setShowActions(false);
                  }}
                >
                  Print
                </button>
                <div className="border-t border-secondary-200 dark:border-secondary-700 my-1" />
                {['archive', 'paid', 'delayed'].map((status) => (
                  <button
                    key={status}
                    className="block w-full text-left px-4 py-2 text-sm capitalize hover:bg-secondary-50 dark:hover:bg-secondary-700"
                    onClick={() => {
                      bulkUpdateStatus(status);
                      setShowActions(false);
                    }}
                  >
                    Mark as {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
      {!loading && !error && (
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
          {/* Build columns for DataTable */}
          {(() => {
            const columns: Column<any>[] = [
              {
                header: (
                  <input
                    type="checkbox"
                    checked={selectedIds.size === sortedDocuments.length && sortedDocuments.length > 0}
                    onChange={toggleSelectAll}
                  />
                ),
                accessor: (row: any) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(row.id);
                    }}
                  />
                ),
                align: 'center',
                width: '40px',
              },
              {
                header: '',
                accessor: (row: any) => <DocumentTypeIcon type={row.documentType} />,
                width: '40px',
              },
              {
                header: (
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('created_at')}>
                    Date Added
                    {sortField === 'created_at' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
                  </div>
                ),
                accessor: (row: any) => (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'),
              },
              { header: 'ID', accessor: (row: any) => (row.hash ? row.hash.slice(0, 8) : row.id) },
              {
                header: (
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('title')}>
                    Invoice No
                    {sortField === 'title' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
                  </div>
                ),
                accessor: 'title',
              },
              {
                header: (
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('sender')}>
                    Sender
                    {sortField === 'sender' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
                  </div>
                ),
                accessor: 'sender',
              },
              {
                header: (
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('dueDate')}>
                    Due Date
                    {sortField === 'dueDate' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
                  </div>
                ),
                accessor: (row: any) => row.due_date || '-',
              },
              { header: 'Amount', accessor: (row: any) => (row.amount ? row.amount.toFixed(2) : '-'), align: 'right' },
              { header: 'Curr.', accessor: 'currency' },
              { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
            ];

            return (
              <DataTable
                columns={columns}
                data={sortedDocuments}
                isStriped
                hoverHighlight
                onRowClick={handleSelectDocument}
                getRowClass={(row: any) =>
                  selectedDocument === row.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }
              />
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default DocumentListIntegrated;
