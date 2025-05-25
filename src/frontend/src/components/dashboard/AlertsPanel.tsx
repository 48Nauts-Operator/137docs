import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useDocuments } from '../../services/api';

const AlertsPanel: React.FC = () => {
  const { documents = [], loading } = useDocuments();

  const alerts = useMemo(()=>{
    const list: string[] = [];

    const missingDue = documents.filter((d:any)=> !d.due_date).length;
    if(missingDue) list.push(`${missingDue} document${missingDue>1?'s':''} missing due dates`);

    const untaggedInv = documents.filter((d:any)=> d.document_type==='invoice' && (!d.tags || d.tags.length===0)).length;
    if(untaggedInv) list.push(`${untaggedInv} untagged invoice${untaggedInv>1?'s':''}`);

    const conflicting = documents.filter((d:any)=> {
      if(d.amount==null || d.subtotal==null || d.tax_amount==null) return false;
      const diff = Math.abs((Number(d.subtotal)+Number(d.tax_amount)) - Number(d.amount));
      return diff > 0.01;
    }).length;
    if(conflicting) list.push(`${conflicting} invoice${conflicting>1?'s':''} have conflicting totals`);

    return list;
  }, [documents]);

  const count = alerts.length;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Exceptions & Alerts
          {!loading && <Badge variant={count? 'destructive':'secondary'}>{count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-secondary-500">Loading…</p>}
        {!loading && count===0 && <p className="text-sm text-green-600">All clear!</p>}
        {!loading && count>0 && (
          <ul className="space-y-3 text-sm">
            {alerts.map((a,i)=>(
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-yellow-500 mt-0.5" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
export default AlertsPanel; 