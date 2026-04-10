import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore, type Lang } from '@/store/simulationStore'
import {
  ChapterTitle, SectionTitle, SubTitle, Prose,
  InfoBox, Table, ConceptGrid, Divider
} from './shared'
import { cn } from '@/lib/utils'
import { OracleInstanceMap } from './OracleInstanceMap'
import type { InstanceComponentId } from './OracleInstanceMap'

// ─── Inline Internals Simulator ─────────────────────────────────────────────
import { OracleDiagram } from '@/components/OracleDiagram'
import { QueryInput } from '@/components/QueryInput'
import { DataPanel } from '@/components/DataPanel'
import { OptimizerPanel } from '@/components/OptimizerPanel'
import { Button } from '@/components/ui/button'

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
    sgaComponents: [
      ['Buffer Cache', '디스크에서 읽은 데이터 블록을 캐싱. Hit 시 물리적 I/O 없이 데이터 접근 가능'],
      ['Library Cache', '파싱된 SQL 커서, 실행 계획을 저장. Soft Parse로 재사용 가능'],
      ['Dictionary Cache', '테이블·컬럼·권한 등 메타데이터(데이터 딕셔너리) 캐싱'],
      ['Redo Log Buffer', 'DML 변경사항을 LGWR가 Redo Log File에 플러시하기 전 임시 보관'],
      ['Large Pool', '대용량 메모리 할당을 위한 영역 (Parallel Query, RMAN 등)'],
      ['Java Pool', 'Oracle JVM을 위한 메모리 영역'],
    ],
    sgaInfo: 'SGA_TARGET 파라미터로 SGA 전체 크기를 자동 관리(ASMM)할 수 있습니다. Oracle 11g 이후 AMM(Automatic Memory Management)으로 SGA+PGA를 함께 관리할 수 있습니다.',
    bufferCacheTitle: 'Buffer Cache 동작 원리',

    // SGA sub-highlights for interactive tour
    sgaTour: [
      { ids: ['library-cache'] as InstanceComponentId[], label: 'Library Cache', desc: { ko: '파싱된 SQL과 실행 계획 캐시. Soft Parse 시 재사용됩니다.', en: 'Caches parsed SQL and execution plans. Reused on Soft Parse.' } },
      { ids: ['dict-cache'] as InstanceComponentId[], label: 'Dictionary Cache', desc: { ko: '테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱합니다.', en: 'Caches data dictionary metadata: tables, columns, privileges.' } },
      { ids: ['buffer-cache'] as InstanceComponentId[], label: 'Buffer Cache', desc: { ko: '데이터 파일에서 읽은 블록을 메모리에 유지합니다. Cache Hit 시 디스크 I/O가 발생하지 않습니다.', en: 'Keeps data blocks in memory. Cache hits avoid disk I/O.' } },
      { ids: ['redo-buffer'] as InstanceComponentId[], label: 'Redo Log Buffer', desc: { ko: 'DML 변경사항을 임시 보관. LGWR가 Online Redo Log에 플러시합니다.', en: 'Temporarily holds DML changes. LGWR flushes to Online Redo Log.' } },
    ],

    pgaTitle: 'PGA — Program Global Area',
    pgaDesc: 'PGA는 각 서버 프로세스(또는 백그라운드 프로세스)에게 독립적으로 할당되는 비공유 메모리입니다. 다른 프로세스와 공유되지 않아 lock이 필요 없습니다.',
    pgaCallout: 'PGA — 서버 프로세스 전용 메모리',
    pgaItems: [
      { icon: '🔐', title: 'Private SQL Area', desc: '바인드 변수 값, 런타임 메모리 등 세션 고유 정보 저장.', color: 'blue' },
      { icon: '🗂', title: 'Sort Area', desc: 'ORDER BY, GROUP BY, DISTINCT 처리 시 사용. PGA_AGGREGATE_TARGET으로 관리.', color: 'orange' },
      { icon: '🔁', title: 'Hash Area', desc: 'Hash Join 수행 시 빌드 테이블을 메모리에 적재하는 공간.', color: 'violet' },
      { icon: '📦', title: 'Bitmap Merge Area', desc: 'Bitmap Index 스캔 결과를 병합할 때 사용하는 메모리.', color: 'emerald' },
    ],

    processTitle: '백그라운드 프로세스',
    processDesc: 'Oracle 인스턴스는 다양한 백그라운드 프로세스를 통해 메모리 관리, I/O, 복구 등의 작업을 자동으로 처리합니다.',
    processCallout: '백그라운드 프로세스 영역',
    processTable: [
      ['DBWn (DB Writer)', 'Buffer Cache의 Dirty 블록을 데이터 파일에 기록. Checkpoint 신호 또는 임계값 초과 시 동작'],
      ['LGWR (Log Writer)', 'Redo Log Buffer의 내용을 Online Redo Log File에 기록. Commit 시 동기 기록'],
      ['CKPT (Checkpoint)', 'Checkpoint SCN을 컨트롤 파일·데이터 파일 헤더에 기록. DBWn에 쓰기 신호 전송'],
      ['SMON (System Monitor)', '인스턴스 복구, 임시 세그먼트 정리, Extent Coalescing 담당'],
      ['PMON (Process Monitor)', '비정상 종료된 세션 정리, 리소스 해제, Listener에 서비스 등록'],
      ['ARCn (Archiver)', 'Online Redo Log가 꽉 차면 Archive Log File로 복사 (ARCHIVELOG 모드 시)'],
      ['MMON / MMNL', '통계 수집(AWR Snapshot), 알림, 자가 진단 담당'],
    ],
    // 프로세스별 하이라이트 매핑
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
    sgaComponents: [
      ['Buffer Cache', 'Caches data blocks read from disk. Cache hits eliminate physical I/O.'],
      ['Library Cache', 'Stores parsed SQL cursors and execution plans. Enables soft parse reuse.'],
      ['Dictionary Cache', 'Caches metadata (tables, columns, privileges) from the data dictionary.'],
      ['Redo Log Buffer', 'Temporarily holds DML changes before LGWR flushes them to redo log files.'],
      ['Large Pool', 'Memory for large allocations: Parallel Query, RMAN backups, etc.'],
      ['Java Pool', 'Memory reserved for the Oracle JVM.'],
    ],
    sgaInfo: 'SGA_TARGET enables Automatic Shared Memory Management (ASMM). From Oracle 11g, AMM (Automatic Memory Management) can manage both SGA and PGA together.',
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
    pgaItems: [
      { icon: '🔐', title: 'Private SQL Area', desc: 'Stores bind variable values and session-specific runtime memory.', color: 'blue' },
      { icon: '🗂', title: 'Sort Area', desc: 'Used for ORDER BY, GROUP BY, DISTINCT operations. Managed by PGA_AGGREGATE_TARGET.', color: 'orange' },
      { icon: '🔁', title: 'Hash Area', desc: 'Loads the build table into memory for Hash Join execution.', color: 'violet' },
      { icon: '📦', title: 'Bitmap Merge Area', desc: 'Merges results from multiple bitmap index scans.', color: 'emerald' },
    ],

    processTitle: 'Background Processes',
    processDesc: 'Oracle background processes automatically handle memory management, I/O, recovery, and other internal tasks.',
    processCallout: 'Background Processes',
    processTable: [
      ['DBWn (DB Writer)', 'Writes dirty blocks from Buffer Cache to data files. Triggered by checkpoint or threshold.'],
      ['LGWR (Log Writer)', 'Writes Redo Log Buffer to Online Redo Log Files. Writes synchronously on COMMIT.'],
      ['CKPT (Checkpoint)', 'Records checkpoint SCN to control file and data file headers. Signals DBWn to write.'],
      ['SMON (System Monitor)', 'Handles instance recovery, temporary segment cleanup, and extent coalescing.'],
      ['PMON (Process Monitor)', 'Cleans up dead sessions, releases resources, registers services with Listener.'],
      ['ARCn (Archiver)', 'Copies online redo logs to archive logs when full (ARCHIVELOG mode).'],
      ['MMON / MMNL', 'Collects statistics (AWR snapshots), sends alerts, handles self-diagnosis.'],
    ],
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
  },
}

// ─── Layout wrapper: 콘텐츠 좌측 + 인스턴스 맵 우측 sticky ────────────────
function TwoColLayout({
  children,
  map,
}: {
  children: React.ReactNode
  map: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Sticky map panel */}
        <aside className="w-80 xl:w-96 shrink-0">
          <div className="sticky top-6">
            {map}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Map Panel 공통 래퍼 ──────────────────────────────────────────────────
function MapPanel({
  title,
  highlightIds,
  callout,
}: {
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

// ─── Page component ────────────────────────────────────────────────────────
export function InternalsPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'internals-simulator') {
    return <InternalsSimulatorSection lang={lang} t={t} />
  }

  return (
    <>
      {sectionId === 'internals-overview' && <OverviewSection t={t} />}
      {sectionId === 'internals-sga' && <SgaSection t={t} lang={lang} />}
      {sectionId === 'internals-pga' && <PgaSection t={t} lang={lang} />}
      {sectionId === 'internals-processes' && <ProcessesSection t={t} lang={lang} />}
    </>
  )
}

// ─── Overview: 모든 컴포넌트 표시 (하이라이트 없음) ─────────────────────
function OverviewSection({ t }: { t: typeof T['ko'] }) {
  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={[]}
          callout={t.overviewCallout}
        />
      }
    >
      <ChapterTitle icon="⚙" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>
      <Prose>{t.overviewDesc2}</Prose>
      <ConceptGrid items={t.instanceItems} />
    </TwoColLayout>
  )
}

// ─── SGA: SGA 영역 + 인터랙티브 컴포넌트 투어 ───────────────────────────
function SgaSection({ t, lang }: { t: typeof T['ko']; lang: Lang }) {
  const [tourIdx, setTourIdx] = useState<number | null>(null)
  const tour = t.sgaTour

  const activeHighlights: InstanceComponentId[] =
    tourIdx !== null
      ? tour[tourIdx].ids
      : ['sga', 'library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer']

  const callout =
    tourIdx !== null
      ? tour[tourIdx].label
      : t.sgaCallout

  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={activeHighlights}
          callout={callout}
        />
      }
    >
      <SectionTitle>{t.sgaTitle}</SectionTitle>
      <Prose>{t.sgaDesc}</Prose>

      {/* 인터랙티브 컴포넌트 투어 */}
      <SubTitle>
        {lang === 'ko' ? 'SGA 구성 요소 살펴보기' : 'Explore SGA Components'}
      </SubTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {tour.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setTourIdx(tourIdx === i ? null : i)}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-xs transition-all',
              tourIdx === i
                ? 'border-blue-400 bg-blue-100 text-blue-700 font-bold shadow-sm'
                : 'hover:border-blue-300 hover:bg-blue-50 text-muted-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
        {tourIdx !== null && (
          <button
            onClick={() => setTourIdx(null)}
            className="rounded-full border border-dashed px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ {lang === 'ko' ? '전체 보기' : 'Show All'}
          </button>
        )}
      </div>

      {tourIdx !== null && (
        <motion.div
          key={tourIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3"
        >
          <div className="mb-1 font-mono text-xs font-bold text-blue-700">{tour[tourIdx].label}</div>
          <p className="font-mono text-xs text-muted-foreground">{tour[tourIdx].desc[lang]}</p>
        </motion.div>
      )}

      <Table
        headers={[lang === 'ko' ? '컴포넌트' : 'Component', lang === 'ko' ? '역할' : 'Role']}
        rows={t.sgaComponents}
      />

      <InfoBox color="blue" icon="💡" title={lang === 'ko' ? '자동 메모리 관리' : 'Automatic Memory Management'}>
        {t.sgaInfo}
      </InfoBox>

      <Divider />
      <SubTitle>{t.bufferCacheTitle}</SubTitle>
      <BufferCacheFlow lang={lang} onHighlight={(id) => setTourIdx(
        id === 'buffer-cache' ? 2 : null
      )} />
    </TwoColLayout>
  )
}

// ─── PGA: PGA 하이라이트 ─────────────────────────────────────────────────
function PgaSection({ t, lang }: { t: typeof T['ko']; lang: Lang }) {
  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={['server-process', 'pga']}
          callout={t.pgaCallout}
        />
      }
    >
      <SectionTitle>{t.pgaTitle}</SectionTitle>
      <Prose>{t.pgaDesc}</Prose>
      <ConceptGrid items={t.pgaItems} />

      <InfoBox color="emerald" icon="🔐" title={lang === 'ko' ? 'SGA vs PGA' : 'SGA vs PGA'}>
        {lang === 'ko'
          ? 'SGA는 모든 프로세스가 공유하는 메모리(공유 메모리)입니다. PGA는 각 프로세스에 독립적으로 할당되는 전용 메모리입니다. Latch, Lock 없이 PGA에 접근할 수 있어 빠릅니다.'
          : 'The SGA is shared by all processes. The PGA is private to each process. PGA access requires no latches or locks, making it faster.'}
      </InfoBox>
    </TwoColLayout>
  )
}

// ─── Processes: 프로세스별 인터랙티브 하이라이트 ───────────────────────
function ProcessesSection({ t, lang }: { t: typeof T['ko']; lang: Lang }) {
  const [activeProcess, setActiveProcess] = useState<number | null>(null)
  const tour = t.processTour

  const highlightIds: InstanceComponentId[] =
    activeProcess !== null
      ? tour[activeProcess].ids
      : ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn']

  const callout =
    activeProcess !== null
      ? tour[activeProcess].label
      : t.processCallout

  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={highlightIds}
          callout={callout}
        />
      }
    >
      <SectionTitle>{t.processTitle}</SectionTitle>
      <Prose>{t.processDesc}</Prose>

      {/* 프로세스 인터랙티브 투어 */}
      <SubTitle>
        {lang === 'ko' ? '프로세스별 역할 살펴보기' : 'Explore Each Process'}
      </SubTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {tour.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setActiveProcess(activeProcess === i ? null : i)}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-xs transition-all',
              activeProcess === i
                ? 'border-amber-400 bg-amber-100 text-amber-700 font-bold shadow-sm'
                : 'hover:border-amber-300 hover:bg-amber-50 text-muted-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
        {activeProcess !== null && (
          <button
            onClick={() => setActiveProcess(null)}
            className="rounded-full border border-dashed px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ {lang === 'ko' ? '전체 보기' : 'Show All'}
          </button>
        )}
      </div>

      {activeProcess !== null && (
        <motion.div
          key={activeProcess}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <div className="mb-1 font-mono text-xs font-bold text-amber-700">{tour[activeProcess].label}</div>
          <p className="font-mono text-xs text-muted-foreground">{tour[activeProcess].desc[lang]}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {tour[activeProcess].ids.map((id) => (
              <span key={id} className="rounded bg-amber-200 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-800">
                {id}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <Table
        headers={[lang === 'ko' ? '프로세스' : 'Process', lang === 'ko' ? '역할' : 'Role']}
        rows={t.processTable}
      />

      <InfoBox color="orange" icon="⚠" title={lang === 'ko' ? 'DBWn과 LGWR의 순서' : 'DBWn vs LGWR Order'}>
        {lang === 'ko'
          ? 'Oracle은 Write-Ahead Logging을 사용합니다. 데이터 블록이 디스크에 기록되기 전에 반드시 Redo Log가 먼저 기록되어야 합니다. LGWR이 DBWn보다 항상 먼저 동작합니다.'
          : 'Oracle uses Write-Ahead Logging. Redo logs must be written to disk before data blocks. LGWR always writes before DBWn.'}
      </InfoBox>
    </TwoColLayout>
  )
}

// ─── Inline Simulator ──────────────────────────────────────────────────────
function InternalsSimulatorSection({ lang, t }: { lang: Lang; t: typeof T['ko'] }) {
  const [dataPanelOpen, setDataPanelOpen] = useState(false)
  const [optimizerOpen, setOptimizerOpen] = useState(false)
  const optimizerResult = useSimulationStore((s) => s.optimizerResult)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Section header */}
      <div className="shrink-0 border-b bg-muted/30 px-6 py-4">
        <h2 className="text-lg font-bold">{t.simTitle}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.simDesc}</p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant={optimizerOpen ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setOptimizerOpen((v) => !v)}
            className="font-mono text-xs"
          >
            ▶ Optimizer
            {optimizerResult && !optimizerOpen && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-400 align-middle" />
            )}
          </Button>
          <Button
            variant={dataPanelOpen ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setDataPanelOpen((v) => !v)}
            className="font-mono text-xs"
          >
            ⬡ {lang === 'ko' ? '데이터 패널' : 'Data Panel'}
          </Button>
        </div>
      </div>

      {/* Simulator body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DataPanel open={dataPanelOpen} onToggle={() => setDataPanelOpen((v) => !v)} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full min-h-0 overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden">
                <OracleDiagram />
              </div>
              {optimizerOpen && (
                <div className="flex min-h-0 w-[380px] shrink-0 flex-col overflow-hidden border-l bg-card">
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
              )}
            </div>
          </div>
          <div className="shrink-0 border-t">
            <QueryInput />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Buffer Cache Flow 인터랙티브 ──────────────────────────────────────────
function BufferCacheFlow({
  lang,
  onHighlight,
}: {
  lang: Lang
  onHighlight: (id: string | null) => void
}) {
  const steps = lang === 'ko'
    ? [
        { id: 'sql',   label: 'SQL 요청',          desc: '서버 프로세스가 데이터 블록 필요',       color: 'bg-muted border-border' },
        { id: 'check', label: 'Buffer Cache 확인', desc: '블록이 이미 메모리에 있는가?',           color: 'bg-blue-50 border-blue-200' },
        { id: 'hit',   label: 'Cache Hit ✓',       desc: '메모리에서 직접 읽기 (Logical I/O)',     color: 'bg-emerald-50 border-emerald-300' },
        { id: 'miss',  label: 'Cache Miss ✗',      desc: '디스크에서 블록 읽기 (Physical I/O)',    color: 'bg-orange-50 border-orange-300' },
      ]
    : [
        { id: 'sql',   label: 'SQL Request',        desc: 'Server process needs a data block',      color: 'bg-muted border-border' },
        { id: 'check', label: 'Buffer Cache Check', desc: 'Is the block already in memory?',        color: 'bg-blue-50 border-blue-200' },
        { id: 'hit',   label: 'Cache Hit ✓',        desc: 'Read from memory (Logical I/O)',         color: 'bg-emerald-50 border-emerald-300' },
        { id: 'miss',  label: 'Cache Miss ✗',       desc: 'Read from disk (Physical I/O)',          color: 'bg-orange-50 border-orange-300' },
      ]

  const [active, setActive] = useState(0)

  function handleClick(i: number) {
    setActive(i)
    onHighlight(steps[i].id === 'check' || steps[i].id === 'hit' || steps[i].id === 'miss' ? 'buffer-cache' : null)
  }

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="flex gap-2 flex-wrap">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleClick(i)}
            className={cn(
              'flex flex-1 min-w-28 flex-col gap-1 rounded-lg border p-3 transition-all text-left',
              s.color,
              active === i ? 'ring-2 ring-blue-400 ring-offset-1 shadow-sm' : 'opacity-60 hover:opacity-90'
            )}
          >
            <span className="font-mono text-[10px] font-bold">{s.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{s.desc}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          Step {active + 1}/{steps.length}: {steps[active].label}
          {(steps[active].id === 'check' || steps[active].id === 'hit' || steps[active].id === 'miss') &&
            (lang === 'ko' ? ' — 우측 지도에서 Buffer Cache 위치 확인' : ' — See Buffer Cache highlighted on the right')}
        </span>
      </div>
    </div>
  )
}
