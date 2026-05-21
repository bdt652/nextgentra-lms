'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteStudent, listStudents } from '@/lib/api/admin';
import { importStudents, type StudentImportRow } from '@/lib/api/import';
import { useIsAdmin } from '@/lib/hooks/usePermission';
import { useHasHydrated } from '@/lib/store/authStore';
import type { StudentAdmin } from '@/lib/types';
import { Toast } from '@/components/Toast';
import {
  ImportDialog,
  type ImportColumn,
} from '@/components/common/ImportDialog';
import {
  CreateStudentModal,
  EditStudentModal,
  ResetStudentPasswordModal,
} from './StudentModals';

export default function StudentsPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const isAdmin = useIsAdmin();

  const [students, setStudents] = useState<StudentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [creating, setCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentAdmin | null>(
    null,
  );
  const [resetStudent, setResetStudent] = useState<StudentAdmin | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const studentImportColumns: ImportColumn<StudentImportRow>[] = [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Tên' },
    { key: 'student_code', label: 'Mã học sinh' },
    { key: 'password', label: 'Mật khẩu' },
  ];

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        setStudents(await listStudents());
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : 'Không thể tải dữ liệu',
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hasHydrated, isAdmin, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setFetchError(null);
      try {
        setStudents(await listStudents(value || undefined));
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : 'Không thể tải dữ liệu',
        );
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleDelete = async (student: StudentAdmin) => {
    if (
      !confirm(
        `Xóa học sinh "${student.name}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    try {
      await deleteStudent(student.id);
      setStudents((list) => list.filter((s) => s.id !== student.id));
      setToast({ message: `Đã xóa học sinh ${student.name}`, type: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Xóa thất bại',
        type: 'error',
      });
    }
  };

  if (!hasHydrated || (!isAdmin && hasHydrated)) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Quản trị
          </Link>
          <span className="text-gray-400">/</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quản lý học sinh
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Nhập từ file
          </button>
          <button
            onClick={() => setCreating(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tạo học sinh
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm theo tên, email hoặc mã học sinh..."
          className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Tên
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Mã học sinh
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {students.map((student) => (
                <Fragment key={student.id}>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {student.email}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {student.student_code}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          student.is_active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {student.is_active ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="rounded px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setResetStudent(student)}
                          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Đặt lại MK
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    {search
                      ? 'Không tìm thấy học sinh nào.'
                      : 'Chưa có học sinh nào.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ImportDialog<StudentImportRow>
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Nhập học sinh từ file"
        templateHeaders={['email', 'name', 'student_code', 'password']}
        templateFilename="mau-hoc-sinh.csv"
        columns={studentImportColumns}
        onImport={(rows) => importStudents(rows)}
        onSuccess={async (res) => {
          setToast({
            message: `Đã tạo ${res.created} học sinh`,
            type: 'success',
          });
          setStudents(await listStudents(search || undefined));
        }}
      />

      {creating && (
        <CreateStudentModal
          onClose={() => setCreating(false)}
          onCreated={(student) => {
            setStudents((list) => [student, ...list]);
            setCreating(false);
            setToast({
              message: `Đã tạo học sinh ${student.name}`,
              type: 'success',
            });
          }}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={(updated) => {
            setStudents((list) =>
              list.map((s) => (s.id === updated.id ? updated : s)),
            );
            setEditingStudent(null);
            setToast({
              message: `Đã cập nhật thông tin ${updated.name}`,
              type: 'success',
            });
          }}
        />
      )}

      {resetStudent && (
        <ResetStudentPasswordModal
          student={resetStudent}
          onClose={() => setResetStudent(null)}
          onDone={() => {
            setToast({
              message: `Đã đặt lại mật khẩu cho ${resetStudent.name}`,
              type: 'success',
            });
            setResetStudent(null);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
