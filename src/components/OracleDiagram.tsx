import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore, STEP_PROCESS_LABEL } from '@/store/simulationStore'
import type { Lang } from '@/store/simulationStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function useIsActive(id: string) {
  return useSimulationStore((s) => s.activeComponents.has(id))
}

type Accent = 'blue' | 'orange' | 'amber' | 'neutral' | 'indigo' | 'teal' | 'slate'

const ACCENT: Record<Accent, { border: string; bg: string; text: string; ring: string }> = {
  blue:    { border: 'border-blue-500',    bg: 'bg-blue-100',    text: 'text-blue-800',   ring: 'ring-blue-300' },
  indigo:  { border: 'border-indigo-500',  bg: 'bg-indigo-100',  text: 'text-indigo-800', ring: 'ring-indigo-300' },
  teal:    { border: 'border-teal-500',    bg: 'bg-teal-100',    text: 'text-teal-800',   ring: 'ring-teal-300' },
  orange:  { border: 'border-orange-500',  bg: 'bg-orange-100',  text: 'text-orange-800', ring: 'ring-orange-300' },
  amber:   { border: 'border-amber-500',   bg: 'bg-amber-100',   text: 'text-amber-800',  ring: 'ring-amber-300' },
  slate:   { border: 'border-slate-400',   bg: 'bg-slate-100',   text: 'text-slate-700',  ring: 'ring-slate-200' },
  neutral: { border: 'border-border',      bg: 'bg-card',        text: 'text-foreground',  ring: '' },
}

// Idle (non-active) tints per accent — subtle background tint always visible
const IDLE_TINT: Record<Accent, string> = {
  blue:    'border-blue-200/80 bg-blue-50/60',
  indigo:  'border-indigo-200/80 bg-indigo-50/60',
  teal:    'border-teal-200/80 bg-teal-50/60',
  orange:  'border-orange-200/80 bg-orange-50/60',
  amber:   'border-amber-200/80 bg-amber-50/60',
  slate:   'border-slate-200/80 bg-slate-50/60',
  neutral: 'border-border bg-card',
}

interface BlockProps {
  id: string
  label: string
  sublabel?: string
  description: string
  accent: Accent
  className?: string
  compact?: boolean
  children?: React.ReactNode
}

function Block({ id, label, sublabel, description, accent, className = '', compact = false, children }: BlockProps) {
  const active = useIsActive(id)
  const c = ACCENT[accent]
  const idle = IDLE_TINT[accent]

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-lg border-2 transition-all duration-200',
        compact ? 'p-1.5' : 'p-2.5',
        active ? [c.border, c.bg, 'ring-2', c.ring, 'shadow-md'] : idle,
        className
      )}
    >
      <div>
        <div className={cn('text-xs font-semibold', active ? c.text : 'text-foreground')}>
          {label}
        </div>
        {sublabel && (
          <div className={cn('text-[10px]', active ? c.text : 'text-muted-foreground')}>
            {sublabel}
          </div>
        )}
      </div>
      {!compact && <div className="mt-1 text-[10px] leading-snug text-muted-foreground">{description}</div>}
      {children && <div className={compact ? 'mt-1' : 'mt-2'}>{children}</div>}
    </motion.div>
  )
}

function ProcessBadge({ id, label, description, color = 'amber', compact = false }: {
  id: string; label: string; description: string; color?: 'amber' | 'orange' | 'teal' | 'indigo'; compact?: boolean
}) {
  const active = useIsActive(id)

  const colorMap = {
    amber:  { idle: 'border-amber-200/80 bg-amber-50/60',   active: 'border-amber-500 bg-amber-100 ring-amber-300', text: 'text-amber-800',  dot: 'text-amber-500' },
    orange: { idle: 'border-orange-200/80 bg-orange-50/60', active: 'border-orange-500 bg-orange-100 ring-orange-300', text: 'text-orange-800', dot: 'text-orange-500' },
    teal:   { idle: 'border-teal-200/80 bg-teal-50/60',     active: 'border-teal-500 bg-teal-100 ring-teal-300',     text: 'text-teal-800',   dot: 'text-teal-500' },
    indigo: { idle: 'border-indigo-200/80 bg-indigo-50/60', active: 'border-indigo-500 bg-indigo-100 ring-indigo-300', text: 'text-indigo-800', dot: 'text-indigo-500' },
  }
  const c = colorMap[color]

  return (
    <motion.div
      animate={active ? { y: [0, -3, 0], scale: [1, 1.06, 1] } : { y: 0, scale: 1 }}
      transition={{ duration: 0.45, repeat: active ? Infinity : 0, repeatDelay: 0.2 }}
      className={cn(
        'flex flex-col items-center rounded-lg border-2 transition-all duration-200',
        compact ? 'px-1.5 py-1.5' : 'px-2 py-2',
        active ? [c.active, 'ring-2 shadow-md'] : c.idle
      )}
      title={description}
    >
      <span className={cn('text-[11px] font-bold', active ? c.text : 'text-foreground')}>
        {label}
      </span>
      {active && (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className={cn('mt-0.5 text-[9px] font-bold', c.dot)}
        >
          ● ACTIVE
        </motion.span>
      )}
    </motion.div>
  )
}

function SectionLabel({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'blue' | 'indigo' | 'amber' | 'slate' }) {
  const textCls = {
    default: 'text-muted-foreground',
    blue:    'text-blue-600',
    indigo:  'text-indigo-600',
    amber:   'text-amber-700',
    slate:   'text-slate-500',
  }[color]
  const lineCls = {
    default: 'bg-border',
    blue:    'bg-blue-200',
    indigo:  'bg-indigo-200',
    amber:   'bg-amber-200',
    slate:   'bg-slate-200',
  }[color]

  return (
    <div className="mb-2 flex items-center gap-2">
      <span className={cn('text-[9px] font-bold uppercase tracking-[0.15em]', textCls)}>
        {children}
      </span>
      <div className={cn('h-px flex-1', lineCls)} />
    </div>
  )
}

// ── Library Cache ──────────────────────────────────────────────────────────

function LibraryCacheBlock({ compact = false }: { compact?: boolean }) {
  const active = useIsActive('library-cache')
  const currentStep = useSimulationStore((s) => s.currentStep)
  const cachedQueries = useSimulationStore((s) => s.cachedQueries)
  const query = useSimulationStore((s) => s.query)
  const lang = useSimulationStore((s) => s.lang)

  const isSearching = currentStep === 'library-cache-check'
  const isHit = currentStep === 'library-cache-hit'
  const isMiss = currentStep === 'library-cache-miss'
  const showList = active || isSearching || isHit || isMiss
  const normalizedQuery = query.trim().toUpperCase()

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-lg border-2 transition-all duration-200',
        compact ? 'p-1.5' : 'p-2.5',
        active
          ? 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-300 shadow-md'
          : 'border-indigo-200/80 bg-indigo-50/60'
      )}
    >
      <div className={cn('text-xs font-semibold', active ? 'text-indigo-800' : 'text-foreground')}>
        Library Cache
      </div>
      {!compact && <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
        {lang === 'ko' ? '파싱된 SQL·실행 계획 캐싱. Soft Parse 활성화' : 'Caches parsed SQL & execution plans. Enables Soft Parse'}
      </div>}

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-md border border-indigo-200 bg-white/90"
          >
            <div className="border-b border-indigo-100 bg-indigo-50 px-2 py-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-indigo-500">
                cached cursor pool
              </span>
            </div>
            <div className="space-y-0.5 p-1.5">
              {cachedQueries.map((cq, i) => {
                const isMatch = cq.trim().toUpperCase() === normalizedQuery
                const isScanning = isSearching

                return (
                  <motion.div
                    key={cq}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0, background: isMatch && (isHit || isScanning) ? '#e0e7ff' : 'transparent' }}
                    transition={{ delay: isScanning ? i * 0.18 : 0, duration: 0.35 }}
                    className="flex items-center gap-1.5 rounded px-1.5 py-0.5"
                  >
                    <span className={cn('shrink-0 font-mono text-[8px] font-bold', isMatch ? 'text-indigo-600' : 'text-muted-foreground')}>
                      #{i + 1}
                    </span>
                    <span className={cn('flex-1 truncate font-mono text-[9px]', isMatch ? 'font-bold text-indigo-800' : 'text-muted-foreground')}>
                      {cq}
                    </span>
                    {isMatch && isHit && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="shrink-0 rounded bg-indigo-600 px-1 font-mono text-[8px] font-bold text-white"
                      >
                        HIT
                      </motion.span>
                    )}
                  </motion.div>
                )
              })}
              {isMiss && normalizedQuery && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 rounded border border-dashed border-orange-300 bg-orange-50 px-1.5 py-0.5"
                >
                  <span className="shrink-0 font-mono text-[8px] font-bold text-orange-500">?</span>
                  <span className="flex-1 truncate font-mono text-[9px] text-orange-600">{query}</span>
                  <span className="shrink-0 rounded bg-orange-500 px-1 font-mono text-[8px] font-bold text-white">MISS</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Buffer Cache ──────────────────────────────────────────────────────────

function BufferCacheBlock({ compact = false }: { compact?: boolean }) {
  const active = useIsActive('buffer-cache')
  const currentStep = useSimulationStore((s) => s.currentStep)
  const lang = useSimulationStore((s) => s.lang)

  const isChecking = currentStep === 'buffer-cache-check'
  const isHit = currentStep === 'buffer-cache-hit'
  const isMiss = currentStep === 'buffer-cache-miss'
  const isDiskIo = currentStep === 'disk-io'
  const showBlocks = active || isChecking || isHit || isMiss || isDiskIo

  const blocks = [
    { id: 'b1', label: 'EMP#1',  state: 'cached' },
    { id: 'b2', label: 'DEPT#2', state: 'cached' },
    { id: 'b3', label: 'EMP#3',  state: isHit ? 'hit' : isChecking ? 'scanning' : 'cached' },
    { id: 'b4', label: 'FREE',   state: isDiskIo ? 'loading' : 'free' },
    { id: 'b5', label: 'JOB#1',  state: 'cached' },
    { id: 'b6', label: 'FREE',   state: isDiskIo ? 'loading' : 'free' },
  ]

  const blockCls: Record<string, string> = {
    cached:   'bg-blue-100 text-blue-800 border-blue-300',
    hit:      'bg-blue-300 text-blue-900 border-blue-600 font-bold',
    scanning: 'bg-amber-100 text-amber-800 border-amber-400',
    free:     'bg-muted text-muted-foreground border-border',
    loading:  'bg-orange-100 text-orange-800 border-orange-400',
  }

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-lg border-2 transition-all duration-200',
        compact ? 'p-1.5' : 'p-2.5',
        active
          ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300 shadow-md'
          : 'border-blue-200/80 bg-blue-50/60'
      )}
    >
      <div className={cn('text-xs font-semibold', active ? 'text-blue-800' : 'text-foreground')}>
        Database Buffer Cache
      </div>
      {!compact && <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
        {lang === 'ko' ? '디스크 블록 메모리 캐시. LRU 관리' : 'In-memory disk block cache. LRU managed'}
      </div>}

      <AnimatePresence>
        {showBlocks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 grid grid-cols-3 gap-1 overflow-hidden"
          >
            {blocks.map((blk, i) => (
              <motion.div
                key={blk.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: isChecking ? i * 0.1 : 0 }}
                className={cn(
                  'rounded border px-1 py-0.5 text-center font-mono text-[8px] font-bold',
                  blockCls[blk.state]
                )}
              >
                {blk.label}
              </motion.div>
            ))}
            {(isMiss || isDiskIo) && (
              <div className="col-span-3 mt-0.5 font-mono text-[9px] text-orange-600">
                {isDiskIo
                  ? (lang === 'ko' ? '↑ Disk → Buffer 로드 중…' : '↑ Loading Disk → Buffer…')
                  : (lang === 'ko' ? '블록 없음 → Disk I/O 필요' : 'Block not found → Disk I/O required')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Diagram ──────────────────────────────────────────────────────────

export function OracleDiagram({ compact = false }: { compact?: boolean }) {
  const currentStep = useSimulationStore((s) => s.currentStep)
  const highlightedStep = useSimulationStore((s) => s.highlightedStep)
  const lang = useSimulationStore((s) => s.lang)
  const displayStep = highlightedStep ?? currentStep
  const stepLabel = STEP_PROCESS_LABEL[lang][displayStep]
  const D = DIAGRAM_TEXT[lang]

  const gap = compact ? 'gap-1.5' : 'gap-3'
  const pad = compact ? 'p-2' : 'p-4'
  const innerPad = compact ? 'p-1.5' : 'p-3'
  const innerPadSm = compact ? 'p-1.5' : 'p-2.5'

  return (
    <div className={cn('flex h-full flex-col overflow-y-auto', gap, pad)}>
      {/* Instance header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="font-mono text-xs font-bold text-blue-800">Oracle Database Instance</span>
        </div>
        <AnimatePresence mode="wait">
          {currentStep !== 'idle' && (
            <motion.div
              key={displayStep}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="flex items-center gap-2"
            >
              <Badge variant="outline" className="font-mono text-[10px] font-bold">
                {highlightedStep ? `📌 ${highlightedStep}` : `▶ ${currentStep}`}
              </Badge>
              {stepLabel && (
                <span className="font-mono text-[10px] text-muted-foreground">{stepLabel}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Server Process + PGA */}
      <div className="grid grid-cols-2 gap-2">
        <Block id="server-process" label="Server Process" description={D.serverProcess} accent="teal" compact={compact} />
        <Block id="pga" label="PGA" sublabel="Program Global Area" description={D.pga} accent="teal" compact={compact} />
      </div>

      {/* SGA */}
      <div className={cn('rounded-xl border-2 border-blue-300 bg-blue-50/50 shadow-sm', innerPad)}>
        <SectionLabel color="blue">SGA — System Global Area</SectionLabel>

        {/* Shared Pool */}
        <div className={cn('mb-2 rounded-lg border-2 border-indigo-200 bg-indigo-50/70', innerPadSm)}>
          <SectionLabel color="indigo">Shared Pool</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <LibraryCacheBlock compact={compact} />
            <Block id="dict-cache" label="Data Dictionary Cache" description={D.dictCache} accent="indigo" compact={compact} />
          </div>
        </div>

        {/* Buffer Cache + Redo + Undo */}
        <div className="grid grid-cols-3 gap-2">
          <BufferCacheBlock compact={compact} />
          <Block id="redo-buffer" label="Redo Log Buffer" description={D.redoBuffer} accent="orange" compact={compact} />
          <Block id="undo" label="Undo Segment" description={D.undo} accent="amber" compact={compact} />
        </div>
      </div>

      {/* Background Processes */}
      <div className={cn('rounded-xl border-2 border-amber-200 bg-amber-50/40 shadow-sm', innerPad)}>
        <SectionLabel color="amber">Background Processes</SectionLabel>
        <div className="grid grid-cols-5 gap-2">
          <ProcessBadge id="dbwr" label="DBWn" description={D.dbwr} color="orange" compact={compact} />
          <ProcessBadge id="lgwr" label="LGWR" description={D.lgwr} color="orange" compact={compact} />
          <ProcessBadge id="ckpt" label="CKPT" description={D.ckpt} color="amber" compact={compact} />
          <ProcessBadge id="smon" label="SMON" description={D.smon} color="amber" compact={compact} />
          <ProcessBadge id="pmon" label="PMON" description={D.pmon} color="teal" compact={compact} />
        </div>
      </div>

      {/* Disk */}
      <div className={cn('rounded-xl border-2 border-slate-300 bg-slate-50/60 shadow-sm', innerPad)}>
        <SectionLabel color="slate">Disk Storage</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          <Block id="disk"          label="Data Files"       description={D.dataFiles}   accent="slate" compact={compact} />
          <Block id="redo-log-file" label="Online Redo Logs" description={D.redoLogs}    accent="slate" compact={compact} />
          <Block id="control-file"  label="Control File"     description={D.controlFile} accent="slate" compact={compact} />
          <Block id="archive-log"   label="Archive Logs"     description={D.archiveLogs} accent="slate" compact={compact} />
        </div>
      </div>
    </div>
  )
}

const DIAGRAM_TEXT: Record<Lang, Record<string, string>> = {
  ko: {
    serverProcess: '사용자 요청 수신, SQL 파싱 수행',
    pga:           '세션별 독립 메모리. Sort/Hash 작업 영역',
    dictCache:     '테이블·컬럼 메타데이터. Hard Parse 시 조회',
    redoBuffer:    '변경사항 순차 기록. LGWR → 디스크',
    undo:          '롤백 및 읽기 일관성 (Read Consistency)',
    dbwr:          'Dirty Buffer → 데이터 파일 쓰기',
    lgwr:          'Redo Buffer → Redo Log 파일 쓰기',
    ckpt:          '체크포인트 정보 기록',
    smon:          'Instance Recovery, 임시 세그먼트 정리',
    pmon:          '실패한 프로세스 복구, 락 해제',
    dataFiles:     '테이블·인덱스 실제 데이터',
    redoLogs:      '순환 로그. 장애 복구용',
    controlFile:   'DB 구조·상태 메타데이터',
    archiveLogs:   '전체 복구용 아카이브',
  },
  en: {
    serverProcess: 'Receives user requests, performs SQL parsing',
    pga:           'Per-session private memory. Sort/Hash work area',
    dictCache:     'Table/column metadata. Accessed during Hard Parse',
    redoBuffer:    'Sequential change recording. LGWR → disk',
    undo:          'Rollback and Read Consistency support',
    dbwr:          'Dirty Buffer → Data File writes',
    lgwr:          'Redo Buffer → Redo Log file writes',
    ckpt:          'Records checkpoint information',
    smon:          'Instance Recovery, temp segment cleanup',
    pmon:          'Failed process recovery, lock release',
    dataFiles:     'Actual table/index data on disk',
    redoLogs:      'Circular logs for crash recovery',
    controlFile:   'DB structure and state metadata',
    archiveLogs:   'Archive logs for full recovery',
  },
}
