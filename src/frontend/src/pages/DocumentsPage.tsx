import React, { useState, useRef, useEffect } from 'react';
import DocumentList from '../components/documents/DocumentListIntegrated';
import DocumentPreview from '../components/documents/DocumentPreviewIntegrated';

const DocumentsPage: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  // Drawer width in vw (viewport-width) units
  const [drawerWidth, setDrawerWidth] = useState<number>(45);
  const isDragging = useRef(false);

  // Attach global mouse handlers once
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Calculate width from right edge
      const vw = window.innerWidth;
      const newWidth = ((vw - e.clientX) / vw) * 100;
      // Constrain between 20% and 90%
      setDrawerWidth(Math.min(90, Math.max(20, newWidth)));
    };
    const stopDrag = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, []);

  const closePreview = () => setSelectedDocument(null);

  return (
    <div className="relative h-full">
      {/* Document list takes full width */}
      <div className="h-full overflow-y-auto pr-2">
        <DocumentList onSelectDocument={setSelectedDocument} />
      </div>

      {/* Slide-out drawer */}
      {selectedDocument && (
        <div
          className="fixed inset-y-0 right-0 bg-white dark:bg-secondary-900 shadow-xl z-50 flex flex-col"
          style={{ width: `${drawerWidth}vw` }}
        >
          {/* Drag handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:w-1.5 transition-all"
            onMouseDown={() => { isDragging.current = true; }}
          />
          <div className="flex justify-end p-2 border-b border-secondary-200 dark:border-secondary-700">
            <button onClick={closePreview} className="text-secondary-600 dark:text-secondary-300 hover:text-primary-500">✕</button>
          </div>
          <div className="h-[calc(100%-48px)] overflow-y-auto">
            <DocumentPreview documentId={selectedDocument.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 