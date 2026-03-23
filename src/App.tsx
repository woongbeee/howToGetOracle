import { useState } from 'react'
import { OracleDiagram } from '@/components/OracleDiagram'
import { QueryInput } from '@/components/QueryInput'
import { DataPanel } from '@/components/DataPanel'
import { SchemaDiagramView } from '@/components/SchemaDiagram'
import { OptimizerPanel } from '@/components/OptimizerPanel'
import { useSimulationStore } from '@/store/simulationStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type MainView = 'simulator' | 'erd'

export function App() {
  const [dataPanelOpen, setDataPanelOpen] = useState(false)
  const [mainView, setMainView] = useState<MainView>('simulator')
  const [optimizerOpen, setOptimizerOpen] = useState(false)
  const optimizerResult = useSimulationStore((s) => s.optimizerResult)
  const isRunning = useSimulationStore((s) => s.isRunning)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">

      {/* ── Header ── */}
      <header className="flex h-11 shrink-0 items-center gap-3 border-b bg-card px-4">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>

        <Separator orientation="vertical" className="h-4" />

        <span className="font-mono text-sm font-semibold tracking-tight">Oracle</span>
        <span className="font-mono text-sm text-muted-foreground">Database Internals Simulator</span>

        {/* View toggle */}
        <div className="ml-4 flex items-center rounded-lg border bg-muted p-0.5">
          {(['simulator', 'erd'] as MainView[]).map((v) => (
            <button
              key={v}
              onClick={() => setMainView(v)}
              className={cn(
                'rounded-md px-3 py-1 font-mono text-xs font-medium transition-all',
                mainView === v
                  ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'simulator' ? '⚙ Simulator' : '⬡ Schema ERD'}
            </button>
          ))}
        </div>

        {/* Optimizer toggle */}
        {mainView === 'simulator' && (
          <Button
            variant={optimizerOpen ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setOptimizerOpen((v) => !v)}
            className="font-mono text-xs"
          >
            ▶ Optimizer
            {optimizerResult && !optimizerOpen && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-400 align-middle" />
            )}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isRunning ? (
            <Badge variant="outline" className="font-mono text-[10px]">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
              RUNNING
            </Badge>
          ) : (
            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              READY
            </Badge>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">
        {mainView === 'simulator' && (
          <DataPanel open={dataPanelOpen} onToggle={() => setDataPanelOpen((v) => !v)} />
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {mainView === 'simulator' ? <OracleDiagram /> : <SchemaDiagramView />}
          </div>

          {/* Optimizer panel */}
          {mainView === 'simulator' && optimizerOpen && (
            <div className="h-full w-[420px] shrink-0 overflow-hidden border-l bg-card">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  CBO Optimizer
                </span>
                {optimizerResult && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    cost {optimizerResult.plan.totalCost.toFixed(1)} · {optimizerResult.plan.estimatedRows} rows
                  </span>
                )}
              </div>
              <OptimizerPanel result={optimizerResult} />
            </div>
          )}
        </div>
      </div>

      {/* ── Query Input ── */}
      {mainView === 'simulator' && (
        <div className="h-52 shrink-0 border-t">
          <QueryInput />
        </div>
      )}
    </div>
  )
}

export default App
