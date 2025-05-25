import React from 'react';

interface Entry { version: string; date: string; description: string; }

const changelog: Entry[] = [
  { version: '0.01', date: '2025-05-18', description: 'Project bootstrap: FastAPI backend + React frontend, document CRUD, initial invoice & calendar features.' },
  { version: '0.02', date: '2025-05-19', description: 'Migrated frontend from CRA to Vite, added Tailwind dark theme, FullCalendar integration, invoice dashboard totals, and version badge.' },
  { version: '0.03', date: '2025-05-19', description: 'Introduced Finance Analytics dashboard with KPI cards, interactive charts, and filters. Added success variant to Badge component, wired Analytics sidebar route, and installed missing Radix UI & react-day-picker dependencies.' },
  { version: '0.04', date: '2025-05-19', description: 'Added rich Dashboard page with due invoices, new docs, financial KPIs, smart reminders, activity feed; rebranded to 137docs.' },
  { version: '0.05', date: '2025-05-19', description: 'Complete calendar page redesign using ShadCN components: modern month grid, upcoming payments panel, summary KPIs, dark-mode styling.' },
  { version: '0.06', date: '2025-05-19', description: 'Settings page with multi-tab Radix UI, default currency support, Postgres+pgvector backend switch, semantic search, dark-theme input fixes, sidebar cleanup.' },
  { version: '0.07', date: '2025-05-19', description: 'Background scheduler creates invoice-due reminders & overdue alerts; notification bell opens NotificationCenter; bug-fixes to JSON serialisation.' },
  { version: '0.08', date: '2025-05-21', description: 'User management: Postgres users table, seed admin/viewer, async UserRepository, admin-only CRUD API & Users page with Dexie cache and modal-driven create/edit/delete & reset-password.' },
  { version: '0.09', date: '2025-05-22', description: 'Vision search UI, column layout refactor (VAT & Tags), offline ColPali guidance, runtime rebuild in Docker to auto-sync frontend code.' },
  { version: '0.10', date: '2025-05-24', description: 'Filesystem browser integrated into Settings, macOS mount guide, clean-start recipe, automatic cache busting, colour-coded "Due In" column for invoices (blue >30d, yellow 14–30d, red <14d/overdue, neutral 0 when paid).' },
];

const ChangelogPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Changelog</h1>
      <div className="relative border-l-2 border-primary-500 pl-6">
        {changelog.map((entry) => (
          <div key={entry.version} className="mb-8">
            <div className="absolute -left-1.5 top-0 w-3 h-3 bg-primary-500 rounded-full" />
            <h2 className="text-lg font-semibold">v{entry.version}</h2>
            <p className="text-sm text-secondary-500 mb-2">{entry.date}</p>
            <p className="text-secondary-700 dark:text-secondary-300">{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangelogPage; 