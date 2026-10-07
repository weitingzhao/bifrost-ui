import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  blankDesignKeeps,
  consumerRoots,
  importedFromUi,
  publicExports,
  repoRoot,
  unusedPublic,
  walkTs,
} from './public-exports.mjs'

test('an export nobody imports fails unless the statement says design-keep', () => {
  const root = mkdtempSync(join(tmpdir(), 'bifrost-ui-exports-'))
  const src = join(root, 'src')
  mkdirSync(src)
  writeFileSync(
    join(src, 'index.ts'),
    [
      'export { Used } from "./used"',
      '// design-keep: the design agent still needs this .d.ts',
      'export { Kept } from "./kept"',
      'export { Dead } from "./dead"',
    ].join('\n'),
  )
  const names = publicExports(join(src, 'index.ts'))
  const used = new Set(['Used'])
  assert.deepEqual(
    unusedPublic(names, used).map((e) => e.name),
    ['Dead'],
  )
  assert.equal(names.find((e) => e.name === 'Kept').designKeep.length > 0, true)
  assert.deepEqual(blankDesignKeeps([{ name: 'X', designKeep: '' }]).map((e) => e.name), ['X'])
})

test('every @bifrost/ui export is imported by an app or marked design-keep', () => {
  const roots = consumerRoots()
  assert.ok(
    roots,
    'NOT MEASURED: set BIFROST_UI_FRONTEND_SRC and BIFROST_UI_CONSOLE_SRC to the two consumers (origin/main)',
  )
  const exports = publicExports(join(repoRoot, 'src/index.ts'))
  const used = importedFromUi([...walkTs(roots.frontend), ...walkTs(roots.console)])
  const blank = blankDesignKeeps(exports)
  assert.deepEqual(
    blank.map((e) => e.name),
    [],
    'design-keep: needs a reason',
  )
  const unused = unusedPublic(exports, used)
  assert.deepEqual(
    unused.map((e) => `${e.name}:${e.line}`),
    [],
    'public export with no importer in Trade frontend or Ops Console, and no design-keep comment',
  )
})
