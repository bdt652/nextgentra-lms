'use client';

import { useRef, useState } from 'react';
import type { ImportResult } from '@/lib/api/import';

type Step = 'idle' | 'preview' | 'importing' | 'result';

export type ImportColumn<T> = {
  key: keyof T;
  label: string;
};

interface ImportDialogProps<T extends Record<string, string>> {
  open: boolean;
  onClose: () => void;
  title: string;
  templateHeaders: string[];
  templateFilename: string;
  columns: ImportColumn<T>[];
  onImport: (rows: T[]) => Promise<ImportResult>;
  onSuccess?: (result: ImportResult) => void;
}

function downloadCsvTemplate(headers: string[], filename: string) {
  const blob = new Blob([headers.join(',') + '\n'], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function parseFile<T extends Record<string, string>>(
  file: File,
): Promise<T[]> {
  const { default: Papa } = await import('papaparse');

  if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      Papa.parse<T>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(new Error(err.message)),
      });
    });
  }

  // Excel
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const csv: string = XLSX.utils.sheet_to_csv(sheet);
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: { message: string }) => reject(new Error(err.message)),
    });
  });
}

export function ImportDialog<T extends Record<string, string>>({
  open,
  onClose,
  title,
  templateHeaders,
  templateFilename,
  columns,
  onImport,
  onSuccess,
}: ImportDialogProps<T>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [rows, setRows] = useState<T[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setStep('idle');
    setRows([]);
    setParseError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    try {
      const parsed = await parseFile<T>(file);
      if (parsed.length === 0) {
        setParseError('File không có dữ liệu');
        return;
      }
      setRows(parsed);
      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Lỗi đọc file');
    }
  };

  const handleCellChange = (rowIdx: number, key: keyof T, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)),
    );
  };

  const handleDeleteRow = (rowIdx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setStep('importing');
    try {
      const res = await onImport(rows);
      setResult(res);
      setStep('result');
      if (res.errors.length === 0) {
        onSuccess?.(res);
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Import thất bại');
      setStep('preview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chọn file CSV hoặc Excel (.xlsx) để nhập dữ liệu
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    downloadCsvTemplate(templateHeaders, templateFilename)
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Tải mẫu CSV
                </button>
                <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  Chọn file
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {parseError && (
                <p className="text-sm text-red-500">{parseError}</p>
              )}
              <p className="text-xs text-gray-400">
                Cột: {templateHeaders.join(', ')}
              </p>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {rows.length} dòng — chỉnh sửa hoặc xóa trước khi nhập
                </p>
                <label className="cursor-pointer text-xs text-emerald-600 hover:underline">
                  Đổi file
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={String(col.key)}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-3 py-1.5 text-xs text-gray-400">
                          {i + 1}
                        </td>
                        {columns.map((col) => (
                          <td key={String(col.key)} className="px-2 py-1">
                            <input
                              value={String(row[col.key] ?? '')}
                              onChange={(e) =>
                                handleCellChange(i, col.key, e.target.value)
                              }
                              className="w-full min-w-[80px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-gray-800 focus:border-emerald-400 focus:outline-none dark:text-gray-200"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-1.5">
                          <button
                            onClick={() => handleDeleteRow(i)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parseError && (
                <p className="mt-2 text-xs text-red-500">{parseError}</p>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Đang nhập dữ liệu...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {result.created}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Đã tạo
                  </p>
                </div>
                <div className="flex-1 rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {result.skipped}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Bỏ qua
                  </p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="mb-2 text-xs font-medium text-red-700 dark:text-red-400">
                    Lỗi ({result.errors.length} dòng):
                  </p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        Dòng {e.row}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('idle')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Quay lại
              </button>
              <button
                onClick={handleImport}
                disabled={rows.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Nhập dữ liệu ({rows.length} dòng)
              </button>
            </>
          )}
          {(step === 'idle' || step === 'result') && (
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
