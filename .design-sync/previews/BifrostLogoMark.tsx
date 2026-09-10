import { BifrostLogoMark } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-6 text-foreground">{children}</div>
}

/** The app mark on its own — a rounded tile with the bifrost arc and its lit
    footing. It carries its own dark tile fill, so it holds on any ground. */
export const Default = () => (
  <Surface>
    <BifrostLogoMark />
  </Surface>
)

/** `size` is a pixel number, not a class — the SVG is drawn on a 32-unit grid
    and scales cleanly. 20px is the collapsed sidebar, 28px the default,
    48px a splash or an about panel. */
export const Sizes = () => (
  <Surface>
    <div className="flex items-end gap-6">
      {[20, 28, 40, 56].map(s => (
        <div key={s} className="flex flex-col items-center gap-2">
          <BifrostLogoMark size={s} />
          <span className="text-dense-meta text-muted-foreground">{s}px</span>
        </div>
      ))}
    </div>
  </Surface>
)

/** `productLabel` is the accessible name. Override it per console — the mark
    is shared, the product it stands for is not. */
export const LabelledPerConsole = () => (
  <Surface>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <BifrostLogoMark size={28} productLabel="Bifrost Trade logo" />
        <span className="text-dense-body text-muted-foreground">Bifrost Trade logo</span>
      </div>
      <div className="flex items-center gap-2">
        <BifrostLogoMark size={28} productLabel="Bifrost Ops logo" />
        <span className="text-dense-body text-muted-foreground">Bifrost Ops logo</span>
      </div>
    </div>
  </Surface>
)
