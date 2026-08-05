import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])'

/**
 * Modal focus management shared by all overlay surfaces: focuses the first
 * focusable element on mount, traps Tab/Shift+Tab inside the dialog, closes on
 * Escape, and restores focus to the opener on unmount.
 */
export function useModalFocus(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
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
  }, [onClose])

  return dialogRef
}
