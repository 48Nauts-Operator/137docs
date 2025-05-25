import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { useDocuments } from '../../services/api';

const SmartStats: React.FC = () => {
  const { documents = [] } = useDocuments();

  const stats = useMemo(()=>{
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
    const newDocs = documents.filter((d:any)=> new Date(d.created_at)>weekAgo).length;
    const pending = documents.filter((d:any)=> d.document_type==='invoice' && d.status!=='paid').length;
    const categorizedPct = Math.round( (documents.filter((d:any)=> d.category).length / (documents.length||1))*100);
    const overdue = documents.filter((d:any)=> {
      if(!(d.document_type==='invoice' && d.status!=='paid')) return false;
      const dt = new Date(d.due_date);
      return !isNaN(dt.getTime()) && dt < new Date();
    }).length;
    return { newDocs, pending, categorizedPct, overdue };
  }, [documents]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Smart Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <Stat label="New Docs This Week" value={stats.newDocs} />
          <Stat label="Pending Invoices" value={stats.pending} />
          <Stat label="Categorized" value={`${stats.categorizedPct}%`} />
          <Stat label="Overdue" value={stats.overdue} />
        </div>
      </CardContent>
    </Card>
  );
};

const Stat = ({label, value}:{label:string;value:any})=> (
  <div className="flex flex-col gap-1">
    <span className="text-xl font-bold">{value}</span>
    <span className="text-xs text-secondary-500 dark:text-secondary-400">{label}</span>
  </div>
);
export default SmartStats; 