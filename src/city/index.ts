/**
 * @bifrost/ui/city: the City world (moved from the platform's console, 2026-11-20, the Owner: the frame is the
 * world and its rules; a platform only binds its state to the world's things and never draws). The frame
 * imports nothing but itself, React and Phaser (an optional peer: only those who show the City need it).
 * Its parts are reachable one by one as @bifrost/ui/city/<module> (grid, places, links, library/towns, …).
 */
export { default as CityGen2 } from './CityGen2'
export type { CityContent, Panel } from './content'
export { PRINCIPLE } from './principle'
export type { TechTree, TreeEdge, TreeNode, TreeTone } from './techTree'
export type { Block, CardBody, CardContent, Cell, Tone, Word } from './cards'
