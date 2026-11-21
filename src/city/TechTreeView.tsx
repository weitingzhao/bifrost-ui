import { useMemo, useState, type ReactNode } from 'react'
import { depthTag, layoutTree, type TechTree, type TreeEdge } from './techTree'

/**
 * The tech tree drawn (techTree.ts), the way a strategy game draws one: tiers in columns under their
 * headers, the ground first; each node a card with its glyph, its name, its tier and its light; traces
 * like a circuit board from each prerequisite to what it unlocks, as thick as the edge is strong. Only the
 * nearest prerequisites are traced; an edge a longer path already implies shows when its node is hovered.
 * A loop is red. Hovering a node keeps its own traces and dims the rest; tapping it goes to its district.
 */

const NODE_W = 184, NODE_H = 40, COL_GAP = 48, ROW_GAP = 10, PAD = 10, HEAD = 22, R = 6

/**
 * The tree's glyphs: plain line pictures, generic so any content can choose among them (the frame knows
 * nothing of domains). Each is drawn in a 16×16 box with the current colour.
 */
export const TREE_GLYPHS: Record<string, ReactNode> = {
  layers: <><path d="M8 2 L14 5 L8 8 L2 5 Z" /><path d="M2 8 L8 11 L14 8" /><path d="M2 11 L8 14 L14 11" /></>,
  blueprint: <><rect x={2} y={2} width={12} height={12} rx={1} /><path d="M2 6 H14 M6 6 V14 M9 9 H12 M9 11.5 H12" /></>,
  branch: <><circle cx={4} cy={3.5} r={1.6} /><circle cx={4} cy={12.5} r={1.6} /><circle cx={12} cy={6} r={1.6} /><path d="M4 5 V11 M12 7.6 C12 10 4 9 4 11" /></>,
  shield: <><path d="M8 1.8 L13.5 4 V8 C13.5 11 11 13.4 8 14.4 C5 13.4 2.5 11 2.5 8 V4 Z" /><path d="M5.5 8 L7.3 9.8 L10.7 6.4" /></>,
  rocket: <><path d="M8 1.5 C10.8 3.5 11.5 6.5 10.6 10 H5.4 C4.5 6.5 5.2 3.5 8 1.5 Z" /><circle cx={8} cy={6} r={1.3} /><path d="M5.4 10 L3.5 12.5 L5.8 12 M10.6 10 L12.5 12.5 L10.2 12 M7 12 L8 14.5 L9 12" /></>,
  gavel: <><path d="M6.5 2.5 L10.5 6.5 M4.7 4.3 L8.7 8.3 M5.6 3.4 L9.6 7.4" /><path d="M7.6 6.4 L2.5 11.5" /><path d="M8.5 13.5 H14" /></>,
  chip: <><rect x={4} y={4} width={8} height={8} rx={1} /><rect x={6.3} y={6.3} width={3.4} height={3.4} /><path d="M6 1.5 V4 M10 1.5 V4 M6 12 V14.5 M10 12 V14.5 M1.5 6 H4 M1.5 10 H4 M12 6 H14.5 M12 10 H14.5" /></>,
  plug: <><path d="M5.5 1.5 V5 M10.5 1.5 V5" /><path d="M3.5 5 H12.5 V8 C12.5 10.5 10.5 12 8 12 C5.5 12 3.5 10.5 3.5 8 Z" /><path d="M8 12 V14.5" /></>,
  signal: <><circle cx={8} cy={9} r={1.4} /><path d="M5.2 6.2 C3.6 7.8 3.6 10.2 5.2 11.8 M10.8 6.2 C12.4 7.8 12.4 10.2 10.8 11.8 M3.2 4.2 C0.6 6.8 0.6 11.2 3.2 13.8 M12.8 4.2 C15.4 6.8 15.4 11.2 12.8 13.8" /></>,
}

type Props = {
  tree: TechTree
  /** The node the page is at (the district entered), if any. */
  here?: string
  pick: (id: string) => void
}

export function TechTreeView({ tree, here, pick }: Props) {
  const lay = useMemo(() => layoutTree(tree), [tree])
  const [hover, setHover] = useState<string | null>(null)
  const byId = new Map(tree.nodes.map(n => [n.id, n]))
  const rows = Math.max(1, ...lay.columns.map(c => c.length))
  const cols = lay.columns.length
  const w = PAD * 2 + cols * NODE_W + (cols - 1) * COL_GAP
  const h = PAD * 2 + HEAD + rows * NODE_H + (rows - 1) * ROW_GAP
  const pos: Record<string, { x: number; y: number }> = {}
  lay.columns.forEach((col, c) => {
    const top = PAD + HEAD + ((rows - col.length) * (NODE_H + ROW_GAP)) / 2
    col.forEach((id, r) => { pos[id] = { x: PAD + c * (NODE_W + COL_GAP), y: top + r * (NODE_H + ROW_GAP) } })
  })
  const implied = new Set(lay.implied.map(e => `${e.from}>${e.to}`))
  const edges = (tree.edges ?? []).filter(e => pos[e.from] && pos[e.to] && e.from !== e.to)
  const mine = (e: TreeEdge) => e.from === hover || e.to === hover
  // Drawn: the nearest prerequisites and the loops always; an implied edge only while one of its ends is hovered.
  const shown = edges.filter(e => !implied.has(`${e.from}>${e.to}`) || mine(e))
  const near = new Set(hover ? [hover, ...edges.filter(mine).flatMap(e => [e.from, e.to])] : [])
  const thick = (wt: number) => Math.min(5, 1.2 + Math.log2(Math.max(1, wt)) * 0.7)

  // A trace from the prerequisite's right port to the unlocked node's left port, turning in the gap just
  // after the prerequisite's column, corners rounded. One that runs right to left (a loop) bends round.
  const trace = (e: TreeEdge) => {
    const a = pos[e.to], b = pos[e.from]
    const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2
    if (x2 <= x1) {
      const dx = Math.max(30, (x1 - x2) / 2)
      return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
    }
    const mx = x1 + COL_GAP / 2, dy = y2 - y1, r = Math.min(R, Math.abs(dy) / 2)
    if (r < 0.5) return `M${x1},${y1} H${x2}`
    const s = Math.sign(dy)
    return `M${x1},${y1} H${mx - r} Q${mx},${y1} ${mx},${y1 + s * r} V${y2 - s * r} Q${mx},${y2} ${mx + r},${y2} H${x2}`
  }
  const label = (id: string) => byId.get(id)?.label ?? id

  return (
    <div className="g2-tree" role="group" aria-label="Who stands on whom">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${tree.nodes.length} districts in ${cols} tiers`}>
        <defs>
          <marker id="g2-tree-arrow" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="4.5" markerHeight="4.5" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
          </marker>
        </defs>
        {lay.columns.map((_, c) => {
          const x = PAD + c * (NODE_W + COL_GAP)
          return <g key={c} className="g2-tree-tier">
            <rect x={x - 6} y={PAD + HEAD - 4} width={NODE_W + 12} height={h - PAD * 2 - HEAD + 8} rx={8} />
            <text x={x} y={PAD + 11}>{depthTag(c)}{c === 0 ? ' · ground' : ''}</text>
          </g>
        })}
        {shown.map(e => {
          const key = `${e.from}>${e.to}`
          const cls = `g2-tree-edge${e.wrong ? ' loop' : ''}${implied.has(key) ? ' implied' : ''}${hover && !mine(e) ? ' dim' : ''}${hover && mine(e) ? ' lit' : ''}`
          return <g key={key}>
            <path d={trace(e)} className={cls} strokeWidth={thick(e.weight)} markerEnd="url(#g2-tree-arrow)">
              <title>{`${label(e.from)} stands on ${label(e.to)}: ${e.weight}${e.wrong ? ' — a loop: the two stand on each other' : implied.has(key) ? ' (also through a longer path)' : ''}`}</title>
            </path>
          </g>
        })}
        {lay.columns.flat().map(id => {
          const n = byId.get(id)!, p = pos[id]
          const dim = hover && !near.has(id)
          const glyph = n.icon ? TREE_GLYPHS[n.icon] : undefined
          return (
            <g key={id} transform={`translate(${p.x},${p.y})`} className={`g2-tree-node${id === here ? ' here' : ''}${dim ? ' dim' : ''}${hover === id ? ' hot' : ''}`}
              tabIndex={0} role="button" aria-label={`${n.label}, ${depthTag(lay.depth[id])}${n.tone ? `, ${n.tone}` : ''}`}
              onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(id)} onBlur={() => setHover(null)}
              onClick={() => pick(id)} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(id) } }}>
              <title>{n.why ? `${n.label}: ${n.why}` : n.label}</title>
              <rect className="g2-tree-card" width={NODE_W} height={NODE_H} rx={6} />
              <rect className="g2-tree-tile" x={5} y={5} width={NODE_H - 10} height={NODE_H - 10} rx={5} />
              {glyph
                ? <g className="g2-tree-glyph" transform={`translate(${5 + (NODE_H - 10 - 18) / 2},${5 + (NODE_H - 10 - 18) / 2}) scale(1.125)`}>{glyph}</g>
                : <text className="g2-tree-initial" x={NODE_H / 2} y={NODE_H / 2 + 4.5} textAnchor="middle">{n.label.slice(0, 1).toUpperCase()}</text>}
              <text x={NODE_H + 2} y={17} className="g2-tree-label">{n.label.length > 19 ? `${n.label.slice(0, 18)}…` : n.label}</text>
              <text x={NODE_H + 2} y={31} className="g2-tree-tag">{depthTag(lay.depth[id])}{lay.depth[id] === 0 ? ' · ground' : ''}</text>
              <circle cx={NODE_W - 12} cy={28} r={3.5} className={`g2-tree-dot ${n.tone ?? 'unknown'}`} />
              <circle cx={0} cy={NODE_H / 2} r={2.6} className="g2-tree-port" />
              <circle cx={NODE_W} cy={NODE_H / 2} r={2.6} className="g2-tree-port" />
            </g>
          )
        })}
      </svg>
      {tree.note && <p className={`g2-tree-note${tree.edges ? '' : ' g2-unknown'}`}>{tree.note}</p>}
      {lay.implied.length > 0 && <p className="g2-tree-note">Only the nearest prerequisites are traced; {lay.implied.length === 1 ? 'one more line shows' : `${lay.implied.length} more lines show`} when you hover a node.</p>}
      {lay.loops.length > 0 && <p className="g2-tree-note g2-warn">{lay.loops.length === 1 ? 'One loop' : `${lay.loops.length} loops`}: two districts that stand on each other (red).</p>}
    </div>
  )
}
