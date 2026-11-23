import { GLYPHS } from './worldGlyphs'
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

/** The tree draws the world's glyphs (worldGlyphs.tsx); the old name stays for one version. */
export { GLYPHS as TREE_GLYPHS } from './worldGlyphs'

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
          const glyph = n.icon ? GLYPHS[n.icon] : undefined
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
      {lay.loops.length > 0 && <p className="g2-tree-note g2-fail">{lay.loops.length === 1 ? 'One loop' : `${lay.loops.length} loops`}: two districts that stand on each other (red).</p>}
    </div>
  )
}
