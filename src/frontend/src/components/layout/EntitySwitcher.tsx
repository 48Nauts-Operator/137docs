import React, { useState, useRef, useEffect } from 'react';
import { useTenants } from '../../services/api';
import { ChevronDown, Building2, User, Star } from 'lucide-react';

const TenantSwitcher: React.FC = () => {
  const { tenants, defaultTenant, loading, setDefault } = useTenants();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current tenant (default tenant or first available)
  const currentTenant = defaultTenant || tenants[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTenantSelect = async (tenant: any) => {
    if (tenant.id !== currentTenant?.id) {
      try {
        await setDefault(tenant.id);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to switch tenant:', error);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleShowAll = async () => {
    console.log('🔄 [DEBUG] Starting handleShowAll function...');
    console.log('🔄 [DEBUG] Current defaultTenant:', defaultTenant);
    console.log('🔄 [DEBUG] All tenants:', tenants);
    console.log('🔄 [DEBUG] setDefault function:', typeof setDefault, setDefault);
    
    if (typeof setDefault !== 'function') {
      console.error('❌ [DEBUG] setDefault is not a function!');
      alert('setDefault function is not available');
      return;
    }
    
    try {
      console.log('🔄 [DEBUG] About to call setDefault(null)...');
      
      // Clear the default tenant to show all documents
      await setDefault(null);
      
      console.log('✅ [DEBUG] setDefault(null) completed successfully');
      console.log('✅ [DEBUG] Setting isOpen to false...');
      
      setIsOpen(false);
      
      console.log('✅ [DEBUG] handleShowAll completed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Error in handleShowAll:', error);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Error response:', error.response);
      alert(`Failed to switch to "All Documents" mode: ${error.message}`);
    }
  };

  // Don't show if no tenants or loading
  if (loading || tenants.length === 0) return null;
  
  // Always show the dropdown - even with one tenant, users need "All Documents" option

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-secondary-50 dark:bg-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md transition-colors"
      >
        {currentTenant ? (
          <>
            {currentTenant.type === 'company' ? (
              <Building2 className="w-4 h-4 text-blue-500" />
            ) : (
              <User className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm font-medium">{currentTenant.alias}</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
            </div>
            <span className="text-sm font-medium">All Documents</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-600">
              Switch Tenant Profile
            </div>
            
            {/* All option */}
            <button
              onClick={handleShowAll}
              className={`w-full text-left px-3 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors ${
                !currentTenant ? 'bg-secondary-100 dark:bg-secondary-700' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">All Documents</div>
                    <div className="text-xs text-secondary-500">Show all tenant documents</div>
                  </div>
                </div>
                {!currentTenant && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </div>
            </button>
            
            <div className="border-t border-secondary-200 dark:border-secondary-600 my-1"></div>
            
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant)}
                className={`w-full text-left px-3 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors ${
                  tenant.id === currentTenant?.id ? 'bg-secondary-100 dark:bg-secondary-700' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {tenant.type === 'company' ? (
                      <Building2 className="w-4 h-4 text-blue-500" />
                    ) : (
                      <User className="w-4 h-4 text-green-500" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{tenant.alias}</div>
                      <div className="text-xs text-secondary-500">{tenant.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {tenant.is_default && (
                      <Star className="w-3 h-3 text-yellow-500" />
                    )}
                    {tenant.id === currentTenant?.id && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher; 