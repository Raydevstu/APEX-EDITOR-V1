import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>
  size?: 'sm' | 'md'
  active?: boolean
}

/**
 * Icon-only action button. 32px visual, but the hit area expands to at
 * least 44x44 on coarse pointers. Hover/focus/active states via CSS.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon: Icon, size = 'md', active = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={props.title ?? label}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150',
          'before:absolute before:-inset-1.5 before:rounded-lg before:content-[""]', // 44px+ hit area on coarse pointers
          'active:scale-95',
          'touch-manipulation',
          size === 'md' ? 'size-8' : 'size-7',
          active
            ? 'bg-accent-soft text-accent-contrast'
            : 'text-text-muted hover:bg-surface-hover hover:text-text-primary',
          className,
        )}
        {...props}
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
