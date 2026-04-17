import { motion } from 'framer-motion'
import type { InstanceComponentId } from './OracleInstanceMap'
import { SubTitle } from '../shared'
import { cn } from '@/lib/utils'
import { OracleInstanceMap } from './OracleInstanceMap'
import { useSimulationStore } from '@/store/simulationStore'

// ── TwoColLayout ───────────────────────────────────────────────────────────

export function TwoColLayout({ children, map }: { children: React.ReactNode; map: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">{children}</div>
        <aside className="w-80 shrink-0 xl:w-96">
          <div className="sticky top-6">{map}</div>
        </aside>
      </div>
    </div>
  )
}

// ── MapPanel ───────────────────────────────────────────────────────────────

export function MapPanel({ title, highlightIds, callout }: {
  title: string
  highlightIds: InstanceComponentId[]
  callout?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <OracleInstanceMap highlightIds={highlightIds} callout={callout} />
    </div>
  )
}

// ── TourItem type ──────────────────────────────────────────────────────────

export type TourItem = {
  ids: InstanceComponentId[]
  label: string
  desc: { ko: string; en: string }
}

// ── TourPanel ──────────────────────────────────────────────────────────────

export function TourPanel({
  tour,
  activeIdx,
  onSelect,
  accentColor,
  exploreLabel,
  showAllLabel,
}: {
  tour: TourItem[]
  activeIdx: number | null
  onSelect: (i: number | null) => void
  accentColor: 'blue' | 'amber'
  exploreLabel: string
  showAllLabel: string
}) {
  const lang = useSimulationStore((s) => s.lang)
  const active = accentColor === 'blue'
    ? { btn: 'border-blue-400 bg-blue-100 text-blue-700 font-bold shadow-sm', hover: 'hover:border-blue-300 hover:bg-blue-50', card: 'border-blue-200 bg-blue-50', title: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' }
    : { btn: 'border-amber-400 bg-amber-100 text-amber-700 font-bold shadow-sm', hover: 'hover:border-amber-300 hover:bg-amber-50', card: 'border-amber-200 bg-amber-50', title: 'text-amber-700', badge: 'bg-amber-200 text-amber-800' }

  return (
    <>
      <SubTitle>{exploreLabel}</SubTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {tour.map((item, i) => (
          <button
            key={item.label}
            onClick={() => onSelect(activeIdx === i ? null : i)}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-xs transition-all',
              activeIdx === i ? active.btn : `${active.hover} text-muted-foreground`
            )}
          >
            {item.label}
          </button>
        ))}
        {activeIdx !== null && (
          <button
            onClick={() => onSelect(null)}
            className="rounded-full border border-dashed px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ {showAllLabel}
          </button>
        )}
      </div>

      {activeIdx !== null && (
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mb-4 rounded-lg border p-3', active.card)}
        >
          <div className={cn('mb-1 font-mono text-xs font-bold', active.title)}>
            {tour[activeIdx].label}
          </div>
          <p className="font-mono text-xs text-muted-foreground">{tour[activeIdx].desc[lang]}</p>
          {accentColor === 'amber' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tour[activeIdx].ids.map((id) => (
                <span key={id} className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold', active.badge)}>
                  {id}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}
