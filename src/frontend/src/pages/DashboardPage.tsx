import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  ComposedChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar 
} from 'recharts';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ProcessingQueue from '../components/dashboard/ProcessingQueue';
import DueSoonList from '../components/dashboard/DueSoonList';
import SmartStats from '../components/dashboard/SmartStats';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import { LayoutDashboard } from 'lucide-react';
import PaymentTrendsChart from '../components/dashboard/PaymentTrendsChart';

// Analytics data interfaces
interface AnalyticsData {
  summary: {
    payment_summary: {
      total_invoices: number;
      paid_invoices: number;
      unpaid_invoices: number;
      overdue_invoices: number;
      total_amount: number;
      paid_amount: number;
      unpaid_amount: number;
      overdue_amount: number;
      paid_percentage: number;
      unpaid_percentage: number;
      overdue_percentage: number;
    };
  };
  monthlyInvoices: Array<{ year: number; month: number; month_name: string; total_amount: number; count: number }>;
}

// Mock data – replace with API calls later
const invoiceStats = {
  dueSoon: 4,
  overdue: 1,
  outstanding: 2325.43,
};

const newDocs = [
  {
    name: 'INV-2025-0519',
    sender: 'AWS',
    tags: ['Hosting'],
    date: '2025-05-19',
  },
  {
    name: 'Receipt_Stripe_5123.pdf',
    sender: 'Stripe',
    tags: ['Payments'],
    date: '2025-05-18',
  },
  {
    name: 'Invoice_GCP_4481.pdf',
    sender: 'Google Cloud',
    tags: [],
    date: '2025-05-17',
  },
];

const kpi = {
  totalSpent: 12450,
  paid: 22,
  unpaid: 9,
  change: 5.3, // percent
};

const sparkData = Array.from({ length: 12 }).map((_, i) => ({
  m: i,
  v: Math.round(Math.random() * 4000 + 1000),
}));

const reminders = [
  {
    text: '3 invoices are still uncategorized',
    icon: AlertTriangle,
  },
  {
    text: 'Invoice from AWS is due in 2 days',
    icon: Clock,
  },
  {
    text: 'One invoice is missing a due date',
    icon: AlertTriangle,
  },
];

const activities = [
  {
    text: 'Invoice INV-2025-0519 marked as paid',
    time: '2h ago',
    icon: CheckCircle,
  },
  {
    text: 'New document uploaded: Receipt_Stripe_5123.pdf',
    time: '5h ago',
    icon: FileText,
  },
  {
    text: 'Tag "Hosting" added to Invoice_GCP_4481.pdf',
    time: '1d ago',
    icon: ChevronRight,
  },
];

// Spending Trend Chart Component
const SpendingTrendChart: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const [summaryRes, monthlyInvoicesRes] = await Promise.all([
          fetch('http://localhost:8808/api/analytics/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8808/api/analytics/monthly-invoices?year=${new Date().getFullYear()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (summaryRes.ok && monthlyInvoicesRes.ok) {
          const summaryData = await summaryRes.json();
          const monthlyInvoicesData = await monthlyInvoicesRes.json();
          
          setAnalytics({
            summary: summaryData,
            monthlyInvoices: monthlyInvoicesData
          });
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Expense Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Expense Trend - {new Date().getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={analytics?.monthlyInvoices || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month_name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="amount" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `CHF ${(value/1000).toFixed(1)}k`}
            />
            <YAxis 
              yAxisId="count" 
              orientation="right" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg shadow-md p-3">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                          {entry.name}: {
                            String(entry.name).includes('Amount') 
                              ? `CHF ${Number(entry.value).toLocaleString()}`
                              : entry.value
                          }
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Area 
              yAxisId="amount"
              type="monotone" 
              dataKey="total_amount" 
              fill="#6366f1"
              fillOpacity={0.1}
              stroke="#6366f1"
              strokeWidth={2}
              name="Total Amount (CHF)"
            />
            <Bar 
              yAxisId="count"
              dataKey="count" 
              fill="#3b82f6"
              opacity={0.8}
              name="Invoice Count"
              radius={[2, 2, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Payment Status Overview Component
const PaymentStatusOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const summaryRes = await fetch('http://localhost:8808/api/analytics/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setAnalytics({ summary: summaryData, monthlyInvoices: [] });
        }
      } catch (err) {
        console.error('Failed to fetch payment status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Payment Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const paymentSummary = analytics?.summary?.payment_summary;
  if (!paymentSummary) return null;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Payment Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {paymentSummary.paid_percentage.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
              Paid
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-mono">
              CHF {paymentSummary.paid_amount.toLocaleString()}
            </div>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {paymentSummary.unpaid_percentage.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
              Unpaid
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
              CHF {paymentSummary.unpaid_amount.toLocaleString()}
            </div>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {paymentSummary.overdue_percentage.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
              Overdue
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 font-mono">
              CHF {paymentSummary.overdue_amount.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Document Processing Status Component
const DocumentProcessingStatus: React.FC = () => {
  const [processingStats, setProcessingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcessingStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Get processing status from the processing API
        const processingRes = await fetch('http://localhost:8808/api/processing/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Get total documents count
        const documentsRes = await fetch('http://localhost:8808/api/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (processingRes.ok && documentsRes.ok) {
          const processingData = await processingRes.json();
          const documentsData = await documentsRes.json();
          
          const totalDocuments = documentsData.length || 0;
          const processingCount = processingData.processing?.count || 0;
          const failedCount = processingData.recent_failed?.count || 0;
          const successCount = processingData.recent_success?.count || 0;
          const completedCount = totalDocuments - processingCount - failedCount;
          const pendingReview = Math.max(0, totalDocuments - completedCount);
          
          setProcessingStats({
            total: totalDocuments,
            processing: processingCount,
            failed: failedCount,
            completed: completedCount,
            pendingReview: pendingReview
          });
        }
      } catch (err) {
        console.error('Failed to fetch processing stats:', err);
        // Set mock data on error
        setProcessingStats({
          total: 47,
          processing: 2,
          failed: 1,
          completed: 42,
          pendingReview: 4
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProcessingStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchProcessingStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Document Processing</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Document Processing</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{processingStats?.total || 0}</div>
        <p className="text-xs text-muted-foreground mb-4">Total Documents Inbox</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm text-red-600 font-medium">Failed</span>
            </div>
            <span className="text-sm font-bold text-red-600">
              {processingStats?.failed || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-green-600 font-medium">Processed</span>
            </div>
            <span className="text-sm font-bold text-green-600">
              {processingStats?.completed || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-yellow-600 font-medium">Pending Review</span>
            </div>
            <span className="text-sm font-bold text-yellow-600">
              {processingStats?.pendingReview || 0}
            </span>
          </div>
          
          {processingStats?.processing > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm text-blue-600 font-medium">Currently Processing</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {processingStats.processing}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <PaymentTrendsChart />
        <DueSoonList />
        <ProcessingQueue />
        <DocumentProcessingStatus />
        <SmartStats />
        <AlertsPanel />
        <SpendingTrendChart />
        <PaymentStatusOverview />
      </div>
    </div>
  );
};

// Reusable Stat component
const Stat = ({
  label,
  value,
  variant,
}: {
  label: string;
  value: React.ReactNode;
  variant?: 'danger' | 'warning';
}) => {
  let color = '';
  if (variant === 'danger') color = 'text-red-500';
  if (variant === 'warning') color = 'text-yellow-500';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-secondary-500 dark:text-secondary-400">{label}</span>
    </div>
  );
};

export default DashboardPage; 