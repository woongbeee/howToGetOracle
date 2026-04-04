// ─── Optimizer Panel ──────────────────────────────────────────────────────
// Visualizes Oracle CBO execution plan: Query Transformer → Estimator → Plan Generator

import { motion } from 'framer-motion'
import type { OptimizerResult, AccessPath, JoinStep, OptimizerPhase } from '@/lib/optimizer/types'
import { useSimulationStore } from '@/store/simulationStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Phase Header ──────────────────────────────────────────────────────────

const PHASE_CLS: Record<OptimizerPhase['name'], { badge: string; border: string; bg: string; text: string }> = {
  'Query Transformer': { badge: 'bg-amber-500',  border: 'border-amber-200', bg: 'bg-amber-50',  text: 'text-amber-800' },
  'Estimator':         { badge: 'bg-blue-600',   border: 'border-blue-200',  bg: 'bg-blue-50',   text: 'text-blue-800' },
  'Plan Generator':    { badge: 'bg-orange-500', border: 'border-orange-200',bg: 'bg-orange-50', text: 'text-orange-800' },
}

function PhaseHeader({ phase, index }: { phase: OptimizerPhase; index: number }) {
  const c = PHASE_CLS[phase.name]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn('overflow-hidden rounded-lg border', c.border, c.bg)}
    >
      <div className={cn('flex items-center gap-2 border-b px-3 py-2', c.border)}>
        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white', c.badge)}>
          {index + 1}
        </span>
        <span className={cn('font-mono text-xs font-bold', c.text)}>{phase.name}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{phase.description}</span>
        {phase.cost !== undefined && (
          <Badge variant="outline" className={cn('font-mono text-[10px]', c.border, c.text)}>
            cost {phase.cost.toFixed(1)}
          </Badge>
        )}
      </div>
      <div className="space-y-0.5 px-3 py-2">
        {phase.details.map((d, i) => (
          <div key={i} className="flex items-start gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className={cn('mt-0.5 shrink-0', c.text)}>›</span>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Access Path Card ──────────────────────────────────────────────────────

const ACCESS_PATH_LABEL: Record<string, string> = {
  FULL_TABLE_SCAN:       'FTS',
  INDEX_UNIQUE_SCAN:     'IUS',
  INDEX_RANGE_SCAN:      'IRS',
  INDEX_FULL_SCAN:       'IFS',
  INDEX_FAST_FULL_SCAN:  'IFFS',
  INDEX_SKIP_SCAN:       'ISS',
}

function AccessPathRow({ path, maxCost }: { path: AccessPath; maxCost: number }) {
  const pct = maxCost > 0 ? Math.min(100, (path.cost / maxCost) * 100) : 0
  const isChosen = path.chosen

  return (
    <div
      className={cn(
        'rounded-md border px-2.5 py-1.5',
        isChosen ? 'border-blue-200 bg-blue-50' : 'border-border bg-muted/30 opacity-60'
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            'h-4 shrink-0 font-mono text-[9px]',
            isChosen ? 'border-blue-300 text-blue-700' : 'text-muted-foreground'
          )}
        >
          {ACCESS_PATH_LABEL[path.type] ?? path.type}
        </Badge>
        {path.indexName && (
          <span className="font-mono text-[10px] text-muted-foreground">{path.indexName}</span>
        )}
        <span className={cn('ml-auto font-mono text-[10px] font-bold', isChosen ? 'text-blue-700' : 'text-muted-foreground')}>
          cost {path.cost.toFixed(1)}
        </span>
        {isChosen && (
          <Badge className="h-4 bg-blue-600 font-mono text-[9px]">CHOSEN</Badge>
        )}
      </div>
      {/* Cost bar */}
      <div className="relative h-1 overflow-hidden rounded-full bg-border">
        <div
          className={cn('h-full rounded-full transition-all', isChosen ? 'bg-blue-500' : 'bg-muted-foreground/30')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">{path.reason}</div>
    </div>
  )
}

function TableAccessCard({ tableName, accessPaths }: { tableName: string; accessPaths: AccessPath[] }) {
  const maxCost = Math.max(...accessPaths.map((p) => p.cost))
  const chosen = accessPaths.find((p) => p.chosen)

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-xs font-bold text-foreground">{tableName}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          card {chosen?.cardinality} · sel {((chosen?.selectivity ?? 1) * 100).toFixed(1)}%
        </span>
      </div>
      <div className="space-y-1.5 p-2">
        {accessPaths.map((p, i) => (
          <AccessPathRow key={i} path={p} maxCost={maxCost} />
        ))}
      </div>
    </div>
  )
}

// ── Join Step Card ────────────────────────────────────────────────────────

const JOIN_METHOD_CLS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  NESTED_LOOPS:    { border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-600' },
  HASH_JOIN:       { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-500' },
  SORT_MERGE_JOIN: { border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-700',  badge: 'bg-amber-500' },
}

function JoinStepCard({ step, index }: { step: JoinStep; index: number }) {
  const c = JOIN_METHOD_CLS[step.method] ?? JOIN_METHOD_CLS.HASH_JOIN

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className={cn('rounded-lg border p-2.5', c.border, c.bg)}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={cn('font-mono text-xs font-bold', c.text)}>
          {step.leftTable} ⋈ {step.rightTable}
        </span>
        <Badge className={cn('h-4 font-mono text-[9px]', c.badge)}>
          {step.method.replace(/_/g, ' ')}
        </Badge>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          cost {step.cost.toFixed(1)}
        </span>
      </div>
      <div className={cn('flex items-center gap-3 font-mono text-[10px]', c.text)}>
        <span>left {step.inputCardinality.left}</span>
        <span className="text-muted-foreground">×</span>
        <span>right {step.inputCardinality.right}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-semibold">out {step.outputCardinality}</span>
        <span className="text-muted-foreground">on {step.condition.leftColumn}={step.condition.rightColumn}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">{step.reason}</div>
    </motion.div>
  )
}

// ── Execution Plan Tree ───────────────────────────────────────────────────

function ExecutionPlanTree({ result }: { result: OptimizerResult }) {
  const { plan } = result
  const rows: Array<{ indent: number; label: string; cost: string; rows: number }> = []

  if (plan.joinSteps.length > 0) {
    rows.push({ indent: 0, label: 'SELECT STATEMENT', cost: plan.totalCost.toFixed(1), rows: plan.estimatedRows })
    for (let i = plan.joinSteps.length - 1; i >= 0; i--) {
      const j = plan.joinSteps[i]
      rows.push({ indent: 1 + (plan.joinSteps.length - 1 - i), label: j.method.replace(/_/g, ' '), cost: j.cost.toFixed(1), rows: j.outputCardinality })
    }
  } else {
    rows.push({ indent: 0, label: 'SELECT STATEMENT', cost: plan.totalCost.toFixed(1), rows: plan.estimatedRows })
  }

  for (const ap of plan.tableAccessPlans) {
    const depth = plan.joinSteps.length > 0 ? plan.joinSteps.length + 1 : 1
    rows.push({
      indent: depth,
      label: `${ap.chosen.type.replace(/_/g, ' ')} ${ap.tableName}${ap.chosen.indexName ? ` [${ap.chosen.indexName}]` : ''}`,
      cost: ap.chosen.cost.toFixed(1),
      rows: ap.chosen.cardinality,
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Execution Plan
        </span>
      </div>
      <div className="space-y-0.5 p-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1 font-mono text-[11px]',
              i === 0 ? 'bg-orange-50 text-orange-700' : 'text-muted-foreground'
            )}
            style={{ marginLeft: row.indent * 16 }}
          >
            {row.indent > 0 && <span className="text-muted-foreground/50">└─</span>}
            <span className="flex-1">{row.label}</span>
            <span className="text-muted-foreground">cost={row.cost}</span>
            <span className="text-muted-foreground">rows={row.rows}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────

interface OptimizerPanelProps {
  result: OptimizerResult | null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export function OptimizerPanel({ result }: OptimizerPanelProps) {
  const lang = useSimulationStore((s) => s.lang)
  if (!result) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground">
          {lang === 'ko'
            ? '쿼리를 실행하면 Optimizer 분석 결과가 표시됩니다.'
            : 'Run a query to see the Optimizer analysis.'}
        </p>
      </div>
    )
  }

  const { plan, phases } = result

  return (
    <div className="h-full space-y-3 overflow-auto p-3">

      {/* Optimizer Phases */}
      <div>
        <SectionLabel>Optimizer Phases</SectionLabel>
        <div className="space-y-2">
          {phases.map((phase, i) => (
            <PhaseHeader key={phase.name} phase={phase} index={i} />
          ))}
        </div>
      </div>

      {/* Access Path Candidates */}
      <div>
        <SectionLabel>Access Path Candidates</SectionLabel>
        <div className="space-y-2">
          {plan.tableAccessPlans.map((ap) => (
            <TableAccessCard key={ap.tableName} tableName={ap.tableName} accessPaths={ap.accessPaths} />
          ))}
        </div>
      </div>

      {/* Join Steps */}
      {plan.joinSteps.length > 0 && (
        <div>
          <SectionLabel>Join Methods</SectionLabel>
          <div className="space-y-1.5">
            {plan.joinSteps.map((step, i) => (
              <JoinStepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Execution Plan Tree */}
      <ExecutionPlanTree result={result} />

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <div className="mb-1 font-mono text-[10px] font-bold text-amber-700">⚠ Optimizer Warnings</div>
          {plan.warnings.map((w, i) => (
            <div key={i} className="font-mono text-[11px] text-amber-700">› {w}</div>
          ))}
        </div>
      )}
    </div>
  )
}
