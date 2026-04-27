'use client';

import type { ReactNode } from 'react';
import StudentLayout from '../student-layout';

export default function StudentRouteGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <StudentLayout>{children}</StudentLayout>;
}
