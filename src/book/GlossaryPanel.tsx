import { memo, useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { GLOSSARY, getTermsForSection, sortTerms, type GlossaryTerm } from '@/data/glossary'
import { cn } from '@/lib/utils'

interface Props {
  sectionId: string
  open: boolean
  onToggle: () => void
}

const T = {
  ko: {
    title: '용어 사전',
    searchPlaceholder: '용어 검색...',
    modeAll: '전체',
    modePage: '현재 페이지',
    noResults: '검색 결과 없음',
    noPageTerms: '이 섹션에 등록된 용어 없음',
    count: (n: number) => `${n}개`,
    tabLabel: '용어사전',
    openTitle: '용어사전 열기',
    closeTitle: '용어사전 닫기',
  },
  en: {
    title: 'Glossary',
    searchPlaceholder: 'Search terms...',
    modeAll: 'All',
    modePage: 'This Page',
    noResults: 'No results found',
    noPageTerms: 'No terms for this section',
    count: (n: number) => `${n} terms`,
    tabLabel: 'Glossary',
    openTitle: 'Open Glossary',
    closeTitle: 'Close Glossary',
  },
} as const

// Toggle tab — isolated so open/lang changes don't re-render the panel body
const GlossaryTab = memo(function GlossaryTab({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <button
      onClick={onToggle}
      title={open ? t.closeTitle : t.openTitle}
      className={cn(
        'flex w-7 shrink-0 flex-col items-center justify-center gap-1.5 border-l transition-colors duration-150',
        open
          ? 'bg-muted/80 text-foreground'
          : 'bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      <motion.span
        animate={{ rotate: open ? 0 : 180 }}
        transition={{ duration: 0.2 }}
        className="text-[11px] leading-none"
      >
        ›
      </motion.span>
      <span
        className="select-none font-mono text-[9px] font-bold uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {t.tabLabel}
      </span>
    </button>
  )
})

export function GlossaryPanel({ sectionId, open, onToggle }: Props) {
  return (
    <div className="flex shrink-0 overflow-hidden">
      <GlossaryTab open={open} onToggle={onToggle} />

      {/* Panel body — key={sectionId} remounts to reset internal state on section change */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="glossary-body"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-l bg-card"
          >
            <GlossaryBody key={sectionId} sectionId={sectionId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inner body — remounts on sectionId change (via key), resetting all local state
function GlossaryBody({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [mode, setMode] = useState<'all' | 'page'>('page')
  const [query, setQuery] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => searchRef.current?.focus(), 280)
    return () => clearTimeout(id)
  }, [])

  const baseTerms = useMemo(() => {
    const raw = mode === 'page' ? getTermsForSection(sectionId) : GLOSSARY
    return sortTerms(raw)
  }, [mode, sectionId])

  const filtered = useMemo(() => {
    if (!query.trim()) return baseTerms
    const q = query.trim().toLowerCase()
    return baseTerms.filter(
      (term) =>
        term.term.toLowerCase().includes(q) ||
        term.definition[lang].toLowerCase().includes(q)
    )
  }, [baseTerms, query, lang])

  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>()
    for (const term of filtered) {
      const first = term.term[0].toUpperCase()
      if (!map.has(first)) map.set(first, [])
      map.get(first)!.push(term)
    }
    return map
  }, [filtered])

  const handleTermToggle = useCallback((termName: string) => {
    setExpandedTerm((prev) => (prev === termName ? null : termName))
  }, [])

  const handleModeChange = (m: 'all' | 'page') => {
    setMode(m)
    setExpandedTerm(null)
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setExpandedTerm(null)
  }

  const handleQueryClear = () => setQuery('')

  return (
    <div className="flex h-full w-[300px] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.title}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {t.count(filtered.length)}
          </span>
        </div>

        {/* Mode toggle */}
        <div className="mb-2.5 flex rounded-md border bg-muted p-0.5">
          {(['page', 'all'] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={cn(
                'flex-1 rounded px-2 py-1 font-mono text-[10px] font-medium transition-all duration-150',
                mode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'page' ? t.modePage : t.modeAll}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40">
            🔍
          </span>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-md border bg-background py-1.5 pl-7 pr-7 font-mono text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              onClick={handleQueryClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground/50 hover:text-muted-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Term list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 && (
          <p className="px-2 py-8 text-center font-mono text-[11px] text-muted-foreground/40">
            {mode === 'page' && !query.trim() ? t.noPageTerms : t.noResults}
          </p>
        )}

        {query.trim() ? (
          <div className="flex flex-col gap-0.5">
            {filtered.map((term) => (
              <TermRow
                key={term.term}
                term={term}
                expanded={expandedTerm === term.term}
                onToggle={handleTermToggle}
              />
            ))}
          </div>
        ) : (
          Array.from(grouped.entries()).map(([letter, terms]) => (
            <div key={letter} className="mb-3">
              <div className="mb-1 px-2 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
                {letter}
              </div>
              <div className="flex flex-col gap-0.5">
                {terms.map((term) => (
                  <TermRow
                    key={term.term}
                    term={term}
                    expanded={expandedTerm === term.term}
                    onToggle={handleTermToggle}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// memo: only re-renders when term identity, expanded state, or toggle fn changes
const TermRow = memo(function TermRow({
  term,
  expanded,
  onToggle,
}: {
  term: GlossaryTerm
  expanded: boolean
  onToggle: (termName: string) => void
}) {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <button
      onClick={() => onToggle(term.term)}
      className={cn(
        'w-full rounded-md px-3 py-2 text-left transition-colors',
        expanded ? 'bg-muted' : 'hover:bg-muted/60'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-foreground">{term.term}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 font-mono text-[9px] text-muted-foreground/40"
        >
          ▶
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
              {term.definition[lang]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
})
