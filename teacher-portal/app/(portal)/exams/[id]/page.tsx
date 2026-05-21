'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePermission } from '@/lib/hooks/usePermission';
import {
  getExam,
  updateExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/lib/api/exams';
import { importQuestions, type QuestionImportRow } from '@/lib/api/import';
import type { ExamDetail, Question, QuestionType } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';
import { RichTextEditor } from '@/components/RichTextEditor';
import { RichTextRenderer } from '@/components/RichTextRenderer';
import {
  ImportDialog,
  type ImportColumn,
} from '@/components/common/ImportDialog';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  essay: 'Tự luận',
  code: 'Code',
  fill_blank: 'Điền từ',
  matching: 'Nối cặp',
};

interface McOption {
  id: string;
  text: string;
  is_correct: boolean;
}

function QuestionForm({
  onSubmit,
  onCancel,
  initial,
}: {
  onSubmit: (data: Partial<Question>) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<Question>;
}) {
  const [type, setType] = useState<QuestionType>(
    initial?.type ?? 'multiple_choice',
  );
  const [content, setContent] = useState(initial?.content ?? '');
  const [points, setPoints] = useState(String(initial?.points ?? 1));
  const [correctAnswer, setCorrectAnswer] = useState(
    initial?.correct_answer ?? '',
  );
  const [codeTemplate, setCodeTemplate] = useState(
    initial?.code_template ?? '',
  );
  const [testCases, setTestCases] = useState(
    initial?.test_cases ? JSON.stringify(initial.test_cases, null, 2) : '',
  );
  const [mcOptions, setMcOptions] = useState<McOption[]>(
    Array.isArray(initial?.options as McOption[] | undefined)
      ? (initial!.options as McOption[])
      : [
          { id: 'A', text: '', is_correct: false },
          { id: 'B', text: '', is_correct: false },
          { id: 'C', text: '', is_correct: false },
          { id: 'D', text: '', is_correct: false },
        ],
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let options: unknown = undefined;
      let correct: string | undefined = undefined;

      if (type === 'multiple_choice') {
        options = mcOptions;
        correct = mcOptions.find((o) => o.is_correct)?.id;
      } else if (type === 'true_false') {
        correct = correctAnswer || 'true';
      } else if (type === 'fill_blank') {
        correct = correctAnswer;
      } else if (type === 'matching') {
        try {
          options = JSON.parse(testCases || '[]');
        } catch {
          options = [];
        }
      }

      await onSubmit({
        content: content.trim(),
        type,
        options,
        correct_answer: correct,
        code_template: type === 'code' ? codeTemplate : undefined,
        test_cases:
          type === 'code'
            ? (() => {
                try {
                  return JSON.parse(testCases || '[]');
                } catch {
                  return [];
                }
              })()
            : undefined,
        points: parseFloat(points) || 1,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Loại câu hỏi
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Điểm
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min="0.1"
            step="0.1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Nội dung câu hỏi
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Nhập nội dung câu hỏi... (**bold**, *italic*, $LaTeX$, ```mermaid)"
          minHeight="140px"
        />
      </div>

      {type === 'multiple_choice' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Đáp án (chọn đáp án đúng)
          </label>
          {mcOptions.map((opt, i) => (
            <div key={opt.id ?? i} className="flex items-start gap-2">
              <input
                type="radio"
                name="correct"
                checked={opt.is_correct}
                onChange={() =>
                  setMcOptions((prev) =>
                    prev.map((o, j) => ({ ...o, is_correct: j === i })),
                  )
                }
                className="mt-2 h-4 w-4 text-emerald-600"
              />
              <span className="mt-1.5 w-6 text-xs font-bold text-gray-500">
                {opt.id}.
              </span>
              <div className="flex-1">
                <RichTextEditor
                  compact
                  value={opt.text}
                  onChange={(v) =>
                    setMcOptions((prev) =>
                      prev.map((o, j) => (j === i ? { ...o, text: v } : o)),
                    )
                  }
                  placeholder={`Đáp án ${opt.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'true_false' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Đáp án đúng
          </label>
          <select
            value={correctAnswer || 'true'}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="true">Đúng</option>
            <option value="false">Sai</option>
          </select>
        </div>
      )}

      {type === 'fill_blank' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Đáp án (dùng ___ trong nội dung cho chỗ trống)
          </label>
          <input
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="Đáp án đúng..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {type === 'code' && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Code mẫu (template)
            </label>
            <textarea
              value={codeTemplate}
              onChange={(e) => setCodeTemplate(e.target.value)}
              rows={5}
              placeholder={
                'def solution(n):\n    # Viết code tại đây\n    pass'
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Test cases (JSON array)
            </label>
            <textarea
              value={testCases}
              onChange={(e) => setTestCases(e.target.value)}
              rows={4}
              placeholder='[{"input": "5", "expected": "120"}]'
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </>
      )}

      {type === 'matching' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {`Cặp nối (JSON array: [{left, right}])`}
          </label>
          <textarea
            value={testCases}
            onChange={(e) => setTestCases(e.target.value)}
            rows={4}
            placeholder='[{"left": "Hà Nội", "right": "Thủ đô"}]'
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={
            saving || content.replace(/[\s\n#*_`>~-]/g, '').length === 0
          }
          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </button>
      </div>
    </form>
  );
}

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const canUpdate = usePermission('exam:update');

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [editingExam, setEditingExam] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingExam, setSavingExam] = useState(false);

  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importQuestionsOpen, setImportQuestionsOpen] = useState(false);

  const questionImportColumns: ImportColumn<QuestionImportRow>[] = [
    { key: 'content', label: 'Nội dung' },
    { key: 'type', label: 'Loại' },
    { key: 'option_a', label: 'Đáp án A' },
    { key: 'option_b', label: 'Đáp án B' },
    { key: 'option_c', label: 'Đáp án C' },
    { key: 'option_d', label: 'Đáp án D' },
    { key: 'correct_answer', label: 'Đúng' },
    { key: 'points', label: 'Điểm' },
  ];

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type });

  useEffect(() => {
    getExam(id)
      .then(setExam)
      .catch(() => showToast('Không thể tải bộ câu hỏi', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const openEditExam = () => {
    if (!exam) return;
    setEditTitle(exam.title);
    setEditDesc(exam.description ?? '');
    setEditingExam(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;
    setSavingExam(true);
    try {
      const updated = await updateExam(exam.id, {
        title: editTitle,
        description: editDesc || undefined,
      });
      setExam({ ...exam, ...updated });
      setEditingExam(false);
      showToast('Đã cập nhật bộ câu hỏi', 'success');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingExam(false);
    }
  };

  const handleAddQuestion = async (data: Partial<Question>) => {
    if (!exam) return;
    const q = await addQuestion(exam.id, {
      content: data.content!,
      type: data.type!,
      options: data.options,
      correct_answer: data.correct_answer ?? undefined,
      code_template: data.code_template ?? undefined,
      test_cases: data.test_cases,
      points: data.points,
    });
    setExam({ ...exam, questions: [...exam.questions, q] });
    setAddingQuestion(false);
    showToast('Đã thêm câu hỏi', 'success');
  };

  const handleUpdateQuestion = async (data: Partial<Question>) => {
    if (!exam || !editingQuestion) return;
    const q = await updateQuestion(exam.id, editingQuestion.id, {
      ...data,
      correct_answer: data.correct_answer ?? undefined,
      code_template: data.code_template ?? undefined,
    });
    setExam({
      ...exam,
      questions: exam.questions.map((x) => (x.id === q.id ? q : x)),
    });
    setEditingQuestion(null);
    showToast('Đã cập nhật câu hỏi', 'success');
  };

  const handleDeleteQuestion = async (q: Question) => {
    if (!exam || !confirm('Xóa câu hỏi này?')) return;
    try {
      await deleteQuestion(exam.id, q.id);
      setExam({
        ...exam,
        questions: exam.questions.filter((x) => x.id !== q.id),
      });
      showToast('Đã xóa câu hỏi', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  if (loading)
    return <div className="py-12 text-center text-gray-500">Đang tải...</div>;
  if (!exam)
    return (
      <div className="py-12 text-center text-gray-500">
        Không tìm thấy bộ câu hỏi.{' '}
        <Link href="/exams" className="text-emerald-600 hover:underline">
          Quay lại
        </Link>
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/exams" className="hover:text-gray-700">
          Thư viện câu hỏi
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {exam.title}
        </span>
      </div>

      {/* Exam header */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="mt-1 text-sm text-gray-500">{exam.description}</p>
          )}
          <div className="mt-2 flex gap-4 text-xs text-gray-400">
            <span>{exam.question_count} câu hỏi</span>
          </div>
        </div>
        {canUpdate && (
          <button
            onClick={openEditExam}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600"
          >
            Sửa thông tin
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Câu hỏi ({exam.questions.length})
          </h2>
          {canUpdate && (
            <div className="flex gap-2">
              <button
                onClick={() => setImportQuestionsOpen(true)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Nhập câu hỏi
              </button>
              <button
                onClick={() => setAddingQuestion(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                + Thêm câu hỏi
              </button>
            </div>
          )}
        </div>

        {exam.questions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Chưa có câu hỏi nào
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {exam.questions.map((q, idx) => (
              <li key={q.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 shrink-0 text-center text-xs font-bold text-gray-400">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <RichTextRenderer
                      content={q.content}
                      compact
                      className="text-gray-800 dark:text-gray-200"
                    />
                    <div className="mt-1 flex gap-2 text-xs text-gray-400">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </span>
                      <span>{q.points} điểm</span>
                    </div>
                  </div>
                  {canUpdate && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit exam dialog */}
      <Dialog
        open={editingExam}
        onClose={() => setEditingExam(false)}
        title="Sửa bộ câu hỏi"
        size="xl"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditingExam(false)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-exam-form"
              disabled={savingExam}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingExam ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        }
      >
        <form
          id="edit-exam-form"
          onSubmit={handleSaveExam}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên bộ câu hỏi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              autoFocus
              placeholder="Tên bộ câu hỏi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              placeholder="Mô tả"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </form>
      </Dialog>

      {/* Add question dialog */}
      <Dialog
        open={addingQuestion}
        onClose={() => setAddingQuestion(false)}
        title="Thêm câu hỏi"
        size="3xl"
      >
        <QuestionForm
          onSubmit={handleAddQuestion}
          onCancel={() => setAddingQuestion(false)}
        />
      </Dialog>

      {/* Edit question dialog */}
      <Dialog
        open={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        title="Sửa câu hỏi"
        size="3xl"
      >
        {editingQuestion && (
          <QuestionForm
            initial={editingQuestion}
            onSubmit={handleUpdateQuestion}
            onCancel={() => setEditingQuestion(null)}
          />
        )}
      </Dialog>

      <ImportDialog<QuestionImportRow>
        open={importQuestionsOpen}
        onClose={() => setImportQuestionsOpen(false)}
        title="Nhập câu hỏi từ file"
        templateHeaders={[
          'content',
          'type',
          'option_a',
          'option_b',
          'option_c',
          'option_d',
          'correct_answer',
          'points',
        ]}
        templateFilename="mau-cau-hoi.csv"
        columns={questionImportColumns}
        onImport={(rows) => importQuestions(exam.id, rows)}
        onSuccess={async (res) => {
          showToast(`Đã thêm ${res.created} câu hỏi`, 'success');
          const updated = await getExam(exam.id);
          setExam(updated);
        }}
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
