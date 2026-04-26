import { cn } from "../../utils/cn";
import type { ComponentProps } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: "default" | "outline" | "ghost" | "destructive";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Children content */
  children: React.ReactNode;
}

/**
 * Reusable button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button>Default</Button>
 * <Button variant="outline">Outline</Button>
 * <Button variant="destructive" size="lg">Large Destructive</Button>
 * ```
 */
export function Button({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
        },
        {
          "h-8 px-3 text-xs": size === "sm",
          "h-9 px-4 py-2": size === "md",
          "h-10 px-6 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type { ButtonProps };
