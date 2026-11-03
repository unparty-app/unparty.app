import React, { useState, useRef } from 'react';
import IconButton from './IconButton';

const SVGUpload = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'image/svg+xml' || file.name.endsWith('.svg')
    );
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select files to upload.');
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-svg', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Upload failed');
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      setMessage('Files uploaded successfully!');
      setSelectedFiles([]);
      setIsOpen(false);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Upload failed'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <IconButton
        icon="upload.svg"
        onClick={() => setIsOpen(true)}
        label="Upload SVGs"
        className="hover:bg-gray-100"
      />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload</h3>
              <IconButton
                icon="close.svg"
                onClick={() => setIsOpen(false)}
                label="Close"
                className="hover:bg-gray-100"
              />
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-500 hover:text-blue-600"
              >
                Choose files
              </button>
              <p className="mt-2 text-sm text-gray-500">
                or drag and drop SVG files here
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-gray-50 p-2"
                  >
                    <span className="max-w-[280px] truncate text-sm">
                      {file.name}
                    </span>
                    <IconButton
                      icon="close.svg"
                      onClick={() => removeFile(index)}
                      label="Remove file"
                      className="text-gray-500 hover:text-red-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {message && (
              <p className={`mt-4 text-sm ${
                message.includes('Error') ? 'text-red-500' : 'text-green-500'
              }`}>
                {message}
              </p>
            )}

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className={`rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 ${
                  isUploading ? 'opacity-75' : ''
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SVGUpload;