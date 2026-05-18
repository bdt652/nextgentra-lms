'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store/authStore';
import type { AuthState } from '@/lib/store/authStore';

export default function Home() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const access_token = useAuthStore((state: AuthState) => state.access_token);

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(access_token ? '/classes' : '/login');
  }, [hasHydrated, access_token, router]);

  return null;
}
