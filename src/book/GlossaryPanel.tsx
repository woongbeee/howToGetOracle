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
    sectionThis: '이 페이지 용어',
    sectionAll: '전체 용어',
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
    sectionThis: 'This Page',
    sectionAll: 'All Terms',
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

function GlossaryBody({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [query, setQuery] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => searchRef.current?.focus(), 280)
    return () => clearTimeout(id)
  }, [])

  // Terms for current section (highlighted set)
  const pageTerms = useMemo(() => sortTerms(getTermsForSection(sectionId)), [sectionId])
  const pageTermNames = useMemo(() => new Set(pageTerms.map((t) => t.term)), [pageTerms])

  // Remaining terms not in current section
  const otherTerms = useMemo(
    () => sortTerms(GLOSSARY.filter((t) => !pageTermNames.has(t.term))),
    [pageTermNames]
  )

  const filterTerms = useCallback(
    (terms: GlossaryTerm[]) => {
      if (!query.trim()) return terms
      const q = query.trim().toLowerCase()
      return terms.filter(
        (term) =>
          term.term.toLowerCase().includes(q) ||
          term.definition[lang].toLowerCase().includes(q)
      )
    },
    [query, lang]
  )

  const filteredPage = useMemo(() => filterTerms(pageTerms), [filterTerms, pageTerms])
  const filteredOther = useMemo(() => filterTerms(otherTerms), [filterTerms, otherTerms])
  const totalCount = filteredPage.length + filteredOther.length

  const handleTermToggle = useCallback((termName: string) => {
    setExpandedTerm((prev) => (prev === termName ? null : termName))
  }, [])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setExpandedTerm(null)
  }

  return (
    <div className="flex h-full w-[300px] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.title}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {t.count(totalCount)}
          </span>
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
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground/50 hover:text-muted-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Term list */}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {totalCount === 0 && (
          <p className="px-2 py-8 text-center font-mono text-[11px] text-muted-foreground/40">
            {t.noResults}
          </p>
        )}

        {/* This page section */}
        {filteredPage.length > 0 && (
          <div className="mb-1">
            <SectionLabel label={t.sectionThis} count={filteredPage.length} highlight />
            <div className="flex flex-col gap-0.5 px-2">
              {filteredPage.map((term) => (
                <TermRow
                  key={term.term}
                  term={term}
                  expanded={expandedTerm === term.term}
                  onToggle={handleTermToggle}
                  highlight
                />
              ))}
            </div>
          </div>
        )}

        {/* No page terms, not searching */}
        {filteredPage.length === 0 && !query.trim() && (
          <div className="mb-1">
            <SectionLabel label={t.sectionThis} count={0} highlight />
            <p className="px-4 pb-2 font-mono text-[10px] text-muted-foreground/40">
              {t.noPageTerms}
            </p>
          </div>
        )}

        {/* Divider before all terms */}
        {filteredOther.length > 0 && (
          <>
            {filteredPage.length > 0 && <div className="mx-4 my-2 border-t" />}
            <div className="mb-1">
              <SectionLabel label={t.sectionAll} count={filteredOther.length} />
              <div className="flex flex-col gap-0.5 px-2">
                {filteredOther.map((term) => (
                  <TermRow
                    key={term.term}
                    term={term}
                    expanded={expandedTerm === term.term}
                    onToggle={handleTermToggle}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({
  label,
  count,
  highlight = false,
}: {
  label: string
  count: number
  highlight?: boolean
}) {
  return (
    <div className={cn('mb-1.5 flex items-center gap-2 px-4 py-1', highlight && 'bg-blue-50/60 dark:bg-blue-950/20')}>
      {highlight && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />}
      <span
        className={cn(
          'font-mono text-[9px] font-bold uppercase tracking-widest',
          highlight ? 'text-blue-500' : 'text-muted-foreground/40'
        )}
      >
        {label}
      </span>
      {count > 0 && (
        <span
          className={cn(
            'ml-auto font-mono text-[9px]',
            highlight ? 'text-blue-400' : 'text-muted-foreground/30'
          )}
        >
          {count}
        </span>
      )}
    </div>
  )
}

const TermRow = memo(function TermRow({
  term,
  expanded,
  onToggle,
  highlight = false,
}: {
  term: GlossaryTerm
  expanded: boolean
  onToggle: (termName: string) => void
  highlight?: boolean
}) {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <button
      onClick={() => onToggle(term.term)}
      className={cn(
        'w-full rounded-md px-3 py-2 text-left transition-colors',
        expanded
          ? highlight ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-muted'
          : highlight ? 'hover:bg-blue-50/70 dark:hover:bg-blue-950/20' : 'hover:bg-muted/60'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'font-mono text-[11px] font-semibold',
            highlight ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'
          )}
        >
          {term.term}
        </span>
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
