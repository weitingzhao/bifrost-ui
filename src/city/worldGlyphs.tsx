import type { ReactNode } from 'react'

/**
 * The world's glyphs (first the tech tree's, 2026-11-20; the one table for every view, 2026-11-23): plain line
 * pictures named by what they show, never by a domain (the engine knows nothing of domains). A content says which
 * glyph stands for which of its domains, once, and every view draws the same one. Each is drawn in a 16×16 box
 * with the current colour; draw it with <Glyph name>.
 */
export const GLYPHS: Record<string, ReactNode> = {
  layers: <><path d="M8 2 L14 5 L8 8 L2 5 Z" /><path d="M2 8 L8 11 L14 8" /><path d="M2 11 L8 14 L14 11" /></>,
  blueprint: <><rect x={2} y={2} width={12} height={12} rx={1} /><path d="M2 6 H14 M6 6 V14 M9 9 H12 M9 11.5 H12" /></>,
  branch: <><circle cx={4} cy={3.5} r={1.6} /><circle cx={4} cy={12.5} r={1.6} /><circle cx={12} cy={6} r={1.6} /><path d="M4 5 V11 M12 7.6 C12 10 4 9 4 11" /></>,
  shield: <><path d="M8 1.8 L13.5 4 V8 C13.5 11 11 13.4 8 14.4 C5 13.4 2.5 11 2.5 8 V4 Z" /><path d="M5.5 8 L7.3 9.8 L10.7 6.4" /></>,
  rocket: <><path d="M8 1.5 C10.8 3.5 11.5 6.5 10.6 10 H5.4 C4.5 6.5 5.2 3.5 8 1.5 Z" /><circle cx={8} cy={6} r={1.3} /><path d="M5.4 10 L3.5 12.5 L5.8 12 M10.6 10 L12.5 12.5 L10.2 12 M7 12 L8 14.5 L9 12" /></>,
  gavel: <><path d="M6.5 2.5 L10.5 6.5 M4.7 4.3 L8.7 8.3 M5.6 3.4 L9.6 7.4" /><path d="M7.6 6.4 L2.5 11.5" /><path d="M8.5 13.5 H14" /></>,
  chip: <><rect x={4} y={4} width={8} height={8} rx={1} /><rect x={6.3} y={6.3} width={3.4} height={3.4} /><path d="M6 1.5 V4 M10 1.5 V4 M6 12 V14.5 M10 12 V14.5 M1.5 6 H4 M1.5 10 H4 M12 6 H14.5 M12 10 H14.5" /></>,
  plug: <><path d="M5.5 1.5 V5 M10.5 1.5 V5" /><path d="M3.5 5 H12.5 V8 C12.5 10.5 10.5 12 8 12 C5.5 12 3.5 10.5 3.5 8 Z" /><path d="M8 12 V14.5" /></>,
  signal: <><circle cx={8} cy={9} r={1.4} /><path d="M5.2 6.2 C3.6 7.8 3.6 10.2 5.2 11.8 M10.8 6.2 C12.4 7.8 12.4 10.2 10.8 11.8 M3.2 4.2 C0.6 6.8 0.6 11.2 3.2 13.8 M12.8 4.2 C15.4 6.8 15.4 11.2 12.8 13.8" /></>,
  people: <><circle cx={5.5} cy={5} r={2} /><circle cx={11} cy={5.5} r={1.7} /><path d="M1.8 13.5 C2 10.5 3.6 9 5.5 9 C7.4 9 9 10.5 9.2 13.5 M9.6 9.6 C10 9.3 10.5 9.2 11 9.2 C12.8 9.2 14.1 10.6 14.2 13.5" /></>,
  wrench: <><path d="M10.5 1.8 C8.6 1.8 7.2 3.4 7.6 5.3 L2.3 10.6 C1.6 11.3 1.6 12.4 2.3 13.1 C3 13.8 4.1 13.8 4.8 13.1 L10.1 7.8 C12 8.2 13.6 6.8 13.6 4.9 L11.6 6.3 L9.9 5.5 L9.1 3.8 Z" /></>,
  gauge: <><path d="M2 11.5 A6 6 0 1 1 14 11.5" /><path d="M8 11 L11 6.5" /><circle cx={8} cy={11} r={1} /><path d="M2 13.5 H14" /></>,
  funnel: <><path d="M2 2.5 H14 L9.5 8 V13 L6.5 14 V8 Z" /></>,
  gears: <><circle cx={6} cy={6} r={2} /><path d="M6 1.5 V3 M6 9 V10.5 M1.5 6 H3 M9 6 H10.5 M2.8 2.8 L3.9 3.9 M8.1 8.1 L9.2 9.2 M2.8 9.2 L3.9 8.1 M8.1 3.9 L9.2 2.8" /><circle cx={11.5} cy={11.5} r={1.6} /><path d="M11.5 8.5 V9.5 M11.5 13.5 V14.5 M8.5 11.5 H9.5 M13.5 11.5 H14.5" /></>,
}

/** A glyph by name, in its 16×16 box, stroked with the current colour; a name not in the table draws nothing. */
export function Glyph({ name, size = 16, title }: { name: string; size?: number; title?: string }) {
  const g = GLYPHS[name]
  if (!g) return null
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>{g}</svg>
}
