import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Origin: 箭10 2026-11-23 (the Owner: keep it isolated in code, move it out once its repository exists): the engine
// backend lodges in bifrost-ui/engine-server until it has its own repository. It may use the engine's contract types
// (type-only, erased at run time) and nothing else of bifrost-ui; bifrost-ui's src never imports it. Then moving the
// directory out is a git mv.

const here = dirname(fileURLToPath(import.meta.url)), server = join(here, '..'), repo = join(server, '..')
const walk = (d: string): string[] => readdirSync(d).flatMap(n => {
  const p = join(d, n)
  if (n === 'node_modules' || n.startsWith('.')) return []
  return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mts)$/.test(n) ? [p] : []
})
const CONTRACT = new Set(['../../src/observation/model.ts'])
// Step 5 (engine-backend.md §4: the engine evaluates the projection with the views' own function, never a copy): the
// communication model is a runtime contract, value imports allowed, because it is pure and imports nothing (held
// below). Moving out swaps it for the published @bifrost/ui package, as the observation types.
const RUNTIME_CONTRACT = new Set(['../../src/communication/model.ts'])
const imports = (src: string) => [...src.matchAll(/^\s*(import|export)\s+(type\s+)?[^'"]*from\s+['"]([^'"]+)['"]/gm)].map(m => ({ typeOnly: !!m[2], spec: m[3] }))

test('the engine backend imports only itself, node, the engine contract types (type-only) and the pure communication model', () => {
  const bad: string[] = []
  for (const f of ['src', 'test', 'scripts'].flatMap(d => walk(join(server, d)))) {
    for (const { typeOnly, spec } of imports(readFileSync(f, 'utf8'))) {
      if (spec.startsWith('node:') || (spec.startsWith('.') && !spec.startsWith('../../'))) continue
      if (CONTRACT.has(spec) && typeOnly) continue
      if (RUNTIME_CONTRACT.has(spec)) continue
      bad.push(`${f.slice(server.length + 1)}: ${spec}${typeOnly ? ' (type)' : ''}`)
    }
  }
  assert.deepEqual(bad, [])
})

test('a runtime contract imports nothing, so the engine still needs no other part of bifrost-ui at run time', () => {
  for (const spec of RUNTIME_CONTRACT) assert.deepEqual(imports(readFileSync(join(here, spec), 'utf8')), [], spec)
})

test('bifrost-ui src never imports the engine backend', () => {
  const bad = walk(join(repo, 'src')).filter(f => /engine-server/.test(readFileSync(f, 'utf8')))
  assert.deepEqual(bad.map(f => f.slice(repo.length + 1)), [])
})

// Positive control for the first case (same origin): a value import of the contract is refused.
test('a value import of the contract counts as a breach', () => {
  const v = imports("import { ReadEvidence } from '../../src/observation/model.ts'")[0]
  assert.equal(v.typeOnly, false)
  assert.ok(CONTRACT.has(v.spec))
})
