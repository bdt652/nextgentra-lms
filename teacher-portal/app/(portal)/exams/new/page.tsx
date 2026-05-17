'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewExamPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/exams');
  }, [router]);
  return null;
}
