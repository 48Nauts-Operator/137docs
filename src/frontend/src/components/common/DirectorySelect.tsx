import React from 'react';

interface DirectorySelectProps {
  label?: string;
  onSelect: (folderName: string) => void;
  className?: string;
}

/**
 * Directory picker that prefers the native File-System-Access API (showDirectoryPicker)
 * and falls back to a hidden <input type="file" webkitdirectory />.
 *
 * Security note: Browsers never reveal the *full* path for privacy reasons –
 * you only get the basename.  We therefore use this picker as a convenience
 * helper; the user must still paste (or type) the absolute path into the text
 * field that accompanies this component so the backend receives the correct
 * mount path.
 */
export const DirectorySelect: React.FC<DirectorySelectProps> = ({ label, onSelect, className }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = async () => {
    const hasNative = !!(window as any).showDirectoryPicker;

    if (hasNative) {
      // Some Chromium variants (Arc, Brave) occasionally hang – we'll fallback
      // after 2 s if no resolution.
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2000)
        );
        const picker = (window as any).showDirectoryPicker();
        const handle = await Promise.race([picker, timeout]);
        // If the race returned a handle proceed, else fallthrough
        if (handle && handle.name) {
          onSelect(handle.name);
          return;
        }
      } catch (err: any) {
        const msg = String(err?.message || err);
        // If another picker already open just stop – user will finish/cancel
        if (msg.includes('File picker already active')) {
          console.warn('Directory picker already open – waiting for user');
          return;
        }
        // Otherwise fall back
        console.warn('Native directory picker failed, falling back', err);
      }
    }

    // Fallback: hidden <input webkitdirectory>
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // webkitRelativePath gives e.g.  "MyFolder/file.txt" → take first segment
      // If not available (older Firefox), fall back to file[0].name
      const relPath = (files[0] as any).webkitRelativePath || files[0].name;
      const topFolder = relPath.split('/')[0];
      onSelect(topFolder);
      // Reset value so selecting same folder again still triggers change event
      e.target.value = '';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <button
        type="button"
        onClick={handleClick}
        className="text-sm px-3 py-1 rounded bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600"
      >
        Browse…
      </button>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        // @ts-ignore – vendor attribute for Chromium/Safari
        webkitdirectory="true"
        onChange={handleInputChange}
      />
      {label && <span className="text-sm italic text-secondary-500 dark:text-secondary-400 truncate max-w-xs">{label}</span>}
    </div>
  );
};

export default DirectorySelect; 