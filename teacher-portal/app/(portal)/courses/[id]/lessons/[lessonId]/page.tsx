'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getLesson,
  updateLesson,
  addAttachment,
  deleteAttachment,
  removeLessonQuestion,
  updateLessonQuestion,
} from '@/lib/api/courses';
import type { Lesson, LessonAttachment, LessonQuestionItem } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { FileUpload } from '@/components/FileUpload';
import { RichTextEditor } from '@/components/RichTextEditor';
import { AddQuestionsDialog } from '@/components/lesson/AddQuestionsDialog';

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

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [prereqPanelId, setPrereqPanelId] = useState<string | null>(null);
  const [editingRandomCount, setEditingRandomCount] = useState(false);
  const [randomCountInput, setRandomCountInput] = useState(5);
  const [savingRandomCount, setSavingRandomCount] = useState(false);

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

  const handleQuestionsAdded = (items: LessonQuestionItem[]) => {
    if (!lesson) return;
    const existingIds = new Set(lesson.lesson_questions.map((q) => q.id));
    const newItems = items.filter((item) => !existingIds.has(item.id));
    setLesson({
      ...lesson,
      lesson_questions: [...lesson.lesson_questions, ...newItems],
    });
    showToast(`Đã thêm ${newItems.length} câu hỏi`, 'success');
  };

  const handleLessonUpdated = (updated: Lesson) => {
    setLesson(updated);
  };

  const handleSaveRandomCount = async (n: number | null) => {
    if (!lesson) return;
    setSavingRandomCount(true);
    try {
      const updated = await updateLesson(courseId, lessonId, {
        random_question_count: n,
      });
      setLesson(updated);
      setEditingRandomCount(false);
      showToast(
        n === null ? 'Đã tắt hiển thị ngẫu nhiên' : `Đã lưu: ${n} câu/học sinh`,
        'success',
      );
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSavingRandomCount(false);
    }
  };

  const handleRemoveQuestion = async (lq: LessonQuestionItem) => {
    if (!lesson) return;
    try {
      await removeLessonQuestion(courseId, lessonId, lq.question_id);
      setLesson({
        ...lesson,
        lesson_questions: lesson.lesson_questions.filter((q) => q.id !== lq.id),
      });
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleToggleExtension = async (lq: LessonQuestionItem) => {
    if (!lesson) return;
    try {
      const updated = await updateLessonQuestion(courseId, lessonId, lq.id, {
        is_extension: !lq.is_extension,
      });
      setLesson({
        ...lesson,
        lesson_questions: lesson.lesson_questions.map((q) =>
          q.id === lq.id ? updated : q,
        ),
      });
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleTogglePrerequisite = async (
    lq: LessonQuestionItem,
    prereqId: string,
  ) => {
    if (!lesson) return;
    const current = new Set(lq.prerequisite_ids);
    if (current.has(prereqId)) current.delete(prereqId);
    else current.add(prereqId);
    try {
      const updated = await updateLessonQuestion(courseId, lessonId, lq.id, {
        prerequisite_ids: Array.from(current),
      });
      setLesson({
        ...lesson,
        lesson_questions: lesson.lesson_questions.map((q) =>
          q.id === lq.id ? updated : q,
        ),
      });
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
                Nội dung
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Nhập nội dung bài học... (**bold**, *italic*, `code`, $LaTeX$)"
                minHeight="280px"
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
              <div className="flex-1">
                <FileUpload
                  folder="attachments"
                  value={attUrl || undefined}
                  onUpload={(url, fileType) => {
                    setAttUrl(url);
                    setAttType(fileType);
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={addingAtt || !attName.trim() || !attUrl.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {addingAtt ? '...' : '+ Thêm'}
              </button>
            </form>
          </div>

          {/* Lesson Questions */}
          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Câu hỏi bài học ({lesson.lesson_questions.length})
                </h3>
                <button
                  onClick={() => setQuestionDialogOpen(true)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                >
                  + Thêm câu hỏi
                </button>
              </div>
              {lesson.lesson_questions.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {editingRandomCount ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Mỗi HS thấy</span>
                      <input
                        type="number"
                        min={1}
                        max={lesson.lesson_questions.length}
                        value={randomCountInput}
                        onChange={(e) =>
                          setRandomCountInput(
                            Math.min(
                              lesson.lesson_questions.length,
                              Math.max(1, parseInt(e.target.value) || 1),
                            ),
                          )
                        }
                        className="w-14 rounded-lg border border-gray-300 px-2 py-0.5 text-xs focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-xs text-gray-500">
                        / {lesson.lesson_questions.length} câu
                      </span>
                      <button
                        onClick={() => handleSaveRandomCount(randomCountInput)}
                        disabled={savingRandomCount}
                        className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingRandomCount(false)}
                        className="rounded px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : lesson.random_question_count !== null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                        Mỗi HS thấy {lesson.random_question_count} /{' '}
                        {lesson.lesson_questions.length} câu ngẫu nhiên
                      </span>
                      <button
                        onClick={() => {
                          setRandomCountInput(lesson.random_question_count!);
                          setEditingRandomCount(true);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleSaveRandomCount(null)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Tắt
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setRandomCountInput(
                          Math.max(
                            1,
                            Math.floor(lesson.lesson_questions.length / 2),
                          ),
                        );
                        setEditingRandomCount(true);
                      }}
                      className="text-xs text-gray-400 hover:text-indigo-600"
                    >
                      + Bật hiển thị ngẫu nhiên
                    </button>
                  )}
                </div>
              )}
            </div>

            {lesson.lesson_questions.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {lesson.lesson_questions.map((lq, idx) => (
                  <li
                    key={lq.id}
                    className={
                      lq.is_extension
                        ? 'bg-amber-50 dark:bg-amber-900/10'
                        : undefined
                    }
                  >
                    {/* Main row */}
                    <div className="flex items-start gap-2 px-5 py-3 text-sm">
                      <span className="mt-0.5 shrink-0 text-xs text-gray-400">
                        {idx + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-gray-700 dark:text-gray-300">
                          {lq.question.content}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {lq.question.type}
                          </span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {lq.question.points}đ
                          </span>
                          {lq.question.exam_title && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                              {lq.question.exam_title}
                            </span>
                          )}
                          {lq.is_extension && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Mở rộng
                            </span>
                          )}
                          {lq.prerequisite_ids.length > 0 && (
                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                              Tiên quyết:{' '}
                              {lq.prerequisite_ids
                                .map((pid) => {
                                  const i = lesson.lesson_questions.findIndex(
                                    (q) => q.id === pid,
                                  );
                                  return i >= 0 ? i + 1 : '?';
                                })
                                .join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Extension toggle */}
                      <button
                        onClick={() => handleToggleExtension(lq)}
                        title={
                          lq.is_extension ? 'Bỏ mở rộng' : 'Đánh dấu mở rộng'
                        }
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                          lq.is_extension
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'text-gray-400 hover:text-amber-500'
                        }`}
                      >
                        {lq.is_extension ? '★' : '☆'}
                      </button>
                      {/* Prereq toggle */}
                      <button
                        onClick={() =>
                          setPrereqPanelId(
                            prereqPanelId === lq.id ? null : lq.id,
                          )
                        }
                        title="Cài đặt tiên quyết"
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                          lq.prerequisite_ids.length > 0
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'text-gray-400 hover:text-purple-500'
                        }`}
                      >
                        ⛓{' '}
                        {lq.prerequisite_ids.length > 0
                          ? lq.prerequisite_ids.length
                          : '–'}
                      </button>
                      <button
                        onClick={() => handleRemoveQuestion(lq)}
                        className="shrink-0 text-xs text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                    {/* Prereq panel */}
                    {prereqPanelId === lq.id && (
                      <div className="border-t border-purple-100 bg-purple-50 px-5 pb-3 pt-2 dark:border-purple-900/30 dark:bg-purple-900/10">
                        <p className="mb-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                          Tiên quyết — phải hoàn thành trước khi làm câu này:
                        </p>
                        {lesson.lesson_questions.filter((q) => q.id !== lq.id)
                          .length === 0 ? (
                          <p className="text-xs text-gray-400">
                            Chưa có câu hỏi nào khác trong bài học.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {lesson.lesson_questions.map((other, otherIdx) =>
                              other.id === lq.id ? null : (
                                <label
                                  key={other.id}
                                  className="flex cursor-pointer items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                                >
                                  <input
                                    type="checkbox"
                                    checked={lq.prerequisite_ids.includes(
                                      other.id,
                                    )}
                                    onChange={() =>
                                      handleTogglePrerequisite(lq, other.id)
                                    }
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-purple-600"
                                  />
                                  <span className="font-medium">
                                    {otherIdx + 1}.
                                  </span>
                                  <span className="line-clamp-1">
                                    {other.question.content}
                                  </span>
                                </label>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {lesson.lesson_questions.length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">
                Chưa có câu hỏi nào. Nhấn &quot;+ Thêm câu hỏi&quot; để chọn từ
                thư viện đề.
              </p>
            )}
          </div>
        </div>
      </div>

      <AddQuestionsDialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
        courseId={courseId}
        lessonId={lessonId}
        existingQuestionIds={
          new Set(lesson.lesson_questions.map((lq) => lq.question_id))
        }
        onAdded={handleQuestionsAdded}
        onLessonUpdated={handleLessonUpdated}
      />

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
