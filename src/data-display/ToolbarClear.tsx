import { Button } from '../ui/button'

/**
 * `Clear N` — the toolbar's reset (§17.3). It exists only while a filter is on,
 * says how many are on, and names in its title every axis it resets. It must
 * end the `filtered` state: reset **every** axis that can empty the list, not
 * only the one that did (§17.1-7).
 */
export function ToolbarClear({ resets, onClear }: { resets: readonly string[]; onClear: () => void }) {
  if (resets.length === 0) return null
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClear} title={`Resets ${resets.join(' · ')}`}>
      Clear {resets.length}
    </Button>
  )
}
