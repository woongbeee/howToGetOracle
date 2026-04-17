/**
 * OracleInstanceMap — 인터랙티브 Oracle 인스턴스 맵
 *
 * 교육 섹션별로 "지금 보고 있는 컴포넌트가 전체 구조에서 어디인지"를 보여준다.
 * highlightIds: 현재 설명 중인 컴포넌트들을 강조
 * focusMode: true면 비강조 컴포넌트를 dim 처리
 */
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

export type InstanceComponentId =
  | 'server-process'
  | 'pga'
  | 'sga'
  | 'library-cache'
  | 'dict-cache'
  | 'buffer-cache'
  | 'redo-buffer'
  | 'undo'
  | 'shared-pool'
  | 'dbwr'
  | 'lgwr'
  | 'ckpt'
  | 'smon'
  | 'pmon'
  | 'arcn'
  | 'disk'
  | 'redo-log-file'
  | 'control-file'
  | 'archive-log'

interface Props {
  highlightIds: InstanceComponentId[]
  /** 하이라이트된 컴포넌트의 설명 텍스트 (옵션) */
  callout?: string
}

// 컴포넌트별 색상 정의
const COMPONENT_COLORS: Record<string, {
  base: string
  highlight: string
  dim: string
  label: string
}> = {
  'server-process': {
    base:      'border-teal-200 bg-teal-50/70 text-teal-700',
    highlight: 'border-teal-500 bg-teal-100 ring-2 ring-teal-300 shadow-md text-teal-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Server Process',
  },
  pga: {
    base:      'border-teal-200 bg-teal-50/70 text-teal-700',
    highlight: 'border-teal-500 bg-teal-100 ring-2 ring-teal-300 shadow-md text-teal-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'PGA',
  },
  sga: {
    base:      'border-blue-300 bg-blue-50/50',
    highlight: 'border-blue-500 bg-blue-100/80 ring-2 ring-blue-300 shadow-md',
    dim:       'border-border/20 bg-muted/10',
    label:     'SGA',
  },
  'shared-pool': {
    base:      'border-indigo-200 bg-indigo-50/70',
    highlight: 'border-indigo-400 bg-indigo-100/80 ring-2 ring-indigo-300 shadow-md',
    dim:       'border-border/20 bg-muted/10',
    label:     'Shared Pool',
  },
  'library-cache': {
    base:      'border-indigo-200 bg-indigo-50/60 text-indigo-700',
    highlight: 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-300 shadow-md text-indigo-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Library Cache',
  },
  'dict-cache': {
    base:      'border-indigo-200 bg-indigo-50/60 text-indigo-700',
    highlight: 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-300 shadow-md text-indigo-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Dict Cache',
  },
  'buffer-cache': {
    base:      'border-blue-200 bg-blue-50/60 text-blue-700',
    highlight: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300 shadow-md text-blue-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Buffer Cache',
  },
  'redo-buffer': {
    base:      'border-orange-200 bg-orange-50/60 text-orange-700',
    highlight: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300 shadow-md text-orange-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Redo Log Buffer',
  },
  undo: {
    base:      'border-amber-200 bg-amber-50/60 text-amber-700',
    highlight: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300 shadow-md text-amber-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Undo Segment',
  },
  dbwr: {
    base:      'border-orange-200 bg-orange-50/60 text-orange-700',
    highlight: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300 shadow-md text-orange-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'DBWn',
  },
  lgwr: {
    base:      'border-orange-200 bg-orange-50/60 text-orange-700',
    highlight: 'border-orange-500 bg-orange-100 ring-2 ring-orange-300 shadow-md text-orange-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'LGWR',
  },
  ckpt: {
    base:      'border-amber-200 bg-amber-50/60 text-amber-700',
    highlight: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300 shadow-md text-amber-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'CKPT',
  },
  smon: {
    base:      'border-amber-200 bg-amber-50/60 text-amber-700',
    highlight: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300 shadow-md text-amber-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'SMON',
  },
  pmon: {
    base:      'border-teal-200 bg-teal-50/60 text-teal-700',
    highlight: 'border-teal-500 bg-teal-100 ring-2 ring-teal-300 shadow-md text-teal-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'PMON',
  },
  arcn: {
    base:      'border-teal-200 bg-teal-50/60 text-teal-700',
    highlight: 'border-teal-500 bg-teal-100 ring-2 ring-teal-300 shadow-md text-teal-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'ARCn',
  },
  disk: {
    base:      'border-slate-200 bg-slate-50/60 text-slate-600',
    highlight: 'border-slate-500 bg-slate-100 ring-2 ring-slate-300 shadow-md text-slate-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Data Files',
  },
  'redo-log-file': {
    base:      'border-slate-200 bg-slate-50/60 text-slate-600',
    highlight: 'border-slate-500 bg-slate-100 ring-2 ring-slate-300 shadow-md text-slate-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Redo Logs',
  },
  'control-file': {
    base:      'border-slate-200 bg-slate-50/60 text-slate-600',
    highlight: 'border-slate-500 bg-slate-100 ring-2 ring-slate-300 shadow-md text-slate-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Control File',
  },
  'archive-log': {
    base:      'border-slate-200 bg-slate-50/60 text-slate-600',
    highlight: 'border-slate-500 bg-slate-100 ring-2 ring-slate-300 shadow-md text-slate-800',
    dim:       'border-border/30 bg-muted/20 text-muted-foreground/30',
    label:     'Archive Logs',
  },
}

function MapBlock({
  id,
  label,
  sublabel,
  highlightIds,
  className,
  pulse = true,
}: {
  id: InstanceComponentId
  label?: string
  sublabel?: string
  highlightIds: InstanceComponentId[]
  className?: string
  pulse?: boolean
}) {
  const isHighlighted = highlightIds.includes(id)
  const hasHighlights = highlightIds.length > 0
  const isDimmed = hasHighlights && !isHighlighted
  const c = COMPONENT_COLORS[id]
  const displayLabel = label ?? c.label

  return (
    <motion.div
      animate={
        isHighlighted && pulse
          ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 1.2, repeatDelay: 0.3 } }
          : { scale: 1 }
      }
      className={cn(
        'relative rounded-lg border-2 px-2.5 py-2 transition-all duration-300',
        isHighlighted ? c.highlight : isDimmed ? c.dim : c.base,
        className
      )}
    >
      {isHighlighted && (
        <motion.div
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <span className="text-[9px] font-bold">★</span>
        </motion.div>
      )}
      <div className="font-mono text-[11px] font-bold leading-tight">{displayLabel}</div>
      {sublabel && (
        <div className="font-mono text-[9px] leading-tight opacity-70 mt-0.5">{sublabel}</div>
      )}
    </motion.div>
  )
}

function SectionLabel({ children, dimmed }: { children: React.ReactNode; dimmed?: boolean }) {
  return (
    <div className={cn(
      'mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-opacity duration-300',
      dimmed ? 'opacity-20' : 'opacity-60'
    )}>
      {children}
    </div>
  )
}

export function OracleInstanceMap({ highlightIds, callout }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const hasHighlights = highlightIds.length > 0

  // 섹션 단위 하이라이트 감지
  const sgaHighlighted = highlightIds.includes('sga') ||
    ['library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer', 'undo', 'shared-pool'].some(id =>
      highlightIds.includes(id as InstanceComponentId)
    )
  const sharedPoolHighlighted = highlightIds.includes('shared-pool') ||
    ['library-cache', 'dict-cache'].some(id => highlightIds.includes(id as InstanceComponentId))
  const bgProcessHighlighted = ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn'].some(id =>
    highlightIds.includes(id as InstanceComponentId)
  )
  const diskHighlighted = ['disk', 'redo-log-file', 'control-file', 'archive-log'].some(id =>
    highlightIds.includes(id as InstanceComponentId)
  )

  const sgaDimmed = hasHighlights && !sgaHighlighted
  const bgDimmed = hasHighlights && !bgProcessHighlighted
  const diskDimmed = hasHighlights && !diskHighlighted

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center gap-3 mb-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-wide">
            {lang === 'ko' ? '현재 위치' : 'Current Focus'}
          </span>
        </div>
        {callout && (
          <motion.span
            key={callout}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-mono text-[11px] text-muted-foreground"
          >
            → {callout}
          </motion.span>
        )}
      </div>

      {/* Server Process + PGA */}
      <div className="grid grid-cols-2 gap-2">
        <MapBlock id="server-process" highlightIds={highlightIds} />
        <MapBlock id="pga" label="PGA" sublabel="Program Global Area" highlightIds={highlightIds} />
      </div>

      {/* SGA */}
      <div className={cn(
        'rounded-xl border-2 p-3 transition-all duration-300',
        sgaHighlighted
          ? 'border-blue-400 bg-blue-50/60 shadow-sm'
          : sgaDimmed
          ? 'border-border/20 bg-muted/10'
          : 'border-blue-200 bg-blue-50/30'
      )}>
        <SectionLabel dimmed={sgaDimmed}>SGA — System Global Area</SectionLabel>

        {/* Shared Pool */}
        <div className={cn(
          'mb-2.5 rounded-lg border-2 p-2 transition-all duration-300',
          sharedPoolHighlighted
            ? 'border-indigo-300 bg-indigo-50/60'
            : sgaDimmed
            ? 'border-border/20 bg-transparent'
            : 'border-indigo-200/70 bg-indigo-50/30'
        )}>
          <SectionLabel dimmed={sgaDimmed && !sharedPoolHighlighted}>Shared Pool</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <MapBlock id="library-cache" highlightIds={highlightIds} />
            <MapBlock id="dict-cache" label="Dict Cache" highlightIds={highlightIds} />
          </div>
        </div>

        {/* Buffer Cache, Redo, Undo */}
        <div className="grid grid-cols-3 gap-2">
          <MapBlock id="buffer-cache" label="Buffer Cache" highlightIds={highlightIds} />
          <MapBlock id="redo-buffer" label="Redo Buffer" highlightIds={highlightIds} />
          <MapBlock id="undo" highlightIds={highlightIds} />
        </div>
      </div>

      {/* Background Processes */}
      <div className={cn(
        'rounded-xl border-2 p-3 transition-all duration-300',
        bgProcessHighlighted
          ? 'border-amber-300 bg-amber-50/60 shadow-sm'
          : bgDimmed
          ? 'border-border/20 bg-muted/10'
          : 'border-amber-200/70 bg-amber-50/20'
      )}>
        <SectionLabel dimmed={bgDimmed}>Background Processes</SectionLabel>
        <div className="grid grid-cols-5 gap-1.5">
          {(['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon'] as InstanceComponentId[]).map((id) => (
            <MapBlock key={id} id={id} highlightIds={highlightIds} pulse={false} />
          ))}
        </div>
      </div>

      {/* Disk */}
      <div className={cn(
        'rounded-xl border-2 p-3 transition-all duration-300',
        diskHighlighted
          ? 'border-slate-400 bg-slate-50/60 shadow-sm'
          : diskDimmed
          ? 'border-border/20 bg-muted/10'
          : 'border-slate-200/70 bg-slate-50/20'
      )}>
        <SectionLabel dimmed={diskDimmed}>Disk Storage</SectionLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {(['disk', 'redo-log-file', 'control-file', 'archive-log'] as InstanceComponentId[]).map((id) => (
            <MapBlock key={id} id={id} highlightIds={highlightIds} pulse={false} />
          ))}
        </div>
      </div>
    </div>
  )
}
