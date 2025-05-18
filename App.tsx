import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder components for routes
const Dashboard = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Dashboard</h1><p>Dashboard content will go here</p></div>;
const Documents = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Documents</h1><p>Documents content will go here</p></div>;
const Invoices = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Invoices</h1><p>Invoices content will go here</p></div>;
const Timeline = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Timeline</h1><p>Timeline content will go here</p></div>;
const Analytics = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Analytics</h1><p>Analytics content will go here</p></div>;
const Search = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Search</h1><p>Search content will go here</p></div>;
const Calendar = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Calendar</h1><p>Calendar content will go here</p></div>;
const Notifications = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Notifications</h1><p>Notifications content will go here</p></div>;
const Tags = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Tags</h1><p>Tags content will go here</p></div>;
const Settings = () => <div className="p-6"><h1 className="text-2xl font-bold mb-6">Settings</h1><p>Settings content will go here</p></div>;

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/search" element={<Search />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
