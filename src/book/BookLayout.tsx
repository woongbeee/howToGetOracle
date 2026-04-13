import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { useInternalsStore } from '@/store/internalsStore'
import { TableOfContents } from './TableOfContents'
import { BookContent } from './BookContent'
import { GlossaryPanel } from './GlossaryPanel'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  onHome: () => void
}

const T: Record<'ko' | 'en', { title: string; subtitle: string; langToggle: string }> = {
  ko: {
    title: 'Oracle',
    subtitle: 'Database Internals',
    langToggle: 'EN',
  },
  en: {
    title: 'Oracle',
    subtitle: 'Database Internals',
    langToggle: '한국어',
  },
}

export function BookLayout({ onHome }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const setLang = useSimulationStore((s) => s.setLang)
  const t = T[lang]

  const [tocOpen, setTocOpen] = useState(true)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState('internals-storage')

  const toggleToc = () => setTocOpen((v) => !v)
  const toggleGlossary = () => setGlossaryOpen((v) => !v)
  const toggleLang = () => setLang(lang === 'ko' ? 'en' : 'ko')

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* ── Top Header ── */}
      <header className="flex h-11 shrink-0 items-center gap-3 border-b bg-card px-4 z-20">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={onHome}
          className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Home
        </button>

        <div className="h-4 w-px bg-border" />

        {/* TOC toggle */}
        <button
          onClick={toggleToc}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs transition-colors',
            tocOpen
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          title={tocOpen ? '목차 접기' : '목차 펼치기'}
        >
          <TocIcon open={tocOpen} />
          <span className="hidden sm:inline">{tocOpen ? (lang === 'ko' ? '목차' : 'TOC') : (lang === 'ko' ? '목차' : 'TOC')}</span>
        </button>

        <div className="h-4 w-px bg-border" />

        <span className="font-mono text-sm font-semibold tracking-tight">{t.title}</span>
        <span className="font-mono text-sm text-muted-foreground">{t.subtitle}</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            🌐 {t.langToggle}
          </button>
          <SimulationBadge />
        </div>
      </header>

      {/* ── Body: TOC + Content ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* TOC Sidebar */}
        <AnimatePresence initial={false}>
          {tocOpen && (
            <motion.aside
              key="toc"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 overflow-hidden border-r bg-card"
            >
              <div className="h-full w-[260px] overflow-y-auto">
                <TableOfContents
                  activeSectionId={activeSectionId}
                  onSelect={setActiveSectionId}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <main className="min-w-0 flex-1 overflow-hidden">
          <BookContent
            sectionId={activeSectionId}
            onNavigate={setActiveSectionId}
          />
        </main>

        {/* Glossary Panel */}
        <GlossaryPanel
          sectionId={activeSectionId}
          open={glossaryOpen}
          onToggle={toggleGlossary}
        />
      </div>
    </div>
  )
}

// Isolated: only re-renders on isRunning changes, not on lang/section changes
const SimulationBadge = memo(function SimulationBadge() {
  const isRunning = useInternalsStore((s) => s.isRunning)
  return isRunning ? (
    <Badge variant="outline" className="font-mono text-[10px]">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
      RUNNING
    </Badge>
  ) : (
    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
      READY
    </Badge>
  )
})

function TocIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={cn('transition-transform duration-200', open ? '' : 'rotate-180')}
    >
      <rect x="1" y="2" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="6" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="10" width="6" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
}
