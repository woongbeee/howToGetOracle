import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { useInternalsStore } from '@/store/internalsStore'
import { OracleDiagram } from '@/components/OracleDiagram'
import { QueryInput, LiveLog, SummaryTimeline } from '@/components/QueryInput'
import { OptimizerPanel } from '@/components/OptimizerPanel'
import { SchemaDiagramView } from '@/components/SchemaDiagram'
import { SchemaView, TableView } from '@/components/DataPanel'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'
import { cn } from '@/lib/utils'

// ── Translation strings ────────────────────────────────────────────────────

const T = {
  ko: {
    simTitle: 'Internals Simulator',
    simDesc: 'SQL을 입력하고 Oracle 인스턴스 내부에서 어떤 컴포넌트가 어떻게 활성화되는지 직접 확인해보세요.',
    execSummary: '처리 요약',
    liveLog: '실시간 로그',
  },
  en: {
    simTitle: 'Internals Simulator',
    simDesc: 'Enter a SQL query and watch which Oracle instance components activate and how.',
    execSummary: 'Execution Summary',
    liveLog: 'Live Log',
  },
}

// ── ErdPanel ───────────────────────────────────────────────────────────────

type ErdLeftView = 'schema' | 'data'

function ErdPanel() {
  const [selectedSchema, setSelectedSchema] = useState(SCHEMAS[0])
  const [leftView, setLeftView] = useState<ErdLeftView>('schema')
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null)
  const [panelWidth, setPanelWidth] = useState(288)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleSchemaChange = (s: typeof SCHEMAS[0]) => {
    setSelectedSchema(s)
    setSelectedTable(null)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setPanelWidth(Math.min(520, Math.max(180, startWidth.current + e.clientX - startX.current)))
    }
    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex shrink-0 flex-col overflow-hidden bg-card" style={{ width: panelWidth }}>
        {/* Schema tabs */}
        <div className="flex shrink-0 border-b">
          {SCHEMAS.map((s) => (
            <button
              key={s.name}
              onClick={() => handleSchemaChange(s)}
              className={cn(
                'flex-1 py-2 font-mono text-xs font-semibold transition-colors',
                selectedSchema.name === s.name
                  ? 'border-b-2 border-violet-500 text-violet-600'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* View toggle: Schema / Data */}
        <div className="flex shrink-0 border-b">
          {(['schema', 'data'] as ErdLeftView[]).map((v) => (
            <button
              key={v}
              onClick={() => setLeftView(v)}
              className={cn(
                'flex-1 py-1.5 font-mono text-[11px] font-medium transition-colors',
                leftView === v
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'schema' ? 'Schema' : 'Table Data'}
            </button>
          ))}
        </div>

        {/* Table picker (only in Data view) */}
        {leftView === 'data' && (
          <div className="flex shrink-0 flex-wrap gap-1 border-b bg-muted/30 px-3 py-2">
            {selectedSchema.tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t)}
                className={cn(
                  'rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors',
                  selectedTable?.name === t.name
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {leftView === 'schema' && <SchemaView schema={selectedSchema} />}
          {leftView === 'data' && selectedTable && <TableView table={selectedTable} />}
          {leftView === 'data' && !selectedTable && (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              위에서 테이블을 선택하세요
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-violet-400 active:bg-violet-500"
      >
        <div className="absolute h-8 w-3 rounded-full bg-border transition-colors group-hover:bg-violet-400" />
      </div>

      {/* ERD diagram */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <SchemaDiagramView lockedSchema={selectedSchema.name} onSchemaChange={handleSchemaChange} />
      </div>
    </div>
  )
}

// ── InternalsSimulatorSection ──────────────────────────────────────────────

type SimTab = 'simulator' | 'erd'

export function InternalsSimulatorSection() {
  const optimizerResult    = useInternalsStore((s) => s.optimizerResult)
  const isComplete         = useInternalsStore((s) => s.isComplete)
  const highlightedStep    = useInternalsStore((s) => s.highlightedStep)
  const setHighlightedStep = useInternalsStore((s) => s.setHighlightedStep)
  const lang               = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeTab, setActiveTab] = useState<SimTab>('simulator')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b bg-muted/30">
        <div className="px-4 py-2.5">
          <h2 className="text-sm font-bold leading-none">{t.simTitle}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t.simDesc}</p>
        </div>
        <div className="ml-auto flex h-full shrink-0 items-stretch gap-px border-l pr-1">
          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              'flex items-center gap-1.5 px-4 font-mono text-xs font-semibold transition-colors',
              activeTab === 'simulator'
                ? 'border-b-2 border-foreground bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-[11px]">⚙</span>
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-4 font-mono text-xs font-semibold transition-colors',
              activeTab === 'erd'
                ? 'border-b-2 border-violet-500 bg-background text-violet-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-[11px]">⬡</span>
            Schema / ERD
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col overflow-hidden"
            >
              {/* Top: OracleDiagram (70%) + Optimizer (right 30%) */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 overflow-hidden" style={{ width: '70%', flexShrink: 0 }}>
                  <OracleDiagram compact />
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l bg-card">
                  <div className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      CBO Optimizer
                    </span>
                    {optimizerResult && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        cost {optimizerResult.plan.totalCost.toFixed(1)} · {optimizerResult.plan.estimatedRows} rows
                      </span>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <OptimizerPanel result={optimizerResult} />
                  </div>
                </div>
              </div>

              {/* Bottom: SQL input (left 70%) + Log/Summary (right 30%) */}
              <div className="flex shrink-0 border-t" style={{ height: '220px' }}>
                <div className="flex min-h-0 flex-col overflow-hidden border-r" style={{ width: '70%', flexShrink: 0 }}>
                  <div className="shrink-0 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      SQL Input
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <QueryInput />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
                  <div className="shrink-0 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isComplete ? t.execSummary : t.liveLog}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <SummaryTimeline selectedStep={highlightedStep} onSelect={setHighlightedStep} />
                        </motion.div>
                      ) : (
                        <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <LiveLog />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="erd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <ErdPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
