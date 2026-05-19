import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth hint cookies set by the client after successful login.
  // These are non-httpOnly UX hints — real security is enforced by the backend API.
  const authHint = request.cookies.get('teacher_auth')?.value;
  const permissionsHint = request.cookies.get('teacher_permissions')?.value;

  if (!authHint) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  if (isAdminRoute) {
    const permissions = permissionsHint ? permissionsHint.split(',') : [];
    if (!permissions.includes('admin:access')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
