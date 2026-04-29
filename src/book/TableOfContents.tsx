import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOK_CHAPTERS } from './bookStructure'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

interface Props {
  activeSectionId: string
  onSelect: (sectionId: string) => void
  onToggle: () => void
}


export function TableOfContents({ activeSectionId, onSelect, onToggle }: Props) {
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
      <div className="shrink-0 flex h-[35px] items-center justify-between px-4 border-b">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {lang === 'ko' ? '목차' : 'Table of Contents'}
        </span>
        <button
          onClick={onToggle}
          title={lang === 'ko' ? '목차 닫기' : 'Close TOC'}
          className="flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
        >
          ‹‹
        </button>
      </div>

      {/* Chapters */}
      <div className="flex flex-col py-3">
      {BOOK_CHAPTERS.map((chapter) => {
        const isOpen      = !!openChapters[chapter.id]
        const hasActive   = chapter.sections.some((s) => s.id === activeSectionId)
        const isChapter1  = chapter.num === 1

        return (
          <div key={chapter.id} className="flex flex-col">
            {/* Chapter header row */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className={cn(
                'group flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                isChapter1 ? 'hover:bg-muted/60' : 'hover:bg-muted/30',
                hasActive && isChapter1 && 'bg-muted/40',
              )}
            >
              {/* Collapse arrow */}
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.18 }}
                className={cn('shrink-0 font-mono text-[9px]', isChapter1 ? 'text-muted-foreground/60' : 'text-muted-foreground/25')}
              >
                ▶
              </motion.span>

              {/* Chapter icon + number */}
              <span className={cn('shrink-0 text-sm leading-none', isChapter1 ? '' : 'opacity-30')}>{chapter.icon}</span>
              <span className={cn('font-mono text-[10px] font-bold shrink-0', isChapter1 ? 'text-muted-foreground/50' : 'text-muted-foreground/25')}>
                {String(chapter.num).padStart(2, '0')}
              </span>

              {/* Chapter title */}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-mono text-[11px] leading-tight transition-colors',
                  isChapter1
                    ? hasActive ? 'font-bold text-ios-orange-dark' : 'font-bold text-foreground/80 group-hover:text-foreground'
                    : 'font-medium text-muted-foreground/30',
                )}
              >
                {chapter.title[lang]}
              </span>

              {/* Active dot */}
              {hasActive && isChapter1 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ios-orange" />}
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
                      const isActive    = section.id === activeSectionId
                      const isSimulator = section.hasSimulator
                      const isChapter1  = chapter.num === 1

                      return (
                        <button
                          key={section.id}
                          onClick={() => {
                            onSelect(section.id)
                            setOpenChapters((prev) => ({ ...prev, [chapter.id]: true }))
                          }}
                          className={cn(
                            'group flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors rounded-r-md',
                            isActive
                              ? 'bg-ios-orange-light text-ios-orange-dark'
                              : isChapter1
                                ? 'text-muted-foreground hover:bg-ios-orange-light/40 hover:text-ios-orange-dark'
                                : 'text-muted-foreground/30 cursor-pointer',
                          )}
                        >
                          {/* Section number */}
                          <span className={cn(
                            'shrink-0 font-mono text-[9px]',
                            isActive ? 'text-ios-orange-dark/60' : isChapter1 ? 'text-muted-foreground/40' : 'text-muted-foreground/20'
                          )}>
                            {chapter.num}.{idx + 1}
                          </span>

                          {/* Section title */}
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate font-mono text-[11px] leading-tight',
                              isActive ? 'font-bold' : isChapter1 ? 'font-medium' : 'font-normal'
                            )}
                          >
                            {section.title[lang]}
                          </span>

                          {/* Simulator badge */}
                          {isSimulator && (
                            <span className={cn(
                              'shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase',
                              isActive ? 'bg-ios-orange/20 text-ios-orange-dark' : isChapter1 ? 'bg-muted text-muted-foreground' : 'bg-muted/40 text-muted-foreground/30'
                            )}>
                              SIM
                            </span>
                          )}

                          {/* Active indicator */}
                          {isActive && (
                            <motion.span
                              layoutId="toc-active"
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-ios-orange"
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
      <div className="mt-auto flex h-[52px] items-center border-t px-4">
        <a
          href="https://woongbee.notion.site"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60"
        >
          <span className="font-mono text-[9px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
            created by
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
