'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';
import { useState, useSyncExternalStore } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  FileCode,
  Quote,
  Eye,
  EyeOff,
} from 'lucide-react';
import { RichTextRenderer } from './RichTextRenderer';

const lowlight = createLowlight(common);

const noopSubscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  compact?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight,
  compact = false,
}: Props) {
  const resolvedPlaceholder =
    placeholder ??
    (compact
      ? 'Nhập đáp án... ($LaTeX$ được hỗ trợ)'
      : 'Nhập nội dung câu hỏi... (**bold**, *italic*, `code`, $LaTeX$, ```mermaid)');
  const resolvedMinHeight = minHeight ?? (compact ? '36px' : '140px');
  const isClient = useIsClient();
  const [preview, setPreview] = useState(false);
  const [markdown, setMarkdown] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
      Placeholder.configure({ placeholder: resolvedPlaceholder }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    onUpdate({ editor }) {
      // tiptap-markdown stores getMarkdown in editor.storage.markdown
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as any).markdown.getMarkdown() as string;
      setMarkdown(md);
      onChange(md);
    },
  });

  if (!isClient) {
    return (
      <div
        className="animate-pulse rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
        style={{ minHeight: resolvedMinHeight }}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 p-1.5 dark:border-gray-600 dark:bg-gray-750">
        <ToolBtn
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="In đậm (Ctrl+B)"
          disabled={preview}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="In nghiêng (Ctrl+I)"
          disabled={preview}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive('underline')}
          title="Gạch chân (Ctrl+U)"
          disabled={preview}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        {!compact && (
          <>
            <Divider />
            <ToolBtn
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              active={editor?.isActive('heading', { level: 1 })}
              title="Tiêu đề lớn"
              disabled={preview}
            >
              <Heading1 className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor?.isActive('heading', { level: 2 })}
              title="Tiêu đề vừa"
              disabled={preview}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolBtn>

            <Divider />

            <ToolBtn
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title="Danh sách"
              disabled={preview}
            >
              <List className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title="Danh sách số"
              disabled={preview}
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolBtn>
          </>
        )}

        <Divider />

        <ToolBtn
          onClick={() => editor?.chain().focus().toggleCode().run()}
          active={editor?.isActive('code')}
          title="Code inline"
          disabled={preview}
        >
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>

        {!compact && (
          <>
            <ToolBtn
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              active={editor?.isActive('codeBlock')}
              title="Code block (thêm 'mermaid' để vẽ sơ đồ)"
              disabled={preview}
            >
              <FileCode className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              title="Trích dẫn"
              disabled={preview}
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolBtn>
          </>
        )}

        {/* Math hint button — inserts $formula$ placeholder */}
        <ToolBtn
          onClick={() => {
            if (!editor) return;
            editor.chain().focus().insertContent('$formula$').run();
          }}
          title="Chèn công thức LaTeX ($formula$)"
          disabled={preview}
        >
          <span className="text-xs font-bold leading-none">∑</span>
        </ToolBtn>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          title={
            preview
              ? 'Quay lại soạn thảo'
              : 'Xem trước (render LaTeX, Mermaid...)'
          }
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            preview
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200'
          }`}
        >
          {preview ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              Sửa
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </>
          )}
        </button>
      </div>

      {/* Editor / Preview pane */}
      {preview ? (
        <div
          className="px-3 py-2 dark:bg-gray-700"
          style={{ minHeight: resolvedMinHeight }}
        >
          {markdown.trim() ? (
            <RichTextRenderer content={markdown} className="text-sm" />
          ) : (
            <p className="text-sm text-gray-400">
              Chưa có nội dung để xem trước.
            </p>
          )}
        </div>
      ) : (
        <div
          className="cursor-text px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          style={{ minHeight: resolvedMinHeight }}
          onClick={() => editor?.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      title={title}
      disabled={disabled}
      className={`rounded p-1.5 transition-colors disabled:cursor-default disabled:opacity-40 ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="mx-0.5 h-4 w-px self-center bg-gray-200 dark:bg-gray-600" />
  );
}
