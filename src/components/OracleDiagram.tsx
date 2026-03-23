import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore, STEP_PROCESS_LABEL } from '@/store/simulationStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function useIsActive(id: string) {
  return useSimulationStore((s) => s.activeComponents.has(id))
}

type Accent = 'blue' | 'orange' | 'amber' | 'neutral'

const ACCENT: Record<Accent, { border: string; bg: string; text: string; ring: string }> = {
  blue:    { border: 'border-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700',   ring: 'ring-blue-200' },
  orange:  { border: 'border-orange-400',  bg: 'bg-orange-50',  text: 'text-orange-700', ring: 'ring-orange-200' },
  amber:   { border: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',  ring: 'ring-amber-200' },
  neutral: { border: 'border-border',      bg: 'bg-card',       text: 'text-foreground',  ring: '' },
}

interface BlockProps {
  id: string
  label: string
  sublabel?: string
  description: string
  accent: Accent
  className?: string
  children?: React.ReactNode
}

function Block({ id, label, sublabel, description, accent, className = '', children }: BlockProps) {
  const active = useIsActive(id)
  const c = ACCENT[accent]

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-lg border-2 p-2.5 transition-all duration-150',
        active ? [c.border, c.bg, 'ring-2', c.ring] : 'border-border bg-card shadow-xs',
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
      <div className="mt-1 text-[10px] leading-snug text-muted-foreground">{description}</div>
      {children && <div className="mt-2">{children}</div>}
    </motion.div>
  )
}

function ProcessBadge({ id, label, description }: { id: string; label: string; description: string }) {
  const active = useIsActive(id)
  return (
    <motion.div
      animate={active ? { y: [0, -3, 0], scale: [1, 1.06, 1] } : { y: 0, scale: 1 }}
      transition={{ duration: 0.45, repeat: active ? Infinity : 0, repeatDelay: 0.2 }}
      className={cn(
        'flex flex-col items-center rounded-lg border-2 px-2 py-2 transition-all duration-150',
        active ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200' : 'border-border bg-card shadow-xs'
      )}
      title={description}
    >
      <span className={cn('text-[11px] font-bold', active ? 'text-amber-700' : 'text-foreground')}>
        {label}
      </span>
      {active && (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="mt-0.5 text-[9px] font-bold text-amber-500"
        >
          ● ACTIVE
        </motion.span>
      )}
    </motion.div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function GroupBox({ children, label, tint = false, className = '' }: {
  children: React.ReactNode; label: string; tint?: boolean; className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        tint ? 'border-blue-200 bg-blue-50/40' : 'border-border bg-muted/30',
        className
      )}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}

// ── Library Cache ──────────────────────────────────────────────────────────

function LibraryCacheBlock() {
  const active = useIsActive('library-cache')
  const currentStep = useSimulationStore((s) => s.currentStep)
  const cachedQueries = useSimulationStore((s) => s.cachedQueries)
  const query = useSimulationStore((s) => s.query)

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
        'relative flex flex-col rounded-lg border-2 p-2.5 transition-all duration-150',
        active ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-border bg-card shadow-xs'
      )}
    >
      <div className={cn('text-xs font-semibold', active ? 'text-blue-700' : 'text-foreground')}>
        Library Cache
      </div>
      <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
        파싱된 SQL·실행 계획 캐싱. Soft Parse 활성화
      </div>

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-md border border-blue-200 bg-white"
          >
            <div className="border-b border-blue-100 px-2 py-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-blue-500">
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
                    animate={{ opacity: 1, x: 0, background: isMatch && (isHit || isScanning) ? '#dbeafe' : 'transparent' }}
                    transition={{ delay: isScanning ? i * 0.18 : 0, duration: 0.35 }}
                    className="flex items-center gap-1.5 rounded px-1.5 py-0.5"
                  >
                    <span className={cn('shrink-0 font-mono text-[8px] font-bold', isMatch ? 'text-blue-600' : 'text-muted-foreground')}>
                      #{i + 1}
                    </span>
                    <span className={cn('flex-1 truncate font-mono text-[9px]', isMatch ? 'font-bold text-blue-800' : 'text-muted-foreground')}>
                      {cq}
                    </span>
                    {isMatch && isHit && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="shrink-0 rounded bg-blue-600 px-1 font-mono text-[8px] font-bold text-white"
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

function BufferCacheBlock() {
  const active = useIsActive('buffer-cache')
  const currentStep = useSimulationStore((s) => s.currentStep)

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
    cached:   'bg-blue-50 text-blue-700 border-blue-200',
    hit:      'bg-blue-200 text-blue-900 border-blue-500',
    scanning: 'bg-amber-50 text-amber-700 border-amber-300',
    free:     'bg-muted text-muted-foreground border-border',
    loading:  'bg-orange-50 text-orange-700 border-orange-300',
  }

  return (
    <motion.div
      animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: active ? Infinity : 0, repeatDelay: 0.3 }}
      className={cn(
        'relative flex flex-col rounded-lg border-2 p-2.5 transition-all duration-150',
        active ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-border bg-card shadow-xs'
      )}
    >
      <div className={cn('text-xs font-semibold', active ? 'text-blue-700' : 'text-foreground')}>
        Database Buffer Cache
      </div>
      <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
        디스크 블록 메모리 캐시. LRU 관리
      </div>

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
                {isDiskIo ? '↑ Disk → Buffer 로드 중…' : '블록 없음 → Disk I/O 필요'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Diagram ──────────────────────────────────────────────────────────

export function OracleDiagram() {
  const currentStep = useSimulationStore((s) => s.currentStep)
  const highlightedStep = useSimulationStore((s) => s.highlightedStep)
  const displayStep = highlightedStep ?? currentStep
  const stepLabel = STEP_PROCESS_LABEL[displayStep]

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      {/* Instance header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="font-mono text-xs font-bold">Oracle Database Instance</span>
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
        <Block id="server-process" label="Server Process" description="사용자 요청 수신, SQL 파싱 수행" accent="blue" />
        <Block id="pga" label="PGA" sublabel="Program Global Area" description="세션별 독립 메모리. Sort/Hash 작업 영역" accent="blue" />
      </div>

      {/* SGA */}
      <GroupBox label="SGA — System Global Area" tint>
        <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50/60 p-2.5">
          <SectionLabel>Shared Pool</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <LibraryCacheBlock />
            <Block id="dict-cache" label="Data Dictionary Cache" description="테이블·컬럼 메타데이터. Hard Parse 시 조회" accent="blue" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <BufferCacheBlock />
          <Block id="redo-buffer" label="Redo Log Buffer" description="변경사항 순차 기록. LGWR → 디스크" accent="orange" />
          <Block id="undo" label="Undo Segment" description="롤백 및 읽기 일관성 (Read Consistency)" accent="amber" />
        </div>
      </GroupBox>

      {/* Background Processes */}
      <GroupBox label="Background Processes">
        <div className="grid grid-cols-5 gap-2">
          <ProcessBadge id="dbwr" label="DBWn" description="Dirty Buffer → 데이터 파일 쓰기" />
          <ProcessBadge id="lgwr" label="LGWR" description="Redo Buffer → Redo Log 파일 쓰기" />
          <ProcessBadge id="ckpt" label="CKPT" description="체크포인트 정보 기록" />
          <ProcessBadge id="smon" label="SMON" description="Instance Recovery, 임시 세그먼트 정리" />
          <ProcessBadge id="pmon" label="PMON" description="실패한 프로세스 복구, 락 해제" />
        </div>
      </GroupBox>

      {/* Disk */}
      <GroupBox label="Disk Storage">
        <div className="grid grid-cols-4 gap-2">
          <Block id="disk"          label="Data Files"       description="테이블·인덱스 실제 데이터"  accent="orange" />
          <Block id="redo-log-file" label="Online Redo Logs" description="순환 로그. 장애 복구용"      accent="orange" />
          <Block id="control-file"  label="Control File"     description="DB 구조·상태 메타데이터"    accent="amber" />
          <Block id="archive-log"   label="Archive Logs"     description="전체 복구용 아카이브"        accent="amber" />
        </div>
      </GroupBox>
    </div>
  )
}
