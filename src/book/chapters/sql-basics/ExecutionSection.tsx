import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle, SubTitle,
  Prose,
} from '../shared'
import {
  EMPLOYEES, EXAMPLE_QUERIES, SELECT_STEPS, UPDATE_STEPS, DELETE_STEPS,
  STEP_COLOR, parseAndExecute, type ParsedQuery,
} from './shared'
import { SqlHighlight } from './SqlHighlight'
import { EmpRow } from './EmpRow'

const T = {
  ko: {
    chapterTitle: 'SQL 실행 순서 시뮬레이터',
    chapterSubtitle: 'SELECT, FROM, WHERE, UPDATE, DELETE의 핵심 문법과 실행 순서를 인터랙티브 시뮬레이션으로 학습합니다.',
    simSectionTitle: 'SQL 실행 순서 시뮬레이터',
    simIntro:
      '아래 예제 쿼리를 선택하거나 직접 입력한 후 실행 버튼을 누르면 Oracle이 SQL을 처리하는 논리적 순서를 단계별로 시각화합니다.',
    runBtn: '실행',
    resetBtn: '초기화',
    selectQuery: '쿼리 선택',
    resultTitle: '결과',
    stepsTitle: '실행 단계',
    tablePreviewTitle: '예제 테이블 — EMPLOYEES',
    rowsMatched: (n: number) => `${n}개 행이 조건에 일치합니다.`,
    updatedRows: (n: number) => `${n}개 행이 수정됩니다.`,
    deletedRows: (n: number) => `${n}개 행이 삭제됩니다.`,
  },
  en: {
    chapterTitle: 'SQL Execution Order Simulator',
    chapterSubtitle: 'Learn SELECT, FROM, WHERE, UPDATE, and DELETE through interactive simulations with step-by-step execution visualization.',
    simSectionTitle: 'SQL Execution Order Simulator',
    simIntro:
      'Select an example query below or type your own, then click Run to visualize how Oracle logically processes the SQL step by step.',
    runBtn: 'Run',
    resetBtn: 'Reset',
    selectQuery: 'Select query',
    resultTitle: 'Result',
    stepsTitle: 'Execution Steps',
    tablePreviewTitle: 'Sample Table — EMPLOYEES',
    rowsMatched: (n: number) => `${n} row${n === 1 ? '' : 's'} match the condition.`,
    updatedRows: (n: number) => `${n} row${n === 1 ? '' : 's'} will be updated.`,
    deletedRows: (n: number) => `${n} row${n === 1 ? '' : 's'} will be deleted.`,
  },
}

export function ExecutionSimulator({ lang, t }: { lang: 'ko' | 'en'; t: typeof T['ko'] }) {
  const [selectedQueryId, setSelectedQueryId] = useState<string>(EXAMPLE_QUERIES[0].id)
  const [customSql, setCustomSql] = useState('')
  const [activeSql, setActiveSql] = useState(EXAMPLE_QUERIES[0].sql)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [parsed, setParsed] = useState<ParsedQuery | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const steps =
    parsed?.type === 'UPDATE' ? UPDATE_STEPS :
    parsed?.type === 'DELETE' ? DELETE_STEPS :
    SELECT_STEPS

  const activeClause = currentStepIdx >= 0 ? steps[currentStepIdx]?.highlightClause : undefined

  function handleQuerySelect(id: string) {
    const q = EXAMPLE_QUERIES.find((eq) => eq.id === id)
    if (!q) return
    setSelectedQueryId(id)
    setActiveSql(q.sql)
    setCustomSql('')
    reset()
  }

  function handleCustomChange(v: string) {
    setCustomSql(v)
    setActiveSql(v)
    setSelectedQueryId('')
    reset()
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsRunning(false)
    setIsComplete(false)
    setCurrentStepIdx(-1)
    setExpandedStep(null)
    setParsed(null)
  }

  function runSimulation() {
    if (isRunning) return
    const result = parseAndExecute(activeSql, EMPLOYEES)
    setParsed(result)
    setCurrentStepIdx(-1)
    setExpandedStep(null)
    setIsComplete(false)
    setIsRunning(true)

    const stepList = result.type === 'UPDATE' ? UPDATE_STEPS : result.type === 'DELETE' ? DELETE_STEPS : SELECT_STEPS
    let idx = 0
    function advance() {
      setCurrentStepIdx(idx)
      idx++
      if (idx < stepList.length) {
        timerRef.current = setTimeout(advance, 1800)
      } else {
        setIsRunning(false)
        setIsComplete(true)
      }
    }
    timerRef.current = setTimeout(advance, 600)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const ALL_COLUMNS: Array<keyof typeof EMPLOYEES[0]> = ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id']

  const selectStepIdx = SELECT_STEPS.findIndex((s) => s.id === 'select')
  const projectionApplied =
    parsed?.type === 'SELECT' &&
    parsed.columns.length > 0 &&
    (isComplete || currentStepIdx > selectStepIdx)

  const tableHeaders = projectionApplied
    ? (parsed!.columns as Array<keyof typeof EMPLOYEES[0]>)
    : ALL_COLUMNS

  const visibleColumns = projectionApplied ? parsed!.columns : []

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle icon="📋" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.simSectionTitle}</SectionTitle>
      <Prose>{t.simIntro}</Prose>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Left: Query editor ── */}
        <div className="flex flex-col gap-4">
          <div>
            <SubTitle>{t.selectQuery}</SubTitle>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleQuerySelect(q.id)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 font-mono text-[11px] transition-all',
                    selectedQueryId === q.id
                      ? 'border-blue-400 bg-blue-50 text-blue-700 font-bold'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
                  )}
                >
                  {q.label[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-zinc-950 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL</span>
            </div>
            <div className="relative p-5">
              {customSql === '' && (
                <div className="pointer-events-none absolute inset-5">
                  <SqlHighlight sql={activeSql} activeClause={activeClause} />
                </div>
              )}
              <textarea
                value={customSql !== '' ? customSql : activeSql}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="relative z-10 w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-transparent caret-white focus:text-foreground/80 outline-none selection:bg-blue-800/50"
                rows={5}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={reset}
              className="rounded-lg border border-border bg-muted px-4 py-2 font-mono text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              {t.resetBtn}
            </button>
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className={cn(
                'flex-1 rounded-lg border px-4 py-2 font-mono text-xs font-bold transition-all',
                isRunning
                  ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                  : 'border-emerald-600 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-sm',
              )}
            >
              {isRunning ? '▶ 실행 중...' : `▶ ${t.runBtn}`}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <SubTitle>{t.stepsTitle}</SubTitle>
              {isComplete && (
                <span className="mb-2 font-mono text-[10px] text-muted-foreground">
                  {lang === 'ko' ? '— 클릭해서 설명 펼치기' : '— click to expand'}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {steps.map((step, idx) => {
                const c = STEP_COLOR[step.color] ?? STEP_COLOR.blue
                const isActive = !isComplete && idx === currentStepIdx
                const isDone = isComplete || (currentStepIdx >= 0 && idx < currentStepIdx)
                const isExpanded = isComplete && expandedStep === idx

                return (
                  <motion.div
                    key={step.id}
                    animate={
                      isActive
                        ? { scale: 1.01, opacity: 1 }
                        : isDone
                        ? { scale: 1, opacity: 1 }
                        : { scale: 1, opacity: 0.4 }
                    }
                    transition={{ duration: 0.25 }}
                    onClick={() => {
                      if (isComplete) setExpandedStep(expandedStep === idx ? null : idx)
                    }}
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      isActive && `${c.bg} ${c.border}`,
                      isExpanded && `${c.bg} ${c.border}`,
                      !isActive && !isExpanded && isDone && 'border-emerald-200 bg-emerald-50/40',
                      !isActive && !isExpanded && !isDone && 'border-border bg-card',
                      isComplete && 'cursor-pointer hover:brightness-95',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        isActive ? c.dot : isDone ? 'bg-emerald-400' : 'bg-muted-foreground/30',
                      )} />
                      <span className={cn(
                        'font-mono text-[11px] font-bold flex-1',
                        isActive ? c.text : isDone ? 'text-emerald-700' : 'text-muted-foreground/50',
                      )}>
                        {step.phase}
                      </span>
                      {isComplete && (
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {(isActive || isExpanded) && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn('text-[11px] leading-relaxed overflow-hidden mt-1', isExpanded ? c.text : c.text)}
                        >
                          {step.desc[lang]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Right: Table visualization ── */}
        <div className="flex flex-col gap-4">
          <div>
            <SubTitle>{t.tablePreviewTitle}</SubTitle>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/60">
                    {tableHeaders.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EMPLOYEES.map((emp) => {
                    const isHighlighted = parsed !== null &&
                      parsed.matchedRows.some((r) => r.emp_id === emp.emp_id)
                    const resultRow = parsed?.resultRows.find((r) => r.emp_id === emp.emp_id)
                    const isDeleted = parsed?.type === 'DELETE' && isHighlighted

                    return (
                      <EmpRow
                        key={emp.emp_id}
                        row={parsed?.type === 'UPDATE' && resultRow ? resultRow : emp}
                        highlighted={isHighlighted}
                        deleted={!!isDeleted}
                        columns={visibleColumns}
                        original={parsed?.type === 'UPDATE' && isHighlighted ? emp : undefined}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <AnimatePresence>
            {parsed && currentStepIdx >= 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-lg border bg-card p-4"
              >
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t.resultTitle}
                </div>
                {parsed.type === 'SELECT' && (
                  <p className="font-mono text-xs text-emerald-600 font-bold">
                    {t.rowsMatched(parsed.matchedRows.length)}
                  </p>
                )}
                {parsed.type === 'UPDATE' && (
                  <p className="font-mono text-xs text-amber-600 font-bold">
                    {t.updatedRows(parsed.matchedRows.length)}
                  </p>
                )}
                {parsed.type === 'DELETE' && (
                  <p className="font-mono text-xs text-rose-600 font-bold">
                    {t.deletedRows(parsed.matchedRows.length)}
                  </p>
                )}

                {parsed.type === 'SELECT' && !isRunning && currentStepIdx >= steps.length - 1 && (
                  <div className="mt-3 overflow-x-auto rounded border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/60">
                          {tableHeaders.map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.resultRows.map((row, i) => (
                          <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                            {tableHeaders.map((c) => (
                              <td key={c} className="px-3 py-1.5 font-mono text-[11px] text-foreground/80">
                                {String(row[c] ?? 'NULL')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  )
}

export { T as ExecutionT }
