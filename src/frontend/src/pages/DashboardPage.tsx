import React from 'react';
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
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ProcessingQueue from '../components/dashboard/ProcessingQueue';
import DueSoonList from '../components/dashboard/DueSoonList';
import SmartStats from '../components/dashboard/SmartStats';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import { LayoutDashboard } from 'lucide-react';
import PaymentTrendsChart from '../components/dashboard/PaymentTrendsChart';

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

const DashboardPage: React.FC = () => (
  <div className="p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <PaymentTrendsChart />
      <DueSoonList />
      <ProcessingQueue />
      <SmartStats />
      <AlertsPanel />
    </div>
  </div>
);

export default DashboardPage;

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