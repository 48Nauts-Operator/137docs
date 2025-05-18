import React, { useMemo } from 'react';
import InvoiceTable from '../components/invoices/InvoiceTable';
import { useDocuments } from '../services/api';

const InvoicesPage: React.FC = () => {
  // Fetch only invoices
  const { documents } = useDocuments({ documentType: 'invoice' });

  // Helper to safely parse ISO date string
  const parseDate = (s: string | null | undefined) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculate totals – current month, next month, current quarter (by due_date)
  const { currentMonthTotal, nextMonthTotal, quarterTotal } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    const startQuarter = Math.floor(month / 3) * 3; // 0,3,6,9

    let cur = 0, next = 0, quarter = 0;

    documents.forEach((doc: any) => {
      if (doc.amount == null) return;
      const d = parseDate(doc.due_date || doc.documentDate);
      if (!d) return;

      if (d.getFullYear() === year) {
        if (d.getMonth() === month) cur += doc.amount;
        if (d.getMonth() === (month + 1) % 12) next += doc.amount;
        if (d.getMonth() >= startQuarter && d.getMonth() < startQuarter + 3) quarter += doc.amount;
      }
    });

    return {
      currentMonthTotal: cur,
      nextMonthTotal: next,
      quarterTotal: quarter,
    };
  }, [documents]);

  return (
    <div className="flex h-full">
      {/* Invoice list */}
      <div className="flex-1 overflow-y-auto pr-4">
        <InvoiceTable />
      </div>
      {/* Summary sidebar */}
      <aside className="w-64 shrink-0 p-4 bg-white dark:bg-secondary-900 border-l border-secondary-200 dark:border-secondary-700">
        <h2 className="text-lg font-semibold mb-4">Totals</h2>
        <div className="space-y-4">
          <SummaryBox label="This Month" amount={currentMonthTotal} />
          <SummaryBox label="Next Month" amount={nextMonthTotal} />
          <SummaryBox label="This Quarter" amount={quarterTotal} />
        </div>
      </aside>
    </div>
  );
};

interface SummaryBoxProps { label: string; amount: number; }
const SummaryBox: React.FC<SummaryBoxProps> = ({ label, amount }) => (
  <div className="p-4 rounded-lg shadow-sm bg-secondary-50 dark:bg-secondary-800">
    <div className="text-sm text-secondary-500 dark:text-secondary-400">{label}</div>
    <div className="text-xl font-semibold">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
  </div>
);

export default InvoicesPage; 