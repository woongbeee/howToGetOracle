import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import type { StepSummary, SimulationStep } from '@/store/simulationStore'
import { SAMPLE_QUERIES } from '@/data/index'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Step result styles ─────────────────────────────────────────────────────

const RESULT_CLS: Record<StepSummary['result'], { dot: string; badge: string; selected: string }> = {
  hit:  { dot: 'bg-blue-500',   badge: 'border-blue-200 text-blue-700',   selected: 'bg-blue-50 border-blue-200' },
  miss: { dot: 'bg-orange-500', badge: 'border-orange-200 text-orange-700', selected: 'bg-orange-50 border-orange-200' },
  ok:   { dot: 'bg-green-500',  badge: 'border-green-200 text-green-700',  selected: 'bg-green-50 border-green-200' },
  info: { dot: 'bg-amber-500',  badge: 'border-amber-200 text-amber-700',  selected: 'bg-amber-50 border-amber-200' },
}

// ── Live log ───────────────────────────────────────────────────────────────

export function LiveLog() {
  const stepLog = useSimulationStore((s) => s.stepLog)
  const lang = useSimulationStore((s) => s.lang)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stepLog.length])

  return (
    <div className="flex h-full flex-col justify-end gap-0.5">
      {stepLog.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          {lang === 'ko'
            ? '쿼리를 실행하면 Oracle 내부 처리 과정이 여기에 표시됩니다.'
            : 'Run a query to see Oracle internal processing steps here.'}
        </p>
      ) : (
        stepLog.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 font-mono text-xs"
          >
            <span className="whitespace-nowrap text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', { hour12: false })}
            </span>
            <span className="text-orange-500">›</span>
            <span className="text-foreground">{log.message}</span>
          </motion.div>
        ))
      )}
      <div ref={endRef} />
    </div>
  )
}

// ── Summary timeline ───────────────────────────────────────────────────────

function SummaryItem({
  summary, index, isSelected, isCurrent, onClick,
}: {
  summary: StepSummary
  index: number
  isSelected: boolean
  isCurrent: boolean
  onClick: () => void
}) {
  const c = RESULT_CLS[summary.result]

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition-all',
        isSelected ? c.selected : isCurrent ? 'border-border bg-muted/40' : 'border-transparent hover:border-border hover:bg-muted/40'
      )}
    >
      {/* Step number */}
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold',
            isSelected ? `${c.dot} text-white` : 'bg-muted text-muted-foreground'
          )}
        >
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-foreground')}>
            {summary.label}
          </span>
          <Badge variant="outline" className={cn('shrink-0 h-4 font-mono text-[8px] font-bold uppercase', c.badge)}>
            {summary.result}
          </Badge>
        </div>
        {isSelected && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-0.5 font-mono text-[10px] leading-snug text-muted-foreground"
          >
            {summary.message}
          </motion.p>
        )}
      </div>
    </motion.button>
  )
}


export function SummaryTimeline({ selectedStep, onSelect }: {
  selectedStep: SimulationStep | null
  onSelect: (step: SimulationStep | null) => void
}) {
  const stepSummary = useSimulationStore((s) => s.stepSummary)
  const currentStep = useSimulationStore((s) => s.currentStep)
  const lang = useSimulationStore((s) => s.lang)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {lang === 'ko' ? '처리 요약' : 'Execution Summary'}
        </span>
        <div className="h-px flex-1 bg-border" />
        {selectedStep && (
          <button
            onClick={() => onSelect(null)}
            className="font-mono text-[9px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {lang === 'ko' ? '핀 해제 ✕' : 'Unpin ✕'}
          </button>
        )}
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {stepSummary
          .filter((s) => s.step !== 'complete')
          .map((s, i) => (
            <SummaryItem
              key={s.step + i}
              summary={s}
              index={i}
              isSelected={selectedStep === s.step}
              isCurrent={currentStep === s.step}
              onClick={() => onSelect(selectedStep === s.step ? null : s.step)}
            />
          ))}
      </div>
    </div>
  )
}

// ── SQL Syntax Highlighter ─────────────────────────────────────────────────

const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|AS|DISTINCT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|CONSTRAINT|VIEW|UNION|ALL|CASE|WHEN|THEN|ELSE|END|WITH|ASC|DESC|COUNT|SUM|AVG|MIN|MAX|COALESCE|NVL|DECODE|ROWNUM|ROWID)\b/gi

const SQL_NUMBERS = /\b\d+(\.\d+)?\b/g

function highlightSQL(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Split by string literals first to protect their contents from keyword matching
  return escaped.split(/('[^']*')/g).map((part, i) => {
    if (i % 2 === 1) {
      return `<span class="text-emerald-500">${part}</span>`
    }
    return part
      .replace(SQL_NUMBERS, (m) => `<span class="text-amber-500">${m}</span>`)
      .replace(SQL_KEYWORDS, (m) => `<span class="text-blue-500 font-bold">${m.toUpperCase()}</span>`)
  }).join('')
}

// ── Main Component ─────────────────────────────────────────────────────────

export function QueryInput() {
  const [input, setInput] = useState('')
  const { startSimulation, resetSimulation, isRunning, setHighlightedStep, flushBuffers } =
    useSimulationStore()
  const lang = useSimulationStore((s) => s.lang)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const handleRun = () => {
    const q = input.trim()
    if (!q || isRunning) return
    resetSimulation()
    setHighlightedStep(null)
    startSimulation(q)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun()
  }

  return (
    <div className="flex flex-col gap-2 bg-card p-3">

      {/* Sample queries */}
      <div className="flex flex-wrap gap-1">
        {SAMPLE_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => { setInput(q); textareaRef.current?.focus() }}
            className="rounded-md border bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            {q.length > 35 ? q.slice(0, 35) + '…' : q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 z-10 font-mono text-sm font-bold text-orange-500">
            SQL&gt;
          </span>
          {/* Highlight layer — sits behind the transparent textarea */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-transparent bg-background py-2 pl-14 pr-3 font-mono text-sm leading-[1.5rem]"
            dangerouslySetInnerHTML={{ __html: highlightSQL(input) || '' }}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder="SELECT * FROM EMPLOYEES"
            rows={2}
            disabled={isRunning}
            className="relative w-full resize-none rounded-lg border border-input bg-transparent py-2 pl-14 pr-3 font-mono text-sm text-transparent caret-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          />
        </div>

        <Button
          onClick={handleRun}
          disabled={!input.trim() || isRunning}
          className="self-end"
        >
          {isRunning ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              {lang === 'ko' ? '실행 중…' : 'Running…'}
            </motion.span>
          ) : 'RUN ⏎'}
        </Button>

        <Button
          variant="outline"
          onClick={() => flushBuffers()}
          disabled={isRunning}
          title={lang === 'ko'
            ? 'Buffer Cache의 Dirty Buffer를 DBWn이 Data File로 씁니다 (Checkpoint)'
            : 'DBWn writes Dirty Buffers from Buffer Cache to Data Files (Checkpoint)'}
          className="self-end font-mono text-sm"
        >
          Buffer Flush
        </Button>

        <Button
          variant="ghost"
          onClick={() => { resetSimulation(); setHighlightedStep(null) }}
          disabled={isRunning}
          className="self-end font-mono text-sm"
        >
          {lang === 'ko' ? '초기화' : 'Reset'}
        </Button>
      </div>
    </div>
  )
}
