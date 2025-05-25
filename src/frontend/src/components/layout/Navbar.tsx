import React, { useState, useEffect, useRef } from 'react';
import { Bell, Moon, Sun, Search, Menu, User, LogOut } from 'lucide-react';
import { useNotifications } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import HealthStatus from './HealthStatus';
import EntitySwitcher from './EntitySwitcher';

interface NavbarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed, toggleSidebar }) => {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useAuth();
  const { notifications } = useNotifications();
  const [showPwd, setShowPwd] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const notificationCount = isAuthenticated ? notifications.filter((n: any) => !n.is_read).length : 0;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [openMenu]);

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
        
        <div className="flex-1 px-4 md:px-0 flex items-center gap-6">
          <EntitySwitcher />
          <div className="relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={18} className="text-secondary-400" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              className="form-input pl-10"
            />
          </div>
          <HealthStatus />
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>
            </div>
          )}
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpenMenu((p) => !p)}
              className="flex items-center space-x-2 p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                <User size={16} />
              </div>
              {isAuthenticated && <span className="hidden md:inline text-sm font-medium">{username}</span>}
            </button>
            {/* Dropdown */}
            {isAuthenticated && openMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-secondary-800 rounded shadow-lg py-2 z-10">
                <button
                  onClick={logout}
                  className="w-full flex items-center px-4 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <LogOut size={14} className="mr-2" /> Logout
                </button>
                <button
                  onClick={() => setShowPwd(true)}
                  className="w-full flex items-center px-4 py-2 text-sm hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
    </header>
  );
};

export default Navbar;
