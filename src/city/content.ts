import type { ReactNode } from 'react'
import type { MenuItem, PanelSize } from './parts'
import type { Place } from './places'
import type { Link } from './links'
import type { TechTree } from './techTree'
import type { CardContent } from './cards'
import type { Trip } from './traffic'
import type { AlertsRead } from './alerts'

/**
 * The contract between the frame and its content (the Owner, 2026-11-19: the frame is a framework,
 * the places and their business are plug-ins; each upgrades on its own). The frame knows only this:
 *
 *   tree    the places: town → districts → buildings → rooms, each with a name, a question and a size
 *   panels  the content's own cards beside a place, each docked left or right, as data (cards.ts); the
 *           engine adds its own (a facility's key and rulers, what a place holds, a picked thing's card)
 *   functions  the content's functions, for the menu along the bottom: one way into the system,
 *           beside the levels (by domain); picking one lights up what serves it
 *   techTree   who among the town's districts stands on whom (techTree.ts): the frame lays it out and
 *           opens it from the levels' District row
 *
 * Content never reaches into the frame's insides, and the frame never imports content: a test in
 * frame/__tests__ holds that line.
 */

/** A table, chart or card beside the middle. */
export type Panel = {
  id: string
  title: string
  /** Which bottom corner it docks in on a wide screen: charts on the left, tables and cards on the right. */
  dock: 'left' | 'right'
  /**
   * What it says, as data the engine draws (cards.ts): tables, facts, notes, or a read that brings them.
   * The way for a content (2026-11-21: nothing but the engine draws the UI).
   */
  cards?: CardContent
  /**
   * Markup the engine's own cards use (builtinPanels.tsx). A content that still hands markup is on the
   * old contract (no `version`); it is accepted for one version while contents move to `cards`.
   * @deprecated for contents: hand `cards`.
   */
  body?: ReactNode | ((at: { size: PanelSize }) => ReactNode)
  /** Secondary actions, in the ⋯ menu at the right of the panel's header. */
  menu?: MenuItem[]
}

export type CityContent = {
  /**
   * 2: the cards contract (2026-11-21). The engine draws its own cards (a facility's key, its rulers, what a
   * place holds, the picked thing's card, builtinPanels.tsx) and the content's `panels` add only its data,
   * as `cards`. Absent: the old contract, where the content handed every card, markup included.
   */
  version?: 2
  tree: Place
  /** The content's own cards beside a place (version 2: data only, as `cards`). */
  panels?: (place: Place, open: (child: Place) => void) => Panel[]
  /** The old contract's picked card; version 2 leaves it to the engine. */
  picked?: (item: Place) => Panel
  functions?: { id: string; label: string }[]
  /** How its places talk to one another, and by which way (links.ts): the frame draws it at each level's grain. */
  links?: Link[]
  /** Who among the town's districts stands on whom: nodes by district id, edges from the real graph. */
  techTree?: TechTree
  /**
   * The deliveries the content saw lately, newest first (traffic.ts): the engine drives each new one once, on
   * the roads of the level on screen. Only what the system said; nothing is made up to move.
   */
  trips?: Trip[]
  /**
   * What the monitoring's own rules say is firing now, each placed where it belongs if the content can say
   * (alerts.ts): the Alerts corner lists them, the places they sit under are lit. Absent: not wired.
   */
  alerts?: AlertsRead
}
