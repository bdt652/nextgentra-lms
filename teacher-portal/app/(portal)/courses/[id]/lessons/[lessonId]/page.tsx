'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getLesson,
  updateLesson,
  addAttachment,
  deleteAttachment,
} from '@/lib/api/courses';
import type { Lesson, LessonAttachment } from '@/lib/types';
import { Toast } from '@/components/Toast';

export default function LessonEditorPage() {
  const { id: courseId, lessonId } = useParams<{
    id: string;
    lessonId: string;
  }>();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // New attachment form
  const [attName, setAttName] = useState('');
  const [attUrl, setAttUrl] = useState('');
  const [attType, setAttType] = useState('pdf');
  const [addingAtt, setAddingAtt] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  useEffect(() => {
    getLesson(courseId, lessonId)
      .then((l) => {
        setLesson(l);
        setTitle(l.title);
        setContent(l.content ?? '');
        setVideoUrl(l.video_url ?? '');
        setIsPublished(l.is_published);
      })
      .catch(() => showToast('Không thể tải bài học', 'error'))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateLesson(courseId, lessonId, {
        title: title.trim(),
        content: content.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        is_published: isPublished,
      });
      setLesson(updated);
      showToast('Đã lưu bài học', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson || !attName.trim() || !attUrl.trim()) return;
    setAddingAtt(true);
    try {
      const att = await addAttachment(courseId, lessonId, {
        name: attName.trim(),
        file_url: attUrl.trim(),
        file_type: attType,
      });
      setLesson({
        ...lesson,
        attachments: [...lesson.attachments, att],
      });
      setAttName('');
      setAttUrl('');
      setAttType('pdf');
      showToast('Đã thêm file đính kèm', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setAddingAtt(false);
    }
  };

  const handleDeleteAttachment = async (att: LessonAttachment) => {
    if (!lesson || !confirm(`Xóa file "${att.name}"?`)) return;
    try {
      await deleteAttachment(courseId, lessonId, att.id);
      setLesson({
        ...lesson,
        attachments: lesson.attachments.filter((a) => a.id !== att.id),
      });
      showToast('Đã xóa file đính kèm', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-xl bg-white px-8 py-6 shadow-xl dark:bg-gray-800">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-xl bg-white px-8 py-6 shadow-xl dark:bg-gray-800">
          <p className="text-gray-500">
            Không tìm thấy bài học.{' '}
            <Link
              href={`/courses/${courseId}`}
              className="text-emerald-600 hover:underline"
            >
              Quay lại
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 pt-12">
      <div className="mx-auto mb-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400">
              Chỉnh sửa bài học
            </p>
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
              {lesson.title}
            </h2>
          </div>
          <Link
            href={`/courses/${courseId}`}
            className="ml-4 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Link>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên bài học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nội dung (Markdown)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="# Nội dung bài học..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL Video
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600"
              />
              Xuất bản bài học
            </label>

            <div className="flex gap-3 pt-1">
              <Link
                href={`/courses/${courseId}`}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-center text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                ← Quay lại
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu bài học'}
              </button>
            </div>
          </form>

          {/* Attachments */}
          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                File đính kèm ({lesson.attachments.length})
              </h3>
            </div>

            {lesson.attachments.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {lesson.attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center gap-3 px-5 py-3 text-sm"
                  >
                    <span className="flex-1 truncate font-medium text-gray-700 dark:text-gray-300">
                      {att.name}
                    </span>
                    <span className="shrink-0 text-xs uppercase text-gray-400">
                      {att.file_type}
                    </span>
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs text-emerald-600 hover:underline"
                    >
                      Xem
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att)}
                      className="shrink-0 text-xs text-red-500 hover:underline"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={handleAddAttachment}
              className="flex flex-col gap-2 p-4 sm:flex-row"
            >
              <input
                type="text"
                value={attName}
                onChange={(e) => setAttName(e.target.value)}
                placeholder="Tên file"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="url"
                value={attUrl}
                onChange={(e) => setAttUrl(e.target.value)}
                placeholder="URL file"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={attType}
                onChange={(e) => setAttType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {['pdf', 'doc', 'ppt', 'xlsx', 'image', 'video', 'other'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t.toUpperCase()}
                    </option>
                  )
                )}
              </select>
              <button
                type="submit"
                disabled={addingAtt || !attName.trim() || !attUrl.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {addingAtt ? '...' : '+ Thêm'}
              </button>
            </form>
          </div>
        </div>
      </div>

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
