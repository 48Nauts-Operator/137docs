import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useDocuments } from '../../services/api';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PaymentTrendsChart: React.FC = () => {
  const { documents = [], loading } = useDocuments();

  const data = useMemo(()=>{
    const now = new Date();
    const year = now.getFullYear();
    const totals = Array(12).fill(0);
    const paid = Array(12).fill(0);
    const unpaid = Array(12).fill(0);

    documents.forEach((d:any)=>{
      if(d.document_type!== 'invoice' || d.amount==null) return;
      const dt = new Date(d.document_date || d.due_date || d.created_at);
      if(isNaN(dt.getTime()) || dt.getFullYear()!==year) return;
      const m = dt.getMonth();
      const amt = Number(d.amount);
      totals[m]+= amt;
      if(d.status?.toLowerCase()==='paid') paid[m]+= amt; else unpaid[m]+= amt;
    });

    return totals.map((_,i)=>({
      name: months[i],
      total: Math.round(totals[i]*100)/100,
      paid: Math.round(paid[i]*100)/100,
      unpaid: Math.round(unpaid[i]*100)/100,
    }));
  }, [documents]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Payment Trends ({new Date().getFullYear()})</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 240 }}>
        {loading ? 'Loading…' : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="paid" stroke="#16a34a" strokeWidth={2} name="Paid" />
              <Line type="monotone" dataKey="unpaid" stroke="#facc15" strokeWidth={2} name="Unpaid" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
export default PaymentTrendsChart; 