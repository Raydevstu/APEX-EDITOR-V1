import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-text-onAccent hover:bg-accent-hover active:bg-accent-active shadow-sm',
  secondary:
    'border border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-active shadow-sm',
  ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-active',
  danger:
    'border border-danger/30 bg-danger-soft text-danger hover:bg-danger-soft/80 active:bg-danger-soft/60',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
}

/**
 * Labeled action button. Primary = the strongest accent, used sparingly.
 * Full state coverage: hover, active (scale 0.98), focus-visible, disabled, loading.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150',
          'active:scale-[0.98]',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Spinner className="size-4" />}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
