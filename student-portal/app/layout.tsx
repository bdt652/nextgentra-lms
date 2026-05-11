import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { initSentry } from '@/sentry.client.config';
import ErrorBoundary from '@/app/error';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NextGenTra LMS - Student Portal',
  description: 'Student Learning Management System Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize Sentry on client-side (only runs in browser)
  if (typeof window !== 'undefined') {
    initSentry();
  }

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ErrorBoundary
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem',
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '2rem',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  textAlign: 'center',
                }}
              >
                <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
                  Không thể tải trang
                </h2>
                <p>Vui lòng tải lại trang hoặc liên hệ hỗ trợ.</p>
              </div>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
