'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  className?: string;
  compact?: boolean;
}

export function RichTextRenderer({
  content,
  className = '',
  compact = false,
}: Props) {
  const baseText = compact ? 'text-sm' : 'text-base';

  return (
    <div className={`rich-text ${baseText} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code(props: any) {
            const { children, className: cls, ...rest } = props;
            const inline = !cls;
            const lang = /language-(\w+)/.exec(cls ?? '')?.[1];

            if (!inline && lang === 'mermaid') {
              return <MermaidBlock code={String(children).trim()} />;
            }

            if (inline) {
              return (
                <code
                  className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-700"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={`block w-full rounded-lg bg-gray-100 p-3 font-mono text-xs dark:bg-gray-900 ${cls ?? ''}`}
                {...rest}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return (
              <pre className="my-2 overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-900">
                {children}
              </pre>
            );
          },
          h1({ children }) {
            return (
              <h1 className="mb-1 mt-3 text-base font-bold text-gray-900 dark:text-white">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="mb-1 mt-2 text-sm font-bold text-gray-900 dark:text-white">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="mb-1 mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                {children}
              </h3>
            );
          },
          p({ children }) {
            return (
              <p className="my-1 leading-relaxed text-gray-800 dark:text-gray-200">
                {children}
              </p>
            );
          },
          ul({ children }) {
            return (
              <ul className="my-1 list-disc pl-5 text-gray-800 dark:text-gray-200">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="my-1 list-decimal pl-5 text-gray-800 dark:text-gray-200">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="my-0.5">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2 border-l-4 border-gray-300 pl-3 italic text-gray-500 dark:border-gray-600 dark:text-gray-400">
                {children}
              </blockquote>
            );
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-gray-900 dark:text-white">
                {children}
              </strong>
            );
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          hr() {
            return <hr className="my-3 border-gray-200 dark:border-gray-700" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const id = `mmd-${Math.random().toString(36).slice(2)}`;

    import('mermaid')
      .then((m) => {
        m.default.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
        });
        return m.default.render(id, code);
      })
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (ref.current) {
          ref.current.innerHTML = `<pre class="text-xs text-red-500 p-2">${code}</pre>`;
        }
      });
  }, [code]);

  return (
    <div
      ref={ref}
      className="my-3 flex justify-center overflow-x-auto rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
    />
  );
}
