import React, { useState, useEffect } from 'react';
import { fsApi, FsListResponse } from '@/services/api';

interface FileBrowserProps {
  initialPath?: string;
  onSelect?: (absPath: string) => void;
  className?: string;
}

/**
 * Minimal file-browser that lists directories & files using the backend /api/fs endpoint.
 *
 * • Clicking a directory navigates into it.
 * • Clicking a file triggers onSelect callback (if provided).
 */
const FileBrowser: React.FC<FileBrowserProps> = ({ initialPath = '/hostfs', onSelect, className }) => {
  const [path, setPath] = useState<string>(initialPath);
  const ROOT = initialPath;
  const [listing, setListing] = useState<FsListResponse | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const limit = 100;
  const [error, setError] = useState<string | null>(null);

  const fetchDir = async (_path: string, _offset = 0) => {
    try {
      setError(null);
      const res = await fsApi.listDirectory(_path, _offset, limit);
      setListing(res);
      setPath(res.path);
      setOffset(_offset);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  };

  useEffect(() => {
    fetchDir(initialPath, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPath]);

  const handleItemClick = (item: any) => {
    if (item.type === 'dir') {
      fetchDir(`${path.replace(/\/$/, '')}/${item.name}`, 0);
    } else if (onSelect) {
      onSelect(`${path.replace(/\/$/, '')}/${item.name}`);
    }
  };

  const goUp = () => {
    if (path === ROOT) return;
    const parent = path.replace(/\/$/, '').split('/').slice(0, -1).join('/') || ROOT;
    fetchDir(parent, 0);
  };

  if (error) {
    return <div className={`text-red-600 ${className || ''}`}>Error: {error}</div>;
  }

  return (
    <div className={`border rounded p-2 text-sm ${className || ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono truncate max-w-full" title={path}>{path}</div>
        <div className="flex gap-2">
          {path !== '/hostfs' && (
            <button className="btn btn-xs" onClick={goUp}>Up</button>
          )}
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-secondary-500 dark:text-secondary-400">
            <th className="py-1">Name</th>
            <th className="py-1 w-24">Type</th>
            <th className="py-1 w-24 text-right">Size</th>
            <th className="py-1 w-40">Modified</th>
          </tr>
        </thead>
        <tbody>
          {listing?.files.map((f) => (
            <tr
              key={f.name}
              className="cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800"
              onClick={() => handleItemClick(f)}
            >
              <td className="py-1">
                {f.type === 'dir' ? '📁' : f.type === 'symlink' ? '🔗' : '📄'} {f.name}
              </td>
              <td className="py-1">{f.type}</td>
              <td className="py-1 text-right">{f.size ? (f.size / 1024).toFixed(1) + ' KB' : ''}</td>
              <td className="py-1">{new Date(f.modified).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {listing?.hasMore && (
        <div className="flex justify-center mt-2">
          <button className="btn btn-xs" onClick={() => fetchDir(path, offset + limit)}>Load more</button>
        </div>
      )}
    </div>
  );
};

export default FileBrowser; 