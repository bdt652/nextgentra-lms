import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@nextgentra/ui';
import TeacherLayout from './teacher-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Teacher Portal - NextGenTra LMS',
  description: 'Teacher portal for managing courses and students',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'min-h-screen bg-background')}>
        <TeacherLayout>{children}</TeacherLayout>
      </body>
    </html>
  );
}
