import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { getAdjacentSections, getSectionById } from './bookStructure'
import { cn } from '@/lib/utils'

// Chapter pages
import { InternalsPage } from './chapters/InternalsPage'
import { IndexChapterPage } from './chapters/IndexChapterPage'
import { JoinPage } from './chapters/JoinPage'
import { OptimizerChapterPage } from './chapters/OptimizerChapterPage'
import { QueryTransformPage } from './chapters/QueryTransformPage'
import { SortPage } from './chapters/SortPage'
import { PartitionPage } from './chapters/PartitionPage'
import { ParallelPage } from './chapters/ParallelPage'

interface Props {
  sectionId: string
  onNavigate: (sectionId: string) => void
}

const COLOR_MAP: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  blue:   { text: 'text-blue-600',   border: 'border-blue-200',   bg: 'bg-blue-50',   dot: 'bg-blue-400' },
  violet: { text: 'text-violet-600', border: 'border-violet-200', bg: 'bg-violet-50', dot: 'bg-violet-400' },
  emerald:{ text: 'text-emerald-600',border: 'border-emerald-200',bg: 'bg-emerald-50',dot: 'bg-emerald-400' },
  orange: { text: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50', dot: 'bg-orange-400' },
  cyan:   { text: 'text-cyan-600',   border: 'border-cyan-200',   bg: 'bg-cyan-50',   dot: 'bg-cyan-400' },
  rose:   { text: 'text-rose-600',   border: 'border-rose-200',   bg: 'bg-rose-50',   dot: 'bg-rose-400' },
  amber:  { text: 'text-amber-600',  border: 'border-amber-200',  bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  teal:   { text: 'text-teal-600',   border: 'border-teal-200',   bg: 'bg-teal-50',   dot: 'bg-teal-400' },
}

export function BookContent({ sectionId, onNavigate }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const info = getSectionById(sectionId)
  const adjacent = getAdjacentSections(sectionId)

  if (!info) return null

  const { chapter } = info
  const c = COLOR_MAP[chapter.color] ?? COLOR_MAP.blue

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex shrink-0 items-center gap-1.5 border-b bg-muted/30 px-6 py-2">
        <span className={cn('font-mono text-[10px] font-medium', c.text)}>
          {chapter.icon} {chapter.num.toString().padStart(2, '0')}. {chapter.title[lang]}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">›</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {info.section.title[lang]}
        </span>
      </div>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={sectionId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <SectionRouter sectionId={sectionId} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex shrink-0 items-center justify-between border-t bg-card px-6 py-3">
        <div className="flex-1">
          {adjacent.prev && (
            <button
              onClick={() => onNavigate(adjacent.prev!.section.id)}
              className="group flex items-center gap-2 text-left"
            >
              <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">←</span>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
                  {lang === 'ko' ? '이전' : 'Previous'}
                </span>
                <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  {adjacent.prev.section.title[lang]}
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="flex-1 text-right">
          {adjacent.next && (
            <button
              onClick={() => onNavigate(adjacent.next!.section.id)}
              className="group ml-auto flex items-center justify-end gap-2 text-right"
            >
              <div className="flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
                  {lang === 'ko' ? '다음' : 'Next'}
                </span>
                <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  {adjacent.next.section.title[lang]}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Route each sectionId to the right chapter page component
function SectionRouter({ sectionId }: { sectionId: string }) {
  if (sectionId.startsWith('internals-')) return <InternalsPage sectionId={sectionId} />
  if (sectionId.startsWith('index-'))     return <IndexChapterPage sectionId={sectionId} />
  if (sectionId.startsWith('join-'))      return <JoinPage sectionId={sectionId} />
  if (sectionId.startsWith('optimizer-')) return <OptimizerChapterPage sectionId={sectionId} />
  if (sectionId.startsWith('qt-'))        return <QueryTransformPage sectionId={sectionId} />
  if (sectionId.startsWith('sort-'))      return <SortPage sectionId={sectionId} />
  if (sectionId.startsWith('partition-')) return <PartitionPage sectionId={sectionId} />
  if (sectionId.startsWith('parallel-'))  return <ParallelPage sectionId={sectionId} />
  return null
}
