import React, { useMemo, useState, useEffect } from 'react';
import InvoiceTable from '../components/invoices/InvoiceTable';
import { useDocuments, useTenants } from '../services/api';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { SlidersHorizontal, Building2, User } from 'lucide-react';

const InvoicesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');

  // Fetch only invoices
  const { documents } = useDocuments({ document_type: 'invoice' });

  // Get tenants for filtering indicator
  const { defaultTenant } = useTenants();

  // Quick view state
  const [quarterView, setQuarterView] = useState<number | null>(null); // 1-4 or null
  const [monthView, setMonthView] = useState<number | null>(null); // 0-11 or null
  const [statusFilter, setStatusFilter] = useState<'all'|'paid'|'unpaid'>('all');

  const STORAGE_KEY_COLS = 'invoice_hidden_cols';
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_COLS);
      return v ? JSON.parse(v) : [];
    } catch { return []; }
  });

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(hiddenCols)); }, [hiddenCols]);

  const allColIds = ['select','date','invoice_date','vendor','tenant','invoice','due','duein','currency','amount','vat','settled_pct','open_payment','paid','tags','category','status'];

  const toggleCol = (id:string)=>{
    setHiddenCols(prev=> prev.includes(id)? prev.filter(c=>c!==id): [...prev,id]);
  };

  // Filter documents based on view
  const filteredDocs = useMemo(()=>{
    let docs = documents;
    // status filter first
    if(statusFilter==='paid') docs = docs.filter((d:any)=> d.status?.toLowerCase?.()==='paid');
    else if(statusFilter==='unpaid') docs = docs.filter((d:any)=> d.status?.toLowerCase?.()!=='paid');

    if(quarterView==null && monthView==null) return docs;
    return docs.filter((doc:any)=>{
      const dateStr = doc.due_date || doc.document_date || doc.created_at;
      if(!dateStr) return false;
      const d = new Date(dateStr);
      if(isNaN(d.getTime())) return false;
      if(monthView!=null) {
        return d.getMonth()===monthView;
      }
      if(quarterView!=null){
        const q = Math.floor(d.getMonth()/3)+1;
        return q===quarterView;
      }
      return true;
    });
  },[documents, quarterView, monthView, statusFilter]);

  // Helper to safely parse ISO date string
  const parseDate = (s: string | null | undefined) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculate totals – current month, next month, current quarter (by due_date)
  const { currentMonthTotal, nextMonthTotal, quarterTotal, currentMonthVat, nextMonthVat, quarterVat, yearTotal, yearPaid } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    const startQuarter = Math.floor(month / 3) * 3; // 0,3,6,9

    let cur = 0, next = 0, quarter = 0, yTotal=0, yPaid=0;
    let curVat = 0, nextVat = 0, quarterVatAcc = 0;

    documents.forEach((doc: any) => {
      if (doc.amount == null) return;
      const d = parseDate(doc.due_date || doc.document_date);
      if (!d) return;

      const amt = Number(doc.amount);
      const vatAmt = Number(doc.tax_amount ?? 0);
      if (!Number.isFinite(amt)) return;

      if (d.getFullYear() === year) {
        yTotal += amt;
        if(doc.status?.toLowerCase?.()==='paid') yPaid += amt;
        if (d.getMonth() === month) {
          cur += amt;
          curVat += vatAmt;
        }
        if (d.getMonth() === (month + 1) % 12) {
          next += amt;
          nextVat += vatAmt;
        }
        if (d.getMonth() >= startQuarter && d.getMonth() < startQuarter + 3) {
          quarter += amt;
          quarterVatAcc += vatAmt;
        }
      }
    });

    return {
      currentMonthTotal: cur,
      nextMonthTotal: next,
      quarterTotal: quarter,
      currentMonthVat: curVat,
      nextMonthVat: nextVat,
      quarterVat: quarterVatAcc,
      yearTotal: yTotal,
      yearPaid: yPaid,
    };
  }, [documents]);

  const quarterMonths = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const renderQuickView = () => (
    <div className="flex flex-col gap-2 p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-sm w-full">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {[1,2,3,4].map(q=> (
            <button
              key={q}
              className={`px-3 py-1 rounded-md text-base font-medium ${quarterView===q && monthView==null ? 'bg-primary-600 text-white' : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
              onClick={()=>{setQuarterView(q);setMonthView(null);}}
            >
              Q{q}
            </button>
          ))}
          <button
            className={`px-3 py-1 rounded-md text-base font-medium ${quarterView==null && monthView==null ? 'bg-primary-600 text-white' : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
            onClick={()=>{setQuarterView(null);setMonthView(null);}}
          >
            All
          </button>
        </div>
        
        {/* Tenant Filter Indicator */}
        {defaultTenant && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            {defaultTenant.type === 'company' ? (
              <Building2 className="w-4 h-4 text-blue-500" />
            ) : (
              <User className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Showing: {defaultTenant.alias}
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 ml-4">
          {['all','paid','unpaid'].map(st=> (
            <button key={st} className={`px-3 py-1 rounded-md text-sm font-medium ${statusFilter===st ? 'bg-primary-600 text-white' : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'}`} onClick={()=>setStatusFilter(st as any)}>
              {st.charAt(0).toUpperCase()+st.slice(1)}
            </button>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1"><SlidersHorizontal size={14}/> Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {allColIds.map(id=> (
              <DropdownMenuCheckboxItem key={id} checked={!hiddenCols.includes(id)} onCheckedChange={()=>toggleCol(id)}>{id}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {quarterView!=null && (
        <div className="flex items-center space-x-2 pl-1">
          {quarterMonths[quarterView-1].map(m=> (
            <button
              key={m}
              className={`px-2 py-0.5 rounded-md text-xs font-medium ${monthView===m ? 'bg-primary-500 text-white' : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}
              onClick={()=>setMonthView(m)}
            >
              {monthNames[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Invoice list */}
      <div className="flex-1 overflow-y-auto pr-4">
        <div className="flex justify-between items-center mb-2">
          {renderQuickView()}
        </div>
        <InvoiceTable dueFilter={filter === 'due'} documents={filteredDocs} hiddenCols={hiddenCols} />
      </div>
      {/* Summary sidebar */}
      <aside className="w-64 shrink-0 p-4 bg-white dark:bg-secondary-900 border-l border-secondary-200 dark:border-secondary-700">
        <h2 className="text-lg font-semibold mb-4">Totals</h2>
        <div className="space-y-4">
          <SummaryBox label="This Year" amount={yearTotal} paid={yearPaid} />
          <SummaryBox label="This Month" amount={currentMonthTotal} vat={currentMonthVat} />
          <SummaryBox label="Next Month" amount={nextMonthTotal} vat={nextMonthVat} />
          <SummaryBox label="This Quarter" amount={quarterTotal} vat={quarterVat} />
        </div>
      </aside>
    </div>
  );
};

interface SummaryBoxProps { label: string; amount: number; vat?: number; paid?: number; }
const SummaryBox: React.FC<SummaryBoxProps> = ({ label, amount, vat, paid }) => (
  <div className="p-4 rounded-lg shadow-sm bg-secondary-50 dark:bg-secondary-800">
    <div className="text-sm text-secondary-500 dark:text-secondary-400">{label}</div>
    <div className="text-xl font-semibold">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    {vat!==undefined && <div className="text-xs font-medium text-red-500 mt-1">VAT {vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
    {paid!==undefined && <div className="text-xs font-medium text-green-500 mt-1">Paid {paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
  </div>
);

export default InvoicesPage; 