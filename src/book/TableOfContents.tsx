import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOK_CHAPTERS } from './bookStructure'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

interface Props {
  activeSectionId: string
  onSelect: (sectionId: string) => void
}

const COLOR_MAP: Record<string, { dot: string; active: string; hover: string; num: string; chapterActive: string }> = {
  blue:   { dot: 'bg-blue-400',   active: 'bg-blue-50 text-blue-700',   hover: 'hover:bg-blue-50/60',   num: 'text-blue-400',   chapterActive: 'text-blue-600' },
  violet: { dot: 'bg-violet-400', active: 'bg-violet-50 text-violet-700', hover: 'hover:bg-violet-50/60', num: 'text-violet-400', chapterActive: 'text-violet-600' },
  emerald:{ dot: 'bg-emerald-400',active: 'bg-emerald-50 text-emerald-700',hover:'hover:bg-emerald-50/60',num:'text-emerald-400', chapterActive:'text-emerald-600' },
  orange: { dot: 'bg-orange-400', active: 'bg-orange-50 text-orange-700', hover: 'hover:bg-orange-50/60', num: 'text-orange-400', chapterActive: 'text-orange-600' },
  cyan:   { dot: 'bg-cyan-400',   active: 'bg-cyan-50 text-cyan-700',   hover: 'hover:bg-cyan-50/60',   num: 'text-cyan-400',   chapterActive: 'text-cyan-600' },
  rose:   { dot: 'bg-rose-400',   active: 'bg-rose-50 text-rose-700',   hover: 'hover:bg-rose-50/60',   num: 'text-rose-400',   chapterActive: 'text-rose-600' },
  amber:  { dot: 'bg-amber-400',  active: 'bg-amber-50 text-amber-700', hover: 'hover:bg-amber-50/60',  num: 'text-amber-400',  chapterActive: 'text-amber-600' },
  teal:   { dot: 'bg-teal-400',   active: 'bg-teal-50 text-teal-700',   hover: 'hover:bg-teal-50/60',   num: 'text-teal-400',   chapterActive: 'text-teal-600' },
}

export function TableOfContents({ activeSectionId, onSelect }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  // Find which chapter contains the active section — expand it by default
  const defaultOpen = BOOK_CHAPTERS.reduce<Record<string, boolean>>((acc, ch) => {
    acc[ch.id] = ch.sections.some((s) => s.id === activeSectionId)
    return acc
  }, {})

  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>(defaultOpen)

  function toggleChapter(id: string) {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-2 border-b">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {lang === 'ko' ? '목차' : 'Table of Contents'}
        </span>
      </div>

      {/* Chapters */}
      <div className="flex flex-col py-3">
      {BOOK_CHAPTERS.map((chapter) => {
        const isOpen = !!openChapters[chapter.id]
        const c = COLOR_MAP[chapter.color] ?? COLOR_MAP.blue
        const hasActive = chapter.sections.some((s) => s.id === activeSectionId)

        return (
          <div key={chapter.id} className="flex flex-col">
            {/* Chapter header row */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className={cn(
                'group flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/60',
                hasActive && 'bg-muted/40'
              )}
            >
              {/* Collapse arrow */}
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.18 }}
                className="shrink-0 font-mono text-[9px] text-muted-foreground/60"
              >
                ▶
              </motion.span>

              {/* Chapter icon + number */}
              <span className={cn('shrink-0 text-sm leading-none', c.num)}>{chapter.icon}</span>
              <span className={cn('font-mono text-[10px] font-bold text-muted-foreground/50 shrink-0')}>
                {String(chapter.num).padStart(2, '0')}
              </span>

              {/* Chapter title */}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-mono text-[11px] font-medium leading-tight transition-colors',
                  hasActive ? c.chapterActive : 'text-foreground/80 group-hover:text-foreground'
                )}
              >
                {chapter.title[lang]}
              </span>

              {/* Active dot */}
              {hasActive && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', c.dot)} />}
            </button>

            {/* Sections */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="sections"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="ml-[1.1rem] border-l border-border/50 pb-1">
                    {chapter.sections.map((section, idx) => {
                      const isActive = section.id === activeSectionId
                      const isSimulator = section.hasSimulator

                      return (
                        <button
                          key={section.id}
                          onClick={() => {
                            onSelect(section.id)
                            // Auto-expand chapter if selecting from outside
                            setOpenChapters((prev) => ({ ...prev, [chapter.id]: true }))
                          }}
                          className={cn(
                            'group flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors',
                            isActive ? c.active : 'text-muted-foreground hover:text-foreground',
                            !isActive && c.hover,
                            'rounded-r-md'
                          )}
                        >
                          {/* Section number */}
                          <span className="shrink-0 font-mono text-[9px] text-muted-foreground/40">
                            {chapter.num}.{idx + 1}
                          </span>

                          {/* Section title */}
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate font-mono text-[11px] leading-tight',
                              isActive ? 'font-semibold' : 'font-normal'
                            )}
                          >
                            {section.title[lang]}
                          </span>

                          {/* Simulator badge */}
                          {isSimulator && (
                            <span className={cn(
                              'shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase',
                              isActive ? 'bg-white/60 text-current' : 'bg-muted text-muted-foreground'
                            )}>
                              SIM
                            </span>
                          )}

                          {/* Active indicator */}
                          {isActive && (
                            <motion.span
                              layoutId="toc-active"
                              className={cn('h-1.5 w-1.5 shrink-0 rounded-full', c.dot)}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
      </div>

      {/* Developer credit — pinned to bottom */}
      <div className="mt-auto border-t pt-3 pb-1 px-4">
        <a
          href="https://woongbee.notion.site"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60"
        >
          <span className="font-mono text-[9px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
            developed by
          </span>
          <span className="font-mono text-[10px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
            Woongbee
          </span>
          <span className="ml-auto font-mono text-[9px] text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60">
            ↗
          </span>
        </a>
      </div>
    </div>
  )
}
