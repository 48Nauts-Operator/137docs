import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import DocumentsPage from './pages/DocumentsPage';
import InvoicesPage from './pages/InvoicesPage';
import AddressBookPage from './pages/AddressBookPage';
import CalendarPage from './pages/CalendarPage';
import './index.css';

// Placeholder components for routes – these can later be replaced with the proper page components
const Dashboard = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Dashboard</h1><p>Dashboard content will go here</p></div>;
const Documents = DocumentsPage;
const Invoices = InvoicesPage;
const Analytics = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Analytics</h1><p>Analytics content will go here</p></div>;
const Calendar = CalendarPage;
const Notifications = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Notifications</h1><p>Notifications content will go here</p></div>;
const Tags = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Tags</h1><p>Tags content will go here</p></div>;
const AddressBook = AddressBookPage;
const Settings = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Settings</h1><p>Settings content will go here</p></div>;

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <Router>
      <div className="flex h-screen bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100">
        <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'main-content-collapsed' : 'main-content'}`}>
          <Navbar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/address-book" element={<AddressBook />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App; 