'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/hooks/usePermission';
import { listClasses, createClass, deleteClass } from '@/lib/api/classes';
import type { ClassItem } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';

export default function ClassesPage() {
  const router = useRouter();
  const canCreate = usePermission('class:create');
  const canDelete = usePermission('class:delete');

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listClasses()
      .then(setClasses)
      .catch(() =>
        setToast({ message: 'Không thể tải danh sách lớp học', type: 'error' }),
      )
      .finally(() => setLoading(false));
  }, []);

  const closeCreate = () => {
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const cls = await createClass({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      router.push(`/classes/${cls.id}`);
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
      setCreating(false);
    }
  };

  const handleDelete = async (cls: ClassItem) => {
    if (!confirm(`Xóa lớp "${cls.name}"? Tất cả dữ liệu sẽ bị mất.`)) return;
    try {
      await deleteClass(cls.id);
      setClasses((prev) => prev.filter((c) => c.id !== cls.id));
      setToast({ message: 'Đã xóa lớp học', type: 'success' });
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lớp học
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý lớp, học sinh và phân công khóa học
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tạo lớp học
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Đang tải...</div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <p className="text-gray-500">Chưa có lớp học nào</p>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-emerald-600 hover:underline"
            >
              Tạo lớp học đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/classes/${cls.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-emerald-600 dark:text-white"
                >
                  {cls.name}
                </Link>
                <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500 dark:bg-gray-700">
                  {cls.code}
                </span>
              </div>
              {cls.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {cls.description}
                </p>
              )}
              <div className="mt-2 flex gap-3 text-xs text-gray-400">
                <span>{cls.student_count} học sinh</span>
                <span>{cls.teacher_count} giáo viên</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/classes/${cls.id}`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Quản lý
                </Link>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(cls)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create class dialog */}
      <Dialog
        open={showCreate}
        onClose={closeCreate}
        title="Tạo lớp học mới"
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeCreate}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="create-class-form"
              disabled={creating || !newName.trim()}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Tạo lớp học'}
            </button>
          </div>
        }
      >
        <form
          id="create-class-form"
          onSubmit={handleCreate}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
              placeholder="VD: Lớp 10A1, Python Cơ Bản..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              placeholder="Mô tả về lớp học..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <p className="text-xs text-gray-400">
            Mã lớp (join code) sẽ được tự động tạo sau khi tạo lớp.
          </p>
        </form>
      </Dialog>

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
