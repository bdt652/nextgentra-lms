import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-base font-medium text-white shadow-md transition-all duration-200 cursor-pointer',
          'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] active:bg-emerald-800',
          'focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:ring-offset-2 focus:bg-emerald-700',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-emerald-600 disabled:hover:shadow-md disabled:active:scale-100',
          'dark:focus:ring-emerald-500/50 dark:focus:ring-offset-0 dark:focus:bg-emerald-700',
          isLoading && 'cursor-wait',
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {children}
      </button>
    );
  },
);

AuthButton.displayName = 'AuthButton';

export { AuthButton };
