import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { BTreeSection } from './BTreeSection'
import { BitmapSection } from './BitmapSection'
import { CompositeSection } from './CompositeSection'
import { IndexTypesOverview } from './IndexTypesOverview'

const TABS = ['overview', 'btree', 'bitmap', 'composite'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS = {
  ko: {
    overview:  '인덱스 개요',
    btree:     'B-Tree 인덱스',
    bitmap:    'Bitmap 인덱스',
    composite: '복합 & 기타',
  },
  en: {
    overview:  'Overview',
    btree:     'B-Tree Index',
    bitmap:    'Bitmap Index',
    composite: 'Composite & More',
  },
}

interface Props {
  onBack: () => void
}

export function IndexPage({ onBack }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const setLang = useSimulationStore((s) => s.setLang)
  const [tab, setTab] = useState<Tab>('overview')
  const labels = TAB_LABELS[lang]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* ── Header ── */}
      <header className="flex h-11 shrink-0 items-center gap-3 border-b bg-card px-4">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={onBack}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Home
        </button>

        <div className="h-4 w-px bg-border" />

        <span className="font-mono text-sm font-semibold tracking-tight">Oracle</span>
        <span className="font-mono text-sm text-muted-foreground">Index Internals</span>

        <div className="ml-auto">
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            🌐 {lang === 'ko' ? 'EN' : '한국어'}
          </button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="flex shrink-0 items-center gap-1 border-b bg-muted/40 px-4 py-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-all',
              tab === t
                ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {labels[t]}
            {tab === t && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-md bg-card shadow-xs ring-1 ring-border"
                style={{ zIndex: -1 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {tab === 'overview'  && <IndexTypesOverview lang={lang} />}
            {tab === 'btree'     && <BTreeSection lang={lang} />}
            {tab === 'bitmap'    && <BitmapSection lang={lang} />}
            {tab === 'composite' && <CompositeSection lang={lang} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
