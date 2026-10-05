import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from '@bifrost/ui'

/** Sheets are glass or opaque by what they are for, so the card needs a page
    for the glass to sit over. */
function Page({ children }: { children: React.ReactNode }) {
  const rows = [
    ['NVDA', 'NOV21 170P', '−2', '4.10'],
    ['AAPL', 'NOV21 245C', '−1', '2.35'],
    ['MSFT', 'DEC19 480P', '−1', '6.80'],
    ['TSLA', 'NOV21 380P', '−1', '9.15'],
  ]
  return (
    <div className="flex h-svh flex-col gap-1 bg-background p-6 text-foreground">
      {rows.map(([s, c, q, p]) => (
        <div key={c} className="flex items-center gap-4 py-1.5 font-mono text-dense-body tabular-nums">
          <span className="w-16 font-semibold">{s}</span>
          <span className="flex-1">{c}</span>
          <span>{q}</span>
          <span className="w-16 text-right">{p}</span>
        </div>
      ))}
      {children}
    </div>
  )
}

/** `size="sm"` — viewing: float glass with the vibrancy inks, 480 wide. The
    close is the round one. */
export const ViewSheet = () => (
  <Page>
    <Dialog open>
      <DialogContent presentation="sheet" size="sm">
        <DialogHeader>
          <DialogTitle>NVDA NOV21 170P</DialogTitle>
          <DialogDescription>Opened 8 Sep at 4.10 · 2 contracts · 72 days to expiry.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  </Page>
)

/** `size="md"` — an edit form: opaque, 600 wide. Dense fields never sit on
    blur (Rev .151). Enter runs the rightmost footer button. */
export const EditSheet = () => (
  <Page>
    <Dialog open>
      <DialogContent presentation="sheet" size="md">
        <DialogHeader>
          <DialogTitle>Edit allocation</DialogTitle>
          <DialogDescription>Wheel · Host account. Changes apply from the next session.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-dense-body">
          <label className="flex flex-col gap-1">
            <span className="text-dense-meta font-semibold text-muted-foreground">Budget</span>
            <Input defaultValue="25,000" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-dense-meta font-semibold text-muted-foreground">Max per name</span>
            <Input defaultValue="5,000" />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Page>
)
