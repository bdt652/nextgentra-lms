'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, Button } from '@nextgentra/ui';
import { LogOut } from 'lucide-react';

const navigation = [{ name: 'My Courses', href: '/', icon: null }];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b bg-white px-4 md:hidden">
        <Link href="/" className="font-semibold">
          Student Portal
        </Link>
      </div>

      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="font-semibold">
            Student Portal
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="flex h-14 items-center border-b bg-white px-6 md:static">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome back!</span>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 pt-16 md:pt-8">{children}</main>
      </div>
    </div>
  );
}
