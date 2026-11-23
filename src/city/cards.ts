/**
 * Cards as data (the Owner, 2026-11-21: "set the boundary from the start; nothing but the engine draws the
 * UI"). A content hands the engine what a card says — tables, facts, notes, or a read that brings them —
 * and the engine draws it. The content writes no markup, so the card keeps the engine's look and rules,
 * and the same data can one day come from a back end (the second generation: systems talk to the engine
 * backend to backend).
 *
 * The parts are few on purpose, like a city game's standard instruments: a table (columns and rows), facts
 * (a label and its value), a note. A cell is a word or a number, with a tone and a hover; a cell may hold a
 * short list with "+N more". A row may open a place inside (by the child's id), as tapping its block does.
 */

/** How a value stands: good, needs a look, or not known. Never a colour the content picks. */
export type Tone = 'good' | 'warn' | 'unknown'

export type Word = string | number | { text: string | number; tone?: Tone; title?: string; mark?: { text: string; tone?: Tone } }
/** A cell: one word, or a short list of them ("+N more" when the list is longer than shown). */
export type Cell = Word | { lines: Word[]; more?: number; empty?: string }

export type Block =
  | {
    kind: 'table'
    head?: { label: string; num?: boolean }[]
    /**
     * A row may lead somewhere: `open` goes into a child place (the engine navigates), `href` goes to another view
     * of this app by its address (the World line, 2026-11-23: City's Lines card leads back to the same line in
     * Console). Only in-app addresses starting with `#` are drawn as links; anything else is shown as plain text.
     * A row has one or the other: when both are given, `open` wins.
     */
    rows: { key: string; cells: Cell[]; tone?: Tone; title?: string; open?: string; href?: string; ghost?: boolean }[]
    /** Said when there are no rows (never an empty table that looks like all is well). */
    empty?: string
  }
  | { kind: 'facts'; rows: { label: string; value: Cell; note?: Cell; tone?: Tone }[] }
  | { kind: 'note'; text: string; tone?: Tone; title?: string }

/**
 * What a card says: its blocks, or a read that brings them (the engine says "reading" while it runs and
 * "not known: why" when it fails). A function gets the size the card is drawn at, for a compact form.
 */
export type CardBody = Block[] | { read: () => Promise<Block[]>; key: string }
export type CardSize = 'card' | 'middle' | 'drawer'
export type CardContent = CardBody | ((at: { size: CardSize }) => CardBody)

export const isRead = (b: CardBody): b is { read: () => Promise<Block[]>; key: string } => !Array.isArray(b)
