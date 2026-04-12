import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import type { InstanceComponentId } from './OracleInstanceMap'
import {
  ChapterTitle, SectionTitle, SubTitle, Prose,
  InfoBox, Table, ConceptGrid, Divider,
} from './shared'
import { cn } from '@/lib/utils'
import { OracleInstanceMap } from './OracleInstanceMap'
import { OracleDiagram } from '@/components/OracleDiagram'
import { QueryInput, LiveLog, SummaryTimeline } from '@/components/QueryInput'
import { OptimizerPanel } from '@/components/OptimizerPanel'
import { SchemaDiagramView } from '@/components/SchemaDiagram'
import { SchemaView, TableView } from '@/components/DataPanel'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'

// ── Bilingual strings ──────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: '오라클 내부 구조와 프로세스',
    chapterSubtitle: 'Oracle Database가 SQL을 처리하는 방법을 인스턴스 아키텍처 수준에서 이해합니다.',
    mapTitle: '인스턴스 구조에서의 위치',

    overviewTitle: '아키텍처 개요',
    overviewDesc: 'Oracle Database는 크게 두 가지 구성 요소로 이루어집니다. 메모리 구조와 프로세스로 이루어진 Oracle Instance와 실제 데이터가 저장되는 Oracle Database(파일 세트)입니다.',
    overviewDesc2: '인스턴스는 한 번에 하나의 데이터베이스만 마운트할 수 있으며, 서버 프로세스는 클라이언트 요청을 처리하고 SGA를 통해 공유 메모리에 접근합니다.',
    overviewCallout: '전체 인스턴스 구조',
    instanceItems: [
      { icon: '🧠', title: 'Oracle Instance', desc: 'SGA(메모리) + Background Processes. 데이터베이스가 마운트되면 인스턴스가 시작됩니다.', color: 'blue' },
      { icon: '💾', title: 'Oracle Database', desc: '데이터 파일(.dbf), 리두 로그 파일(.log), 컨트롤 파일(.ctl)로 구성된 물리적 파일 집합.', color: 'orange' },
      { icon: '🔄', title: 'Server Process', desc: '클라이언트 연결당 하나 생성. SQL 파싱, 실행, 결과 반환을 담당합니다.', color: 'violet' },
      { icon: '📋', title: 'PGA', desc: 'Program Global Area. 서버 프로세스마다 독립적으로 할당되는 비공유 메모리.', color: 'emerald' },
    ],

    sgaTitle: 'SGA — System Global Area',
    sgaDesc: 'SGA는 모든 서버 프로세스와 백그라운드 프로세스가 공유하는 메모리 영역입니다. Oracle 인스턴스 시작 시 할당되며, 종료 시 해제됩니다.',
    sgaCallout: 'SGA 전체 영역',
    sgaExploreLabel: 'SGA 구성 요소 살펴보기',
    sgaComponents: [
      ['Buffer Cache', '디스크에서 읽은 데이터 블록을 캐싱. Hit 시 물리적 I/O 없이 데이터 접근 가능'],
      ['Library Cache', '파싱된 SQL 커서, 실행 계획을 저장. Soft Parse로 재사용 가능'],
      ['Dictionary Cache', '테이블·컬럼·권한 등 메타데이터(데이터 딕셔너리) 캐싱'],
      ['Redo Log Buffer', 'DML 변경사항을 LGWR가 Redo Log File에 플러시하기 전 임시 보관'],
      ['Large Pool', '대용량 메모리 할당을 위한 영역 (Parallel Query, RMAN 등)'],
      ['Java Pool', 'Oracle JVM을 위한 메모리 영역'],
    ],
    sgaInfo: 'SGA_TARGET 파라미터로 SGA 전체 크기를 자동 관리(ASMM)할 수 있습니다. Oracle 11g 이후 AMM(Automatic Memory Management)으로 SGA+PGA를 함께 관리할 수 있습니다.',
    sgaMemMgmtTitle: '자동 메모리 관리',
    bufferCacheTitle: 'Buffer Cache 동작 원리',
    sgaTour: [
      { ids: ['library-cache'] as InstanceComponentId[], label: 'Library Cache', desc: { ko: '파싱된 SQL과 실행 계획 캐시. Soft Parse 시 재사용됩니다.', en: 'Caches parsed SQL and execution plans. Reused on Soft Parse.' } },
      { ids: ['dict-cache'] as InstanceComponentId[], label: 'Dictionary Cache', desc: { ko: '테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱합니다.', en: 'Caches data dictionary metadata: tables, columns, privileges.' } },
      { ids: ['buffer-cache'] as InstanceComponentId[], label: 'Buffer Cache', desc: { ko: '데이터 파일에서 읽은 블록을 메모리에 유지합니다. Cache Hit 시 디스크 I/O가 발생하지 않습니다.', en: 'Keeps data blocks in memory. Cache hits avoid disk I/O.' } },
      { ids: ['redo-buffer'] as InstanceComponentId[], label: 'Redo Log Buffer', desc: { ko: 'DML 변경사항을 임시 보관. LGWR가 Online Redo Log에 플러시합니다.', en: 'Temporarily holds DML changes. LGWR flushes to Online Redo Log.' } },
    ],

    pgaTitle: 'PGA — Program Global Area',
    pgaDesc: 'PGA는 각 서버 프로세스(또는 백그라운드 프로세스)에게 독립적으로 할당되는 비공유 메모리입니다. 다른 프로세스와 공유되지 않아 lock이 필요 없습니다.',
    pgaCallout: 'PGA — 서버 프로세스 전용 메모리',
    pgaSgaVsTitle: 'SGA vs PGA',
    pgaSgaVsDesc: 'SGA는 모든 프로세스가 공유하는 메모리(공유 메모리)입니다. PGA는 각 프로세스에 독립적으로 할당되는 전용 메모리입니다. Latch, Lock 없이 PGA에 접근할 수 있어 빠릅니다.',
    pgaItems: [
      { icon: '🔐', title: 'Private SQL Area', desc: '바인드 변수 값, 런타임 메모리 등 세션 고유 정보 저장.', color: 'blue' },
      { icon: '🗂', title: 'Sort Area', desc: 'ORDER BY, GROUP BY, DISTINCT 처리 시 사용. PGA_AGGREGATE_TARGET으로 관리.', color: 'orange' },
      { icon: '🔁', title: 'Hash Area', desc: 'Hash Join 수행 시 빌드 테이블을 메모리에 적재하는 공간.', color: 'violet' },
      { icon: '📦', title: 'Bitmap Merge Area', desc: 'Bitmap Index 스캔 결과를 병합할 때 사용하는 메모리.', color: 'emerald' },
    ],

    processTitle: '백그라운드 프로세스',
    processDesc: 'Oracle 인스턴스는 다양한 백그라운드 프로세스를 통해 메모리 관리, I/O, 복구 등의 작업을 자동으로 처리합니다.',
    processCallout: '백그라운드 프로세스 영역',
    processExploreLabel: '프로세스별 역할 살펴보기',
    processTable: [
      ['DBWn (DB Writer)', 'Buffer Cache의 Dirty 블록을 데이터 파일에 기록. Checkpoint 신호 또는 임계값 초과 시 동작'],
      ['LGWR (Log Writer)', 'Redo Log Buffer의 내용을 Online Redo Log File에 기록. Commit 시 동기 기록'],
      ['CKPT (Checkpoint)', 'Checkpoint SCN을 컨트롤 파일·데이터 파일 헤더에 기록. DBWn에 쓰기 신호 전송'],
      ['SMON (System Monitor)', '인스턴스 복구, 임시 세그먼트 정리, Extent Coalescing 담당'],
      ['PMON (Process Monitor)', '비정상 종료된 세션 정리, 리소스 해제, Listener에 서비스 등록'],
      ['ARCn (Archiver)', 'Online Redo Log가 꽉 차면 Archive Log File로 복사 (ARCHIVELOG 모드 시)'],
      ['MMON / MMNL', '통계 수집(AWR Snapshot), 알림, 자가 진단 담당'],
    ],
    processWalTitle: 'DBWn과 LGWR의 순서',
    processWalDesc: 'Oracle은 Write-Ahead Logging을 사용합니다. 데이터 블록이 디스크에 기록되기 전에 반드시 Redo Log가 먼저 기록되어야 합니다. LGWR이 DBWn보다 항상 먼저 동작합니다.',
    processTour: [
      { ids: ['dbwr', 'disk'] as InstanceComponentId[], label: 'DBWn', desc: { ko: 'Buffer Cache → Data Files 쓰기', en: 'Writes Buffer Cache → Data Files' } },
      { ids: ['lgwr', 'redo-log-file'] as InstanceComponentId[], label: 'LGWR', desc: { ko: 'Redo Buffer → Online Redo Log 쓰기', en: 'Writes Redo Buffer → Online Redo Log' } },
      { ids: ['ckpt', 'control-file', 'disk'] as InstanceComponentId[], label: 'CKPT', desc: { ko: 'Checkpoint 정보를 Control File·Data Files에 기록', en: 'Records checkpoint to Control File & Data Files' } },
      { ids: ['smon'] as InstanceComponentId[], label: 'SMON', desc: { ko: 'Instance Recovery 및 세그먼트 정리', en: 'Instance Recovery & segment cleanup' } },
      { ids: ['pmon'] as InstanceComponentId[], label: 'PMON', desc: { ko: '실패한 세션 정리, 락 해제', en: 'Cleans up failed sessions, releases locks' } },
      { ids: ['arcn', 'redo-log-file', 'archive-log'] as InstanceComponentId[], label: 'ARCn', desc: { ko: 'Online Redo Log → Archive Log 복사', en: 'Copies Online Redo Log → Archive Log' } },
    ],

    simTitle: 'Internals Simulator',
    simDesc: 'SQL을 입력하고 Oracle 인스턴스 내부에서 어떤 컴포넌트가 어떻게 활성화되는지 직접 확인해보세요.',
    tableHeaderComponent: '컴포넌트',
    tableHeaderRole: '역할',
    tableHeaderProcess: '프로세스',
    showAll: '전체 보기',
    execSummary: '처리 요약',
    liveLog: '실시간 로그',
    bufferSteps: [
      { id: 'sql',   label: 'SQL 요청',          desc: '서버 프로세스가 데이터 블록 필요' },
      { id: 'check', label: 'Buffer Cache 확인', desc: '블록이 이미 메모리에 있는가?' },
      { id: 'hit',   label: 'Cache Hit ✓',       desc: '메모리에서 직접 읽기 (Logical I/O)' },
      { id: 'miss',  label: 'Cache Miss ✗',      desc: '디스크에서 블록 읽기 (Physical I/O)' },
    ],
    bufferStepHint: '— 우측 지도에서 Buffer Cache 위치 확인',
  },
  en: {
    chapterTitle: 'Oracle Internals & Processes',
    chapterSubtitle: 'Understand how Oracle Database processes SQL at the instance architecture level.',
    mapTitle: 'Location in Instance Structure',

    overviewTitle: 'Architecture Overview',
    overviewDesc: 'An Oracle Database system consists of two main components: the Oracle Instance (memory structures + processes) and the Oracle Database (the set of physical files on disk).',
    overviewDesc2: 'An instance can only mount one database at a time. Server processes handle client requests and access shared memory through the SGA.',
    overviewCallout: 'Full Instance Structure',
    instanceItems: [
      { icon: '🧠', title: 'Oracle Instance', desc: 'SGA (memory) + Background Processes. The instance starts when a database is mounted.', color: 'blue' },
      { icon: '💾', title: 'Oracle Database', desc: 'Physical file set: data files (.dbf), redo log files (.log), and control files (.ctl).', color: 'orange' },
      { icon: '🔄', title: 'Server Process', desc: 'One created per client connection. Handles SQL parsing, execution, and result return.', color: 'violet' },
      { icon: '📋', title: 'PGA', desc: 'Program Global Area. Non-shared memory allocated independently per server process.', color: 'emerald' },
    ],

    sgaTitle: 'SGA — System Global Area',
    sgaDesc: 'The SGA is a shared memory region used by all server and background processes. It is allocated when the Oracle instance starts and released when it shuts down.',
    sgaCallout: 'SGA — Shared Memory Region',
    sgaExploreLabel: 'Explore SGA Components',
    sgaComponents: [
      ['Buffer Cache', 'Caches data blocks read from disk. Cache hits eliminate physical I/O.'],
      ['Library Cache', 'Stores parsed SQL cursors and execution plans. Enables soft parse reuse.'],
      ['Dictionary Cache', 'Caches metadata (tables, columns, privileges) from the data dictionary.'],
      ['Redo Log Buffer', 'Temporarily holds DML changes before LGWR flushes them to redo log files.'],
      ['Large Pool', 'Memory for large allocations: Parallel Query, RMAN backups, etc.'],
      ['Java Pool', 'Memory reserved for the Oracle JVM.'],
    ],
    sgaInfo: 'SGA_TARGET enables Automatic Shared Memory Management (ASMM). From Oracle 11g, AMM (Automatic Memory Management) can manage both SGA and PGA together.',
    sgaMemMgmtTitle: 'Automatic Memory Management',
    bufferCacheTitle: 'How Buffer Cache Works',
    sgaTour: [
      { ids: ['library-cache'] as InstanceComponentId[], label: 'Library Cache', desc: { ko: '파싱된 SQL과 실행 계획 캐시. Soft Parse 시 재사용됩니다.', en: 'Caches parsed SQL and execution plans. Reused on Soft Parse.' } },
      { ids: ['dict-cache'] as InstanceComponentId[], label: 'Dictionary Cache', desc: { ko: '테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱합니다.', en: 'Caches data dictionary metadata: tables, columns, privileges.' } },
      { ids: ['buffer-cache'] as InstanceComponentId[], label: 'Buffer Cache', desc: { ko: '데이터 파일에서 읽은 블록을 메모리에 유지합니다. Cache Hit 시 디스크 I/O가 발생하지 않습니다.', en: 'Keeps data blocks in memory. Cache hits avoid disk I/O.' } },
      { ids: ['redo-buffer'] as InstanceComponentId[], label: 'Redo Log Buffer', desc: { ko: 'DML 변경사항을 임시 보관. LGWR가 Online Redo Log에 플러시합니다.', en: 'Temporarily holds DML changes. LGWR flushes to Online Redo Log.' } },
    ],

    pgaTitle: 'PGA — Program Global Area',
    pgaDesc: 'The PGA is a non-shared memory region allocated independently per server (or background) process. No locks are required since it is private.',
    pgaCallout: 'PGA — Per-Process Private Memory',
    pgaSgaVsTitle: 'SGA vs PGA',
    pgaSgaVsDesc: 'The SGA is shared by all processes. The PGA is private to each process. PGA access requires no latches or locks, making it faster.',
    pgaItems: [
      { icon: '🔐', title: 'Private SQL Area', desc: 'Stores bind variable values and session-specific runtime memory.', color: 'blue' },
      { icon: '🗂', title: 'Sort Area', desc: 'Used for ORDER BY, GROUP BY, DISTINCT operations. Managed by PGA_AGGREGATE_TARGET.', color: 'orange' },
      { icon: '🔁', title: 'Hash Area', desc: 'Loads the build table into memory for Hash Join execution.', color: 'violet' },
      { icon: '📦', title: 'Bitmap Merge Area', desc: 'Merges results from multiple bitmap index scans.', color: 'emerald' },
    ],

    processTitle: 'Background Processes',
    processDesc: 'Oracle background processes automatically handle memory management, I/O, recovery, and other internal tasks.',
    processCallout: 'Background Processes',
    processExploreLabel: 'Explore Each Process',
    processTable: [
      ['DBWn (DB Writer)', 'Writes dirty blocks from Buffer Cache to data files. Triggered by checkpoint or threshold.'],
      ['LGWR (Log Writer)', 'Writes Redo Log Buffer to Online Redo Log Files. Writes synchronously on COMMIT.'],
      ['CKPT (Checkpoint)', 'Records checkpoint SCN to control file and data file headers. Signals DBWn to write.'],
      ['SMON (System Monitor)', 'Handles instance recovery, temporary segment cleanup, and extent coalescing.'],
      ['PMON (Process Monitor)', 'Cleans up dead sessions, releases resources, registers services with Listener.'],
      ['ARCn (Archiver)', 'Copies online redo logs to archive logs when full (ARCHIVELOG mode).'],
      ['MMON / MMNL', 'Collects statistics (AWR snapshots), sends alerts, handles self-diagnosis.'],
    ],
    processWalTitle: 'DBWn vs LGWR Order',
    processWalDesc: 'Oracle uses Write-Ahead Logging. Redo logs must be written to disk before data blocks. LGWR always writes before DBWn.',
    processTour: [
      { ids: ['dbwr', 'disk'] as InstanceComponentId[], label: 'DBWn', desc: { ko: 'Buffer Cache → Data Files 쓰기', en: 'Writes Buffer Cache → Data Files' } },
      { ids: ['lgwr', 'redo-log-file'] as InstanceComponentId[], label: 'LGWR', desc: { ko: 'Redo Buffer → Online Redo Log 쓰기', en: 'Writes Redo Buffer → Online Redo Log' } },
      { ids: ['ckpt', 'control-file', 'disk'] as InstanceComponentId[], label: 'CKPT', desc: { ko: 'Checkpoint 정보를 Control File·Data Files에 기록', en: 'Records checkpoint to Control File & Data Files' } },
      { ids: ['smon'] as InstanceComponentId[], label: 'SMON', desc: { ko: 'Instance Recovery 및 세그먼트 정리', en: 'Instance Recovery & segment cleanup' } },
      { ids: ['pmon'] as InstanceComponentId[], label: 'PMON', desc: { ko: '실패한 세션 정리, 락 해제', en: 'Cleans up failed sessions, releases locks' } },
      { ids: ['arcn', 'redo-log-file', 'archive-log'] as InstanceComponentId[], label: 'ARCn', desc: { ko: 'Online Redo Log → Archive Log 복사', en: 'Copies Online Redo Log → Archive Log' } },
    ],

    simTitle: 'Internals Simulator',
    simDesc: 'Enter a SQL query and watch which Oracle instance components activate and how.',
    tableHeaderComponent: 'Component',
    tableHeaderRole: 'Role',
    tableHeaderProcess: 'Process',
    showAll: 'Show All',
    execSummary: 'Execution Summary',
    liveLog: 'Live Log',
    bufferSteps: [
      { id: 'sql',   label: 'SQL Request',        desc: 'Server process needs a data block' },
      { id: 'check', label: 'Buffer Cache Check', desc: 'Is the block already in memory?' },
      { id: 'hit',   label: 'Cache Hit ✓',        desc: 'Read from memory (Logical I/O)' },
      { id: 'miss',  label: 'Cache Miss ✗',       desc: 'Read from disk (Physical I/O)' },
    ],
    bufferStepHint: '— See Buffer Cache highlighted on the right',
  },
}

// ── Shared layout primitives ───────────────────────────────────────────────

function TwoColLayout({ children, map }: { children: React.ReactNode; map: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">{children}</div>
        <aside className="w-80 shrink-0 xl:w-96">
          <div className="sticky top-6">{map}</div>
        </aside>
      </div>
    </div>
  )
}

function MapPanel({ title, highlightIds, callout }: {
  title: string
  highlightIds: InstanceComponentId[]
  callout?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <OracleInstanceMap highlightIds={highlightIds} callout={callout} />
    </div>
  )
}

// ── Shared TourPanel (SGA & Processes reuse) ──────────────────────────────

type TourItem = {
  ids: InstanceComponentId[]
  label: string
  desc: { ko: string; en: string }
}

function TourPanel({
  tour,
  activeIdx,
  onSelect,
  accentColor,
  exploreLabel,
  showAllLabel,
  lang,
}: {
  tour: TourItem[]
  activeIdx: number | null
  onSelect: (i: number | null) => void
  accentColor: 'blue' | 'amber'
  exploreLabel: string
  showAllLabel: string
  lang: 'ko' | 'en'
}) {
  const active = accentColor === 'blue'
    ? { btn: 'border-blue-400 bg-blue-100 text-blue-700 font-bold shadow-sm', hover: 'hover:border-blue-300 hover:bg-blue-50', card: 'border-blue-200 bg-blue-50', title: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' }
    : { btn: 'border-amber-400 bg-amber-100 text-amber-700 font-bold shadow-sm', hover: 'hover:border-amber-300 hover:bg-amber-50', card: 'border-amber-200 bg-amber-50', title: 'text-amber-700', badge: 'bg-amber-200 text-amber-800' }

  return (
    <>
      <SubTitle>{exploreLabel}</SubTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {tour.map((item, i) => (
          <button
            key={item.label}
            onClick={() => onSelect(activeIdx === i ? null : i)}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-xs transition-all',
              activeIdx === i ? active.btn : `${active.hover} text-muted-foreground`
            )}
          >
            {item.label}
          </button>
        ))}
        {activeIdx !== null && (
          <button
            onClick={() => onSelect(null)}
            className="rounded-full border border-dashed px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ {showAllLabel}
          </button>
        )}
      </div>

      {activeIdx !== null && (
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mb-4 rounded-lg border p-3', active.card)}
        >
          <div className={cn('mb-1 font-mono text-xs font-bold', active.title)}>
            {tour[activeIdx].label}
          </div>
          <p className="font-mono text-xs text-muted-foreground">{tour[activeIdx].desc[lang]}</p>
          {accentColor === 'amber' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tour[activeIdx].ids.map((id) => (
                <span key={id} className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold', active.badge)}>
                  {id}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}

// ── Page component ─────────────────────────────────────────────────────────

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-simulator') return <InternalsSimulatorSection />

  return (
    <>
      {sectionId === 'internals-overview'  && <OverviewSection />}
      {sectionId === 'internals-sga'       && <SgaSection />}
      {sectionId === 'internals-pga'       && <PgaSection />}
      {sectionId === 'internals-processes' && <ProcessesSection />}
    </>
  )
}

// ── Overview ───────────────────────────────────────────────────────────────

function OverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <TwoColLayout map={<MapPanel title={t.mapTitle} highlightIds={[]} callout={t.overviewCallout} />}>
      <ChapterTitle icon="⚙" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>
      <Prose>{t.overviewDesc2}</Prose>
      <ConceptGrid items={t.instanceItems} />
    </TwoColLayout>
  )
}

// ── SGA ────────────────────────────────────────────────────────────────────

function SgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [tourIdx, setTourIdx] = useState<number | null>(null)

  const highlightIds: InstanceComponentId[] =
    tourIdx !== null
      ? t.sgaTour[tourIdx].ids
      : ['sga', 'library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer']

  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={highlightIds}
          callout={tourIdx !== null ? t.sgaTour[tourIdx].label : t.sgaCallout}
        />
      }
    >
      <SectionTitle>{t.sgaTitle}</SectionTitle>
      <Prose>{t.sgaDesc}</Prose>

      <TourPanel
        tour={t.sgaTour}
        activeIdx={tourIdx}
        onSelect={setTourIdx}
        accentColor="blue"
        exploreLabel={t.sgaExploreLabel}
        showAllLabel={t.showAll}
        lang={lang}
      />

      <Table headers={[t.tableHeaderComponent, t.tableHeaderRole]} rows={t.sgaComponents} />
      <InfoBox color="blue" icon="💡" title={t.sgaMemMgmtTitle}>{t.sgaInfo}</InfoBox>

      <Divider />
      <SubTitle>{t.bufferCacheTitle}</SubTitle>
      <BufferCacheFlow onHighlight={(id) => setTourIdx(id === 'buffer-cache' ? 2 : null)} />
    </TwoColLayout>
  )
}

// ── PGA ────────────────────────────────────────────────────────────────────

function PgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <TwoColLayout
      map={<MapPanel title={t.mapTitle} highlightIds={['server-process', 'pga']} callout={t.pgaCallout} />}
    >
      <SectionTitle>{t.pgaTitle}</SectionTitle>
      <Prose>{t.pgaDesc}</Prose>
      <ConceptGrid items={t.pgaItems} />
      <InfoBox color="emerald" icon="🔐" title={t.pgaSgaVsTitle}>{t.pgaSgaVsDesc}</InfoBox>
    </TwoColLayout>
  )
}

// ── Processes ──────────────────────────────────────────────────────────────

function ProcessesSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeProcess, setActiveProcess] = useState<number | null>(null)

  const highlightIds: InstanceComponentId[] =
    activeProcess !== null
      ? t.processTour[activeProcess].ids
      : ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn']

  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={highlightIds}
          callout={activeProcess !== null ? t.processTour[activeProcess].label : t.processCallout}
        />
      }
    >
      <SectionTitle>{t.processTitle}</SectionTitle>
      <Prose>{t.processDesc}</Prose>

      <TourPanel
        tour={t.processTour}
        activeIdx={activeProcess}
        onSelect={setActiveProcess}
        accentColor="amber"
        exploreLabel={t.processExploreLabel}
        showAllLabel={t.showAll}
        lang={lang}
      />

      <Table headers={[t.tableHeaderProcess, t.tableHeaderRole]} rows={t.processTable} />
      <InfoBox color="orange" icon="⚠" title={t.processWalTitle}>{t.processWalDesc}</InfoBox>
    </TwoColLayout>
  )
}

// ── Internals Simulator ────────────────────────────────────────────────────

type SimTab = 'simulator' | 'erd'

function InternalsSimulatorSection() {
  const optimizerResult   = useSimulationStore((s) => s.optimizerResult)
  const isComplete        = useSimulationStore((s) => s.isComplete)
  const highlightedStep   = useSimulationStore((s) => s.highlightedStep)
  const setHighlightedStep = useSimulationStore((s) => s.setHighlightedStep)
  const lang              = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeTab, setActiveTab] = useState<SimTab>('simulator')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b bg-muted/30">
        <div className="px-4 py-2.5">
          <h2 className="text-sm font-bold leading-none">{t.simTitle}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t.simDesc}</p>
        </div>
        <div className="ml-auto flex h-full shrink-0 items-stretch gap-px border-l pr-1">
          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              'flex items-center gap-1.5 px-4 font-mono text-xs font-semibold transition-colors',
              activeTab === 'simulator'
                ? 'border-b-2 border-foreground bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-[11px]">⚙</span>
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-4 font-mono text-xs font-semibold transition-colors',
              activeTab === 'erd'
                ? 'border-b-2 border-violet-500 bg-background text-violet-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-[11px]">⬡</span>
            Schema / ERD
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col overflow-hidden"
            >
              {/* Top: OracleDiagram (70%) + Optimizer (right 30%) */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 overflow-hidden" style={{ width: '70%', flexShrink: 0 }}>
                  <OracleDiagram compact />
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l bg-card">
                  <div className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      CBO Optimizer
                    </span>
                    {optimizerResult && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        cost {optimizerResult.plan.totalCost.toFixed(1)} · {optimizerResult.plan.estimatedRows} rows
                      </span>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <OptimizerPanel result={optimizerResult} />
                  </div>
                </div>
              </div>

              {/* Bottom: SQL input (left 70%) + Log/Summary (right 30%) */}
              <div className="flex shrink-0 border-t" style={{ height: '220px' }}>
                <div className="flex min-h-0 flex-col overflow-hidden border-r" style={{ width: '70%', flexShrink: 0 }}>
                  <div className="shrink-0 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      SQL Input
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <QueryInput />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
                  <div className="shrink-0 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isComplete ? t.execSummary : t.liveLog}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <SummaryTimeline selectedStep={highlightedStep} onSelect={setHighlightedStep} />
                        </motion.div>
                      ) : (
                        <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <LiveLog />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="erd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <ErdPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── ERD Panel ──────────────────────────────────────────────────────────────

type ErdLeftView = 'schema' | 'data'

function ErdPanel() {
  const [selectedSchema, setSelectedSchema] = useState(SCHEMAS[0])
  const [leftView, setLeftView] = useState<ErdLeftView>('schema')
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null)
  const [panelWidth, setPanelWidth] = useState(288)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleSchemaChange = (s: typeof SCHEMAS[0]) => {
    setSelectedSchema(s)
    setSelectedTable(null)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setPanelWidth(Math.min(520, Math.max(180, startWidth.current + e.clientX - startX.current)))
    }
    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex shrink-0 flex-col overflow-hidden bg-card" style={{ width: panelWidth }}>
        {/* Schema tabs */}
        <div className="flex shrink-0 border-b">
          {SCHEMAS.map((s) => (
            <button
              key={s.name}
              onClick={() => handleSchemaChange(s)}
              className={cn(
                'flex-1 py-2 font-mono text-xs font-semibold transition-colors',
                selectedSchema.name === s.name
                  ? 'border-b-2 border-violet-500 text-violet-600'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* View toggle: Schema / Data */}
        <div className="flex shrink-0 border-b">
          {(['schema', 'data'] as ErdLeftView[]).map((v) => (
            <button
              key={v}
              onClick={() => setLeftView(v)}
              className={cn(
                'flex-1 py-1.5 font-mono text-[11px] font-medium transition-colors',
                leftView === v
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'schema' ? 'Schema' : 'Table Data'}
            </button>
          ))}
        </div>

        {/* Table picker (only in Data view) */}
        {leftView === 'data' && (
          <div className="flex shrink-0 flex-wrap gap-1 border-b bg-muted/30 px-3 py-2">
            {selectedSchema.tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t)}
                className={cn(
                  'rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors',
                  selectedTable?.name === t.name
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {leftView === 'schema' && <SchemaView schema={selectedSchema} />}
          {leftView === 'data' && selectedTable && <TableView table={selectedTable} />}
          {leftView === 'data' && !selectedTable && (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              위에서 테이블을 선택하세요
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-violet-400 active:bg-violet-500"
      >
        <div className="absolute h-8 w-3 rounded-full bg-border transition-colors group-hover:bg-violet-400" />
      </div>

      {/* ERD diagram */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <SchemaDiagramView lockedSchema={selectedSchema.name} onSchemaChange={handleSchemaChange} />
      </div>
    </div>
  )
}

// ── Buffer Cache Flow ──────────────────────────────────────────────────────

function BufferCacheFlow({ onHighlight }: { onHighlight: (id: string | null) => void }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [active, setActive] = useState(0)

  const STEP_COLORS = ['bg-muted border-border', 'bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-300', 'bg-orange-50 border-orange-300']

  const handleClick = (i: number) => {
    setActive(i)
    const id = t.bufferSteps[i].id
    onHighlight(id === 'check' || id === 'hit' || id === 'miss' ? 'buffer-cache' : null)
  }

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap gap-2">
        {t.bufferSteps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleClick(i)}
            className={cn(
              'flex min-w-28 flex-1 flex-col gap-1 rounded-lg border p-3 text-left transition-all',
              STEP_COLORS[i],
              active === i ? 'shadow-sm ring-2 ring-blue-400 ring-offset-1' : 'opacity-60 hover:opacity-90'
            )}
          >
            <span className="font-mono text-[10px] font-bold">{s.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{s.desc}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          Step {active + 1}/{t.bufferSteps.length}: {t.bufferSteps[active].label}
          {['check', 'hit', 'miss'].includes(t.bufferSteps[active].id) && ` ${t.bufferStepHint}`}
        </span>
      </div>
    </div>
  )
}
