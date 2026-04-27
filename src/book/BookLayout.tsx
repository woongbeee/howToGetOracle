import { memo, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { useInternalsStore } from '@/store/internalsStore'
import { TableOfContents } from './TableOfContents'
import { BookContent } from './BookContent'
import { GlossaryPanel } from './GlossaryPanel'
import { Badge } from '@/components/ui/badge'

interface Props {
  onHome: () => void
}

const T: Record<'ko' | 'en', { title: string; subtitle: string; langToggle: string; tocLabel: string; openTitle: string; closeTitle: string }> = {
  ko: {
    title: 'Oracle DB',
    subtitle: 'Interactive Learning Book',
    langToggle: 'EN',
    tocLabel: '목차',
    openTitle: '목차 열기',
    closeTitle: '목차 닫기',
  },
  en: {
    title: 'Oracle DB',
    subtitle: 'Interactive Learning Book',
    langToggle: '한국어',
    tocLabel: 'TOC',
    openTitle: 'Open TOC',
    closeTitle: 'Close TOC',
  },
}

const MIN_WIDTH = 200
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 260

// Vertical tab — only visible when TOC is closed, sits to the right of the panel area
const TocTab = memo(function TocTab({ onToggle }: { onToggle: () => void }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <button
      onClick={onToggle}
      title={t.openTitle}
      className="flex w-7 shrink-0 flex-col items-center justify-center gap-1.5 border-r bg-card text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground"
    >
      <motion.span
        animate={{ rotate: 0 }}
        className="text-[11px] leading-none"
      >
        ›
      </motion.span>
      <span
        className="select-none font-mono text-[9px] font-bold uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {t.tocLabel}
      </span>
    </button>
  )
})

export function BookLayout({ onHome }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const setLang = useSimulationStore((s) => s.setLang)
  const t = T[lang]

  const [tocOpen, setTocOpen]         = useState(true)
  const [tocWidth, setTocWidth]       = useState(DEFAULT_WIDTH)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState('sql-basics-syntax')

  const toggleToc      = useCallback(() => setTocOpen((v) => !v), [])
  const toggleGlossary = () => setGlossaryOpen((v) => !v)
  const toggleLang     = () => setLang(lang === 'ko' ? 'en' : 'ko')

  // Drag-to-resize
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = tocWidth

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      setTocWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [tocWidth])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* ── Top Header ── */}
      <header className="flex h-[35px] shrink-0 items-center gap-3 border-b bg-card px-4 z-20">
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

        <span className="font-mono text-sm font-semibold tracking-tight">{t.title}</span>
        <span className="font-mono text-sm text-muted-foreground">{t.subtitle}</span>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-[10px] text-muted-foreground/50 sm:inline">
            last updated {__BUILD_DATE__}
          </span>
          <div className="hidden h-3 w-px bg-border sm:block" />
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            🌐 {t.langToggle}
          </button>
          <SimulationBadge />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* TOC: panel + tab (tab only when closed) */}
        <div className="flex shrink-0">
          <AnimatePresence initial={false}>
            {tocOpen && (
              <motion.div
                key="toc-body"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: tocWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-r bg-card"
              >
                <div className="relative flex h-full" style={{ width: tocWidth }}>
                  <div className="min-w-0 flex-1 overflow-y-auto">
                    <TableOfContents
                      activeSectionId={activeSectionId}
                      onSelect={setActiveSectionId}
                      onToggle={toggleToc}
                    />
                  </div>
                  {/* Drag handle */}
                  <div
                    onMouseDown={onDragStart}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-border active:bg-border transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!tocOpen && <TocTab onToggle={toggleToc} />}
        </div>

        {/* Main content */}
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

// Isolated: only re-renders on isRunning changes
const SimulationBadge = memo(function SimulationBadge() {
  const isRunning = useInternalsStore((s) => s.isRunning)
  if (!isRunning) return null
  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
      RUNNING
    </Badge>
  )
})
