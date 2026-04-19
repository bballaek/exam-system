import React, { useState, useRef } from 'react';
import Icon from '@/components/Icon';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
}

export default function ImageUpload({ value, onChange, className = '', placeholder = 'Upload Image' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (Max 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!value) return;
    try {
      setIsUploading(true);
      await fetch(`/api/upload?url=${encodeURIComponent(value)}`, {
        method: 'DELETE',
      });
      onChange('');
    } catch (err) {
      console.error(err);
      alert('Error deleting file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden ${className}`}>
      {value ? (
        <div className="relative w-full h-full group">
          <img src={value} alt="Uploaded" className="object-contain w-full h-full" />
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 mx-1 shadow-sm"
              title="Change Image"
            >
              <Icon name="upload" size="sm" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 mx-1 shadow-sm disabled:opacity-50"
              title="Remove Image"
            >
              <Icon name="trash" size="sm" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-colors p-4"
        >
          {isUploading ? (
            <Icon name="spinner" size="md" className="animate-spin mb-2" />
          ) : (
            <Icon name="upload" size="md" className="mb-2" />
          )}
          <span className="text-xs font-medium text-center">{isUploading ? 'Uploading...' : placeholder}</span>
        </button>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
    </div>
  );
}
