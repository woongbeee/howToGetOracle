import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import type { InstanceComponentId } from './OracleInstanceMap'
import { SectionTitle, Prose, InfoBox, Table, Divider, SubTitle } from '../shared'
import { TwoColLayout, MapPanel, TourPanel } from './shared'
import type { TourItem } from './shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    mapTitle: '인스턴스 구조에서의 위치',
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
    ] satisfies TourItem[],
    tableHeaderComponent: '컴포넌트',
    tableHeaderRole: '역할',
    showAll: '전체 보기',
    bufferSteps: [
      { id: 'sql',   label: 'SQL 요청',          desc: '서버 프로세스가 데이터 블록 필요' },
      { id: 'check', label: 'Buffer Cache 확인', desc: '블록이 이미 메모리에 있는가?' },
      { id: 'hit',   label: 'Cache Hit ✓',       desc: '메모리에서 직접 읽기 (Logical I/O)' },
      { id: 'miss',  label: 'Cache Miss ✗',      desc: '디스크에서 블록 읽기 (Physical I/O)' },
    ],
    bufferStepHint: '— 우측 지도에서 Buffer Cache 위치 확인',
  },
  en: {
    mapTitle: 'Location in Instance Structure',
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
    ] satisfies TourItem[],
    tableHeaderComponent: 'Component',
    tableHeaderRole: 'Role',
    showAll: 'Show All',
    bufferSteps: [
      { id: 'sql',   label: 'SQL Request',        desc: 'Server process needs a data block' },
      { id: 'check', label: 'Buffer Cache Check', desc: 'Is the block already in memory?' },
      { id: 'hit',   label: 'Cache Hit ✓',        desc: 'Read from memory (Logical I/O)' },
      { id: 'miss',  label: 'Cache Miss ✗',       desc: 'Read from disk (Physical I/O)' },
    ],
    bufferStepHint: '— See Buffer Cache highlighted on the right',
  },
}

// ── BufferCacheFlow ────────────────────────────────────────────────────────

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

// ── SgaSection ─────────────────────────────────────────────────────────────

export function SgaSection() {
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
      />

      <Table headers={[t.tableHeaderComponent, t.tableHeaderRole]} rows={t.sgaComponents} />
      <InfoBox color="blue" icon="💡" title={t.sgaMemMgmtTitle}>{t.sgaInfo}</InfoBox>

      <Divider />
      <SubTitle>{t.bufferCacheTitle}</SubTitle>
      <BufferCacheFlow onHighlight={(id) => setTourIdx(id === 'buffer-cache' ? 2 : null)} />
    </TwoColLayout>
  )
}
