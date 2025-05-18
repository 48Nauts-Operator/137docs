import React, { useState } from 'react';
import { Bell, Moon, Sun, Search, Menu, User } from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed, toggleSidebar }) => {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notificationCount, setNotificationCount] = useState(3);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className={`navbar ${collapsed ? 'navbar-collapsed' : ''}`}>
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center md:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1 px-4 md:px-0">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={18} className="text-secondary-400" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              className="form-input pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="relative">
            <button className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
          </div>
          
          <div className="relative">
            <button className="flex items-center space-x-2 p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                <User size={16} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
