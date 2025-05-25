import React from 'react';

interface Props {
  status: string | null | undefined;
  /** Optional override text shown inside badge (defaults to capitalised status) */
  label?: React.ReactNode;
  /** Additional class names for the wrapper span */
  className?: string;
}

const StatusBadge: React.FC<Props> = ({ status = '', label, className = '' }) => {
  const base = 'inline-block px-2 py-0.5 rounded-full text-xs font-medium';
  const s = status.toString().toLowerCase();

  let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
  switch (s) {
    case 'paid':
      colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'pending':
    case 'unpaid':
      colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      break;
    case 'scheduled':
      colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'overdue':
    case 'delayed':
      colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
  }

  const text = label ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

  return <span className={`${base} ${colorClasses} ${className}`.trim()}>{text}</span>;
};

export default StatusBadge; 