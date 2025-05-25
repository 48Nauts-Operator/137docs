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
  MoreVertical,
  SlidersHorizontal
} from 'lucide-react';
import DataTable, { Column } from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/date';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '../ui/dropdown-menu';
import { Button } from '../ui/button';

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
  const STORAGE_KEY = 'inbox_hidden_cols';
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenCols));
  }, [hiddenCols]);

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

  // Document type icon component
  const DocumentTypeIcon = ({ type }: { type: string }) => {
    if (!type) return null;

    const colour = (() => {
      switch (type) {
        case 'invoice':
          return 'text-yellow-500';
        case 'tax':
        case 'tax-return':
          return 'text-red-500';
        default:
          return 'text-blue-500';
      }
    })();

    switch (type) {
      case 'invoice':
        return <FileCheck size={18} className={colour} />;
      case 'tax':
      case 'tax-return':
        return <AlertTriangle size={18} className={colour} />;
      default:
        return <FileText size={18} className={colour} />;
    }
  };

  // Year segment menu
  const nowYear = new Date().getFullYear();
  const yearOptions = [nowYear, nowYear - 1, nowYear - 2, 'Archive'] as const;
  type YearSegment = typeof yearOptions[number];
  const [yearSegment, setYearSegment] = useState<YearSegment>(nowYear);

  const filteredDocs = documents.filter((doc: any) => {
    const dateStr = doc.due_date || doc.document_date || doc.created_at;
    if (!dateStr) return false;
    const year = new Date(dateStr).getFullYear();

    if (yearSegment === 'Archive') {
      return year < nowYear - 2;
    }
    return year === yearSegment;
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

  const toggleCol = (id: string) => {
    setHiddenCols((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const allCols: Column<any>[] = [
    {
      id: 'select',
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
      id: 'type',
      header: '',
      accessor: (row: any) => <DocumentTypeIcon type={row.documentType} />,
      width: '40px',
    },
    { id: 'id', header: 'ID', accessor: (row: any) => (row.hash ? row.hash.slice(0, 8) : row.id) },
    {
      id: 'created',
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('created_at')}>
          Date Added
          {sortField === 'created_at' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
        </div>
      ),
      accessor: (row: any) => formatDate(row.created_at),
    },
    {
      id: 'due',
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('dueDate')}>
          Due Date
          {sortField === 'dueDate' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
        </div>
      ),
      accessor: (row: any) => formatDate(row.due_date),
    },
    {
      id: 'invoice_date',
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('document_date')}>
          Invoice Date
          {sortField === 'document_date' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
        </div>
      ),
      accessor: (row: any) => formatDate(row.document_date),
    },
    {
      id: 'vendor',
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('sender')}>
          Vendor
          {sortField === 'sender' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
        </div>
      ),
      accessor: 'sender',
    },
    {
      id: 'title',
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('title')}>
          Invoice ID
          {sortField === 'title' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
        </div>
      ),
      accessor: 'title',
    },
    { id: 'currency', header: 'Curr.', accessor: 'currency' },
    { id: 'amount', header: 'Amount', accessor: (row: any) => (row.amount ? row.amount.toFixed(2) : '-'), align: 'right' },
    { id: 'vat', header: 'VAT', accessor: (row: any) => (row.tax_amount ? row.tax_amount.toFixed(2) : '-'), align: 'right' },
    { id: 'tags', header: 'Tags', accessor: (row: any) => (row.tags?.map((t:any)=>t.name).join(', ') || '-'), width:'120px' },
    { id: 'status', header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
  ];

  const columns = allCols.filter((c)=> !c.id || !hiddenCols.includes(c.id));

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

        {/* Column selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <SlidersHorizontal size={14}/> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {['select','type','id','created','due','invoice_date','vendor','title','currency','amount','vat','tags','status'].map(id=> (
              <DropdownMenuCheckboxItem
                key={id}
                checked={!hiddenCols.includes(id)}
                onCheckedChange={()=>toggleCol(id)}
              >{id}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
            return (
              <DataTable
                enablePagination
                enableColumnPicker={false}
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
