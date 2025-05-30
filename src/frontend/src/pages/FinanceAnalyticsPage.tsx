import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Legend, 
  Area, AreaChart, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { 
  Calendar as CalendarIcon, TrendingUp, TrendingDown, FileText, 
  DollarSign, Receipt, AlertTriangle, Download, ArrowLeft, ArrowRight, 
  Building2, Tag, Zap, Euro, ChevronDown, Banknote, CreditCard,
  BarChart3, Activity, Clock, Target, Users, Briefcase,
  PieChart as PieChartIcon, Calculator, Percent
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { format, startOfYear, endOfYear, subDays, subMonths } from 'date-fns';
import { http } from '../services/api';

// Enhanced Types for comprehensive analytics
interface AnalyticsData {
  summary: {
    by_type: Array<{ document_type: string; count: number }>;
    by_status: Array<{ status: string; count: number }>;
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
  monthlyDocuments: Array<{ year: number; month: number; month_name: string; count: number }>;
  monthlyInvoices: Array<{ year: number; month: number; month_name: string; total_amount: number; count: number }>;
}

interface VendorData {
  name: string;
  transactions: number;
  total_amount: number;
  last_transaction: string;
  category: string;
}

interface ExpenditureData {
  supplier: string;
  amount: number;
  percentage: number;
  category: string;
}

interface BillableMetrics {
  billable_hours: number;
  total_hours: number;
  billable_rate: number;
  target_rate: number;
  billable_amount: number;
  non_billable_amount: number;
}

interface ClientAnalytics {
  client_name: string;
  total_billed: number;
  percentage: number;
  invoice_count: number;
  last_invoice: string;
  status: 'active' | 'inactive' | 'overdue';
}

interface ExpenseCategoryData {
  category_name: string;
  total_amount: number;
  percentage: number;
  invoice_count: number;
  avg_amount: number;
  last_invoice: string;
}

interface TimeTrackingData {
  date: string;
  billable_hours: number;
  non_billable_hours: number;
  total_hours: number;
}

interface MonthlyRecurringData {
  date: string;
  recurring_invoices: number;
  recurring_amount: number;
  one_time_invoices: number;
  one_time_amount: number;
}

interface SmartInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  icon: React.ReactNode;
}

// Modern color palette following ShadCN design principles
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))', 
  success: '#10b981',
  warning: '#f59e0b',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))'
};

const PIE_COLORS = [
  '#6366f1', '#3b82f6', '#f97316', '#10b981', 
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
];

const FinanceAnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedContact, setSelectedContact] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [vendorData, setVendorData] = useState<VendorData[]>([]);
  const [expenditureData, setExpenditureData] = useState<ExpenditureData[]>([]);
  const [billableMetrics, setBillableMetrics] = useState<BillableMetrics | null>(null);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<ExpenseCategoryData[]>([]);
  const [timeTrackingData, setTimeTrackingData] = useState<TimeTrackingData[]>([]);
  const [monthlyRecurringData, setMonthlyRecurringData] = useState<MonthlyRecurringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('Authentication required');
          return;
        }

        const [summaryRes, monthlyDocsRes, monthlyInvoicesRes] = await Promise.all([
          fetch('http://localhost:8808/api/analytics/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8808/api/analytics/monthly-documents?year=${selectedYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8808/api/analytics/monthly-invoices?year=${selectedYear}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (!summaryRes.ok) throw new Error(`Analytics API error: ${summaryRes.status}`);
        
        const summaryData = await summaryRes.json();
        const monthlyDocsData = monthlyDocsRes.ok ? await monthlyDocsRes.json() : [];
        const monthlyInvoicesData = monthlyInvoicesRes.ok ? await monthlyInvoicesRes.json() : [];
        
        setAnalytics({
          summary: summaryData,
          monthlyDocuments: monthlyDocsData,
          monthlyInvoices: monthlyInvoicesData
        });
        
        // Generate comprehensive mock data for all chart types
        const mockVendors: VendorData[] = [
          { name: 'AWS', transactions: 12, total_amount: 4500, last_transaction: '2025-01-15', category: 'Cloud Services' },
          { name: 'Google Cloud', transactions: 8, total_amount: 3200, last_transaction: '2025-01-10', category: 'Cloud Services' },
          { name: 'Microsoft', transactions: 6, total_amount: 2800, last_transaction: '2025-01-08', category: 'Software' },
          { name: 'Swisscom', transactions: 4, total_amount: 1200, last_transaction: '2025-01-05', category: 'Telecom' },
          { name: 'Legal Partners AG', transactions: 3, total_amount: 8900, last_transaction: '2025-01-03', category: 'Legal' }
        ];
        setVendorData(mockVendors);

        // Mock expenditure data by supplier
        const mockExpenditures: ExpenditureData[] = [
          { supplier: 'Technopark Immobilien AG', amount: 13449, percentage: 69, category: 'Office & Facilities' },
          { supplier: 'Google Cloud EMEA Limited', amount: 1767, percentage: 9, category: 'Cloud Services' },
          { supplier: 'Without supplier', amount: 1248, percentage: 6, category: 'Miscellaneous' },
          { supplier: 'Dextra Rechtsschutz AG', amount: 1246, percentage: 6, category: 'Legal Services' },
          { supplier: 'Remaining suppliers', amount: 1643, percentage: 8, category: 'Various' }
        ];
        setExpenditureData(mockExpenditures);

        // Mock billable metrics
        const mockBillableMetrics: BillableMetrics = {
          billable_hours: 142.5,
          total_hours: 180.0,
          billable_rate: 79.2,
          target_rate: 85.0,
          billable_amount: 142080,
          non_billable_amount: 47966
        };
        setBillableMetrics(mockBillableMetrics);

        // Mock client analytics
        const mockClientAnalytics: ClientAnalytics[] = [
          { client_name: 'Bankrupt estate of envion AG', total_billed: 80799, percentage: 43, invoice_count: 15, last_invoice: '2025-01-20', status: 'active' },
          { client_name: '21 Impact Labs AG', total_billed: 55500, percentage: 29, invoice_count: 12, last_invoice: '2025-01-18', status: 'active' },
          { client_name: 'Wadsack Zug AG', total_billed: 38656, percentage: 21, invoice_count: 8, last_invoice: '2025-01-15', status: 'active' },
          { client_name: 'Swiss Stablecoin AG', total_billed: 13600, percentage: 7, invoice_count: 4, last_invoice: '2025-01-10', status: 'overdue' }
        ];
        setClientAnalytics(mockClientAnalytics);

        // Mock expense category data for invoice breakdown
        const mockExpenseCategories: ExpenseCategoryData[] = [
          { category_name: 'Office & Facilities', total_amount: 45600, percentage: 35, invoice_count: 12, avg_amount: 3800, last_invoice: '2025-01-20' },
          { category_name: 'Professional Services', total_amount: 32400, percentage: 25, invoice_count: 8, avg_amount: 4050, last_invoice: '2025-01-18' },
          { category_name: 'Software & Technology', total_amount: 28800, percentage: 22, invoice_count: 15, avg_amount: 1920, last_invoice: '2025-01-15' },
          { category_name: 'Legal & Compliance', total_amount: 15600, percentage: 12, invoice_count: 4, avg_amount: 3900, last_invoice: '2025-01-12' },
          { category_name: 'Travel & Transportation', total_amount: 8400, percentage: 6, invoice_count: 6, avg_amount: 1400, last_invoice: '2025-01-10' }
        ];
        setExpenseCategoryData(mockExpenseCategories);

        // Mock time tracking data for charts
        const mockTimeTracking: TimeTrackingData[] = [
          { date: '2025-01', billable_hours: 120, non_billable_hours: 40, total_hours: 160 },
          { date: '2025-02', billable_hours: 135, non_billable_hours: 35, total_hours: 170 },
          { date: '2025-03', billable_hours: 110, non_billable_hours: 50, total_hours: 160 },
          { date: '2025-04', billable_hours: 145, non_billable_hours: 25, total_hours: 170 },
          { date: '2025-05', billable_hours: 125, non_billable_hours: 45, total_hours: 170 }
        ];
        setTimeTrackingData(mockTimeTracking);

        // Mock monthly recurring vs one-time data
        const mockMonthlyRecurring: MonthlyRecurringData[] = [
          { date: '2025-01', recurring_invoices: 8, recurring_amount: 2400, one_time_invoices: 3, one_time_amount: 1200 },
          { date: '2025-02', recurring_invoices: 9, recurring_amount: 2700, one_time_invoices: 2, one_time_amount: 800 },
          { date: '2025-03', recurring_invoices: 7, recurring_amount: 2100, one_time_invoices: 4, one_time_amount: 1600 },
          { date: '2025-04', recurring_invoices: 10, recurring_amount: 3000, one_time_invoices: 2, one_time_amount: 600 },
          { date: '2025-05', recurring_invoices: 6, recurring_amount: 1800, one_time_invoices: 1, one_time_amount: 400 }
        ];
        setMonthlyRecurringData(mockMonthlyRecurring);
        
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedYear]);

  // Calculate KPIs with better handling
  const calculateKPIs = () => {
    if (!analytics?.summary?.payment_summary) return null;
    
    const { payment_summary } = analytics.summary;
    const monthlyData = analytics.monthlyInvoices || [];
    
    // Calculate period-over-period changes
    let totalSpentChange = 0;
    let invoiceCountChange = 0;
    
    if (monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      
      if (previousMonth.total_amount > 0) {
        totalSpentChange = ((currentMonth.total_amount - previousMonth.total_amount) / previousMonth.total_amount) * 100;
      }
      
      if (previousMonth.count > 0) {
        invoiceCountChange = ((currentMonth.count - previousMonth.count) / previousMonth.count) * 100;
      }
    }

    return {
      totalSpent: payment_summary.total_amount,
      totalVAT: payment_summary.total_amount * 0.077, // Swiss VAT rate
      invoiceCount: payment_summary.total_invoices,
      outstandingBalance: payment_summary.unpaid_amount,
      totalSpentChange,
      invoiceCountChange,
      paidPercentage: payment_summary.paid_percentage
    };
  };

  // Enhanced smart insights generation
  const generateSmartInsights = (): SmartInsight[] => {
    if (!analytics?.summary?.payment_summary) return [];
    
    const insights: SmartInsight[] = [];
    const { payment_summary } = analytics.summary;
    const monthlyData = analytics.monthlyInvoices || [];
    
    // Overdue invoices critical alert
    if (payment_summary.overdue_invoices > 0) {
      insights.push({
        type: 'warning',
        title: 'Overdue Payments Alert',
        message: `${payment_summary.overdue_invoices} invoices overdue (CHF ${payment_summary.overdue_amount.toFixed(2)}) require immediate attention`,
        icon: <AlertTriangle className="h-4 w-4" />
      });
    }
    
    // Spending trend analysis
    if (monthlyData.length >= 2) {
      const recent = monthlyData.slice(-2);
      if (recent[0].total_amount > 0) {
        const change = ((recent[1].total_amount - recent[0].total_amount) / recent[0].total_amount) * 100;
        
        if (change > 25) {
          insights.push({
            type: 'info',
            title: 'Significant Spending Increase',
            message: `Spending increased by ${change.toFixed(1)}% this month. Review budget allocations.`,
            icon: <TrendingUp className="h-4 w-4" />
          });
        } else if (change < -25) {
          insights.push({
            type: 'success',
            title: 'Cost Reduction Achievement',
            message: `Spending decreased by ${Math.abs(change).toFixed(1)}% this month. Excellent cost control!`,
            icon: <TrendingDown className="h-4 w-4" />
          });
        }
      }
    }
    
    // Payment efficiency recognition
    if (payment_summary.paid_percentage > 95) {
      insights.push({
        type: 'success',
        title: 'Outstanding Payment Performance',
        message: `${payment_summary.paid_percentage.toFixed(1)}% payment rate demonstrates excellent financial management`,
        icon: <Zap className="h-4 w-4" />
      });
    }
    
    return insights;
  };

  const kpis = calculateKPIs();
  const insights = generateSmartInsights();

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-96 w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-screen">
      <div className="space-y-6 p-6">
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">137Docs Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive financial insights and document analytics
            </p>
          </div>
          
          {/* Year Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
              <span className="text-sm font-medium min-w-[3rem] text-center">{selectedYear}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" className="ml-4">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Time Control Tabs */}
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((t) => (
                <TabsTrigger 
                  key={t} 
                  value={t} 
                  className="capitalize text-xs lg:text-sm"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                placeholder="Filter by tag..." 
                className="w-[140px] h-8"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value={timeframe} className="space-y-6 mt-6">
            {/* Enhanced Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
              <OverviewCard
                title="Total Spent"
                value={`CHF ${kpis?.totalSpent?.toLocaleString() || '0'}`}
                change={kpis?.totalSpentChange}
                icon={<DollarSign className="h-4 w-4" />}
                variant="default"
                subValue={`CHF ${kpis?.totalVAT?.toFixed(0) || '0'}`}
              />
              <OverviewCard
                title="Total VAT"
                value={`CHF ${kpis?.totalVAT?.toFixed(0) || '0'}`}
                icon={<Receipt className="h-4 w-4" />}
                variant="secondary"
              />
              <OverviewCard
                title="Billable Total"
                value={`CHF ${billableMetrics?.billable_amount?.toLocaleString() || '188,555'}`}
                subValue={`open ${billableMetrics?.non_billable_amount?.toLocaleString() || '25,415'}`}
                icon={<Briefcase className="h-4 w-4" />}
                variant="success"
              />
              <OverviewCard
                title="Outstanding"
                value={`CHF ${kpis?.outstandingBalance?.toLocaleString() || '0'}`}
                icon={<AlertTriangle className="h-4 w-4" />}
                variant="warning"
              />
              <OverviewCard
                title="Fixed Price Work"
                value={`CHF ${billableMetrics?.billable_amount || '142,080'}`}
                subValue={`due ${billableMetrics?.non_billable_amount || '47,966'} total`}
                icon={<Calculator className="h-4 w-4" />}
                variant="default"
              />
              <OverviewCard
                title="Expenditures"
                value="CHF 161,511"
                subValue="open 16,960"
                icon={<Target className="h-4 w-4" />}
                variant="destructive"
              />

              <OverviewCard
                title="Total Expenses"
                value={`CHF ${kpis?.totalSpent?.toLocaleString() || '0'}`}
                change={kpis?.totalSpentChange}
                icon={<DollarSign className="h-4 w-4" />}
                variant="default"
                subValue={`${analytics?.summary.payment_summary.total_invoices || 0} invoices`}
              />
              <OverviewCard
                title="Total VAT"
                value={`CHF ${kpis?.totalVAT?.toFixed(0) || '0'}`}
                icon={<Receipt className="h-4 w-4" />}
                variant="secondary"
              />
              <OverviewCard
                title="Outstanding"
                value={`CHF ${kpis?.outstandingBalance?.toLocaleString() || '0'}`}
                icon={<AlertTriangle className="h-4 w-4" />}
                variant="warning"
                subValue={`${analytics?.summary.payment_summary.unpaid_invoices || 0} unpaid`}
              />
              <OverviewCard
                title="Categories"
                value={`${expenseCategoryData.length || 5}`}
                icon={<Tag className="h-4 w-4" />}
                variant="default"
                subValue="expense types"
              />
              <OverviewCard
                title="Avg Invoice"
                value={`CHF ${analytics?.summary.payment_summary.total_invoices ? Math.round(analytics.summary.payment_summary.total_amount / analytics.summary.payment_summary.total_invoices) : 0}`}
                icon={<Calculator className="h-4 w-4" />}
                variant="secondary"
              />
              <OverviewCard
                title="This Month"
                value={`CHF ${analytics?.monthlyInvoices?.[analytics.monthlyInvoices.length - 1]?.total_amount?.toFixed(0) || '0'}`}
                icon={<TrendingUp className="h-4 w-4" />}
                variant="success"
                subValue={`${analytics?.monthlyInvoices?.[analytics.monthlyInvoices.length - 1]?.count || 0} invoices`}
              />
            </div>

            {/* Circular Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <CircularMetricCard
                title="Chargeability"
                percentage={billableMetrics?.billable_rate || 79.2}
                target={billableMetrics?.target_rate || 85}
                color="#3b82f6"
              />
              <CircularMetricCard
                title="Billable Hours Ratio"
                percentage={16}
                color="#10b981"
              />
              <CircularMetricCard
                title="Collection Rate"
                percentage={kpis?.paidPercentage || 94.2}
                color="#f59e0b"
              />

              <CircularMetricCard
                title="Payment Rate"
                percentage={kpis?.paidPercentage || 94.2}
                target={95}
                color="#10b981"
              />
              <CircularMetricCard
                title="Budget Variance"
                percentage={85.4}
                target={90}
                color="#3b82f6"
              />
              <CircularMetricCard
                title="Processing Rate"
                percentage={analytics?.summary.payment_summary.total_invoices ? 
                  Math.round((analytics.summary.payment_summary.total_invoices / 
                  (analytics.summary.payment_summary.total_invoices + 2)) * 100) : 85}
                color="#f59e0b"
              />
            </div>

            {/* Smart Insights */}
            {insights.length > 0 && (
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Smart Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`flex items-start gap-3 p-3 rounded-lg border-l-2 transition-colors ${
                          insight.type === 'warning' ? 'bg-orange-50 border-l-orange-400 dark:bg-orange-950/20' :
                          insight.type === 'success' ? 'bg-green-50 border-l-green-400 dark:bg-green-950/20' :
                          'bg-blue-50 border-l-blue-400 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className={`mt-0.5 ${
                          insight.type === 'warning' ? 'text-orange-600' :
                          insight.type === 'success' ? 'text-green-600' :
                          'text-blue-600'
                        }`}>
                          {insight.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Spending Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Expense Trend - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] pt-4">
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

            {/* Two Column Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Vendors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Top Vendors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorData.slice(0, 5)} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickFormatter={(value) => `CHF ${(value/1000).toFixed(1)}k`}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80} 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                        />
                        <Tooltip 
                          formatter={(value) => [`CHF ${Number(value).toLocaleString()}`, 'Total']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar 
                          dataKey="total_amount" 
                          fill="#3b82f6" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Vendor</TableHead>
                          <TableHead className="text-xs">Transactions</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendorData.slice(0, 5).map((vendor) => (
                          <TableRow key={vendor.name} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-sm">{vendor.name}</TableCell>
                            <TableCell className="text-sm">{vendor.transactions}</TableCell>
                            <TableCell className="text-sm text-right font-mono">
                              CHF {vendor.total_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {vendor.category}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Document Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Document Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-2/3 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics?.summary.by_type || []}
                            dataKey="count"
                            nameKey="document_type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ document_type, percent }) => 
                              `${document_type} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={false}
                            fontSize={11}
                          >
                            {(analytics?.summary.by_type || []).map((_, index) => (
                              <Cell 
                                key={index} 
                                fill={PIE_COLORS[index % PIE_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 lg:w-1/3">
                      {(analytics?.summary.by_type || []).map((item, index) => (
                        <div key={item.document_type} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="text-sm font-medium flex-1 truncate">
                            {item.document_type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {analytics?.summary.payment_summary.paid_percentage.toFixed(1) || '0'}%
                    </div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                      Paid
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-mono">
                      CHF {analytics?.summary.payment_summary.paid_amount.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="text-center p-6 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">
                      {analytics?.summary.payment_summary.unpaid_percentage.toFixed(1) || '0'}%
                    </div>
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                      Unpaid
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                      CHF {analytics?.summary.payment_summary.unpaid_amount.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="text-center p-6 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {analytics?.summary.payment_summary.overdue_percentage.toFixed(1) || '0'}%
                    </div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                      Overdue
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-mono">
                      CHF {analytics?.summary.payment_summary.overdue_amount.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comprehensive Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {/* Hours Tracking Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Hours Tracking - {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeTrackingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
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
                                    {entry.name}: {entry.value}h
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="billable_hours" 
                        fill="#10b981" 
                        name="Billable Hours"
                        stackId="a"
                      />
                      <Bar 
                        dataKey="non_billable_hours" 
                        fill="#f59e0b" 
                        name="Non-Billable Hours"
                        stackId="a"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Recurring Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Recurring vs One-Time - {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyRecurringData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
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
                      <Bar 
                        yAxisId="count"
                        dataKey="recurring_invoices" 
                        fill="#10b981" 
                        name="Recurring Count"
                        stackId="a"
                      />
                      <Bar 
                        yAxisId="count"
                        dataKey="one_time_invoices" 
                        fill="#f59e0b" 
                        name="One-Time Count"
                        stackId="a"
                      />
                      <Line
                        yAxisId="amount"
                        type="monotone"
                        dataKey="recurring_amount"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Recurring Amount"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Others Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Monthly Others
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRecurringData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `CHF ${(value/1000).toFixed(1)}k`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `CHF ${Number(value).toLocaleString()}`, 
                          name === 'one_time_amount' ? 'One-Time Amount' : 'Total Amount'
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="one_time_amount"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                        name="One-Time Amount"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Client Revenue Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Revenue by Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-2/3 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={clientAnalytics}
                            dataKey="total_billed"
                            nameKey="client_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ client_name, percentage }) => 
                              `${percentage}%`
                            }
                            labelLine={false}
                            fontSize={11}
                          >
                            {clientAnalytics.map((_, index) => (
                              <Cell 
                                key={index} 
                                fill={PIE_COLORS[index % PIE_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`CHF ${Number(value).toLocaleString()}`, 'Revenue']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 lg:w-1/3">
                      {clientAnalytics.map((client, index) => (
                        <div key={client.client_name} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {client.client_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              CHF {client.total_billed.toLocaleString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {client.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expense Category Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Expenses by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-2/3 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseCategoryData}
                            dataKey="total_amount"
                            nameKey="category_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ category_name, percentage }) => 
                              `${percentage}%`
                            }
                            labelLine={false}
                            fontSize={11}
                          >
                            {expenseCategoryData.map((_, index) => (
                              <Cell 
                                key={index} 
                                fill={PIE_COLORS[index % PIE_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`CHF ${Number(value).toLocaleString()}`, 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 lg:w-1/3">
                      {expenseCategoryData.map((category, index) => (
                        <div key={category.category_name} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {category.category_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              CHF {category.total_amount.toLocaleString()} ({category.invoice_count} invoices)
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {category.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Modern Overview Card Component
const OverviewCard = ({ 
  title, 
  value, 
  change, 
  icon,
  variant = 'default',
  subValue
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  subValue?: string;
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800';
      case 'warning':
        return 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800';
      case 'destructive':
        return 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800';
      case 'secondary':
        return 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800';
      default:
        return 'hover:bg-muted/50';
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {typeof change === 'number' && !isNaN(change) && (
            <Badge 
              variant={change >= 0 ? 'default' : 'destructive'} 
              className="text-xs"
            >
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </Badge>
          )}
        </div>
        {subValue && (
          <div className="text-sm text-muted-foreground mt-1">{subValue}</div>
        )}
      </CardContent>
    </Card>
  );
};

// Circular Metric Card Component
const CircularMetricCard = ({ 
  title, 
  percentage, 
  target,
  color
}: { 
  title: string; 
  percentage: number; 
  target?: number;
  color: string;
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-in-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
      {target && (
        <div className="text-xs text-muted-foreground text-center">
          Target: {target.toFixed(0)}%
        </div>
      )}
    </Card>
  );
};

export default FinanceAnalyticsPage;