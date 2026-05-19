'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/hooks/usePermission';
import {
  listCourses,
  createCourse,
  deleteCourse,
  togglePublish,
} from '@/lib/api/courses';
import type { Course } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { FileUpload } from '@/components/FileUpload';
import { Dialog } from '@/components/Dialog';

export default function CoursesPage() {
  const router = useRouter();
  const canCreate = usePermission('course:create');
  const canUpdate = usePermission('course:update');
  const canDelete = usePermission('course:delete');

  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'published'>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');
  const [creating, setCreating] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  useEffect(() => {
    listCourses(filter === 'mine')
      .then((data) => {
        const filtered =
          filter === 'published' ? data.filter((c) => c.is_published) : data;
        setCourses(filtered);
      })
      .catch(() => showToast('Không thể tải danh sách khóa học', 'error'))
      .finally(() => setLoading(false));
  }, [filter]);

  const closeCreate = () => {
    setShowCreate(false);
    setNewTitle('');
    setNewDesc('');
    setNewCoverImage('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const course = await createCourse({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        cover_image: newCoverImage.trim() || undefined,
      });
      router.push(`/courses/${course.id}`);
    } catch (err) {
      showToast((err as Error).message, 'error');
      setCreating(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Xóa khóa học "${course.title}"?`)) return;
    try {
      await deleteCourse(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      showToast('Đã xóa khóa học', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const updated = await togglePublish(course.id);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
      showToast(
        updated.is_published ? 'Đã xuất bản khóa học' : 'Đã ẩn khóa học',
        'success'
      );
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Khóa học
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý khóa học và bài học
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tạo khóa học
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        {(['all', 'mine', 'published'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setLoading(true);
              setFilter(f);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'mine' ? 'Của tôi' : 'Đã xuất bản'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Đang tải...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có khóa học nào
          </p>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-emerald-600 hover:underline"
            >
              Tạo khóa học đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {course.cover_image && (
                <Image
                  src={course.cover_image}
                  alt={course.title}
                  width={400}
                  height={128}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-emerald-600 dark:text-white"
                >
                  {course.title}
                </Link>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    course.is_published
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {course.is_published ? 'Đã xuất bản' : 'Nháp'}
                </span>
              </div>
              {course.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {course.description}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {course.lesson_count} bài học
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Xem
                </Link>
                {canUpdate && (
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    {course.is_published ? 'Ẩn' : 'Xuất bản'}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(course)}
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

      {/* Create course dialog */}
      <Dialog
        open={showCreate}
        onClose={closeCreate}
        title="Tạo khóa học mới"
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
              form="create-course-form"
              disabled={creating || !newTitle.trim()}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Tạo khóa học'}
            </button>
          </div>
        }
      >
        <form
          id="create-course-form"
          onSubmit={handleCreate}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên khóa học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
              placeholder="Nhập tên khóa học..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              placeholder="Mô tả nội dung khóa học..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh bìa
            </label>
            <FileUpload
              folder="covers"
              imageOnly
              value={newCoverImage || undefined}
              onUpload={(url) => setNewCoverImage(url)}
            />
          </div>
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
