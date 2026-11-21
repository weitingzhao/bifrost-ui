/**
 * The tech tree (the Owner, 2026-11-20): who stands on whom among a town's districts, drawn the way a
 * strategy game draws what unlocks what — in columns, the ground on the left, each one right of what it
 * stands on. The map itself cannot carry it: the Owner moves districts as he likes (a place says nothing),
 * the edges hold the ports to the town outside, the streets are the bus. So the graph has its own place:
 * it grows out of the levels (the domain dimension), and the map stays as it is.
 *
 * The frame knows nothing of what the graph is about. Content hands it nodes and edges (an edge `from`
 * stands on `to`); the frame lays them out itself, so whoever uses the frame gets the tree from the
 * graph it has, with nothing placed by hand (the Owner: "it is configuration, from the real graph").
 *
 * The layout is the usual layered one: a node's column is one more than the deepest node it stands on
 * (0 for one standing on nothing); within a column, nodes sit near the average row of what they stand on,
 * which keeps edges from crossing where it can. An edge the content marks wrong (one that closes a loop)
 * is left out of the columns, so a loop never stops the layout; it is drawn, marked, between whatever
 * columns its two ends got.
 */

/** A node's light, as the content reads it. */
export type TreeTone = 'good' | 'problem' | 'bad' | 'unknown'

export type TreeNode = {
  /** The id of the town's child (a district) it stands for: picking the node goes there. */
  id: string
  label: string
  /** One of the tree's glyphs (TREE_GLYPHS in TechTreeView), chosen by the content; absent, its initial. */
  icon?: string
  tone?: TreeTone
  /** One line said on hover: what the tone was read from. */
  why?: string
}

/** `from` stands on `to` (uses it). */
export type TreeEdge = {
  from: string
  to: string
  /** How strong (imports, calls): the line's thickness. */
  weight: number
  /** It closes a loop: two that stand on each other. Drawn red; left out of the columns. */
  wrong?: boolean
}

export type TechTree = {
  nodes: TreeNode[]
  /** Absent when the graph could not be read: the nodes stand alone and `note` says why (never a guessed edge). */
  edges?: TreeEdge[]
  /** What the edges were read from (and when), or why they are not known. */
  note?: string
}

export type TreeLayout = {
  /** Columns, left (the ground) to right; each a list of node ids, top to bottom. */
  columns: string[][]
  /** Each node's column: its depth (L0, L1, …). */
  depth: Record<string, number>
  /** The edges that close a loop, as the content marked them. */
  loops: TreeEdge[]
  /**
   * The edges a longer path already implies (delivery stands on owner, owner on foundation: delivery's own
   * edge to foundation is implied). A tech tree draws only the nearest prerequisites; these show on hover.
   */
  implied: TreeEdge[]
}

export function layoutTree(t: TechTree): TreeLayout {
  const ids = t.nodes.map(n => n.id)
  const known = new Set(ids)
  const edges = (t.edges ?? []).filter(e => known.has(e.from) && known.has(e.to) && e.from !== e.to)
  const on = new Map<string, string[]>(ids.map(id => [id, []]))
  for (const e of edges) if (!e.wrong) on.get(e.from)!.push(e.to)

  // Depth: one more than the deepest it stands on. A loop the content did not mark is cut where it is met.
  const depth: Record<string, number> = {}
  const walking = new Set<string>()
  const depthOf = (id: string): number => {
    if (id in depth) return depth[id]
    if (walking.has(id)) return 0
    walking.add(id)
    const d = on.get(id)!.reduce((m, to) => Math.max(m, depthOf(to) + 1), 0)
    walking.delete(id)
    return (depth[id] = d)
  }
  ids.forEach(depthOf)

  const columns: string[][] = []
  for (const id of ids) (columns[depth[id]] ??= []).push(id)
  // Rows: each column after the first sorted by the average row of what its nodes stand on (ties keep the
  // content's order), so the lines run as straight as they can.
  const row: Record<string, number> = {}
  columns.forEach((col, c) => {
    if (c > 0) {
      const order = new Map(col.map((id, i) => [id, i]))
      const mean = (id: string) => {
        const under = on.get(id)!.filter(to => to in row)
        return under.length ? under.reduce((s, to) => s + row[to], 0) / under.length : order.get(id)!
      }
      const m = new Map(col.map(id => [id, mean(id)]))
      col.sort((a, b) => m.get(a)! - m.get(b)! || order.get(a)! - order.get(b)!)
    }
    col.forEach((id, i) => { row[id] = i - (col.length - 1) / 2 })
  })
  // Implied: another way from `from` to `to` through at least one node between (loops left out).
  const reachesAvoiding = (a: string, b: string, skip: string) => {
    const seen = new Set([a]), queue = on.get(a)!.filter(n => !(a === skip && n === b))
    while (queue.length) {
      const at = queue.shift()!
      if (at === b) return true
      if (seen.has(at)) continue
      seen.add(at)
      queue.push(...on.get(at)!)
    }
    return false
  }
  const implied = edges.filter(e => !e.wrong && reachesAvoiding(e.from, e.to, e.from))
  return { columns: columns.filter(Boolean), depth, loops: edges.filter(e => e.wrong), implied }
}

/** The short name of a depth, as a game writes a level. */
export const depthTag = (d: number) => `L${d}`
