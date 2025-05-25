import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Shield, Bell, Moon, Sun, Globe, Database, Save } from 'lucide-react';
import { settingsApi } from '../../services/api';
import DirectorySelect from '../common/DirectorySelect';
import FileBrowser from '../common/FileBrowser';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState({
    // Account settings
    name: 'John Doe',
    email: 'john.doe@example.com',
    
    // Notification settings
    emailNotifications: true,
    dueDateReminders: true,
    overdueAlerts: true,
    systemUpdates: false,
    
    // Appearance settings
    darkMode: false,
    compactMode: false,
    
    // System settings
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    autoSave: true,
    
    // Document settings
    inbox_path: '',
    storage_root: '',
    locked: false,
    autoOCR: true,
    autoTagging: true,
    
    // Privacy settings
    shareAnalytics: false,
    storeHistory: true,

    // Currency
    defaultCurrency: 'USD',
  });

  // Fetch initial settings from backend
  useEffect(() => {
    settingsApi.getSettings().then((data) => {
      if (data && Object.keys(data).length) {
        setSettings((prev) => ({ ...prev, ...data }));
        setValidationResult(null);
      }
    });
  }, []);

  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<any | null>(null);

  // Store the basename hints chosen via DirectorySelect so we can display
  // them next to the Browse button without mutating the actual path value.
  const [pickerHints, setPickerHints] = useState<{ inbox: string; storage: string }>({ inbox: '', storage: '' });

  const handleValidate = async () => {
    const res = await settingsApi.validateFolders(settings.inbox_path, settings.storage_root);
    setValidationResult(res);
  };

  const handleMigrate = async () => {
    await settingsApi.migrateStorage(settings.storage_root, false);
    setMigrationStatus({ state: 'running' });
  };

  // Poll migration status when running
  useEffect(() => {
    if (migrationStatus?.state === 'running') {
      const id = setInterval(async () => {
        const st = await settingsApi.getMigrationStatus();
        setMigrationStatus(st);
        if (st.state !== 'running') clearInterval(id);
      }, 3000);
      return () => clearInterval(id);
    }
  }, [migrationStatus?.state]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save settings to backend
    settingsApi.updateSettings(settings).then(() => {
      alert('Settings saved successfully!');
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-secondary-200 dark:border-secondary-700">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'account'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
            onClick={() => setActiveTab('account')}
          >
            <User size={16} className="inline mr-1" />
            Account
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} className="inline mr-1" />
            Notifications
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'appearance'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            <Moon size={16} className="inline mr-1" />
            Appearance
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'system'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
            onClick={() => setActiveTab('system')}
          >
            <Globe size={16} className="inline mr-1" />
            System
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'documents'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            <Database size={16} className="inline mr-1" />
            Documents
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'privacy'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield size={16} className="inline mr-1" />
            Privacy
          </button>

          {/* Save icon button */}
          <button
            type="button"
            onClick={handleSubmit as any}
            className="ml-auto px-3 py-3 hover:text-primary-600 text-secondary-600 dark:text-secondary-400 dark:hover:text-primary-400"
            title="Save settings"
          >
            <Save size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Account Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={settings.name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={settings.email}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <button type="button" className="btn btn-outline">
                      <Lock size={16} className="mr-1" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-secondary-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        className="sr-only peer"
                        checked={settings.emailNotifications}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Due Date Reminders</h3>
                      <p className="text-sm text-secondary-500">Get reminded about upcoming due dates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="dueDateReminders"
                        className="sr-only peer"
                        checked={settings.dueDateReminders}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Overdue Alerts</h3>
                      <p className="text-sm text-secondary-500">Get alerted about overdue documents</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="overdueAlerts"
                        className="sr-only peer"
                        checked={settings.overdueAlerts}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">System Updates</h3>
                      <p className="text-sm text-secondary-500">Get notified about system updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="systemUpdates"
                        className="sr-only peer"
                        checked={settings.systemUpdates}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Appearance Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Dark Mode</h3>
                      <p className="text-sm text-secondary-500">Use dark theme for the application</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="darkMode"
                        className="sr-only peer"
                        checked={settings.darkMode}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Compact Mode</h3>
                      <p className="text-sm text-secondary-500">Use compact layout for more content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="compactMode"
                        className="sr-only peer"
                        checked={settings.compactMode}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">System Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="language" className="form-label">Language</label>
                    <select
                      id="language"
                      name="language"
                      className="form-input"
                      value={settings.language}
                      onChange={handleChange}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateFormat" className="form-label">Date Format</label>
                    <select
                      id="dateFormat"
                      name="dateFormat"
                      className="form-input"
                      value={settings.dateFormat}
                      onChange={handleChange}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Auto Save</h3>
                      <p className="text-sm text-secondary-500">Automatically save changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoSave"
                        className="sr-only peer"
                        checked={settings.autoSave}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Document Settings */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Folder Configuration</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="inbox_path" className="form-label">Inbox Folder (watched)</label>
                    <input
                      type="text"
                      id="inbox_path"
                      name="inbox_path"
                      className="form-input"
                      value={settings.inbox_path}
                      onChange={handleChange}
                    />
                    <DirectorySelect
                      label={pickerHints.inbox || 'select…'}
                      onSelect={(name) => setPickerHints((p) => ({ ...p, inbox: name }))}
                    />
                  </div>

                  <div>
                    <label htmlFor="storage_root" className="form-label">Storage Root</label>
                    <input
                      type="text"
                      id="storage_root"
                      name="storage_root"
                      className="form-input"
                      value={settings.storage_root}
                      onChange={handleChange}
                    />
                    <DirectorySelect
                      label={pickerHints.storage || 'select…'}
                      onSelect={(name) => setPickerHints((p) => ({ ...p, storage: name }))}
                    />
                  </div>

                  <button type="button" className="btn btn-outline" onClick={handleValidate}>Validate</button>

                  {validationResult && (
                    <pre className="bg-secondary-100 dark:bg-secondary-800 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(validationResult, null, 2)}
                    </pre>
                  )}

                  {settings.locked && (
                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                      Paths are locked. Changing storage root will trigger migration.
                    </div>
                  )}

                  {settings.locked && (
                    <button type="button" className="btn btn-primary" onClick={handleMigrate} disabled={migrationStatus?.state==='running'}>
                      {migrationStatus?.state==='running' ? 'Migrating…' : 'Migrate to new Storage Root'}
                    </button>
                  )}

                  {migrationStatus && migrationStatus.state !== 'idle' && (
                    <div className="text-sm mt-2">
                      Status: {migrationStatus.state}
                      {migrationStatus.detail && <span> – {migrationStatus.detail}</span>}
                    </div>
                  )}

                  {/* Live preview of Inbox folder */}
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Inbox Preview</h3>
                    <FileBrowser key={settings.inbox_path} initialPath={settings.inbox_path || '/hostfs'} className="max-h-96 overflow-auto" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Privacy Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Share Analytics</h3>
                      <p className="text-sm text-secondary-500">Share anonymous usage data to improve the application</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="shareAnalytics"
                        className="sr-only peer"
                        checked={settings.shareAnalytics}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Store History</h3>
                      <p className="text-sm text-secondary-500">Store document history and activity logs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="storeHistory"
                        className="sr-only peer"
                        checked={settings.storeHistory}
                        onChange={handleChange}
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
