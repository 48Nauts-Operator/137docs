import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments, useTenants } from '../../services/api';
import DataTable, { Column } from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/date';
import { Building2, User } from 'lucide-react';

interface Props {
  onSelect?: (doc: any) => void;
  dueFilter?: boolean;
  documents?: any[];
  hiddenCols?: string[];
}

const InvoiceTable: React.FC<Props> = ({ onSelect, dueFilter = false, documents: overrideDocs, hiddenCols = [] }) => {
  const { documents: fetchedDocs, loading: fetchLoading, error: fetchError } = useDocuments({ document_type: 'invoice' });
  const documents = overrideDocs ?? fetchedDocs;
  const loading = overrideDocs ? false : fetchLoading;
  const error = overrideDocs ? null : fetchError;
  const navigate = useNavigate();

  // Get tenants for recipient display
  const { tenants, defaultTenant } = useTenants();

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const calcDue = (iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    return diffDays > 0 ? `${diffDays}d` : `${diffDays}d`;
  };

  let tableData = documents;
  if (dueFilter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    tableData = documents.filter((doc: any) => {
      const due = doc.due_date ? new Date(doc.due_date) : null;
      if (!due || isNaN(due.getTime())) return false;
      const diff = due.getTime() - today.getTime();
      return diff <= sevenDays; // includes overdue (negative diff)
    });
  }

  // Apply tenant filtering based on current default tenant
  if (defaultTenant) {
    tableData = tableData.filter((doc: any) => {
      return doc.recipient === defaultTenant.alias;
    });
  }

  const baseColumns: (Column<any> & { id: string; sortField?: (row: any) => any })[] = [
    { id: 'date', header: 'Date Added', accessor: (r) => formatDate(r.created_at), sortField: (r) => new Date(r.created_at).getTime() },
    { 
      id: 'vendor', 
      header: 'Vendor', 
      accessor: (r) => (
        <button
          onClick={(e) => handleVendorClick(r.sender, e)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline text-left"
          title={`View analytics for ${r.sender}`}
        >
          {r.sender || '-'}
        </button>
      ), 
      sortField: (r) => r.sender 
    },
    { 
      id: 'tenant', 
      header: 'Tenant', 
      accessor: (r) => {
        const matchingTenant = tenants.find(t => t.alias === r.recipient);
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
              <span className="text-sm text-secondary-500">{r.recipient || '-'}</span>
            </div>
          );
        }
      },
      sortField: (r) => r.recipient 
    },
    { id: 'invoice', header: 'Invoice No', accessor: 'title', sortField: (r) => r.title },
    { id: 'invoice_date', header: 'Invoice Date', accessor: (r) => formatDate(r.document_date), sortField: (r) => r.document_date ?? '' },
    { id: 'due', header: 'Due Date', accessor: (r) => formatDate(r.due_date), sortField: (r) => r.due_date ?? '' },
    { id: 'duein', header: 'Due In', accessor: (r) => {
        if (r.status?.toLowerCase?.() === 'paid') {
          return <span className="text-secondary-300 dark:text-secondary-400">0</span>; // neutral
        }

        if (!r.due_date) return '-';

        const d = new Date(r.due_date);
        if (isNaN(d.getTime())) return '-';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let color = '';
        if (diffDays > 30) color = 'text-blue-400';
        else if (diffDays >= 14) color = 'text-yellow-400';
        else color = 'text-red-500'; // <14 incl overdue

        const label = diffDays === 0 ? 'Today' : `${diffDays}d`;
        return <span className={color}>{label}</span>;
      } },
    { id: 'currency', header: 'Curr.', accessor: 'currency', sortField: (r) => r.currency },
    { id: 'amount', header: 'Amount', accessor: (r) => (r.amount?.toFixed(2) ?? '-'), align: 'right', sortField: (r) => r.amount ?? 0 },
    { id: 'vat', header: 'VAT', accessor: (r) => (r.tax_amount?.toFixed(2) ?? '-'), align: 'right', sortField: (r) => r.tax_amount ?? 0 },
    { id: 'settled_pct', header: '% Settled', accessor: (r) => (r.status === 'paid' ? '100%' : r.settled_pct ? r.settled_pct + '%' : '0%'), align: 'right', sortField: (r) => (r.status === 'paid' ? 100 : r.settled_pct ?? 0) },
    { id: 'open_payment', header: 'Open Payment', accessor: (r) => {
        const amount = r.amount ?? 0;
        const pct = r.status === 'paid' ? 100 : r.settled_pct ?? 0;
        const open = amount * (1 - pct / 100);
        return open.toFixed(2);
      }, align: 'right', sortField: (r) => {
        const amount = r.amount ?? 0;
        const pct = r.status === 'paid' ? 100 : r.settled_pct ?? 0;
        return amount * (1 - pct / 100);
      } },
    { id: 'paid', header: 'Paid On', accessor: (r) => formatDate(r.payment_date) },
    { id: 'tags', header: 'Tags', accessor: (r) => (r.tags?.map((t:any)=>t.name).join(', ') || '-') },
    { id: 'category', header: 'Category', accessor: (r) => r.category || '-', sortField: (r) => r.category },
    { id: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} />, align: 'center', sortField: (r) => r.status },
  ];

  const visibleColumns = baseColumns.filter(c=>!hiddenCols.includes(c.id));

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return tableData;
    const col = baseColumns.find((c) => c.id === sortKey && c.sortField);
    if (!col || !col.sortField) return tableData;
    const copy = [...tableData];
    copy.sort((a, b) => {
      const av = col.sortField!(a);
      const bv = col.sortField!(b);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [tableData, sortKey, sortAsc]);

  const handleVendorClick = (vendorName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (vendorName && vendorName.trim()) {
      navigate(`/vendor/${encodeURIComponent(vendorName)}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <DataTable
      enablePagination
      enableColumnPicker={false}
      columns={visibleColumns.map((col) => ({
        ...col,
        header: (
          <button
            className="flex items-center gap-1 group"
            onClick={() => {
              if (sortKey === col.id) {
                setSortAsc(!sortAsc);
              } else {
                setSortKey(col.id);
                setSortAsc(true);
              }
            }}
          >
            {col.header}
            {sortKey === col.id && (
              <span className="text-xs group-hover:opacity-80">
                {sortAsc ? '▲' : '▼'}
              </span>
            )}
          </button>
        ),
      }))}
      data={sortedData}
      isStriped
      onRowClick={onSelect}
    />
  );
};

export default InvoiceTable;