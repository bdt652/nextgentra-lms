'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { listExams, getExam } from '@/lib/api/exams';
import { addLessonQuestions } from '@/lib/api/courses';
import type { Exam, ExamDetail, LessonQuestionItem } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  lessonId: string;
  existingQuestionIds: Set<string>;
  onAdded: (items: LessonQuestionItem[]) => void;
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
}: Props) {
  const [tab, setTab] = useState<'pick' | 'exam'>('pick');

  const [exams, setExams] = useState<Exam[]>([]);
  // Initialize true so there's no flash of empty state on first open
  const [loadingExams, setLoadingExams] = useState(true);
  const [examCache, setExamCache] = useState<Record<string, ExamDetail>>({});
  const loadedIds = useRef(new Set<string>());

  // Tab 1 state
  const [filterExamId, setFilterExamId] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [randomN, setRandomN] = useState(5);

  // Tab 2 state
  const [examId2, setExamId2] = useState('');
  const [mode2, setMode2] = useState<'all' | 'random'>('all');
  const [randomN2, setRandomN2] = useState(5);

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load exam list whenever dialog opens; setState only in callbacks
  useEffect(() => {
    if (!open) return;
    listExams()
      .then(setExams)
      .catch(() => setError('Không thể tải danh sách đề'))
      .finally(() => setLoadingExams(false));
  }, [open]);

  // Load exam details for tab 1 (all or filtered); setState only in callbacks
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

  // Load exam detail for tab 2; setState only in callbacks
  useEffect(() => {
    if (!examId2 || loadedIds.current.has(examId2)) return;
    getExam(examId2)
      .then((d) => {
        loadedIds.current.add(d.id);
        setExamCache((prev) => ({ ...prev, [d.id]: d }));
      })
      .catch(() => setError('Không thể tải đề'));
  }, [examId2]);

  // Derive loading states from cache presence (no synchronous setState in effects)
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
    if (filterExamId === 'all') {
      return Object.values(examCache).flatMap((d) => d.questions);
    }
    return examCache[filterExamId]?.questions ?? [];
  }, [filterExamId, examCache]);

  const toggleQ = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleRandom = () => {
    const pool = questionsForTab1.filter(
      (q) => !existingQuestionIds.has(q.id) && !selectedIds.has(q.id),
    );
    const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, randomN);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      picks.forEach((q) => next.add(q.id));
      return next;
    });
  };

  const confirm1 = async () => {
    if (!selectedIds.size) return;
    setAdding(true);
    setError(null);
    try {
      const result = await addLessonQuestions(courseId, lessonId, [
        ...selectedIds,
      ]);
      onAdded(result);
      handleClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const confirm2 = async () => {
    const detail = examCache[examId2];
    if (!detail) return;
    setAdding(true);
    setError(null);
    try {
      const available = detail.questions.filter(
        (q) => !existingQuestionIds.has(q.id),
      );
      const ids =
        mode2 === 'all'
          ? available.map((q) => q.id)
          : [...available]
              .sort(() => Math.random() - 0.5)
              .slice(0, Math.min(randomN2, available.length))
              .map((q) => q.id);
      if (!ids.length) {
        setError('Tất cả câu hỏi trong đề này đã được thêm');
        return;
      }
      const result = await addLessonQuestions(courseId, lessonId, ids);
      onAdded(result);
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
    setRandomN(5);
    setExamId2('');
    setMode2('all');
    setRandomN2(5);
    setError(null);
    // Reset loading so next open shows the spinner while re-fetching
    setLoadingExams(true);
    onClose();
  };

  if (!open) return null;

  const detail2 = examCache[examId2];
  const available2 =
    detail2?.questions.filter((q) => !existingQuestionIds.has(q.id)) ?? [];
  const totalPts2 = available2.reduce((s, q) => s + q.points, 0);

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
              {t === 'pick' ? 'Chọn từng câu' : 'Cả bộ đề'}
            </button>
          ))}
        </div>

        {error && (
          <div className="shrink-0 bg-red-50 px-5 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Tab 1: Pick questions ── */}
        {tab === 'pick' && (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
              <select
                value={filterExamId}
                onChange={(e) => {
                  setFilterExamId(e.target.value);
                  setSelectedIds(new Set());
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tất cả đề</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">Ngẫu nhiên</span>
                <input
                  type="number"
                  min={1}
                  value={randomN}
                  onChange={(e) =>
                    setRandomN(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <span className="text-xs text-gray-500">câu</span>
                <button
                  onClick={handleRandom}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                >
                  Lấy ngẫu nhiên
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingExams || loadingQ ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  Đang tải...
                </p>
              ) : questionsForTab1.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  Không có câu hỏi
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {questionsForTab1.map((q) => {
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
                            {filterExamId === 'all' && examMap[q.exam_id] && (
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
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-700">
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
                  onClick={confirm1}
                  disabled={adding || !selectedIds.size}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {adding ? 'Đang thêm...' : `Thêm ${selectedIds.size} câu`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Tab 2: Whole exam ── */}
        {tab === 'exam' && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chọn bộ đề
                </label>
                <select
                  value={examId2}
                  onChange={(e) => setExamId2(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Chọn bộ đề --</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.question_count} câu)
                    </option>
                  ))}
                </select>
              </div>

              {examId2 &&
                (loadingExam2 ? (
                  <p className="text-sm text-gray-400">Đang tải đề...</p>
                ) : (
                  detail2 && (
                    <>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {detail2.title}
                        </p>
                        <div className="mt-2 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {available2.length} câu chưa thêm /{' '}
                            {detail2.questions.length} câu
                          </span>
                          {totalPts2 > 0 && <span>Tổng {totalPts2}đ</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-600">
                          <input
                            type="radio"
                            name="mode2"
                            value="all"
                            checked={mode2 === 'all'}
                            onChange={() => setMode2('all')}
                            className="mt-0.5 h-4 w-4 text-emerald-600"
                          />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              Thêm tất cả
                            </p>
                            <p className="text-xs text-gray-500">
                              Thêm {available2.length} câu chưa có trong bài học
                            </p>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-600">
                          <input
                            type="radio"
                            name="mode2"
                            value="random"
                            checked={mode2 === 'random'}
                            onChange={() => setMode2('random')}
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                          />
                          <div className="flex flex-1 flex-wrap items-center gap-2">
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                Ngẫu nhiên
                              </p>
                              <p className="text-xs text-gray-500">
                                Lấy N câu ngẫu nhiên từ đề
                              </p>
                            </div>
                            {mode2 === 'random' && (
                              <div className="ml-auto flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={available2.length || 1}
                                  value={randomN2}
                                  onChange={(e) =>
                                    setRandomN2(
                                      Math.max(
                                        1,
                                        Math.min(
                                          available2.length || 1,
                                          parseInt(e.target.value) || 1,
                                        ),
                                      ),
                                    )
                                  }
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <span className="text-xs text-gray-500">
                                  / {available2.length} câu
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </>
                  )
                ))}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={confirm2}
                disabled={adding || !examId2 || !detail2 || !available2.length}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {adding
                  ? 'Đang thêm...'
                  : mode2 === 'all'
                    ? `Thêm tất cả ${available2.length} câu`
                    : `Thêm ${Math.min(randomN2, available2.length)} câu ngẫu nhiên`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
