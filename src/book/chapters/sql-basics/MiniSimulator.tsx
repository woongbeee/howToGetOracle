import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EMPLOYEES, parseAndExecute, type ClauseDemo, type Employee, type GroupRow } from './shared'
import { SqlHighlight } from './SqlHighlight'

// ── MiniSimulatorTable ─────────────────────────────────────────────────────

export function MiniSimulatorTable({ sql }: { sql: string; lang?: 'ko' | 'en' }) {
  const ALL_COLS: Array<keyof Employee> = ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id']
  const parsed = parseAndExecute(sql, EMPLOYEES)

  function displayVal(emp: Employee, col: keyof Employee): string {
    return String(emp[col] ?? 'NULL')
  }

  if (parsed.type === 'GROUPBY' && parsed.groupRows) {
    const cols = parsed.groupCols ?? ['dept_id', 'cnt']
    const DEPT_COLOR: Record<number, string> = { 10: 'bg-ios-blue-light', 20: 'bg-ios-teal-light', 30: 'bg-muted/40' }
    return (
      <>
        <div className="overflow-x-auto rounded-lg border text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/60">
                {cols.map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.groupRows.map((g: GroupRow) => (
                <tr key={g.dept_id} className={cn('border-b last:border-0', DEPT_COLOR[g.dept_id] ?? '')}>
                  {cols.map((col) => {
                    const val = col === 'dept_id' ? g.dept_id
                      : col === 'cnt'       ? g.cnt
                      : col === 'avg_sal'   ? g.avg_sal
                      : col === 'total_sal' ? g.total_sal
                      : col === 'max_sal'   ? g.max_sal
                      : col === 'min_sal'   ? g.min_sal
                      : '—'
                    return (
                      <td key={col} className="px-2 py-1.5 font-mono text-[10px] font-medium">{String(val ?? '—')}</td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="font-mono text-[11px]">
          <span className="text-ios-teal-dark font-bold">{parsed.groupRows.length} groups</span>
        </div>
      </>
    )
  }

  const isDistinctQuery = /^\s*SELECT\s+DISTINCT\s+/i.test(sql)

  if (isDistinctQuery && parsed.type === 'SELECT' && parsed.columns.length > 0) {
    return (
      <>
        <div className="overflow-x-auto rounded-lg border text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/60">
                {(parsed.columns as string[]).map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.matchedRows.map((r, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-ios-teal-light' : 'bg-ios-teal-light/50')}
                >
                  {(parsed.columns as Array<keyof Employee>).map((col) => (
                    <td key={col} className="px-2 py-1 font-mono text-[10px] font-medium text-ios-teal-dark">
                      {String(r[col] ?? 'NULL')}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="font-mono text-[11px]">
          <span className="text-emerald-600 font-bold">{parsed.matchedRows.length} distinct rows</span>
        </div>
      </>
    )
  }

  const matchedIds = new Set(parsed.matchedRows.map((r) => r.emp_id))
  const updatedMap = new Map<number, Employee>()
  if (parsed.type === 'UPDATE') parsed.resultRows.forEach((r) => updatedMap.set(r.emp_id, r))

  const showCols: Array<keyof Employee> =
    parsed.type === 'SELECT' && parsed.columns.length > 0
      ? (parsed.columns as Array<keyof Employee>)
      : ALL_COLS

  const hasWhere = parsed.whereExpr !== ''
  const baseRows: Employee[] =
    parsed.type === 'SELECT' && parsed.orderKey
      ? parsed.resultRows.map((r) => EMPLOYEES.find((e) => e.emp_id === r.emp_id)!).filter(Boolean)
      : (hasWhere || parsed.type === 'UPDATE' || parsed.type === 'DELETE')
        ? EMPLOYEES.filter((e) => matchedIds.has(e.emp_id))
        : EMPLOYEES

  return (
    <>
      <div className="overflow-x-auto rounded-lg border text-xs">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/60">
              {showCols.map((h) => {
                const isOrderKey = parsed.orderKey === h || parsed.orderKey2 === h
                const dir = parsed.orderKey === h ? parsed.orderDir : parsed.orderDir2
                return (
                  <th key={h} className={cn('whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold', isOrderKey ? 'text-ios-blue' : 'text-muted-foreground')}>
                    {h}{isOrderKey ? (dir === 'DESC' ? ' ↓' : ' ↑') : ''}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {baseRows.map((emp, i) => {
              const matched    = matchedIds.has(emp.emp_id)
              const isDeleted  = parsed.type === 'DELETE' && matched
              const displayRow = parsed.type === 'UPDATE' && matched && updatedMap.has(emp.emp_id)
                ? updatedMap.get(emp.emp_id)! : emp

              return (
                <motion.tr
                  key={emp.emp_id}
                  initial={parsed.orderKey ? { opacity: 0, y: -4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: parsed.orderKey ? i * 0.04 : 0 }}
                  className={cn(
                    'border-b last:border-0',
                    matched && !isDeleted && !parsed.orderKey && 'bg-ios-blue-light',
                    isDeleted && 'bg-ios-red-light',
                  )}
                >
                  {showCols.map((col) => {
                    const origVal = parsed.type === 'UPDATE' && matched ? displayVal(emp, col) : undefined
                    const newVal  = displayVal(displayRow, col)
                    const changed = origVal !== undefined && origVal !== newVal
                    return (
                      <td key={col} className={cn('px-2 py-1 font-mono text-[10px]', isDeleted && 'line-through text-ios-red')}>
                        {changed ? (
                          <span>
                            <span className="text-ios-red line-through mr-1">{origVal}</span>
                            <span className="text-ios-teal-dark font-bold">{newVal}</span>
                          </span>
                        ) : newVal}
                      </td>
                    )
                  })}
                </motion.tr>
              )
            })}

          </tbody>
        </table>
      </div>
      <div className="font-mono text-[11px]">
        {parsed.type === 'SELECT' && <span className="text-ios-teal-dark font-bold">{matchedIds.size} rows returned</span>}
        {parsed.type === 'UPDATE' && <span className="text-ios-orange-dark font-bold">{matchedIds.size} rows updated</span>}
        {parsed.type === 'DELETE' && <span className="text-ios-red-dark font-bold">{matchedIds.size} rows deleted</span>}
      </div>
    </>
  )
}

// ── MiniSimulator ──────────────────────────────────────────────────────────

export function MiniSimulator({
  demo,
  lang,
  variantIdx = 0,
}: {
  demo: ClauseDemo
  lang: 'ko' | 'en'
  variantIdx?: number
}) {
  const variants   = demo.variants
  const activeSql  = variants ? variants[variantIdx].sql  : demo.sql
  const activeDesc = variants ? variants[variantIdx].desc[lang] : undefined

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSql}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col gap-2"
        >
          <div className="rounded-lg border bg-muted/60 px-4 py-3">
            <SqlHighlight sql={activeSql} />
          </div>
          {activeDesc && (
            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{activeDesc}</p>
          )}
          <MiniSimulatorTable sql={activeSql} lang={lang} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── ClickableSyntaxRow ─────────────────────────────────────────────────────

export function ClickableSyntaxRow({
  lang,
  demo,
  header,
  rows,
  topContent,
  bottomContent,
}: {
  lang: 'ko' | 'en'
  demo: ClauseDemo
  header: string[]
  rows: string[][]
  topContent?: React.ReactNode
  bottomContent?: React.ReactNode
}) {
  const [selectedRow, setSelectedRow] = useState(0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div>
        {topContent}
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {header.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  onClick={() => setSelectedRow(ri)}
                  className={cn(
                    'cursor-pointer border-b last:border-0 transition-colors',
                    ri === selectedRow
                      ? 'bg-ios-blue-light outline outline-1 outline-ios-blue/30'
                      : ri % 2 === 0 ? 'bg-background hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40',
                  )}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-3 py-1.5 font-mono text-[11px]',
                        ri === selectedRow ? 'text-ios-blue-dark font-medium' : 'text-foreground/80',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bottomContent}
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <MiniSimulator demo={demo} lang={lang} variantIdx={selectedRow} />
      </div>
    </div>
  )
}

// ── SyntaxRow ──────────────────────────────────────────────────────────────

export function SyntaxRow({
  left,
  demo,
  lang,
}: {
  left: React.ReactNode
  demo: ClauseDemo
  lang: 'ko' | 'en'
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div>{left}</div>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <MiniSimulator demo={demo} lang={lang} />
      </div>
    </div>
  )
}
