'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, Button } from '@nextgentra/ui';
import { LogOut } from 'lucide-react';

const navigation = [{ name: 'Dashboard', href: '/', icon: null }];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-semibold">Teacher Portal</h1>
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
          <Button variant="outline" className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b bg-white px-6">
          <h2 className="text-lg font-semibold">
            {navigation.find((n) => n.href === pathname)?.name || 'Dashboard'}
          </h2>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
