import React, { useState } from 'react';
import { Search, Loader, Image as ImageIcon } from 'lucide-react';
import { visionSearchApi } from '../../services/api';

interface Result {
  id: number;
  title: string;
  sender: string;
  document_type: string;
  status: string;
  vision_score: number;
}

const VisionSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await visionSearchApi.search(query.trim());
    setResults(res as Result[]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center">
        <ImageIcon className="mr-2" size={20} /> Vision Search
      </h1>

      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-secondary-400" />
        </div>
        <input
          type="text"
          placeholder='Describe what you see... (e.g., "invoice with Visana logo")'
          className="form-input pl-10 pr-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {loading && (
        <div className="flex items-center text-secondary-500">
          <Loader className="animate-spin mr-2" size={18} /> Searching...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.id} className="p-4 bg-white dark:bg-secondary-800 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-secondary-500">{r.sender} • {r.document_type}</p>
              </div>
              <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-md">{r.vision_score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <p className="text-secondary-500">No visual matches found.</p>
      )}
    </div>
  );
};

export default VisionSearch; 