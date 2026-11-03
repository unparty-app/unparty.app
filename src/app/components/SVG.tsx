'use client';
import React, { useState, useEffect } from 'react';
import SVGUpload from './SVGUpload';
import SVGColor from './SVGColor';
import Image from 'next/image';


interface IconButtonProps {
  icon: string;
  onClick: () => void;
  label: string;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, label, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded-md opacity-60 transition-all duration-150 hover:opacity-100 ${className}`}
      aria-label={label}
      title={label}
    >
      {icon ? (
        <Image src={`/svgs/user_set/${icon}`} alt="" width={16} height={16} unoptimized className="size-4" />
      ) : (
        <span className="text-sm">⚙️</span>
      )}
    </button>
  );
};
  

interface TagInputProps {
    fileName: string;
    onClose: () => void;
    }
// TagInput Component
const TagInput: React.FC<TagInputProps> = ({ fileName, onClose }) => {
  const [tag, setTag] = useState('');
  
  const handleAddTag = async () => {
    try {
      const response = await fetch('/api/add-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, newTag: tag }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add tag');
      }
      
      setTag('');
      onClose();
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  return (
    <div className="absolute -top-8 flex items-center space-x-2 rounded-lg bg-white p-2 shadow-lg">
      <input
        type="text"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="Add tag"
        className="w-32 rounded border px-2 py-1 text-sm"
      />
      <IconButton
        icon="check.svg"
        onClick={handleAddTag}
        label="Confirm"
        className="text-green-500 hover:text-green-700"
      />
      <IconButton
        icon="close.svg"
        onClick={onClose}
        label="Cancel"
        className="text-red-500 hover:text-red-700"
      />
    </div>
  );
};

// Main SVGGallery Component
const SVGGallery = () => {
  const [svgFiles, setSvgFiles] = useState<string[]>([]);
  const [trashedFiles, setTrashedFiles] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewingTrash, ] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const [currentColor, setCurrentColor] = useState<string>('');


  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const [activeResponse, trashedResponse] = await Promise.all([
          fetch('/api/get-svgs'),
          fetch('/api/get-trashed-svgs')
        ]);

        if (!activeResponse.ok) throw new Error('Failed to fetch SVG files');

        const activeData = await activeResponse.json();
        setSvgFiles(activeData);

        if (trashedResponse.ok) {
          const trashedData = await trashedResponse.json();
          setTrashedFiles(trashedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load files.');
      }
    };

    fetchFiles();
  }, []);

  const handleRename = async () => {
    try {
      const oldName = svgFiles[currentIndex];
      const response = await fetch('/api/rename-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: newFileName }),
      });

      if (!response.ok) throw new Error('Error renaming file');

      setSvgFiles(prev => {
        const updated = [...prev];
        updated[currentIndex] = newFileName;
        return updated;
      });
      setIsRenaming(false);
      setNewFileName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error renaming file');
    }
  };

  const handleDelete = async () => {
    try {
      const fileName = svgFiles[currentIndex];
      const response = await fetch(`/api/delete-svg?fileName=${fileName}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error moving file to trash');

      setSvgFiles(prev => prev.filter((_, idx) => idx !== currentIndex));
      setTrashedFiles(prev => [...prev, fileName]);
      setCurrentIndex(prev => prev >= svgFiles.length - 1 ? prev - 1 : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting file');
    }
  };

  
  
  const handleRestore = async () => {
    try {
      const fileName = trashedFiles[currentIndex];
      const response = await fetch('/api/restore-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) throw new Error('Error restoring file');

      setTrashedFiles(prev => prev.filter((_, idx) => idx !== currentIndex));
      setSvgFiles(prev => [...prev, fileName]);
      setCurrentIndex(prev => prev >= trashedFiles.length - 1 ? prev - 1 : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error restoring file');
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (svgFiles.length === 0) return <div>No SVG files available.</div>;

  const currentFiles = viewingTrash ? trashedFiles : svgFiles;
  const currentFileName = currentFiles[currentIndex];
  

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <Image
          src={`/${viewingTrash ? 'svgs/trash' : 'svgs'}/${currentFileName}`}
          alt="SVG Preview"
          width={256}
          height={256}
          unoptimized
          className="size-64 object-contain"
          style={currentColor ? { color: currentColor } : undefined}
        />

        {!viewingTrash && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-lg border border-gray-100 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
            <div className="relative flex items-center gap-1">
              {isRenaming ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-32 rounded border border-gray-200 px-2 py-1 font-google-sans-code text-xs outline-none focus:border-gray-400"
                    placeholder="New filename"
                  />
                  <IconButton icon="check.svg" onClick={handleRename} label="Confirm" />
                  <IconButton icon="close.svg" onClick={() => setIsRenaming(false)} label="Cancel" />
                </div>
              ) : (
                <>
                  <IconButton
                    icon="edit.svg"
                    onClick={() => { setNewFileName(currentFileName); setIsRenaming(true); }}
                    label="Rename"
                  />
                  <IconButton icon="tag.svg" onClick={() => setIsTagging(true)} label="Add Tag" />
                  <IconButton icon="trash.svg" onClick={handleDelete} label="Move to Trash" />
                  <SVGUpload />
                  <SVGColor currentFileName={currentFileName} onColorChange={setCurrentColor} />
                </>
              )}

              {isTagging && (
                <TagInput
                  fileName={currentFileName}
                  onClose={() => setIsTagging(false)}
                />
              )}
            </div>
          </div>
        )}

        {viewingTrash && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-lg border border-gray-100 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
            <IconButton icon="restore.svg" onClick={handleRestore} label="Restore" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          icon="arrow_left.svg"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + currentFiles.length) % currentFiles.length)}
          label="Previous"
          className="rounded-md bg-gray-100 hover:bg-gray-200"
        />
        <span className="font-google-sans-code text-xs text-gray-400">
          {currentIndex + 1} / {currentFiles.length}
        </span>
        <IconButton
          icon="arrow_right.svg"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % currentFiles.length)}
          label="Next"
          className="rounded-md bg-gray-100 hover:bg-gray-200"
        />
      </div>
    </div>
    
  );
};

export default SVGGallery;