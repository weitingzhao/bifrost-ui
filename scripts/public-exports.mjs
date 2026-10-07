/**
 * Public API of @bifrost/ui is src/index.ts. A name there must be imported
 * from '@bifrost/ui' by Trade frontend or the Ops Console, or the export
 * statement must carry a `design-keep:` comment saying why Design still
 * publishes it (the design agent reads each sub-export's .d.ts).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export function walkTs(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.cache') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkTs(p, acc)
    else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) acc.push(p)
  }
  return acc
}

function scriptKind(file) {
  return file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
}

export function parse(file, text = readFileSync(file, 'utf8')) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(file))
}

function commentText(sf, node) {
  const ranges = ts.getLeadingCommentRanges(sf.getFullText(), node.getFullStart()) ?? []
  return ranges.map((r) => sf.getFullText().slice(r.pos, r.end)).join('\n')
}

/** Reason text after `design-keep:`, or null when the marker is absent. */
export function designKeepReason(comment) {
  const m = comment.match(/design-keep:\s*([^\n*]*)/)
  if (!m) return null
  return m[1].trim()
}

export function publicExports(indexPath) {
  const sf = parse(indexPath)
  const names = []
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt) || !stmt.exportClause || !ts.isNamedExports(stmt.exportClause)) continue
    const reason = designKeepReason(commentText(sf, stmt))
    for (const el of stmt.exportClause.elements) {
      names.push({
        name: el.name.text,
        line: sf.getLineAndCharacterOfPosition(el.getStart(sf)).line + 1,
        designKeep: reason,
      })
    }
  }
  return names
}

export function importedFromUi(files) {
  const used = new Set()
  for (const file of files) {
    const sf = parse(file)
    const visit = (node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === '@bifrost/ui'
      ) {
        const clause = ts.isImportDeclaration(node) ? node.importClause?.namedBindings : node.exportClause
        if (clause && (ts.isNamedImports(clause) || ts.isNamedExports(clause))) {
          for (const el of clause.elements) used.add((el.propertyName ?? el.name).text)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
  return used
}

export function consumerRoots() {
  const fe = process.env.BIFROST_UI_FRONTEND_SRC
  const con = process.env.BIFROST_UI_CONSOLE_SRC
  if (fe && con) return { frontend: fe, console: con }
  const siblingFe = resolve(repoRoot, '../bifrost-trade-frontend/src')
  const siblingCon = resolve(repoRoot, '../bifrost-platform/console/src')
  if (existsSync(siblingFe) && existsSync(siblingCon)) return { frontend: siblingFe, console: siblingCon }
  return null
}

/** Names that are neither imported by a consumer nor marked design-keep. */
export function unusedPublic(exports, used) {
  return exports.filter((e) => !used.has(e.name) && e.designKeep == null)
}

export function blankDesignKeeps(exports) {
  return exports.filter((e) => e.designKeep === '')
}
