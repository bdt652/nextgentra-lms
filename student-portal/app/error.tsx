'use client';

import * as Sentry from '@sentry/react';
import { NextErrorBoundary } from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Global Error Boundary for Student Portal
 *
 * This component catches JavaScript errors anywhere in the React component tree,
 * logs them to Sentry, and displays a fallback UI to the user.
 *
 * To use: Wrap your root layout with <NextErrorBoundary fallback={...}>
 * See app/layout.tsx
 */

export default NextErrorBoundary(
  ({
    error,
    reset,
    eventId,
  }: {
    error: Error;
    reset: () => void;
    eventId?: string;
  }) => {
    // Log additional context when an error occurs
    useEffect(() => {
      if (error) {
        console.error('Global error caught:', error);
        // You can add custom context here:
        // Sentry.setContext("user-context", { ... });
      }
    }, [error]);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            textAlign: 'center',
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h1
            style={{
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: '#dc2626',
            }}
          >
            Đã xảy ra lỗi
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Chúng tôi xin lỗi vì sự bất tiện này. Đội ngũ phát triển đã được
            thông báo về lỗi này.
          </p>

          {eventId && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {eventId}
            </p>
          )}

          <details
            style={{
              textAlign: 'left',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Chi tiết lỗi (development)
            </summary>
            <pre
              style={{
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#ef4444',
              }}
            >
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>

          <button
            onClick={() => {
              // Log that user tried to recover
              Sentry.captureMessage('User attempted error recovery', {
                level: 'info',
              });
              reset();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Thử lại
          </button>

          <p
            style={{
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#94a3b8',
            }}
          >
            Nếu lỗi vẫn tiếp tục, vui lòng liên hệ hỗ trợ và cung cấp Error ID ở
            trên.
          </p>
        </div>
      </div>
    );
  }
);
