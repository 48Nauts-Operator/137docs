import React, { useState, useEffect } from 'react';
import { useDocuments, documentApi, useTenants } from '../../services/api';
import { 
  FileText, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  SortAsc,
  SortDesc,
  Loader,
  MoreVertical,
  SlidersHorizontal,
  Building2,
  User
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

  // Get tenants for recipient display
  const { tenants, defaultTenant, setDefault } = useTenants();

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

  // Helper function to parse dates in multiple formats
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try ISO format first (2024-08-29)
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try European format (30.10.2024)
    const europeanMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (europeanMatch) {
      const [, day, month, year] = europeanMatch;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  };

  const filteredDocs = documents.filter((doc: any) => {
    const dateStr = doc.due_date || doc.document_date || doc.created_at;
    
    // Apply year filtering (but don't hide docs without dates)
    let yearMatch = true; // Default to showing documents
    if (dateStr) {
      const parsedDate = parseDate(dateStr);
      if (parsedDate) {
        const year = parsedDate.getFullYear();
        if (yearSegment === 'Archive') {
          yearMatch = year < nowYear - 2;
        } else {
          yearMatch = year === yearSegment;
        }
      } else {
        // If date parsing fails, show in current year (not archive)
        yearMatch = yearSegment !== 'Archive';
      }
    } else {
      // Documents without dates: show them in current year view, hide in archive
      yearMatch = yearSegment !== 'Archive';
    }

    // Apply tenant filtering based on current default tenant
    let tenantMatch = true;
    if (defaultTenant) {
      // Only show documents that belong to the current default tenant
      tenantMatch = doc.recipient === defaultTenant.alias;
    }
    // If no default tenant is set, show all documents (no filtering)

    // Check other potential filters (status, search)
    let statusMatch = true;
    if (filterStatus) {
      statusMatch = doc.status === filterStatus;
    }
    
    let searchMatch = true;
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      searchMatch = [doc.title, doc.sender, doc.recipient, doc.status]
        .some(field => field && field.toLowerCase().includes(query));
    }

    const finalMatch = yearMatch && tenantMatch && statusMatch && searchMatch;

    return finalMatch;
  });

  const sortedDocuments = [...filteredDocs].sort((a, b) => {
    // Handle sorting
    if (a[sortField] === null) return 1;
    if (b[sortField] === null) return -1;
    
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Debug information
  console.log(`[DEBUG] Documents: ${documents.length} total → ${filteredDocs.length} after filtering → ${sortedDocuments.length} final`);
  console.log(`[DEBUG] Year segment: ${yearSegment}, Default tenant: ${defaultTenant?.alias || 'None'}`);
  if (!defaultTenant) {
    console.log('[DEBUG] Showing ALL documents (no tenant filter)');
  }

  // Add visible debug info in UI when in All Documents mode
  const showDebugInfo = false; // Disabled - issue resolved

  // Listen to external refresh events
  useEffect(() => {
    const refresh = () => {
      console.log('[DEBUG] Documents refresh event triggered');
      setSearchQuery((q) => q + ' ');
    };
    window.addEventListener('documentsRefresh', refresh);
    return () => window.removeEventListener('documentsRefresh', refresh);
  }, []);

  // Also listen for defaultTenant changes to trigger refresh
  useEffect(() => {
    console.log('[DEBUG] Default tenant changed:', defaultTenant);
    // Force a small state update to trigger re-render
    setSearchQuery((q) => q.trim());
  }, [defaultTenant]);

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
      id: 'tenant',
      header: (
        <div className="flex items-center cursor-pointer" onClick={() => handleSort('recipient')}>
          Tenant
          {sortField === 'recipient' && (sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />)}
        </div>
      ),
      accessor: (row: any) => {
        const matchingTenant = tenants.find(t => t.alias === row.recipient);
        if (matchingTenant) {
          return (
            <div className="flex items-center space-x-1">
              {matchingTenant.type === 'company' ? (
                <Building2 size={14} className="text-blue-500" />
              ) : (
                <User size={14} className="text-green-500" />
              )}
              <span className="text-sm">{matchingTenant.alias}</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-1">
              <User size={14} className="text-secondary-500" />
              <span className="text-sm text-secondary-500">{row.recipient || '-'}</span>
            </div>
          );
        }
      },
      width: '120px',
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

        {/* Tenant Filter Indicator */}
        {defaultTenant ? (
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            {defaultTenant.type === 'company' ? (
              <Building2 className="w-4 h-4 text-blue-500" />
            ) : (
              <User className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Showing: {defaultTenant.alias}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              (Use dropdown in top nav to show "All Documents")
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                try {
                  await setDefault(null);
                } catch (error) {
                  console.error('Failed to clear tenant filter:', error);
                }
              }}
              className="ml-2 text-xs"
            >
              Show All
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm text-green-700 dark:text-green-300">
              Showing: All Documents
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              (Use dropdown in top nav to filter by tenant)
            </span>
          </div>
        )}

        {/* Column selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <SlidersHorizontal size={14}/> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {['select','type','id','created','due','invoice_date','vendor','tenant','title','currency','amount','vat','tags','status'].map(id=> (
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

      {/* Debug Information Panel */}
      {showDebugInfo && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            🔍 Debug Info: Documents Being Filtered
          </h4>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <div>📊 <strong>Total loaded:</strong> {documents.length} documents</div>
            <div>✅ <strong>After filtering:</strong> {filteredDocs.length} documents</div>
            <div>❌ <strong>Hidden:</strong> {documents.length - filteredDocs.length} documents</div>
            <div>📅 <strong>Year filter:</strong> {yearSegment}</div>
            <div>🏢 <strong>Tenant filter:</strong> {defaultTenant?.alias || 'All Documents'}</div>
            <div>📝 <strong>Status filter:</strong> {filterStatus || 'None'}</div>
            <div>🔍 <strong>Search:</strong> {searchQuery ? `"${searchQuery}"` : 'None'}</div>
          </div>
        </div>
      )}

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
