'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { listExams, getExam } from '@/lib/api/exams';
import { addLessonQuestions, updateLesson } from '@/lib/api/courses';
import type {
  Exam,
  ExamDetail,
  Lesson,
  LessonQuestionItem,
  Question,
} from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  existingQuestionIds: Set<string>;
  onAdded: (items: LessonQuestionItem[]) => void;
  onLessonUpdated?: (lesson: Lesson) => void;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  essay: 'Tự luận',
  code: 'Lập trình',
  fill_blank: 'Điền từ',
  matching: 'Ghép đôi',
};

export function AddQuestionsDialog({
  open,
  onClose,
  courseId,
  lessonId,
  existingQuestionIds,
  onAdded,
  onLessonUpdated,
}: Props) {
  const [tab, setTab] = useState<'pick' | 'exam'>('pick');

  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examCache, setExamCache] = useState<Record<string, ExamDetail>>({});
  const loadedIds = useRef(new Set<string>());

  // ── Shared selection pool (used by both tabs) ─────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Tab 1 filter
  const [filterExamId, setFilterExamId] = useState('all');

  // Tab 2 exam picker
  const [examId2, setExamId2] = useState('');

  // Per-student random setting
  const [randomEnabled, setRandomEnabled] = useState(false);
  const [randomN, setRandomN] = useState(5);

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    listExams()
      .then(setExams)
      .catch(() => setError('Không thể tải danh sách bộ câu hỏi'))
      .finally(() => setLoadingExams(false));
  }, [open]);

  // Load exam questions for Tab 1 (all or filtered)
  useEffect(() => {
    if (!open || !exams.length) return;
    const toLoad =
      filterExamId === 'all'
        ? exams.map((e) => e.id).filter((id) => !loadedIds.current.has(id))
        : loadedIds.current.has(filterExamId)
          ? []
          : [filterExamId];
    if (!toLoad.length) return;
    Promise.all(toLoad.map((id) => getExam(id)))
      .then((details) => {
        details.forEach((d) => loadedIds.current.add(d.id));
        setExamCache((prev) => {
          const next = { ...prev };
          details.forEach((d) => {
            next[d.id] = d;
          });
          return next;
        });
      })
      .catch(() => setError('Không thể tải câu hỏi'));
  }, [open, exams, filterExamId]);

  // Load exam detail for Tab 2
  useEffect(() => {
    if (!examId2 || loadedIds.current.has(examId2)) return;
    getExam(examId2)
      .then((d) => {
        loadedIds.current.add(d.id);
        setExamCache((prev) => ({ ...prev, [d.id]: d }));
      })
      .catch(() => setError('Không thể tải bộ câu hỏi'));
  }, [examId2]);

  const loadingQ = useMemo(() => {
    if (!open || !exams.length) return false;
    if (filterExamId === 'all') return exams.some((e) => !examCache[e.id]);
    return !examCache[filterExamId];
  }, [open, exams, filterExamId, examCache]);

  const loadingExam2 = !!examId2 && !examCache[examId2];

  const examMap = useMemo(
    () => Object.fromEntries(exams.map((e) => [e.id, e.title])),
    [exams],
  );

  const questionsForTab1 = useMemo(() => {
    if (filterExamId === 'all')
      return Object.values(examCache).flatMap((d) => d.questions);
    return examCache[filterExamId]?.questions ?? [];
  }, [filterExamId, examCache]);

  const questionsForTab2 = useMemo(() => {
    if (!examId2 || !examCache[examId2]) return [];
    return examCache[examId2].questions;
  }, [examId2, examCache]);

  const toggleQ = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Tab 2 helpers: bulk select / deselect all available questions from current exam
  const available2 = questionsForTab2.filter(
    (q) => !existingQuestionIds.has(q.id),
  );
  const allExam2Selected =
    available2.length > 0 && available2.every((q) => selectedIds.has(q.id));

  const handleSelectAllFromExam = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      available2.forEach((q) => next.add(q.id));
      return next;
    });
  };

  const handleDeselectAllFromExam = () => {
    const examQIds = new Set(questionsForTab2.map((q) => q.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      examQIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const confirm = async () => {
    if (!selectedIds.size) return;
    setAdding(true);
    setError(null);
    try {
      const result = await addLessonQuestions(courseId, lessonId, [
        ...selectedIds,
      ]);
      onAdded(result);
      if (randomEnabled && randomN > 0 && onLessonUpdated) {
        const updatedLesson = await updateLesson(courseId, lessonId, {
          random_question_count: randomN,
        });
        onLessonUpdated(updatedLesson);
      }
      handleClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setTab('pick');
    setFilterExamId('all');
    setSelectedIds(new Set());
    setRandomEnabled(false);
    setRandomN(5);
    setExamId2('');
    setError(null);
    setLoadingExams(true);
    onClose();
  };

  if (!open) return null;

  const renderQuestionList = (qs: Question[], showExamBadge: boolean) => {
    if (!qs.length)
      return (
        <p className="py-10 text-center text-sm text-gray-400">
          Không có câu hỏi
        </p>
      );
    return (
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {qs.map((q) => {
          const already = existingQuestionIds.has(q.id);
          const checked = selectedIds.has(q.id);
          return (
            <li
              key={q.id}
              onClick={() => !already && toggleQ(q.id)}
              className={`flex items-start gap-3 px-5 py-3 text-sm ${
                already
                  ? 'opacity-50'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <input
                type="checkbox"
                checked={already || checked}
                disabled={already}
                onChange={() => !already && toggleQ(q.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-gray-800 dark:text-gray-200">
                  {q.content}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {TYPE_LABELS[q.type] ?? q.type}
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    {q.points}đ
                  </span>
                  {showExamBadge && examMap[q.exam_id] && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {examMap[q.exam_id]}
                    </span>
                  )}
                  {already && (
                    <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                      Đã thêm
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Thêm câu hỏi từ thư viện
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
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
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-gray-100 dark:border-gray-700">
          {(['pick', 'exam'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t === 'pick' ? 'Chọn từng câu' : 'Cả bộ câu hỏi'}
            </button>
          ))}
        </div>

        {error && (
          <div className="shrink-0 bg-red-50 px-5 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Tab 1: Chọn từng câu ── */}
        {tab === 'pick' && (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <select
                value={filterExamId}
                onChange={(e) => setFilterExamId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả bộ câu hỏi</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingExams || loadingQ ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  Đang tải...
                </p>
              ) : (
                renderQuestionList(questionsForTab1, filterExamId === 'all')
              )}
            </div>
          </>
        )}

        {/* ── Tab 2: Cả bộ đề ── */}
        {tab === 'exam' && (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <select
                value={examId2}
                onChange={(e) => setExamId2(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Chọn bộ câu hỏi --</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.question_count} câu)
                  </option>
                ))}
              </select>

              {examId2 && !loadingExam2 && available2.length > 0 && (
                <div className="ml-auto flex gap-2">
                  {allExam2Selected ? (
                    <button
                      onClick={handleDeselectAllFromExam}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                    >
                      Bỏ chọn tất cả
                    </button>
                  ) : (
                    <button
                      onClick={handleSelectAllFromExam}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                    >
                      Chọn tất cả {available2.length} câu
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {!examId2 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  Chọn bộ câu hỏi để xem danh sách câu hỏi
                </p>
              ) : loadingExam2 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  Đang tải...
                </p>
              ) : (
                renderQuestionList(questionsForTab2, false)
              )}
            </div>
          </>
        )}

        {/* ── Shared footer ── */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          {selectedIds.size > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={randomEnabled}
                onChange={(e) => setRandomEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-gray-600 dark:text-gray-400">
                Mỗi học sinh thấy
              </span>
              <input
                type="number"
                min={1}
                max={selectedIds.size}
                value={randomN}
                disabled={!randomEnabled}
                onChange={(e) =>
                  setRandomN(
                    Math.min(
                      selectedIds.size,
                      Math.max(1, parseInt(e.target.value) || 1),
                    ),
                  )
                }
                className="w-14 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-600 dark:text-gray-400">
                / {selectedIds.size} câu ngẫu nhiên
              </span>
            </label>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Đã chọn {selectedIds.size} câu
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={confirm}
                disabled={adding || !selectedIds.size}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {adding ? 'Đang thêm...' : `Thêm ${selectedIds.size} câu`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
