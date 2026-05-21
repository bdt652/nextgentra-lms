'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/hooks/usePermission';
import { useAuthStore } from '@/lib/store/authStore';
import { logoutTeacher } from '@/lib/api/auth';
import { clearAuthCookies } from '@/lib/utils/authCookies';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission: string | null;
  sublevel?: boolean;
}

interface TeacherInfo {
  name?: string | null;
  role?: string | null;
}

interface SidebarProps {
  teacher: TeacherInfo | null | undefined;
  pathname: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

const MAIN_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tổng quan',
    icon: <HomeIcon />,
    permission: null,
  },
  {
    href: '/courses',
    label: 'Khóa học',
    icon: <BookOpenIcon />,
    permission: 'course:read',
  },
  {
    href: '/exams',
    label: 'Thư viện câu hỏi',
    icon: <FileTextIcon />,
    permission: 'exam:read',
  },
  {
    href: '/classes',
    label: 'Lớp học',
    icon: <UsersIcon />,
    permission: 'class:read',
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Quản trị',
    icon: <ShieldIcon />,
    permission: 'admin:access',
  },
  {
    href: '/admin/teachers',
    label: 'Giáo viên',
    icon: <ClipboardIcon />,
    permission: 'admin:access',
    sublevel: true,
  },
  {
    href: '/admin/students',
    label: 'Học sinh',
    icon: <ClipboardIcon />,
    permission: 'admin:access',
    sublevel: true,
  },
  {
    href: '/admin/roles',
    label: 'Roles & Permissions',
    icon: <PlusIcon />,
    permission: 'admin:access',
    sublevel: true,
  },
];

function NavLink({
  item,
  currentPath,
  onClick,
}: {
  item: NavItem;
  currentPath: string;
  onClick?: () => void;
}) {
  const hasPermission = usePermission(item.permission ?? '');
  if (item.permission && !hasPermission) return null;

  const isActive =
    currentPath === item.href ||
    (item.href !== '/dashboard' && currentPath.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
        item.sublevel ? 'ml-4 text-xs' : 'text-sm font-medium'
      } ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function AdminNavSection({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick?: () => void;
}) {
  const hasAdmin = usePermission('admin:access');
  if (!hasAdmin) return null;
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Administrator
      </p>
      {ADMIN_NAV.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          currentPath={pathname}
          onClick={onNavClick}
        />
      ))}
    </div>
  );
}

export function Sidebar({
  teacher,
  pathname,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const refresh_token = useAuthStore((s) => s.refresh_token);

  const handleLogout = async () => {
    try {
      if (refresh_token) {
        await logoutTeacher(refresh_token);
      }
    } finally {
      clearAuthCookies();
      logout();
      router.push('/login');
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`flex flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              NextGenTra LMS
            </span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 md:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                currentPath={pathname}
                onClick={onMobileClose}
              />
            ))}
          </div>
        </nav>

        {/* Bottom section: admin + profile + logout */}
        <div className="shrink-0 border-t border-gray-200 px-3 pb-3 pt-2 dark:border-gray-700">
          <AdminNavSection pathname={pathname} onNavClick={onMobileClose} />

          {/* Teacher profile */}
          <div className="mt-3 flex items-center gap-3 rounded-lg px-1 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {teacher?.name?.charAt(0).toUpperCase() ?? 'T'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {teacher?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {teacher?.role ?? 'Giáo viên'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
