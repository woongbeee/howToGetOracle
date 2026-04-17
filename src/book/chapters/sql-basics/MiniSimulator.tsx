import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EMPLOYEES, parseAndExecute, type ClauseDemo, type Employee, type GroupRow } from './shared'
import { SqlHighlight } from './SqlHighlight'

// ── MiniSimulatorTable ─────────────────────────────────────────────────────

export function MiniSimulatorTable({ sql }: { sql: string }) {
  const ALL_COLS: Array<keyof Employee> = ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id']
  const parsed = parseAndExecute(sql, EMPLOYEES)

  if (parsed.type === 'GROUPBY' && parsed.groupRows) {
    const cols = parsed.groupCols ?? ['dept_id', 'cnt']
    const DEPT_COLOR: Record<number, string> = { 10: 'bg-blue-50', 20: 'bg-violet-50', 30: 'bg-orange-50' }
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
          <span className="text-violet-600 font-bold">{parsed.groupRows.length} groups</span>
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
                  className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-emerald-50' : 'bg-emerald-50/50')}
                >
                  {(parsed.columns as Array<keyof Employee>).map((col) => (
                    <td key={col} className="px-2 py-1 font-mono text-[10px] font-medium text-emerald-800">
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

  const displayOrder: Employee[] =
    parsed.type === 'SELECT' && parsed.orderKey
      ? parsed.resultRows.map((r) => EMPLOYEES.find((e) => e.emp_id === r.emp_id)!).filter(Boolean)
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
                  <th key={h} className={cn('whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold', isOrderKey ? 'text-blue-600' : 'text-muted-foreground')}>
                    {h}{isOrderKey ? (dir === 'DESC' ? ' ↓' : ' ↑') : ''}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayOrder.map((emp, i) => {
              const matched   = matchedIds.has(emp.emp_id)
              const isDeleted = parsed.type === 'DELETE' && matched
              const displayRow = parsed.type === 'UPDATE' && matched && updatedMap.has(emp.emp_id)
                ? updatedMap.get(emp.emp_id)! : emp

              return (
                <motion.tr
                  key={emp.emp_id}
                  initial={parsed.orderKey ? { opacity: 0, y: -4 } : false}
                  animate={
                    parsed.type === 'DELETE'
                      ? { opacity: isDeleted ? 0.3 : 1, y: 0 }
                      : matched ? { opacity: 1, y: 0 } : { opacity: 0.35, y: 0 }
                  }
                  transition={{ duration: 0.2, delay: parsed.orderKey ? i * 0.04 : 0 }}
                  className={cn(
                    'border-b last:border-0',
                    matched && !isDeleted && !parsed.orderKey && 'bg-orange-50',
                    isDeleted && 'bg-rose-50',
                  )}
                >
                  {showCols.map((col) => {
                    const origVal = parsed.type === 'UPDATE' && matched ? emp[col] : undefined
                    const newVal  = displayRow[col]
                    const changed = origVal !== undefined && origVal !== newVal
                    return (
                      <td key={col} className={cn('px-2 py-1 font-mono text-[10px]', isDeleted && 'line-through text-rose-400')}>
                        {changed ? (
                          <span>
                            <span className="text-rose-400 line-through mr-1">{String(origVal)}</span>
                            <span className="text-emerald-600 font-bold">{String(newVal)}</span>
                          </span>
                        ) : String(newVal ?? 'NULL')}
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
        {parsed.type === 'SELECT' && <span className="text-emerald-600 font-bold">{matchedIds.size} rows returned</span>}
        {parsed.type === 'UPDATE' && <span className="text-amber-600 font-bold">{matchedIds.size} rows updated</span>}
        {parsed.type === 'DELETE' && <span className="text-rose-600 font-bold">{matchedIds.size} rows deleted</span>}
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
          <MiniSimulatorTable sql={activeSql} />
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
                      ? 'bg-orange-50 outline outline-1 outline-orange-300'
                      : ri % 2 === 0 ? 'bg-background hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40',
                  )}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-3 py-1.5 font-mono text-[11px]',
                        ri === selectedRow ? 'text-orange-800 font-medium' : 'text-foreground/80',
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
