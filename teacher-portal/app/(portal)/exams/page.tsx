'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/hooks/usePermission';
import { listExams, createExam, deleteExam } from '@/lib/api/exams';
import type { Exam } from '@/lib/types';
import { Toast } from '@/components/Toast';
import { Dialog } from '@/components/Dialog';

export default function ExamsPage() {
  const router = useRouter();
  const canCreate = usePermission('exam:create');
  const canDelete = usePermission('exam:delete');

  const [exams, setExams] = useState<Exam[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newPassScore, setNewPassScore] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listExams(filter === 'mine')
      .then(setExams)
      .catch(() =>
        setToast({ message: 'Không thể tải danh sách đề thi', type: 'error' }),
      )
      .finally(() => setLoading(false));
  }, [filter]);

  const closeCreate = () => {
    setShowCreate(false);
    setNewTitle('');
    setNewDesc('');
    setNewDuration('');
    setNewPassScore('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const exam = await createExam({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        duration: newDuration ? parseInt(newDuration) : undefined,
        pass_score: newPassScore ? parseFloat(newPassScore) : undefined,
      });
      router.push(`/exams/${exam.id}`);
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExam(deleteTarget.id);
      setExams((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setToast({ message: 'Đã xóa đề thi', type: 'success' });
      setDeleteTarget(null);
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thư viện đề thi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý ngân hàng câu hỏi và đề thi
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Tạo đề thi
          </button>
        )}
      </div>

      <div className="mb-4 flex w-fit gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        {(['all', 'mine'] as const).map((f) => (
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
            {f === 'all' ? 'Tất cả' : 'Của tôi'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Đang tải...</div>
      ) : exams.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <p className="text-gray-500">Chưa có đề thi nào</p>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-sm text-emerald-600 hover:underline"
            >
              Tạo đề thi đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <Link
                href={`/exams/${exam.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-emerald-600 dark:text-white"
              >
                {exam.title}
              </Link>
              {exam.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {exam.description}
                </p>
              )}
              <div className="mt-2 flex gap-3 text-xs text-gray-400">
                <span>{exam.question_count} câu hỏi</span>
                {exam.duration && <span>{exam.duration} phút</span>}
                {exam.pass_score && <span>Đạt: {exam.pass_score}%</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/exams/${exam.id}`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Xem & Sửa
                </Link>
                {canDelete && (
                  <button
                    onClick={() => setDeleteTarget(exam)}
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

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Xóa đề thi"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Đang xóa...' : 'Xóa đề thi'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Bạn có chắc muốn xóa đề thi này?
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                &ldquo;{deleteTarget?.title}&rdquo;
              </p>
            </div>
          </div>

          {(deleteTarget?.question_count ?? 0) > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">
                ⚠ Thao tác này sẽ xóa vĩnh viễn toàn bộ{' '}
                <span className="font-bold">
                  {deleteTarget?.question_count} câu hỏi
                </span>{' '}
                bên trong đề thi và không thể khôi phục.
              </p>
            </div>
          )}
        </div>
      </Dialog>

      {/* Create exam dialog */}
      <Dialog
        open={showCreate}
        onClose={closeCreate}
        title="Tạo đề thi mới"
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
              form="create-exam-form"
              disabled={creating || !newTitle.trim()}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? 'Đang tạo...' : 'Tạo đề thi'}
            </button>
          </div>
        }
      >
        <form
          id="create-exam-form"
          onSubmit={handleCreate}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên đề thi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
              placeholder="Nhập tên đề thi..."
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thời gian (phút)
              </label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                min="1"
                placeholder="60"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Điểm đạt (%)
              </label>
              <input
                type="number"
                value={newPassScore}
                onChange={(e) => setNewPassScore(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                placeholder="70"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
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
