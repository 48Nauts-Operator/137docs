import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTenants, Tenant } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Edit2, Trash2, Star, Building2, User, X, Save, ChevronDown } from 'lucide-react';

// Common countries list (Switzerland first for convenience)
const COUNTRIES = [
  'Switzerland',
  'Germany',
  'Austria',
  'France',
  'Italy',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Netherlands',
  'Belgium',
  'Spain',
  'Portugal',
  'Norway',
  'Sweden',
  'Denmark',
  'Finland',
  'Iceland',
  'Luxembourg',
  'Liechtenstein',
  'Monaco',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 
  'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belize', 'Benin',
  'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Cape Verde', 'Chad', 'Chile',
  'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Estonia', 'Ethiopia', 'Fiji', 'Gabon', 'Gambia',
  'Georgia', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Lithuania', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Oman', 'Pakistan', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa',
  'South Korea', 'Sri Lanka', 'Sudan', 'Suriname', 
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
];

interface TenantFormData {
  name: string;
  alias: string;
  type: 'company' | 'individual';
  street: string;
  house_number: string;
  apartment: string;
  area_code: string;
  county: string;
  country: string;
  iban: string;
  vat_id: string;
}

const TenantManagement: React.FC = () => {
  const { tenants, defaultTenant, loading, error, createTenant, updateTenant, deleteTenant, setDefault } = useTenants();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<TenantFormData>({
    name: '',
    alias: '',
    type: 'company',
    street: '',
    house_number: '',
    apartment: '',
    area_code: '',
    county: '',
    country: '',
    iban: '',
    vat_id: '',
  });

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES;
    return COUNTRIES.filter(country =>
      country.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  const resetForm = () => {
    setForm({
      name: '',
      alias: '',
      type: 'company',
      street: '',
      house_number: '',
      apartment: '',
      area_code: '',
      county: '',
      country: '',
      iban: '',
      vat_id: '',
    });
    setCountrySearch('');
  };

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setForm({
      name: tenant.name,
      alias: tenant.alias,
      type: tenant.type,
      street: tenant.street || '',
      house_number: tenant.house_number || '',
      apartment: tenant.apartment || '',
      area_code: tenant.area_code || '',
      county: tenant.county || '',
      country: tenant.country || '',
      iban: tenant.iban || '',
      vat_id: tenant.vat_id || '',
    });
    setCountrySearch(tenant.country || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tenantData = {
        ...form,
        is_default: !editing && tenants.length === 0, // First tenant becomes default
      };

      if (editing) {
        await updateTenant(editing.id, tenantData);
      } else {
        await createTenant(tenantData);
      }
      
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Error saving tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!window.confirm(`Are you sure you want to delete "${tenant.alias}"?`)) return;
    
    try {
      await deleteTenant(tenant.id);
    } catch (err: any) {
      alert(err.message || 'Error deleting tenant');
    }
  };

  const handleSetDefault = async (tenant: Tenant) => {
    if (tenant.is_default) return;
    
    try {
      await setDefault(tenant.id);
    } catch (err: any) {
      alert(err.message || 'Error setting default tenant');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCountrySelect = (country: string) => {
    setForm(prev => ({ ...prev, country }));
    setCountrySearch(country);
    setShowCountryDropdown(false);
  };

  const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountrySearch(value);
    setForm(prev => ({ ...prev, country: value }));
    setShowCountryDropdown(true);
  };

  if (loading) return <div className="p-4">Loading tenants...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Tenant Profiles</h2>
          <p className="text-sm text-secondary-500">
            Manage your personal and business profiles for document processing
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add New Tenant</span>
        </Button>
      </div>

      {/* Tenant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className={`relative ${tenant.is_default ? 'ring-1 ring-primary-500' : ''}`}>
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center space-x-1">
                  {tenant.type === 'company' ? (
                    <Building2 className="w-3 h-3 text-blue-500" />
                  ) : (
                    <User className="w-3 h-3 text-green-500" />
                  )}
                  <span className="truncate">{tenant.alias}</span>
                </CardTitle>
                {tenant.is_default && (
                  <Badge variant="default" className="text-xs px-1 py-0">
                    <Star className="w-2 h-2 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-secondary-600 truncate">{tenant.name}</p>
            </CardHeader>
            
            <CardContent className="pt-0 px-3 pb-3">
              <div className="space-y-1 text-xs">
                {tenant.street && (
                  <div className="truncate">
                    <span className="text-secondary-500">📍</span>
                    <span className="ml-1">{tenant.street} {tenant.house_number}</span>
                  </div>
                )}
                
                {tenant.country && (
                  <div className="truncate">
                    <span className="text-secondary-500">🌍</span>
                    <span className="ml-1">{tenant.country}</span>
                  </div>
                )}
                
                {tenant.iban && (
                  <div className="truncate">
                    <span className="text-secondary-500">💳</span>
                    <span className="ml-1 font-mono text-xs">{tenant.iban.slice(0, 15)}...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t space-x-1">
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(tenant)}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit2 className="w-2 h-2" />
                  </Button>
                  
                  {!tenant.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(tenant)}
                      className="h-6 px-2 text-xs"
                    >
                      <Star className="w-2 h-2" />
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(tenant)}
                  className="h-6 px-2 text-xs"
                >
                  <Trash2 className="w-2 h-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tenants.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-secondary-400 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No tenants found</h3>
            <p className="text-secondary-500 text-center mb-4">
              Create your first tenant profile to start organizing your documents by entity.
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Tenant
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-secondary-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-medium">
                  {editing ? 'Edit Tenant' : 'Create New Tenant'}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Basic Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="alias" className="block text-sm font-medium mb-1">
                        Alias <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="alias"
                        name="alias"
                        value={form.alias}
                        onChange={handleChange}
                        placeholder="Personal, Company A, etc."
                        required
                      />
                      <p className="text-xs text-secondary-500 mt-1">
                        Display name shown in the tenant selector
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium mb-1">
                        Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="company">Company</option>
                        <option value="individual">Individual</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Complete legal name or company name"
                      required
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Address Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="street" className="block text-sm font-medium mb-1">
                        Street
                      </label>
                      <Input
                        id="street"
                        name="street"
                        value={form.street}
                        onChange={handleChange}
                        placeholder="Street name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="house_number" className="block text-sm font-medium mb-1">
                        House Number
                      </label>
                      <Input
                        id="house_number"
                        name="house_number"
                        value={form.house_number}
                        onChange={handleChange}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="apartment" className="block text-sm font-medium mb-1">
                        Apartment
                      </label>
                      <Input
                        id="apartment"
                        name="apartment"
                        value={form.apartment}
                        onChange={handleChange}
                        placeholder="Apt 4B"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="area_code" className="block text-sm font-medium mb-1">
                        Area Code
                      </label>
                      <Input
                        id="area_code"
                        name="area_code"
                        value={form.area_code}
                        onChange={handleChange}
                        placeholder="12345"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="county" className="block text-sm font-medium mb-1">
                        County/City
                      </label>
                      <Input
                        id="county"
                        name="county"
                        value={form.county}
                        onChange={handleChange}
                        placeholder="City name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-1">
                      Country
                    </label>
                    <div className="relative" ref={countryDropdownRef}>
                      <Input
                        id="country"
                        name="country"
                        value={countrySearch}
                        onChange={handleCountryInputChange}
                        onFocus={() => setShowCountryDropdown(true)}
                        placeholder="Type to search countries..."
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      
                      {showCountryDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                              <button
                                key={country}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 focus:bg-secondary-100 dark:focus:bg-secondary-700 focus:outline-none"
                                onClick={() => handleCountrySelect(country)}
                              >
                                {country}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-secondary-500">
                              No countries found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Financial Information</h4>
                  
                  <div>
                    <label htmlFor="iban" className="block text-sm font-medium mb-1">
                      IBAN
                    </label>
                    <Input
                      id="iban"
                      name="iban"
                      value={form.iban}
                      onChange={handleChange}
                      placeholder="CH93 0076 2011 6238 5295 7"
                      className="font-mono"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="vat_id" className="block text-sm font-medium mb-1">
                      VAT ID
                    </label>
                    <Input
                      id="vat_id"
                      name="vat_id"
                      value={form.vat_id}
                      onChange={handleChange}
                      placeholder="CHE-123.456.789"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement; 