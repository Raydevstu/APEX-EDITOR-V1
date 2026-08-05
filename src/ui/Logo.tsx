import { cn } from '../utils/cn'

/**
 * ApexPad brand mark: a minimal geometric "A" monogram.
 * Two straight strokes forming the apex + a solid counter — reads at
 * favicon size, scales to PWA icons. Solid accent fill, no gradient.
 */
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M16 6.5 25.5 25h-3.3L16 13.9 9.8 25H6.5L16 6.5Z"
        className="fill-text-onAccent"
      />
      <rect x="13.9" y="18.6" width="4.2" height="3.4" rx="1" className="fill-text-onAccent" />
    </svg>
  )
}
