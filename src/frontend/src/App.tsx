import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EntityProvider } from './modules/entity/EntityContext';
import RequireAuth from './components/auth/RequireAuth';
import RequirePermission from './components/auth/RequirePermission';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import DocumentsPage from './pages/DocumentsPage';
import VisionSearchPage from './pages/VisionSearchPage';
import InvoicesPage from './pages/InvoicesPage';
import AddressBookPage from './pages/AddressBookPage';
import CalendarPage from './pages/CalendarPage';
import ChangelogPage from './pages/ChangelogPage';
import FinanceAnalyticsPage from './pages/FinanceAnalyticsPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './components/settings/Settings';
import NotificationCenter from './components/notifications/NotificationCenter';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import MarketplacePage from './pages/MarketplacePage';
import ProcessingActivityPage from './pages/ProcessingActivityPage';
import ProcessingRulesPage from './pages/ProcessingRulesPage';
import VendorAnalytics from './components/vendors/VendorAnalytics';
import Wizard from './modules/onboarding/Wizard';
import './index.css';

// Placeholder components for routes – these can later be replaced with the proper page components
const Dashboard = DashboardPage;
const Documents = DocumentsPage;
const Invoices = InvoicesPage;
const Analytics = FinanceAnalyticsPage;
const Calendar = CalendarPage;
const Notifications = NotificationCenter;
const AddressBook = AddressBookPage;
const Settings = SettingsPage;
const Changelog = ChangelogPage;
const Users = UsersPage;
const VisionSearch = VisionSearchPage;
const Reports = ReportsPage;
const Marketplace = MarketplacePage;

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/onboarding" element={<Wizard />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Protected routes */}
          <Route
            path="*"
            element={
              <RequireAuth>
                <EntityProvider>
                  <div className="flex h-screen bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100">
                    <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
                    <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'main-content-collapsed' : 'main-content'}`}>
                      <Navbar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
                      <main className="flex-1 overflow-y-auto">
                        <Routes>
                          <Route index element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/invoices" element={<Invoices />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/search" element={<VisionSearch />} />
                          <Route path="/address-book" element={<AddressBook />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/changelog" element={<Changelog />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/marketplace" element={<Marketplace />} />
                          <Route path="/processing-activity" element={<ProcessingActivityPage />} />
                          <Route path="/processing-rules" element={<ProcessingRulesPage />} />
                          <Route path="/vendor-analytics" element={<VendorAnalytics />} />
                          <Route
                            path="/settings"
                            element={
                              <RequirePermission roles={['admin']}>
                                <Settings />
                              </RequirePermission>
                            }
                          />
                          <Route
                            path="/users"
                            element={
                              <RequirePermission roles={['admin']}>
                                <Users />
                              </RequirePermission>
                            }
                          />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </EntityProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App; 