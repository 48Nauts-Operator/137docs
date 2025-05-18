import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  BarChart2, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Bell,
  Tag,
  FileCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/documents', icon: <FileText size={20} />, label: 'Documents' },
    { path: '/invoices', icon: <FileCheck size={20} />, label: 'Invoices' },
    { path: '/timeline', icon: <Clock size={20} />, label: 'Timeline' },
    { path: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { path: '/search', icon: <Search size={20} />, label: 'Search' },
    { path: '/calendar', icon: <Calendar size={20} />, label: 'Calendar' },
    { path: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { path: '/tags', icon: <Tag size={20} />, label: 'Tags' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              DocManager
            </h1>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
              D
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

      <nav className="mt-6 px-2">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
