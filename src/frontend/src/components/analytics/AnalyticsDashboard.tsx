import React from 'react';
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
import { ArrowUp, ArrowDown, DollarSign, FileText, Clock } from 'lucide-react';

// Mock data for analytics
const documentTypeData = [
  { name: 'Invoice', value: 42 },
  { name: 'Receipt', value: 28 },
  { name: 'Contract', value: 15 },
  { name: 'Other', value: 10 },
];

const monthlyDocumentsData = [
  { name: 'Jan', count: 12 },
  { name: 'Feb', count: 19 },
  { name: 'Mar', count: 15 },
  { name: 'Apr', count: 22 },
  { name: 'May', count: 28 },
  { name: 'Jun', count: 14 },
];

const invoiceAmountData = [
  { name: 'Jan', amount: 1250 },
  { name: 'Feb', amount: 1850 },
  { name: 'Mar', amount: 1350 },
  { name: 'Apr', amount: 2100 },
  { name: 'May', amount: 1750 },
  { name: 'Jun', amount: 2250 },
];

const paymentStatusData = [
  { name: 'Paid', value: 65 },
  { name: 'Unpaid', value: 25 },
  { name: 'Overdue', value: 10 },
];

// Colors for charts
const COLORS = ['#0ea5e9', '#64748b', '#22c55e', '#f59e0b', '#ef4444'];
const STATUS_COLORS = {
  Paid: '#22c55e',
  Unpaid: '#64748b',
  Overdue: '#ef4444',
};

const AnalyticsDashboard: React.FC = () => {
  // Calculate summary metrics
  const totalDocuments = documentTypeData.reduce((sum, item) => sum + item.value, 0);
  const totalInvoiceAmount = invoiceAmountData.reduce((sum, item) => sum + item.amount, 0);
  const paidPercentage = (paymentStatusData.find(item => item.name === 'Paid')?.value || 0);
  
  // Calculate month-over-month change
  const lastMonthDocs = monthlyDocumentsData[monthlyDocumentsData.length - 1].count;
  const previousMonthDocs = monthlyDocumentsData[monthlyDocumentsData.length - 2].count;
  const docChange = ((lastMonthDocs - previousMonthDocs) / previousMonthDocs) * 100;
  
  const lastMonthAmount = invoiceAmountData[invoiceAmountData.length - 1].amount;
  const previousMonthAmount = invoiceAmountData[invoiceAmountData.length - 2].amount;
  const amountChange = ((lastMonthAmount - previousMonthAmount) / previousMonthAmount) * 100;

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
            <span className="analytics-value">{totalDocuments}</span>
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
            <span className="analytics-value">${totalInvoiceAmount.toLocaleString()}</span>
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
            <span className="analytics-value">{paidPercentage}%</span>
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
            <span className="analytics-value">{paymentStatusData.find(item => item.name === 'Overdue')?.value || 0}</span>
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
                  data={documentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {documentTypeData.map((entry, index) => (
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
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
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
                data={monthlyDocumentsData}
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
                data={invoiceAmountData}
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

export default AnalyticsDashboard;
