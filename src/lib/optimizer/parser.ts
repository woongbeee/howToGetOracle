// ─── SQL Parser ───────────────────────────────────────────────────────────
// Lightweight SQL parser for educational simulation purposes.
// Parses SELECT statements into a structured ParsedQuery.

import type { ParsedQuery, Predicate, JoinCondition, PredicateType } from './types'

const COMPARISON_OPS = ['<=', '>=', '<>', '!=', '<', '>', '='] as const
const JOIN_KEYWORDS = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'JOIN']

function normalize(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\t|\n|\r/g, ' ')
    .trim()
    .toUpperCase()
}

function extractTableName(token: string): string {
  // Handle "SCHEMA.TABLE alias" or "TABLE alias"
  const parts = token.trim().split(/\s+/)
  const tableWithSchema = parts[0]
  const dotIdx = tableWithSchema.indexOf('.')
  return dotIdx >= 0 ? tableWithSchema.slice(dotIdx + 1) : tableWithSchema
}

function detectPredicateType(op: string): PredicateType {
  if (op === '=') return 'EQUALITY'
  if (['<', '>', '<=', '>=', 'BETWEEN'].includes(op)) return 'RANGE'
  if (op === 'LIKE') return 'LIKE'
  if (op === 'IS NULL') return 'IS_NULL'
  if (op === 'IN') return 'IN'
  return 'EQUALITY'
}

function parsePredicates(whereClause: string, tables: string[]): Predicate[] {
  const predicates: Predicate[] = []
  if (!whereClause) return predicates

  // Split on AND/OR (basic — treats OR same as AND for simplicity)
  const conditions = whereClause.split(/\bAND\b|\bOR\b/)

  for (const cond of conditions) {
    const trimmed = cond.trim()
    if (!trimmed) continue

    // IS NULL / IS NOT NULL
    const isNullMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+IS\s+(NOT\s+)?NULL$/i)
    if (isNullMatch) {
      const [tablePart, col] = resolveColumnRef(isNullMatch[1], tables)
      predicates.push({
        table: tablePart,
        column: col,
        operator: 'IS NULL',
        value: null,
        type: 'IS_NULL',
      })
      continue
    }

    // IN clause
    const inMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+IN\s*\(([^)]+)\)/i)
    if (inMatch) {
      const [tablePart, col] = resolveColumnRef(inMatch[1], tables)
      predicates.push({
        table: tablePart,
        column: col,
        operator: 'IN',
        value: inMatch[2].trim(),
        type: 'IN',
      })
      continue
    }

    // LIKE
    const likeMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+LIKE\s+'([^']+)'/i)
    if (likeMatch) {
      const [tablePart, col] = resolveColumnRef(likeMatch[1], tables)
      predicates.push({
        table: tablePart,
        column: col,
        operator: 'LIKE',
        value: likeMatch[2],
        type: 'LIKE',
      })
      continue
    }

    // Comparison operators
    for (const op of COMPARISON_OPS) {
      const idx = trimmed.indexOf(op)
      if (idx < 0) continue
      const lhs = trimmed.slice(0, idx).trim()
      const rhs = trimmed.slice(idx + op.length).trim()

      // Skip join conditions (both sides are column refs)
      if (/^\w+\.\w+$/.test(rhs) || tables.includes(rhs)) continue

      const [tablePart, col] = resolveColumnRef(lhs, tables)
      const value = rhs.replace(/^'(.*)'$/, '$1') // strip quotes
      predicates.push({
        table: tablePart,
        column: col,
        operator: op as Predicate['operator'],
        value: isNaN(Number(value)) ? value : Number(value),
        type: detectPredicateType(op),
      })
      break
    }
  }

  return predicates
}

function resolveColumnRef(ref: string, tables: string[]): [string, string] {
  if (ref.includes('.')) {
    const [t, c] = ref.split('.')
    return [t, c]
  }
  return [tables[0] ?? '', ref]
}

function parseJoins(sql: string, tables: string[]): JoinCondition[] {
  const joins: JoinCondition[] = []

  for (const kw of JOIN_KEYWORDS) {
    const regex = new RegExp(`${kw}\\s+(\\w+(?:\\.\\w+)?(?:\\s+\\w+)?)\\s+ON\\s+([\\w.]+)\\s*=\\s*([\\w.]+)`, 'gi')
    let m: RegExpExecArray | null
    while ((m = regex.exec(sql)) !== null) {
      const joinType: JoinCondition['type'] =
        kw.startsWith('LEFT') ? 'LEFT' :
        kw.startsWith('RIGHT') ? 'RIGHT' :
        kw.startsWith('FULL') ? 'FULL' : 'INNER'

      const [lt, lc] = resolveColumnRef(m[2].toUpperCase(), tables)
      const [rt, rc] = resolveColumnRef(m[3].toUpperCase(), tables)

      joins.push({ leftTable: lt, leftColumn: lc, rightTable: rt, rightColumn: rc, type: joinType })
    }
  }

  return joins
}

export function parseSQL(sql: string): ParsedQuery {
  const upper = normalize(sql)

  // Detect statement type
  const type: ParsedQuery['type'] =
    upper.startsWith('SELECT') ? 'SELECT' :
    upper.startsWith('INSERT') ? 'INSERT' :
    upper.startsWith('UPDATE') ? 'UPDATE' :
    upper.startsWith('DELETE') ? 'DELETE' : 'UNKNOWN'

  if (type !== 'SELECT') {
    return {
      type, tables: [], columns: [], predicates: [], joins: [],
      hasGroupBy: false, hasOrderBy: false, hasDistinct: false, rawSQL: sql,
    }
  }

  // Extract SELECT columns
  const selectMatch = upper.match(/SELECT\s+(DISTINCT\s+)?(.*?)\s+FROM\s+/s)
  const hasDistinct = upper.includes('SELECT DISTINCT')
  const rawCols = selectMatch ? selectMatch[2] : '*'
  const columns = rawCols === '*' ? ['*'] : rawCols.split(',').map((c) => c.trim().split(/\s+/).pop() ?? c.trim())

  // Extract FROM tables (before JOIN / WHERE / GROUP / ORDER / HAVING)
  const fromMatch = upper.match(/FROM\s+(.*?)(?:\s+(?:WHERE|GROUP BY|ORDER BY|HAVING|INNER JOIN|LEFT JOIN|RIGHT JOIN|JOIN|$))/s)
  const rawFrom = fromMatch ? fromMatch[1] : ''
  const tables = rawFrom
    .split(',')
    .map(extractTableName)
    .filter(Boolean)

  // Add JOIN tables
  for (const kw of JOIN_KEYWORDS) {
    const re = new RegExp(`${kw}\\s+(\\w+(?:\\.\\w+)?(?:\\s+\\w+)?)`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(upper)) !== null) {
      const t = extractTableName(m[1])
      if (t && !tables.includes(t)) tables.push(t)
    }
  }

  // WHERE clause
  const whereMatch = upper.match(/WHERE\s+(.*?)(?:\s+(?:GROUP BY|ORDER BY|HAVING)|$)/s)
  const whereClause = whereMatch ? whereMatch[1] : ''
  const predicates = parsePredicates(whereClause, tables)

  // JOIN conditions
  const joins = parseJoins(upper, tables)

  // Also treat WHERE join conditions as JoinCondition
  const whereJoins = extractWhereJoins(whereClause, tables)
  joins.push(...whereJoins)

  return {
    type: 'SELECT',
    tables,
    columns,
    predicates,
    joins,
    hasGroupBy: /\bGROUP BY\b/.test(upper),
    hasOrderBy: /\bORDER BY\b/.test(upper),
    hasDistinct,
    rawSQL: sql,
  }
}

function extractWhereJoins(whereClause: string, tables: string[]): JoinCondition[] {
  const joins: JoinCondition[] = []
  if (!whereClause) return joins

  const conditions = whereClause.split(/\bAND\b|\bOR\b/)
  for (const cond of conditions) {
    const m = cond.trim().match(/^(\w+\.\w+)\s*=\s*(\w+\.\w+)$/)
    if (m) {
      const [lt, lc] = resolveColumnRef(m[1], tables)
      const [rt, rc] = resolveColumnRef(m[2], tables)
      joins.push({ leftTable: lt, leftColumn: lc, rightTable: rt, rightColumn: rc, type: 'INNER' })
    }
  }
  return joins
}
