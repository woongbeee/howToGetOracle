import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
} from '../shared'
import {
  EMPLOYEES, EXAMPLE_QUERIES, SELECT_STEPS, UPDATE_STEPS, DELETE_STEPS,
  STEP_COLOR, parseAndExecute, type ParsedQuery, type ExampleQuery,
} from './shared'
import { SqlHighlight } from './SqlHighlight'
import { EmpRow } from './EmpRow'

const T = {
  ko: {
    chapterTitle: 'SQL 실행 순서',
    chapterSubtitle: 'Oracle이 SQL을 처리하는 논리적 순서를 예제 쿼리별로 확인합니다.',
    pickQuery: '예제 쿼리를 선택하면 실행 순서가 바로 표시됩니다.',
    stepsTitle: '실행 순서',
    tableTitle: 'EMPLOYEES 테이블',
    resultTitle: '쿼리 결과',
    groupResultTitle: 'GROUP BY 결과',
    rowsMatched: (n: number) => `${n}개 행 일치`,
    updatedRows: (n: number) => `${n}개 행 수정`,
    deletedRows: (n: number) => `${n}개 행 삭제`,
    groupRows: (n: number) => `${n}개 그룹`,
    mergeSourceTitle: '원본 테이블 (SOURCE)',
    mergeTargetTitle: '대상 테이블 (TARGET)',
    mergeResultTitle: 'MERGE 결과',
  },
  en: {
    chapterTitle: 'SQL Execution Order',
    chapterSubtitle: 'See how Oracle logically processes SQL — step by step — for each example query.',
    pickQuery: 'Click an example query to instantly see the execution order.',
    stepsTitle: 'Execution Order',
    tableTitle: 'EMPLOYEES Table',
    resultTitle: 'Query Result',
    groupResultTitle: 'GROUP BY Result',
    rowsMatched: (n: number) => `${n} row${n === 1 ? '' : 's'} matched`,
    updatedRows: (n: number) => `${n} row${n === 1 ? '' : 's'} updated`,
    deletedRows: (n: number) => `${n} row${n === 1 ? '' : 's'} deleted`,
    groupRows: (n: number) => `${n} group${n === 1 ? '' : 's'}`,
    mergeSourceTitle: 'Source Table (SOURCE)',
    mergeTargetTitle: 'Target Table (TARGET)',
    mergeResultTitle: 'MERGE Result',
  },
}

export { T as ExecutionT }


// ── Result table ────────────────────────────────────────────────────────────

function ResultTable({ parsed, t, lang, overrideResult }: {
  parsed: ParsedQuery
  t: typeof T['ko']
  lang: 'ko' | 'en'
  overrideResult?: ExampleQuery['overrideResult']
}) {
  const ALL_COLUMNS = ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id'] as const
  type EmpKey = typeof ALL_COLUMNS[number]

  if (overrideResult) {
    const { columns, rows, summary } = overrideResult
    const summaryText = summary ? summary[lang] : (lang === 'ko' ? `${rows.length}개 행` : `${rows.length} rows`)
    return (
      <div>
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.resultTitle} — <span className="text-ios-teal-dark">{summaryText}</span>
        </div>
        <div className="inline-block rounded-lg border">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {columns.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                      {row[c] == null
                        ? <span className="italic text-muted-foreground/50">NULL</span>
                        : String(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (parsed.type === 'GROUPBY' && parsed.groupRows) {
    const cols = parsed.groupCols ?? ['dept_id']
    return (
      <div>
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.groupResultTitle} — {t.groupRows(parsed.groupRows.length)}
        </div>
        <div className="inline-block rounded-lg border">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {MERGE_COLS.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.groupRows.map((row, i) => (
                <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                  {cols.map((c) => (
                    <td key={c} className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                      {String((row as unknown as Record<string, unknown>)[c] ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (parsed.type === 'SELECT') {
    const headers: EmpKey[] = parsed.columns.length > 0
      ? (parsed.columns as EmpKey[])
      : [...ALL_COLUMNS]
    const summaryText = t.rowsMatched(parsed.resultRows.length)
    return (
      <div>
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.resultTitle} — <span className="text-ios-teal-dark">{summaryText}</span>
        </div>
        <div className="inline-block rounded-lg border">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.resultRows.map((row, i) => (
                <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                  {headers.map((c) => (
                    <td key={c} className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                      {String(row[c] ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (parsed.type === 'UPDATE') {
    return (
      <div>
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.resultTitle} — <span className="text-ios-orange-dark">{t.updatedRows(parsed.matchedRows.length)}</span>
        </div>
        <div className="inline-block rounded-lg border">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {ALL_COLUMNS.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.matchedRows.map((emp) => {
                const resultRow = parsed.resultRows.find((r) => r.emp_id === emp.emp_id)
                return (
                  <EmpRow
                    key={emp.emp_id}
                    row={resultRow ?? emp}
                    highlighted={true}
                    deleted={false}
                    columns={[]}
                    original={emp}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (parsed.type === 'DELETE') {
    return (
      <div>
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.resultTitle} — <span className="text-ios-red-dark">{t.deletedRows(parsed.matchedRows.length)}</span>
        </div>
        <div className="inline-block rounded-lg border">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {ALL_COLUMNS.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.matchedRows.map((emp) => (
                <EmpRow
                  key={emp.emp_id}
                  row={emp}
                  highlighted={true}
                  deleted={true}
                  columns={[]}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null
}

// ── Merge panel ─────────────────────────────────────────────────────────────

const MERGE_COLS = ['emp_id', 'first_name', 'dept_id', 'salary']

function SimpleTable({ rows, highlightIds, strikeIds, joinKey }: {
  rows: Record<string, unknown>[]
  highlightIds?: unknown[]
  strikeIds?: unknown[]
  joinKey: string
}) {
  return (
    <div className="inline-block rounded-lg border overflow-hidden">
      <table className="text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {MERGE_COLS.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const id = row[joinKey]
            const isHighlighted = highlightIds?.includes(id)
            const isStruck = strikeIds?.includes(id)
            return (
              <tr key={i} className={cn('border-b last:border-0', isHighlighted ? 'bg-brand-navy-light' : (i % 2 === 0 ? 'bg-background' : 'bg-muted/20'))}>
                {MERGE_COLS.map((c) => (
                  <td key={c} className={cn('px-3 py-1.5 font-mono text-[11px] whitespace-nowrap', isStruck ? 'line-through text-muted-foreground/50' : 'text-foreground/80')}>
                    {String(row[c] ?? 'NULL')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MergePanel({ mergeData, t }: {
  mergeData: NonNullable<ExampleQuery['mergeData']>
  t: typeof T['ko']
}) {
  const statusStyle: Record<string, string> = {
    updated:   'bg-ios-orange-light border-ios-orange/30',
    inserted:  'bg-ios-teal-light border-ios-teal/30',
    unchanged: '',
  }
  const statusBadge: Record<string, { cls: string; label: string }> = {
    updated:   { cls: 'bg-brand-orange/20 text-ios-orange-dark', label: 'UPDATED'  },
    inserted:  { cls: 'bg-brand-teal/20 text-ios-teal-dark',     label: 'INSERTED' },
    unchanged: { cls: 'bg-muted text-muted-foreground',             label: '—'        },
  }

  return (
    <div className="flex flex-col gap-5">
      {/* SOURCE + TARGET side by side */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.mergeSourceTitle}
          </div>
          <SimpleTable
            rows={mergeData.sourceRows}
            highlightIds={[...mergeData.matchedIds, ...mergeData.insertedIds]}
            joinKey={mergeData.joinKey}
          />
        </div>
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.mergeTargetTitle}
          </div>
          <SimpleTable
            rows={mergeData.targetRows}
            highlightIds={mergeData.matchedIds}
            joinKey={mergeData.joinKey}
          />
        </div>
      </div>

      {/* Result */}
      <div>
        <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.mergeResultTitle} —{' '}
          <span className="text-ios-orange-dark">{mergeData.matchedIds.length}개 Updated</span>
          {' · '}
          <span className="text-ios-teal-dark">{mergeData.insertedIds.length}개 Inserted</span>
        </div>
        <div className="inline-block rounded-lg border overflow-hidden">
          <table className="text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                {MERGE_COLS.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
                <th className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">status</th>
              </tr>
            </thead>
            <tbody>
              {mergeData.resultRows.map((row, i) => {
                const status = String(row['_status'] ?? 'unchanged')
                const orig = mergeData.targetRows.find((r) => r[mergeData.joinKey] === row[mergeData.joinKey])
                return (
                  <tr key={i} className={cn('border-b last:border-0 transition-colors', statusStyle[status] ?? (i % 2 === 0 ? 'bg-background' : 'bg-muted/20'))}>
                    {MERGE_COLS.map((c) => {
                      const isChangedSalary = c === 'salary' && status === 'updated' && orig && orig[c] !== row[c]
                      return (
                        <td key={c} className={cn('px-3 py-1.5 font-mono text-[11px] whitespace-nowrap', isChangedSalary ? 'font-bold text-ios-orange-dark' : 'text-foreground/80')}>
                          {String(row[c] ?? 'NULL')}
                          {isChangedSalary && (
                            <span className="ml-1.5 font-normal text-muted-foreground/60 line-through text-[10px]">
                              {String(orig[c])}
                            </span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', statusBadge[status]?.cls)}>
                        {statusBadge[status]?.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function ExecutionSimulator({ lang, t }: { lang: 'ko' | 'en'; t: typeof T['ko'] }) {
  const [selectedId, setSelectedId] = useState<string>(EXAMPLE_QUERIES[0].id)

  const selectedQuery = EXAMPLE_QUERIES.find((q) => q.id === selectedId) ?? EXAMPLE_QUERIES[0]
  const parsed = parseAndExecute(selectedQuery.sql, EMPLOYEES)

  const steps =
    selectedQuery.steps ? selectedQuery.steps :
    parsed.type === 'UPDATE' ? UPDATE_STEPS :
    parsed.type === 'DELETE' ? DELETE_STEPS :
    SELECT_STEPS

  const ALL_COLUMNS = ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id'] as const

  return (
    <PageContainer className="max-w-[1200px]">
      <ChapterTitle icon="📋" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      {/* Query picker */}
      <div className="mb-6">
        <Prose>{t.pickQuery}</Prose>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedId(q.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-[11px] transition-all',
                selectedId === q.id
                  ? 'border-brand-navy/40 bg-brand-navy-light text-brand-navy-dark font-bold shadow-sm'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
              )}
            >
              {q.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Steps (left) + Table & Result (right) */}
      <div className="flex gap-6 items-start">

        {/* Left: SQL + execution steps — fixed width, vertical list */}
        <div className="w-[414px] shrink-0">

          {/* SQL display */}
          <div className="mb-4 rounded-xl border overflow-hidden">
            <div className="border-b px-4 py-2">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL</span>
            </div>
            <div className="p-4">
              <SqlHighlight sql={selectedQuery.sql} />
            </div>
          </div>
          <SectionTitle>{t.stepsTitle}</SectionTitle>
          <div className="flex flex-col gap-2">
            {steps.map((step, idx) => {
              const c = STEP_COLOR[step.color] ?? STEP_COLOR.blue
              return (
                <div key={step.id} className={cn('rounded-lg border p-3', c.bg, c.border)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', c.dot)} />
                    <span className={cn('font-mono text-[11px] font-bold', c.text)}>{step.phase}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60 ml-auto">
                      Step {idx + 1}
                    </span>
                  </div>
                  <p className={cn('text-[11px] leading-relaxed', c.text)}>{step.desc[lang]}</p>
                  {step.hint && (
                    <div className="mt-2 rounded border border-muted-foreground/20 bg-white/60 px-2.5 py-1.5">
                      <span className="mr-1 text-[10px]">💡</span>
                      <span className="text-[10px] leading-relaxed text-muted-foreground">{step.hint[lang]}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: tables + result — takes remaining space */}
        <div className="min-w-0 flex-1 flex flex-col gap-6">
          {selectedQuery.type === 'MERGE' && selectedQuery.mergeData ? (
            <MergePanel mergeData={selectedQuery.mergeData} t={t} />
          ) : (
            <>
              <div>
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t.tableTitle}
                </div>
                <div className="inline-block rounded-lg border overflow-x-auto">
                  <table className="text-xs">
                    <thead>
                      <tr className="border-b bg-muted/60">
                        {ALL_COLUMNS.map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const isFiltered = parsed.type === 'UPDATE' || parsed.type === 'DELETE' || parsed.matchedRows.length < EMPLOYEES.length
                        const displayRows = isFiltered
                          ? EMPLOYEES.filter((e) => parsed.matchedRows.some((r) => r.emp_id === e.emp_id))
                          : EMPLOYEES
                        return displayRows.map((emp) => {
                          const isHighlighted = parsed.matchedRows.some((r) => r.emp_id === emp.emp_id)
                          const resultRow = parsed.resultRows.find((r) => r.emp_id === emp.emp_id)
                          const isDeleted = parsed.type === 'DELETE' && isHighlighted
                          return (
                            <EmpRow
                              key={emp.emp_id}
                              row={parsed.type === 'UPDATE' && resultRow ? resultRow : emp}
                              highlighted={isHighlighted}
                              deleted={!!isDeleted}
                              columns={[]}
                              original={parsed.type === 'UPDATE' && isHighlighted ? emp : undefined}
                            />
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              <ResultTable parsed={parsed} t={t} lang={lang} overrideResult={selectedQuery.overrideResult} />
            </>
          )}
        </div>

      </div>
    </PageContainer>
  )
}
