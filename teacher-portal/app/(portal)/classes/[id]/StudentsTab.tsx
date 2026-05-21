'use client';

import { useEffect, useState } from 'react';
import {
  importClassStudents,
  type ClassStudentImportRow,
} from '@/lib/api/import';
import type { ClassEnrollment } from '@/lib/types';
import {
  ImportDialog,
  type ImportColumn,
} from '@/components/common/ImportDialog';

export function StudentsTab({
  classId,
  canManage,
  onRemove,
  onEnrolled,
}: {
  classId: string;
  canManage: boolean;
  onRemove: (sid: string, name: string) => void;
  onEnrolled: () => void;
}) {
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Enroll search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; email: string; student_code: string }[]
  >([]);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const classStudentImportColumns: ImportColumn<ClassStudentImportRow>[] = [
    { key: 'student_code', label: 'Mã học sinh' },
  ];

  useEffect(() => {
    import('@/lib/api/classes')
      .then(({ listStudents }) => listStudents(classId))
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [classId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedStudent(null);
    try {
      const { listStudents: searchStudents } = await import('@/lib/api/admin');
      const results = await searchStudents(query.trim());
      if (results.length === 0) {
        setSearchError('Không tìm thấy học sinh nào');
      } else if (results.length === 1) {
        setSelectedStudent({ id: results[0].id, name: results[0].name });
      } else {
        setSearchResults(results);
      }
    } catch {
      setSearchError('Tìm kiếm thất bại');
    } finally {
      setSearching(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent) return;
    setEnrolling(true);
    try {
      const { enrollStudent } = await import('@/lib/api/classes');
      const enrollment = await enrollStudent(classId, selectedStudent.id);
      setStudents((prev) => [...prev, enrollment]);
      setQuery('');
      setSelectedStudent(null);
      setSearchResults([]);
      onEnrolled();
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Thêm thất bại');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <div className="py-10 text-center text-sm text-gray-400">Đang tải...</div>
    );

  return (
    <div>
      {students.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {students.map((s) => (
            <li
              key={s.student_id}
              className="flex items-center gap-3 px-5 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                  {s.name}
                </p>
                <p className="text-xs text-gray-400">
                  {s.email}
                  <span className="ml-2 font-mono">{s.student_code}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {new Date(s.enrolled_at).toLocaleDateString('vi-VN')}
              </span>
              {canManage && (
                <button
                  onClick={() => onRemove(s.student_id, s.name)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Xóa
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-gray-400">
          Chưa có học sinh nào
        </p>
      )}

      {canManage && (
        <div className="border-t border-gray-100 p-4 dark:border-gray-700">
          <ImportDialog<ClassStudentImportRow>
            open={importOpen}
            onClose={() => setImportOpen(false)}
            title="Nhập học sinh vào lớp từ file"
            templateHeaders={['student_code']}
            templateFilename="mau-hoc-sinh-lop.csv"
            columns={classStudentImportColumns}
            onImport={(rows) => importClassStudents(classId, rows)}
            onSuccess={async (res) => {
              if (res.created > 0) {
                const { listStudents } = await import('@/lib/api/classes');
                setStudents(await listStudents(classId));
                onEnrolled();
              }
            }}
          />
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchResults([]);
                setSelectedStudent(null);
                setSearchError(null);
              }}
              placeholder="Tìm theo email hoặc mã học sinh..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              {searching ? '...' : 'Tìm'}
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              Nhập file
            </button>
          </form>

          {searchError && (
            <p className="mt-2 text-xs text-red-500">{searchError}</p>
          )}

          {searchResults.length > 1 && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedStudent({ id: r.id, name: r.name });
                    setSearchResults([]);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {r.name}
                  </span>
                  <span className="text-gray-400">{r.email}</span>
                  <span className="ml-auto font-mono text-xs text-gray-400">
                    {r.student_code}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <span className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {selectedStudent.name}
              </span>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {enrolling ? '...' : 'Thêm vào lớp'}
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
