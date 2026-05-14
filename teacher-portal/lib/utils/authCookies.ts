const MAX_AGE = 7 * 24 * 60 * 60;

export function setAuthCookies(permissions: string[]): void {
  document.cookie = `teacher_auth=1; path=/; SameSite=Strict; max-age=${MAX_AGE}`;
  document.cookie = `teacher_permissions=${permissions.join(',')}; path=/; SameSite=Strict; max-age=${MAX_AGE}`;
}

export function clearAuthCookies(): void {
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `teacher_auth=; path=/; ${expired}`;
  document.cookie = `teacher_permissions=; path=/; ${expired}`;
}
