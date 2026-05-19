'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import { apiFetch } from '@/lib/api/client';

interface UploadResponse {
  url: string;
  file_type: string;
}

interface Props {
  folder: 'covers' | 'attachments';
  onUpload: (url: string, fileType: string) => void;
  value?: string;
  imageOnly?: boolean;
  className?: string;
}

export function FileUpload({
  folder,
  onUpload,
  value,
  imageOnly = false,
  className = '',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = imageOnly
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : undefined;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Do NOT set Content-Type — browser must set it with the multipart boundary
      const res = await apiFetch(`/upload?folder=${folder}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => ({ detail: 'Upload thất bại' }));
        throw new Error(
          (body as { detail: string }).detail || 'Upload thất bại',
        );
      }

      const data: UploadResponse = await res.json();
      onUpload(data.url, data.file_type);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isImage =
    imageOnly || (value != null && /\.(jpe?g|png|webp|gif)$/i.test(value));

  return (
    <div className={`space-y-2 ${className}`}>
      {value && isImage && (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
          <Image src={value} alt="Preview" fill className="object-cover" />
        </div>
      )}
      {value && !isImage && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-emerald-600 hover:underline dark:border-gray-600"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          <span className="truncate">{value.split('/').pop()}</span>
        </a>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          {uploading
            ? 'Đang tải lên...'
            : value
              ? 'Thay thế file'
              : 'Chọn file'}
        </button>
        <span className="text-xs text-gray-400">
          {imageOnly
            ? 'JPEG, PNG, WebP, GIF — tối đa 10 MB'
            : 'PDF, DOC, PPT, XLSX, ảnh, video — tối đa 10 MB'}
        </span>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />
    </div>
  );
}
