import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Bell,
  Tag,
  FileCheck,
  Book,
  History,
  Users,
  Inbox,
  Store,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const { role } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', type: 'link' },

    { label: 'Documents', type: 'header' },
    { path: '/documents', icon: <Inbox size={20} />, label: 'Inbox', type: 'link' },
    { path: '/invoices', icon: <FileCheck size={20} />, label: 'Invoices', type: 'link' },
    { path: '/documents-all', icon: <FileText size={20} />, label: 'DocAI', type: 'link' },
    { path: '/address-book', icon: <Book size={20} />, label: 'Address Book', type: 'link' },

    { label: 'Insights', type: 'header' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics', type: 'link' },
    { path: '/calendar', icon: <Calendar size={20} />, label: 'Calendar', type: 'link' },
    { path: '/reports', icon: <PieChart size={20} />, label: 'Reports', type: 'link' },

    { label: 'Settings', type: 'header' },
    ...(role === 'admin' ? [{ path: '/users', icon: <Users size={20} />, label: 'Users', type: 'link' }] : []),
    { path: '/settings', icon: <Settings size={20} />, label: 'Preferences', type: 'link' },

    { label: 'Marketplace', type: 'header' },
    { path: '/marketplace', icon: <Store size={20} />, label: 'Modules', type: 'link' },
  ];

  // Track which header sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className={`sidebar relative ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              137docs
            </h1>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
              1
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="mt-6 px-2 flex flex-col h-full">
        <ul className="space-y-2 flex-1">
          {(() => {
            const elements: JSX.Element[] = [];
            let currentSection: string = '';

            navItems.forEach((item) => {
              if (item.type === 'header') {
                currentSection = item.label as string;
                elements.push(
                  <li
                    key={item.label}
                    className="mt-4 mb-1 px-3 text-xs font-semibold uppercase text-secondary-400 dark:text-secondary-500 flex items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleSection(item.label as string)}
                  >
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && (
                      <span className="text-secondary-500 dark:text-secondary-400">
                        {collapsedSections[item.label as string] ? '▶' : '▼'}
                      </span>
                    )}
                  </li>
                );
              } else {
                if (!collapsedSections[currentSection]) {
                  elements.push(
                    <li key={item.path as string}>
                      <Link
                        to={item.path as string}
                        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                          isActive(item.path as string)
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                            : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                }
              }
            });
            return elements;
          })()}
        </ul>
        <Link
          to="/changelog"
          className="absolute bottom-0 inset-x-0 px-3 py-3 text-xs text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 flex items-center justify-center"
        >
          <History size={16} className="mr-1" />
          {!collapsed && <span>v0.09</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
