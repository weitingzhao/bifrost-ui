import { CalendarGrid, CalendarNav, formatMonthLabel, formatWeekLabel, isoAddDays, isoDow, shiftIsoMonth, type CalendarDayContext } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

// A fixture month in the shape the Calendar page passes in. The grid holds no
// data: the page says what a day shows, and today shows both what happened and
// what is coming (Owner #19).
const TODAY = '2026-09-11'
const PNL: Record<string, number> = { '2026-09-01': 420, '2026-09-02': -310, '2026-09-03': 1180, '2026-09-04': 260, '2026-09-08': -740, '2026-09-09': 95, '2026-09-10': 1610, '2026-09-11': 140 }
const PAST: Record<string, string[]> = {
  '2026-09-01': ['2 fills'],
  '2026-09-03': ['4 fills', '2 decisions', '1 note'],
  '2026-09-08': ['3 fills', '2 notes'],
  '2026-09-10': ['2 fills', '3 decisions', '1 note'],
  '2026-09-11': ['1 fill'],
}
const COMING: Record<string, [string, string][]> = {
  '2026-09-11': [['Inbox · 1 expires', 'var(--sk-mute2, #98a2b0)']],
  '2026-09-15': [['CPI', 'var(--sk-ink, var(--foreground))']],
  '2026-09-17': [['FOMC', 'var(--sk-ink, var(--foreground))'], ['AVGO earnings', 'var(--sk-ticker)']],
  '2026-09-18': [['OPEX', 'var(--sk-contract)'], ['SMCI 2 legs', 'var(--sk-contract)'], ['H-121 settles', 'var(--sk-mute2, #98a2b0)'], ['PFF ex-div', 'var(--sk-ticker)']],
  '2026-09-24': [['CRWD earnings (est.)', 'var(--sk-ticker)']],
  '2026-09-25': [['COIN 210P', 'var(--sk-contract)'], ['PFF ex-div', 'var(--sk-ticker)']],
}
const money = (v: number) => (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toLocaleString('en-US')
const CAP = 3

function cellLines(ctx: CalendarDayContext) {
  const lines: [string, string][] = []
  if (ctx.tense !== 'future') for (const t of PAST[ctx.date] ?? []) lines.push([t, 'var(--sk-soft, var(--foreground))'])
  if (ctx.tense !== 'past') lines.push(...(COMING[ctx.date] ?? []))
  const shown = lines.slice(0, CAP)
  return (
    <>
      {shown.map(([t, c]) => (
        <span key={t} className="truncate text-dense-meta" style={{ color: c, lineHeight: '16px' }}>
          {t}
        </span>
      ))}
      {lines.length > CAP ? (
        <span className="text-dense-meta text-muted-foreground" style={{ lineHeight: '16px' }}>
          +{lines.length - CAP} more
        </span>
      ) : null}
    </>
  )
}

const corner = (ctx: CalendarDayContext) => {
  const v = ctx.tense === 'future' ? null : PNL[ctx.date]
  return v == null ? null : <span className={v >= 0 ? 'text-profit' : 'text-loss'}>{money(v)}</span>
}

/** The month (§17.9): Monday first, weekdays only; today has the accent
    outline, the selected day an ink 9% fill; a closed market says so and draws
    nothing. ← → ↑ ↓ T [ ] Enter work once the grid has focus. */
export const Month = () => {
  const [month, setMonth] = useState('2026-09')
  const [sel, setSel] = useState<string | null>(TODAY)
  return (
    <Surface>
      <div className="flex flex-col gap-2">
        <CalendarNav
          label={formatMonthLabel(month)}
          onPrev={() => setMonth(shiftIsoMonth(month, -1))}
          onNext={() => setMonth(shiftIsoMonth(month, 1))}
          onToday={() => {
            setMonth(TODAY.slice(0, 7))
            setSel(TODAY)
          }}
        />
        <CalendarGrid
          month={month}
          today={TODAY}
          selected={sel}
          onSelect={setSel}
          onMonthChange={setMonth}
          holidays={{ '2026-09-07': 'Labor Day' }}
          renderCell={cellLines}
          renderCorner={corner}
          cellTone={(ctx) => (ctx.date === '2026-09-08' ? 'warn' : null)}
          aria-label="Calendar · September 2026"
        />
      </div>
    </Surface>
  )
}

/** Today on a weekend gets its own column (Owner #19), and so does a weekend
    day with something on it. Here today is Sunday 4 October. */
export const WeekendToday = () => (
  <Surface>
    <CalendarGrid
      month="2026-10"
      today="2026-10-04"
      selected="2026-10-04"
      renderCell={(ctx) =>
        ctx.date === '2026-10-04' ? (
          <span className="truncate text-dense-meta text-muted-foreground">Nothing dated today</span>
        ) : ctx.date === '2026-10-14' ? (
          <span className="truncate text-dense-meta" style={{ color: 'var(--sk-ink, var(--foreground))' }}>
            CPI
          </span>
        ) : null
      }
      cellMinHeight={72}
      aria-label="Calendar · October 2026"
    />
  </Surface>
)

/** The week span: the selected day's week, tall cells with the date written
    out. The page writes the full text by layer. */
export const Week = () => {
  const [sel, setSel] = useState<string | null>('2026-09-17')
  const mon = isoAddDays(sel ?? TODAY, -((isoDow(sel ?? TODAY) + 6) % 7))
  return (
    <Surface>
      <div className="flex flex-col gap-2">
        <span className="text-dense-label font-semibold">{formatWeekLabel(mon, isoAddDays(mon, 4))}</span>
        <CalendarGrid
          span="week"
          month={(sel ?? TODAY).slice(0, 7)}
          today={TODAY}
          selected={sel}
          onSelect={setSel}
          cellMinHeight={180}
          renderCorner={corner}
          renderCell={(ctx) => (
            <div className="flex flex-col gap-1 pt-1">
              {(COMING[ctx.date] ?? []).map(([t, c]) => (
                <span key={t} className="text-dense-meta" style={{ color: c }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        />
      </div>
    </Surface>
  )
}
