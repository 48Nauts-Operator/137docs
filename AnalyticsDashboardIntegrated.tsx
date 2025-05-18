import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { ArrowUp, ArrowDown, DollarSign, FileText, Clock, Loader } from 'lucide-react';

// Colors for charts
const COLORS = ['#0ea5e9', '#64748b', '#22c55e', '#f59e0b', '#ef4444'];
const STATUS_COLORS = {
  Paid: '#22c55e',
  Unpaid: '#64748b',
  Overdue: '#ef4444',
};

const AnalyticsDashboardIntegrated: React.FC = () => {
  // Use the custom hook to fetch analytics data
  const { analytics, loading, error } = useAnalytics();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary-500" />
        <span className="ml-2 text-secondary-600 dark:text-secondary-400">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 dark:bg-danger-900/20 text-danger-800 dark:text-danger-300 p-4 rounded-md">
        <p>Error loading analytics data: {error}</p>
        <button className="btn btn-outline text-danger-600 dark:text-danger-400 mt-2">Retry</button>
      </div>
    );
  }

  // Extract data from analytics
  const { documentTypes, paymentStatus, monthlyDocuments, monthlyInvoices, summary } = analytics;
  
  // Calculate month-over-month change
  const calculateChange = (data: any[], field: string) => {
    if (!data || data.length < 2) return 0;
    const lastMonth = data[data.length - 1][field];
    const previousMonth = data[data.length - 2][field];
    return ((lastMonth - previousMonth) / previousMonth) * 100;
  };
  
  const docChange = calculateChange(monthlyDocuments, 'count');
  const amountChange = calculateChange(monthlyInvoices, 'amount');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents Card */}
        <div className="analytics-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Documents</h3>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <FileText size={18} className="text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="analytics-value">{summary.totalDocuments || 0}</span>
            <span className={`ml-2 text-xs font-medium ${docChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {docChange >= 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
              {Math.abs(docChange).toFixed(1)}%
            </span>
          </div>
          <p className="analytics-label">vs. previous month</p>
        </div>
        
        {/* Total Invoice Amount Card */}
        <div className="analytics-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Invoice Amount</h3>
            <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-full">
              <DollarSign size={18} className="text-success-600 dark:text-success-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="analytics-value">${summary.totalInvoiceAmount?.toLocaleString() || 0}</span>
            <span className={`ml-2 text-xs font-medium ${amountChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {amountChange >= 0 ? <ArrowUp size={12} className="inline" /> : <ArrowDown size={12} className="inline" />}
              {Math.abs(amountChange).toFixed(1)}%
            </span>
          </div>
          <p className="analytics-label">vs. previous month</p>
        </div>
        
        {/* Payment Rate Card */}
        <div className="analytics-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Payment Rate</h3>
            <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-full">
              <Clock size={18} className="text-warning-600 dark:text-warning-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="analytics-value">{summary.paidPercentage || 0}%</span>
          </div>
          <p className="analytics-label">of invoices paid</p>
        </div>
        
        {/* Overdue Card */}
        <div className="analytics-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Overdue Invoices</h3>
            <div className="p-2 bg-danger-100 dark:bg-danger-900/30 rounded-full">
              <Clock size={18} className="text-danger-600 dark:text-danger-400" />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="analytics-value">{summary.overdueCount || 0}</span>
          </div>
          <p className="analytics-label">invoices need attention</p>
        </div>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Type Distribution */}
        <div className="analytics-card">
          <h3 className="text-lg font-medium mb-4">Document Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={documentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {documentTypes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} documents`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Payment Status */}
        <div className="analytics-card">
          <h3 className="text-lg font-medium mb-4">Payment Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Document Count */}
        <div className="analytics-card">
          <h3 className="text-lg font-medium mb-4">Monthly Document Count</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyDocuments}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} documents`, 'Count']} />
                <Legend />
                <Bar dataKey="count" name="Documents" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Monthly Invoice Amount */}
        <div className="analytics-card">
          <h3 className="text-lg font-medium mb-4">Monthly Invoice Amount</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyInvoices}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="Invoice Amount" stroke="#22c55e" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardIntegrated;
