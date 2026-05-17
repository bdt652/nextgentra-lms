'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePermission } from '@/lib/hooks/usePermission';
import {
  getCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  createLesson,
  deleteLesson,
} from '@/lib/api/courses';
import type { CourseDetail, Lesson } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const canUpdate = usePermission('course:update');
  const canDelete = usePermission('course:delete');
  const canCreateLesson = usePermission('lesson:create');
  const canDeleteLesson = usePermission('lesson:delete');

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [editingCourse, setEditingCourse] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  useEffect(() => {
    getCourse(id)
      .then(setCourse)
      .catch(() => showToast('Không thể tải khóa học', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      const updated = await togglePublish(course.id);
      setCourse({ ...course, ...updated });
      showToast(
        updated.is_published ? 'Đã xuất bản khóa học' : 'Đã ẩn khóa học',
        'success'
      );
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!course || !confirm(`Xóa khóa học "${course.title}"?`)) return;
    try {
      await deleteCourse(course.id);
      router.push('/courses');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const openEdit = () => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDesc(course.description ?? '');
    setEditingCourse(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setSavingEdit(true);
    try {
      const updated = await updateCourse(course.id, {
        title: editTitle,
        description: editDesc || undefined,
      });
      setCourse({ ...course, ...updated });
      setEditingCourse(false);
      showToast('Đã cập nhật', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !newLessonTitle.trim()) return;
    setSavingLesson(true);
    try {
      const lesson = await createLesson(course.id, {
        title: newLessonTitle.trim(),
      });
      setCourse({ ...course, lessons: [...course.lessons, lesson] });
      setNewLessonTitle('');
      setAddingLesson(false);
      showToast('Đã thêm bài học', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!course || !confirm(`Xóa bài học "${lesson.title}"?`)) return;
    try {
      await deleteLesson(course.id, lesson.id);
      setCourse({
        ...course,
        lessons: course.lessons.filter((l) => l.id !== lesson.id),
      });
      showToast('Đã xóa bài học', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Đang tải...</div>;
  }

  if (!course) {
    return (
      <div className="py-12 text-center text-gray-500">
        Không tìm thấy khóa học.{' '}
        <Link href="/courses" className="text-emerald-600 hover:underline">
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/courses" className="hover:text-gray-700">
          Khóa học
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {course.title}
        </span>
      </div>

      {/* Course header */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {course.title}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                course.is_published
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {course.is_published ? 'Đã xuất bản' : 'Nháp'}
            </span>
          </div>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500">{course.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {course.lesson_count} bài học
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {canUpdate && (
            <>
              <button
                onClick={openEdit}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Sửa
              </button>
              <button
                onClick={handleTogglePublish}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                {course.is_published ? 'Ẩn' : 'Xuất bản'}
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Lessons */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Bài học
          </h2>
          {canCreateLesson && (
            <button
              onClick={() => setAddingLesson(true)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              + Thêm bài học
            </button>
          )}
        </div>

        {course.lessons.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Chưa có bài học nào
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {course.lessons.map((lesson, idx) => (
              <li key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 text-center text-xs font-medium text-gray-400">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lesson.attachments.length} file đính kèm
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    lesson.is_published
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {lesson.is_published ? 'Đã xuất bản' : 'Nháp'}
                </span>
                <Link
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Sửa
                </Link>
                {canDeleteLesson && (
                  <button
                    onClick={() => handleDeleteLesson(lesson)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit course dialog */}
      <Dialog
        open={editingCourse}
        onClose={() => setEditingCourse(false)}
        title="Sửa khóa học"
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên khóa học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Tên khóa học"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Mô tả"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setEditingCourse(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingEdit ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Add lesson dialog */}
      <Dialog
        open={addingLesson}
        onClose={() => {
          setAddingLesson(false);
          setNewLessonTitle('');
        }}
        title="Thêm bài học"
        size="md"
      >
        <form onSubmit={handleAddLesson} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên bài học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              required
              autoFocus
              placeholder="Tên bài học..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setAddingLesson(false);
                setNewLessonTitle('');
              }}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingLesson || !newLessonTitle.trim()}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingLesson ? 'Đang thêm...' : 'Thêm'}
            </button>
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
