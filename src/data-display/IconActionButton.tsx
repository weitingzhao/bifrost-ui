import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import { Button } from '../ui/button'

interface IconActionBase {
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
  className?: string
}

/** A ghost icon button for a row or a toolbar action. */
export interface IconActionButtonDefaultProps extends IconActionBase {
  variant?: 'default'
  title: string
  ariaLabel: string
  tone?: 'default' | 'danger' | 'warn'
  size?: 'dense' | 'icon'
  children: ReactNode
}

/**
 * The one close (0.10.0, Trade design Rev .151 · `data-sr-close`): round 22,
 * ink 7% fill, mute ink; hover ink 16% and full ink. `size="sm"` is the 16px
 * remove inside a chip. The ✕ and the "Close" label are the defaults.
 */
export interface IconActionButtonCloseProps extends IconActionBase {
  variant: 'close'
  title?: string
  ariaLabel?: string
  size?: 'md' | 'sm'
  children?: ReactNode
}

export type IconActionButtonProps = IconActionButtonDefaultProps | IconActionButtonCloseProps

export function IconActionButton(props: IconActionButtonProps) {
  if (props.variant === 'close') {
    const { onClick, disabled, className, title, ariaLabel, size = 'md', children } = props
    return (
      <button
        type="button"
        data-sr-close={size === 'sm' ? 'sm' : ''}
        title={title ?? ariaLabel ?? 'Close'}
        aria-label={ariaLabel ?? title ?? 'Close'}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {children ?? <XIcon aria-hidden />}
      </button>
    )
  }
  const { onClick, title, ariaLabel, tone = 'default', size = 'dense', disabled, children, className } = props
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        size === 'dense' && 'h-7 w-7',
        tone === 'danger' && 'text-destructive hover:text-destructive',
        tone === 'warn' && 'text-amber-600 dark:text-amber-400 hover:text-amber-600',
        className,
      )}
    >
      {children}
    </Button>
  )
}
