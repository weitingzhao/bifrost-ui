import { Button, MiniMonth, Popover, PopoverContent, PopoverTrigger, formatDayLabel } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

// Journal's record: which days have a trail and whether the night's distill read it.
const LATEST = '2026-09-18'
const STAT: Record<string, 'done' | 'pending'> = {
  '2026-09-01': 'done', '2026-09-02': 'done', '2026-09-03': 'done', '2026-09-04': 'done', '2026-09-08': 'done',
  '2026-09-09': 'done', '2026-09-10': 'done', '2026-09-11': 'done', '2026-09-14': 'done', '2026-09-15': 'done',
  '2026-09-16': 'done', '2026-09-17': 'pending', '2026-09-18': 'done',
}
const LABELS = { done: 'distilled', pending: 'not distilled yet', none: 'nothing recorded' }

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-dense-caption text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full" style={{ width: 5, height: 5, background: 'var(--sk-soft, var(--foreground))' }} />
        distilled
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full" style={{ width: 5, height: 5, boxShadow: 'inset 0 0 0 1.2px var(--sk-warn, var(--color-lamp-yellow))' }} />
        not distilled yet
      </span>
      <span>no dot · nothing recorded</span>
    </div>
  )
}

/** Picking a day in Journal: one status dot per day, the latest day outlined,
    weekends faint and not selectable (the interim answer to the open design
    question), future days and days with no record disabled. */
export const Inline = () => {
  const [month, setMonth] = useState('2026-09')
  const [day, setDay] = useState('2026-09-17')
  return (
    <Surface>
      <MiniMonth
        month={month}
        onMonthChange={setMonth}
        selected={day}
        onSelect={setDay}
        today={LATEST}
        status={(d) => STAT[d]}
        statusLabels={LABELS}
        isDisabled={(d) => d > LATEST || !STAT[d]}
        footer={<Legend />}
      />
    </Surface>
  )
}

/** In a popover grown out of the button that opened it — the way Journal's
    toolbar uses it. Enter or Esc closes. */
export const InPopover = () => {
  const [open, setOpen] = useState(true)
  const [month, setMonth] = useState('2026-09')
  const [day, setDay] = useState('2026-09-17')
  return (
    <div className="flex bg-background p-4 text-foreground" style={{ height: 340 }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="xs">
            {formatDayLabel(day)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" style={{ width: 'auto', padding: 10 }}>
          <MiniMonth
            month={month}
            onMonthChange={setMonth}
            selected={day}
            onSelect={setDay}
            today={LATEST}
            status={(d) => STAT[d]}
            statusLabels={LABELS}
            isDisabled={(d) => d > LATEST || !STAT[d]}
            onDone={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
