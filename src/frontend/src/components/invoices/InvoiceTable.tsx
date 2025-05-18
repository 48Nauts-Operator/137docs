import React from 'react';
import { useDocuments } from '../../services/api';
import DataTable, { Column } from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';

interface Props {
  onSelect?: (doc: any) => void;
}

const InvoiceTable: React.FC<Props> = ({ onSelect }) => {
  const { documents, loading, error } = useDocuments({ documentType: 'invoice' });

  const calcDue = (iso: string): string => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    return diffDays > 0 ? `${diffDays}d` : `${diffDays}d`;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const columns: Column<any>[] = [
    { header: 'Date', accessor: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '-') },
    { header: 'Invoice No', accessor: 'title' },
    { header: 'Sender', accessor: 'sender' },
    { header: 'Due', accessor: (r) => r.due_date || '-' },
    { header: 'Amount', accessor: (r) => (r.amount?.toFixed(2) ?? '-'), align: 'right' },
    { header: 'Curr.', accessor: 'currency' },
    { header: 'Category', accessor: (r) => r.category || '-' },
    { header: 'Paid On', accessor: (r) => r.payment_date || (r.status === 'paid' ? '—' : '-') },
    { header: 'Due In', accessor: (r) => (r.due_date ? calcDue(r.due_date) : '-') },
    { header: 'Status', accessor: (r) => <StatusBadge status={r.status} />, align: 'center' },
  ];

  return (
    <DataTable
      columns={columns}
      data={documents}
      isStriped
      onRowClick={onSelect}
    />
  );
};

export default InvoiceTable;