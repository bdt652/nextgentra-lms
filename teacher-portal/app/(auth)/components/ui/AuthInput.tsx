import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base shadow-sm transition-all duration-200',
            'placeholder:text-gray-400',
            'focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:shadow-md',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400',
            'dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20',
            error &&
              'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

AuthInput.displayName = 'AuthInput';

export { AuthInput };
