'use client';

import { Dialog } from '@/components/Dialog';

interface EditClassDialogProps {
  open: boolean;
  onClose: () => void;
  editName: string;
  onEditNameChange: (v: string) => void;
  editDesc: string;
  onEditDescChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function EditClassDialog({
  open,
  onClose,
  editName,
  onEditNameChange,
  editDesc,
  onEditDescChange,
  onSubmit,
  saving,
}: EditClassDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Sửa lớp học"
      size="xl"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="edit-class-form"
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      }
    >
      <form id="edit-class-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên lớp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            required
            autoFocus
            placeholder="Tên lớp"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mô tả
          </label>
          <textarea
            value={editDesc}
            onChange={(e) => onEditDescChange(e.target.value)}
            rows={3}
            placeholder="Mô tả"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </form>
    </Dialog>
  );
}
