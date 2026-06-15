/**
 * BifrostLogo — shared app mark for Trade & Ops consoles.
 */

import { cn } from '../lib/cn'

interface BifrostLogoMarkProps {
  size?: number
  className?: string
  /** Accessible label (default: Bifrost Trade logo) */
  productLabel?: string
}

export function BifrostLogoMark({
  size = 28,
  className,
  productLabel = 'Bifrost Trade logo',
}: BifrostLogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={productLabel}
    >
      <defs>
        <filter id="bf-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="bf-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#a3e635" stopOpacity="1" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="30" height="30" rx="8" fill="#111720" />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="none"
        stroke="#2a313c"
        strokeWidth="0.75"
      />

      <path
        d="M4.5 22.5 Q16 3.5 27.5 22.5"
        stroke="url(#bf-arc-grad)"
        strokeWidth="2.4"
        strokeLinecap="round"
        filter="url(#bf-glow)"
      />

      <path
        d="M8 22.5 Q16 10 24 22.5"
        stroke="#a3e635"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.38"
      />

      <path
        d="M10.5 28 L16 22.5 L21.5 28"
        stroke="url(#bf-arc-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="16" cy="22.5" r="1.5" fill="#a3e635" filter="url(#bf-glow)" />
    </svg>
  )
}

/** Full lockup: mark + wordmark, for expanded sidebar header */
export function BifrostLogoFull({
  className,
  productSubtitle = 'Trade',
  badge,
  productLabel = 'Bifrost Trade logo',
}: {
  className?: string
  /** Small uppercase subtitle under "Bifrost" (default Trade) */
  productSubtitle?: string
  /** Optional pill badge beside the wordmark (e.g. Ops) */
  badge?: string
  productLabel?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BifrostLogoMark size={30} productLabel={productLabel} />
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold tracking-tight text-sidebar-primary">
            Bifrost
          </span>
          {badge != null && badge !== '' && (
            <span className="rounded bg-sidebar-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-primary">
              {badge}
            </span>
          )}
        </div>
        {productSubtitle !== '' && (
          <span className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
            {productSubtitle}
          </span>
        )}
      </div>
    </div>
  )
}
