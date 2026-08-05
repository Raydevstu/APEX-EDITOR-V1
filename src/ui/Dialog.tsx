import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../utils/cn'
import { IconButton } from './IconButton'
import { X } from 'lucide-react'

const FOCUSABLE = 'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  titleId: string
  icon?: ReactNode
  children: ReactNode
  /** 'center' for modals, 'right' for the drawer, 'top' for the palette */
  placement?: 'center' | 'right' | 'top'
  maxWidth?: string
  closeLabel?: string
}

/**
 * Single overlay shell for all ApexPad dialogs. Entrance/exit use the
 * tokenized CSS keyframes (transform + opacity only, per motion.md), with
 * `prefers-reduced-motion` handled by the theme. Owns focus trap + focus
 * return via the existing focus-management pattern.
 */
export function Dialog({
  open,
  onClose,
  title,
  titleId,
  icon,
  children,
  placement = 'center',
  maxWidth = 'max-w-lg',
  closeLabel = 'Close',
}: DialogProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const index = focusable.indexOf(document.activeElement as HTMLElement)
      event.preventDefault()
      focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const placementClass =
    placement === 'right'
      ? 'justify-start rounded-r-none'
      : placement === 'top'
        ? 'items-start pt-20'
        : 'items-center justify-center'

  const panelClass =
    placement === 'right'
      ? 'h-full max-h-full w-full max-w-80 rounded-l-2xl border-y border-l border-border bg-surface shadow-lg animate-slide-in-right'
      : placement === 'top'
        ? 'w-full rounded-xl border border-border bg-surface shadow-lg animate-slide-in-up'
        : cn('w-full rounded-xl border border-border bg-surface shadow-lg animate-scale-in', maxWidth)

  return (
    <div
      className={cn('fixed inset-0 z-modal flex bg-canvas/60 p-0 backdrop-blur-sm animate-fade-in', placementClass)}
      onMouseDown={placement !== 'top' ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <section
        ref={dialogRef}
        role="document"
        onMouseDown={(event) => event.stopPropagation()}
        className={cn('overflow-hidden', placement === 'center' && 'p-5', placement === 'right' ? '' : '', panelClass)}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-text-primary">
            {icon}
            {title}
          </h2>
          <IconButton label={closeLabel} icon={X} size="sm" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  )
}
