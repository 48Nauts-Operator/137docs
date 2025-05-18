import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, FileText, Tag as TagIcon } from 'lucide-react';

// Mock search results
const mockSearchResults = [
  {
    id: 1,
    title: 'Invoice #2023-001',
    sender: 'Acme Corporation',
    documentDate: '2023-05-15',
    documentType: 'invoice',
    status: 'paid',
    relevanceScore: 9.5,
    snippet: "...Invoice #2023-001 from Acme Corporation for software services..."
  },
  {
    id: 2,
    title: 'Electricity Bill May 2023',
    sender: 'Power Company',
    documentDate: '2023-05-20',
    documentType: 'invoice',
    status: 'unpaid',
    relevanceScore: 8.7,
    snippet: "...monthly electricity bill for May 2023 with usage details..."
  },
  {
    id: 5,
    title: 'Insurance Policy',
    sender: 'Secure Insurance Co.',
    documentDate: '2023-04-30',
    documentType: 'document',
    status: 'processed',
    relevanceScore: 7.2,
    snippet: "...comprehensive insurance policy covering property and liability..."
  },
  {
    id: 3,
    title: 'Contract Renewal',
    sender: 'Office Space Inc.',
    documentDate: '2023-05-18',
    documentType: 'contract',
    status: 'pending',
    relevanceScore: 6.8,
    snippet: "...annual contract renewal for office space lease agreement..."
  }
];

const AdvancedSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    documentType: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsSearching(false);
    }, 800);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Update filters
  const updateFilter = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      documentType: '',
      dateFrom: '',
      dateTo: '',
      status: ''
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="status-paid">Paid</span>;
      case 'unpaid':
        return <span className="status-unpaid">Unpaid</span>;
      case 'overdue':
        return <span className="status-overdue">Overdue</span>;
      default:
        return <span className="status-pending">Processed</span>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Advanced Search</h1>
      
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-secondary-400" />
            </div>
            <input
              type="text"
              placeholder="Search documents by content, title, sender..."
              className="form-input pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={clearSearch}
              >
                <X className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              className="btn btn-outline py-1.5 text-sm flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-1" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              <ChevronDown size={16} className={`ml-1 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              type="submit"
              className="btn btn-primary py-1.5"
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? (
                <>
                  <div className="spinner mr-2" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-md">
              <div>
                <label htmlFor="documentType" className="form-label">Document Type</label>
                <select
                  id="documentType"
                  className="form-input"
                  value={filters.documentType}
                  onChange={(e) => updateFilter('documentType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="contract">Contract</option>
                  <option value="document">Other Document</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dateFrom" className="form-label">Date From</label>
                <input
                  type="date"
                  id="dateFrom"
                  className="form-input"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="dateTo" className="form-label">Date To</label>
                <input
                  type="date"
                  id="dateTo"
                  className="form-input"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  className="form-input"
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                  <option value="processed">Processed</option>
                </select>
              </div>
              
              <div className="col-span-full flex justify-end">
                <button
                  type="button"
                  className="btn btn-outline py-1 px-3 text-sm"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Search Results</h2>
            <span className="text-sm text-secondary-500">{searchResults.length} documents found</span>
          </div>
          
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div key={result.id} className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileText size={20} className="text-primary-500 mr-3" />
                    <div>
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">{result.sender} • {result.documentDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusBadge(result.status)}
                    <span className="ml-2 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full">
                      {result.relevanceScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900 p-2 rounded">
                  <p>{result.snippet}</p>
                </div>
                
                <div className="mt-3 flex items-center">
                  <TagIcon size={14} className="text-secondary-500 mr-1" />
                  <span className="text-xs text-secondary-500">
                    {result.documentType.charAt(0).toUpperCase() + result.documentType.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchQuery && isSearching && (
        <div className="flex justify-center py-8">
          <div className="spinner h-8 w-8" />
        </div>
      )}
      
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search />
          </div>
          <p className="empty-state-text">No documents found matching your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
