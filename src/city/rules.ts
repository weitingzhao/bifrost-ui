import { area, assign, CLASSES, decodePlan, GRID, MAX_THINGS, plotsOf, sidesOf, SHAPES, TAPPABLE, UNIT, type Shape } from './grid'
import { COMPUTER_LOOKS, LOOKS, sheetsOf, STATES, SYSTEMS, type Place, type PlaceKind } from './places'
import { TOWN_LANDMARKS } from './library/towns'
import { BUILDING_ROLES } from './library/buildings'
import { linkRulesBroken, type Link } from './links'

/**
 * The frame's rules, checked on the content it is given (ISSUE-9: the ground, its
 * cuts and the sizes are the frame's, fixed; a domain that wants this look uses them as they are
 * and cannot change them). Content that breaks one is not drawn: the frame lists what it broke, so
 * the domain fixes its content, not the frame.
 *
 *   levels   a town holds districts, a district buildings, a building rooms; nothing below a room
 *   shapes   every place is one of the frame's shapes: 1×1, 1×2, 2×2, 2×4, 4×4, 4×8 or 8×8
 *   doors    a place you go into (a district, a building) is at least 2 wide, for a finger
 *   ground   every level is the same 16×16 sheet; what a place holds fits it, at most 16 things, and a
 *            district or a building is small, medium or large (grid.ts MAX_THINGS, CLASSES)
 *   names    ids are unique among siblings and safe in an address
 *   function a place's function, if it says one, is one of the content's functions
 *   states   a state is one of the four words; a look one of the five
 *   roles    a building's role is one of the building catalogue's (library/buildings.ts), on buildings only
 *   readings a meter says where it was read; numbers are not negative and used is not past its whole;
 *            an unread thing has no number (unread is not zero)
 *   plan     a domain's own ground plan keeps the cutting rules, and everything it holds finds its plot
 *   links    a connection takes one of the frame's ways, both its ends are places, and it is read from
 *            an API path or a registry file (links.ts)
 *   made up  a number must come from a read: its source is a query or an API path, never words
 *            (ISSUE-33: nothing on the screen is made up or written in once and left)
 */

/** A source a number can come from: a PromQL query (a function or a selector) or a platform API path. */
const READ_SOURCE = /^\/api\/|[a-z_:]+\s*\(|[a-z_:]+\{/i

const CHILD: Record<PlaceKind, PlaceKind | null> = { town: 'district', district: 'building', building: 'room', room: null }

export function rulesBroken(content: { tree: Place; functions?: { id: string }[]; links?: Link[] }): string[] {
  const out: string[] = linkRulesBroken(content.tree, content.links ?? [])
  const fns = content.functions ? new Set(content.functions.map(f => f.id)) : null
  if (content.tree.kind !== 'town') out.push(`the top place must be a town, not a ${content.tree.kind}`)
  const walk = (p: Place, where: string) => {
    if (!(SHAPES as readonly string[]).includes(p.shape)) out.push(`${where}: shape ${String(p.shape)} is not one of ${SHAPES.join(', ')}`)
    else if (p.kind !== 'town' && sidesOf(p.shape as Shape).short < UNIT) out.push(`${where}: the smallest thing is ${UNIT}×${UNIT}, not ${p.shape}`)
    else if ((p.kind === 'district' || p.kind === 'building') && sidesOf(p.shape as Shape).short < TAPPABLE) out.push(`${where}: a ${p.kind} is gone into, so it must be at least ${TAPPABLE} wide (it is ${p.shape})`)
    if (p.function && fns && !fns.has(p.function)) out.push(`${where}: function ${p.function} is not one of the content's functions`)
    if (p.state && !(STATES as readonly string[]).includes(p.state)) out.push(`${where}: state ${p.state} is not one of ${STATES.join(', ')}`)
    if (p.look && !(LOOKS as readonly string[]).includes(p.look)) out.push(`${where}: look ${p.look} is not one of ${LOOKS.join(', ')}`)
    // What it stands as must be in the catalogue (the world offers the things; the content only picks).
    const f = p.facility
    if (f && f.kind === 'computer' && !(COMPUTER_LOOKS as readonly string[]).includes(f.look)) out.push(`${where}: a computer's look ${f.look} is not one of ${COMPUTER_LOOKS.join(', ')}`)
    if (f && f.kind === 'computer' && !(SYSTEMS as readonly string[]).includes(f.system)) out.push(`${where}: a computer's system ${f.system} is not one of ${SYSTEMS.join(', ')}`)
    if (p.style && p.style !== 'campus' && !(p.style in TOWN_LANDMARKS)) out.push(`${where}: town ${p.style} is not in the catalogue (${Object.keys(TOWN_LANDMARKS).join(', ')})`)
    if (p.role !== undefined && !(BUILDING_ROLES as readonly string[]).includes(p.role)) out.push(`${where}: building role ${String(p.role)} is not in the catalogue (${BUILDING_ROLES.join(', ')})`)
    if (p.role !== undefined && p.kind !== 'building') out.push(`${where}: a role is a building's; a ${p.kind} has none`)
    if (p.flow && p.kind !== 'building') out.push(`${where}: a flow is a building's; a ${p.kind} has none`)
    if (p.flow && ((p.flow.perMin != null && p.flow.perMin < 0) || !READ_SOURCE.test(p.flow.source))) out.push(`${where}: a flow is requests a minute read from a query or an API path, not "${p.flow.source}"`)
    const t = p.face?.tally
    if (t && t.n != null && (t.n < 0 || !READ_SOURCE.test(t.source))) out.push(`${where}: a tally is a count read from a query or an API path, not "${t.source}"`)
    for (const u of p.units ?? []) if (!(STATES as readonly string[]).includes(u)) out.push(`${where}: a unit's state ${u} is not one of ${STATES.join(', ')}`)
    const m = p.meter
    if (m) {
      if (!m.source) out.push(`${where}: a reading must say where it was read`)
      if (m.unit !== 'cores' && m.unit !== 'bytes') out.push(`${where}: unit ${String(m.unit)} is not cores or bytes`)
      if ((m.used != null && m.used < 0) || (m.of != null && m.of < 0)) out.push(`${where}: a reading is not negative`)
      if (m.used != null && m.of != null && m.used > m.of * 1.05) out.push(`${where}: used ${m.used} is past its whole ${m.of}`)
      if (p.state === 'unread' && m.used != null) out.push(`${where}: an unread thing has no reading (unread is not zero)`)
      if ((m.used != null || m.of != null) && !READ_SOURCE.test(m.source)) out.push(`${where}: a number must come from a read (a query or an API path), not from "${m.source}"`)
    }
    // A district of several sheets lays each sheet out anew (places.ts onSheet): one plan for all of them is not drawn.
    const grounds = p.kind === 'district' ? sheetsOf(p) : [p.children]
    if (p.arrangement && grounds.length === 1) {
      const plan = decodePlan(p.arrangement.plan)
      if (plan === null) out.push(`${where}: its ground plan is not a plan of halvings`)
      else {
        const { homeless } = assign(p.children.filter(c => (SHAPES as readonly string[]).includes(c.shape)), plotsOf(plan), p.arrangement.at)
        if (homeless.length) out.push(`${where}: its ground plan has no plot for ${homeless.map(h => h.id).join(', ')}`)
      }
    }
    const want = CHILD[p.kind]
    const seen = new Set<string>()
    for (const c of p.children) {
      const at = `${where}/${c.id}`
      if (!c.id || /[/#?\s]/.test(c.id)) out.push(`${at}: an id must be non-empty, without / # ? or spaces`)
      if (seen.has(c.id)) out.push(`${at}: two places here share this id`)
      seen.add(c.id)
      if (want === null) out.push(`${at}: a room holds nothing; there is no level below it`)
      else if (c.kind !== want) out.push(`${at}: a ${p.kind} holds ${want}s, not a ${c.kind}`)
    }
    // A sheet holds at most MAX_THINGS; a district or a building is small, medium or large (ISSUE-9).
    // A district of 2 or 4 sheets has a ground on each (places.ts sheetsOf), and each sheet keeps the ground's rules
    // (2026-11-24, PROD: the hardware district, 272 cells of devices, could only be refused or cut while its sheets
    // were counted as one ground; given more land it now holds them).
    grounds.forEach((g, i) => {
      const on = grounds.length > 1 ? `${where} (sheet ${i + 1} of ${grounds.length})` : where
      if (g.length > MAX_THINGS) out.push(`${on}: holds ${g.length} things; a level holds at most ${MAX_THINGS}`)
      const valid = g.filter(c => (SHAPES as readonly string[]).includes(c.shape))
      if (area(valid) > GRID * GRID) out.push(`${on}: what it holds takes ${area(valid)} cells; its ground has ${GRID * GRID}`)
    })
    for (const c of p.children) if ((c.kind === 'district' || c.kind === 'building') && !(CLASSES as readonly string[]).includes(c.shape)) out.push(`${where}/${c.id}: a ${c.kind} is small, medium or large (${CLASSES.join(', ')}), not ${c.shape}`)
    for (const c of p.children) walk(c, `${where}/${c.id}`)
  }
  walk(content.tree, content.tree.id)
  return out
}

/**
 * Contain what breaks the rules to the place that broke them (ISSUE-34: a new machine, win11-secondary,
 * pushed the compute district past its ground, "town/compute: … 272 cells; its ground has 256", and the whole
 * City went blank, every other district with it). The rules do not bend: the place that breaks one is not drawn.
 * But only that place: it stands empty, saying which rule it broke (Place.inside { why }), and the rest of the
 * city draws. A broken connection is dropped alone. Only what breaks at the top (the town itself, or a break no
 * place can be found for) refuses the whole content, as before.
 *
 * Escalation: a place emptied that still breaks a rule (its own shape, state, id) is taken out by emptying its
 * parent in turn, up to the town.
 */
export type Contained<C> = { content: C; contained: { path: string; broken: string[] }[]; dropped: string[]; refused: string[] }

export function containBroken<C extends { tree: Place; functions?: { id: string }[]; links?: Link[] }>(content: C): Contained<C> {
  const base = linkRulesBroken(content.tree, []).length
  const links = content.links?.filter(l => linkRulesBroken(content.tree, [l]).length === base)
  const dropped = (content.links ?? []).filter(l => !links?.includes(l)).map(l => linkRulesBroken(content.tree, [l]).slice(base).join('; '))
  let tree = content.tree
  const emptied = new Map<string, string[]>()
  for (let round = 0; round < 64; round++) {
    const msgs = rulesBroken({ ...content, tree, links })
    if (msgs.length === 0) break
    const at = new Map<string, string[]>()
    for (const m of msgs) {
      const i = m.indexOf(': ')
      const segs = i < 0 ? [] : m.slice(0, i).split('/')
      if (segs[0] !== tree.id || segs.length < 2) return { content, contained: [], dropped: [], refused: msgs }
      let path = segs.slice(1).join('/')
      // Emptied already and still broken: the break is in the place itself, so its parent goes.
      while (emptied.has(path)) path = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
      if (!path) return { content, contained: [], dropped: [], refused: msgs }
      at.set(path, [...(at.get(path) ?? []), m.slice(i + 2)])
    }
    for (const [path, why] of at) {
      const inner = [...emptied].filter(([p]) => p.startsWith(`${path}/`))
      for (const [p] of inner) emptied.delete(p)
      const all = [...why, ...inner.flatMap(([, w]) => w)]
      emptied.set(path, all)
      tree = emptyAt(tree, path.split('/'), all)
    }
  }
  const left = rulesBroken({ ...content, tree, links })
  if (left.length) return { content, contained: [], dropped: [], refused: left }
  return { content: { ...content, tree, ...(content.links ? { links } : {}) }, contained: [...emptied].map(([path, broken]) => ({ path, broken })), dropped, refused: [] }
}

/** The place at `path` stood empty: its name and size kept, what it held gone, the rules it broke said. */
function emptyAt(p: Place, path: string[], why: string[]): Place {
  if (path.length === 0) {
    const { id, kind, shape, label, question, dashboard } = p
    return { id, kind, shape, label, question, dashboard, children: [], inside: { why: `refused by the frame's rules: ${why.join('; ')}` } }
  }
  return { ...p, children: p.children.map(c => c.id === path[0] ? emptyAt(c, path.slice(1), why) : c) }
}
