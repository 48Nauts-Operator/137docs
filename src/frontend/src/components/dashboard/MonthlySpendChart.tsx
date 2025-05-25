import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAnalytics } from '../../services/api';

const MonthlySpendChart: React.FC = () => {
  const { analytics, loading } = useAnalytics();
  const data = (analytics?.monthlyInvoices ?? []).map((m:any)=>({ name:m.month, amt:m.total }));

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Monthly Spend</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 220 }}>
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="amt" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
export default MonthlySpendChart; 