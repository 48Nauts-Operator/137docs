import React from 'react';
import FileBrowser from '@/components/common/FileBrowser';

const FileSystemPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">File Browser</h1>
      <FileBrowser initialPath="/inbox" />
    </div>
  );
};

export default FileSystemPage; 