import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';

// Mock data – replace with real API data later
const kpiData = {
  total: 12450,
  change: 8.4,
  invoices: 37,
  avg: 336.5,
};

const trendData = Array.from({ length: 12 }).map((_, i) => ({
  month: format(new Date(2025, i, 1), 'MMM'),
  amount: Math.round(Math.random() * 4000 + 1000),
}));

const contactBreakdown = [
  { name: 'AWS', tx: 12, total: 4500, category: 'Hosting', last: '2025-05-18' },
  { name: 'Google Cloud', tx: 9, total: 3800, category: 'Cloud', last: '2025-05-16' },
  { name: 'Stripe', tx: 15, total: 2100, category: 'Payments', last: '2025-05-17' },
];

const tagBreakdown = [
  { tag: 'Hosting', value: 4500 },
  { tag: 'Cloud', value: 3800 },
  { tag: 'Payments', value: 2100 },
];
const tagColors = ['#6366f1', '#3b82f6', '#f97316'];

const FinanceAnalyticsPage: React.FC = () => {
  const [tab, setTab] = useState('monthly');
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Finance Analytics</h1>
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-secondary-300 dark:border-secondary-700 text-sm">
                <CalendarIcon size={16} />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverContent>
          </Popover>
          <Select>
            <SelectTrigger className="w-[150px] text-sm" aria-label="Contact">
              Contact
            </SelectTrigger>
            <SelectContent>
              {contactBreakdown.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Tag" className="w-[120px]" />
          <Select>
            <SelectTrigger className="w-[120px] text-sm" aria-label="Status">
              Status
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Spent" value={`$${kpiData.total.toLocaleString()}`} change={kpiData.change} />
            <KpiCard title="Invoices" value={kpiData.invoices} />
            <KpiCard title="Avg. Transaction" value={`$${kpiData.avg.toFixed(2)}`} />
            <KpiCard title="Change vs Prev" value={`${kpiData.change}%`} change={kpiData.change} />
          </div>

          {/* Trend Chart */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="month" className="text-xs fill-current" />
                  <YAxis className="text-xs fill-current" />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Contact Breakdown */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Top Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contactBreakdown} layout="vertical" margin={{ left: 50 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>#Tx</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Top Category</TableHead>
                        <TableHead>Last Activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactBreakdown.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.tx}</TableCell>
                          <TableCell>${c.total}</TableCell>
                          <TableCell>{c.category}</TableCell>
                          <TableCell>{c.last}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tag Breakdown */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Spending by Tag</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tagBreakdown} dataKey="value" nameKey="tag" outerRadius={80} label>
                      {tagBreakdown.map((_, i) => <Cell key={i} fill={tagColors[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagBreakdown.map((t, i) => (
                  <Badge key={t.tag} className="text-sm" style={{ backgroundColor: tagColors[i] }}>
                    {t.tag}: ${t.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceAnalyticsPage;

// KPI Card component
const KpiCard = ({ title, value, change }: { title: string; value: string | number; change?: number }) => (
  <Card className="rounded-2xl shadow-sm">
    <CardHeader>
      <CardTitle className="text-sm text-secondary-500 dark:text-secondary-400">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold flex items-center gap-2">
        {value}
        {typeof change === 'number' && (
          <Badge variant={change >= 0 ? 'success' : 'destructive'} className="text-xs">
            {change >= 0 ? '+' : ''}{change}%
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
); 