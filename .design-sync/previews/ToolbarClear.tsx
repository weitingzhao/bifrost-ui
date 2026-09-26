import { FilterBar, ToolbarClear } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** `Clear N` exists only while a filter is on. It counts the axes it resets
    and names them in its title — and it resets every axis that can empty the
    list, not only the one that did. With nothing on, it renders nothing. */
export const InAFilterBar = () => (
  <Surface>
    <FilterBar aria-label="Screener filters">
      <FilterBar.Label>Filters</FilterBar.Label>
      <span className="text-dense-body">IV rank ≥ 40 · DTE 21–45 · Sector: Semis</span>
      <ToolbarClear resets={['IV rank', 'DTE', 'Sector']} onClear={() => {}} />
      <FilterBar.Meta>0 of 575 symbols</FilterBar.Meta>
    </FilterBar>
  </Surface>
)
