import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider,
} from '../shared'
import { IconBolt } from '@tabler/icons-react'
import { ScanDiagram, ScanStepList } from './ScanDiagram'
import type { ScanConfig, ScanStep } from './ScanDiagram'

// Fast Full Scan은 멀티블록 I/O 순서를 보여주기 위해 블록을 묶음으로 색칠
const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

// 멀티블록 I/O: 2개씩 묶어서 읽는 시각 효과 (배치 1: L1+L2, 배치 2: L3+L4, 배치 3: L5)
const BATCH_GROUPS = [['L1', 'L2'], ['L3', 'L4'], ['L5']]

type Mode = 'idle' | 'batch1' | 'batch2' | 'batch3'

function buildConfig(mode: Mode, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  const activeLeaves = new Set<string>()
  if (mode === 'batch1') BATCH_GROUPS[0].forEach((id) => activeLeaves.add(id))
  if (mode === 'batch2') { BATCH_GROUPS[0].forEach((id) => activeLeaves.add(id)); BATCH_GROUPS[1].forEach((id) => activeLeaves.add(id)) }
  if (mode === 'batch3') LEAVES.forEach((l) => activeLeaves.add(l.id))

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    const isActive = activeLeaves.has(leaf.id)
    for (const e of leaf.entries) {
      entryStates[leaf.id][e.key] = isActive ? 'visited' : 'idle'
    }
    blockStates[leaf.id] = isActive ? 'active' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: mode !== 'idle' ? [
      { color: 'bg-blue-400', label: isKo ? '멀티블록 I/O로 읽은 블록' : 'Blocks read by multi-block I/O' },
      { color: 'bg-slate-200', label: isKo ? '아직 읽지 않음' : 'Not yet read' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Fast Full Scan',
    subtitle: '인덱스 세그먼트 전체를 멀티블록 I/O로 한 번에 읽습니다. Full Scan보다 훨씬 빠르지만, Leaf를 순서대로 읽지 않아 정렬이 보장되지 않습니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: 'SELECT COUNT(*) 나 집계처럼 인덱스 키값만 필요하고 정렬이 필요 없을 때 옵티마이저가 선택합니다. db_file_multiblock_read_count 파라미터만큼 블록을 한 번에 읽어 I/O 횟수를 대폭 줄입니다.',
    howTitle: '작동 방식',
    steps: [
      { label: '인덱스 세그먼트 전체 스캔', detail: 'Root/Branch를 거치지 않고 인덱스 세그먼트의 블록을 직접 읽습니다.', color: 'bg-amber-400' },
      { label: '멀티블록 I/O', detail: 'db_file_multiblock_read_count 설정에 따라 한 번의 I/O로 여러 블록을 한꺼번에 읽습니다.', color: 'bg-blue-400' },
      { label: '정렬 없이 반환', detail: '물리적 저장 순서대로 읽으므로 결과 순서는 보장되지 않습니다.', color: 'bg-slate-400' },
    ] as ScanStep[],
    diagramTitle: 'Fast Full Scan 시각화 (멀티블록 I/O)',
    batchLabel: '멀티블록 I/O 배치',
    batches: ['배치 1 (L1, L2)', '배치 2 (L3, L4)', '배치 3 (L5)'],
    resetBtn: '초기화',
    traitTitle: '특징',
    traits: [
      { icon: '🚀', title: '가장 빠른 전체 읽기', desc: '멀티블록 I/O로 Full Scan보다 I/O 횟수가 훨씬 적습니다. 대량 집계 쿼리에 적합합니다.' },
      { icon: '🔀', title: '정렬 비보장', desc: 'Leaf를 순서 없이 읽으므로 ORDER BY가 필요하면 별도 정렬 단계가 추가됩니다.' },
      { icon: '📊', title: '병렬 처리와 궁합이 좋음', desc: '세그먼트 전체를 여러 프로세스가 나눠 읽는 병렬 쿼리와 함께 쓰면 더욱 빠릅니다.' },
    ],
    vsNote: 'Full Scan vs Fast Full Scan 요약: 정렬 결과가 필요하면 Full Scan, 속도만 필요하면 Fast Full Scan. 인덱스 컬럼만으로 결과를 만들 수 있는 경우(Covering Index)에만 두 방식 모두 사용 가능합니다.',
  },
  en: {
    title: 'Index Fast Full Scan',
    subtitle: 'Reads the entire index segment with multi-block I/O. Much faster than Full Scan, but reads Leaf blocks out of order so results are not sorted.',
    whatTitle: 'When is it used?',
    whatDesc: 'The optimizer chooses Fast Full Scan when only indexed columns are needed (e.g., COUNT(*), aggregations) and sort order does not matter. It reads db_file_multiblock_read_count blocks per I/O call, dramatically reducing I/O count.',
    howTitle: 'How it works',
    steps: [
      { label: 'Scan the entire index segment', detail: 'Reads index blocks directly without descending Root→Branch.', color: 'bg-amber-400' },
      { label: 'Multi-block I/O', detail: 'Reads multiple blocks per I/O call based on db_file_multiblock_read_count.', color: 'bg-blue-400' },
      { label: 'Return in physical order', detail: 'Blocks are read in physical storage order, so result rows are not sorted.', color: 'bg-slate-400' },
    ] as ScanStep[],
    diagramTitle: 'Fast Full Scan Visualization (multi-block I/O)',
    batchLabel: 'Multi-block I/O batch',
    batches: ['Batch 1 (L1, L2)', 'Batch 2 (L3, L4)', 'Batch 3 (L5)'],
    resetBtn: 'Reset',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '🚀', title: 'Fastest full read', desc: 'Multi-block I/O means far fewer I/O calls than Full Scan. Great for bulk aggregation queries.' },
      { icon: '🔀', title: 'No sort guarantee', desc: 'Leaf blocks are read out of order. An ORDER BY requires an extra sort step.' },
      { icon: '📊', title: 'Works well with parallelism', desc: 'Multiple parallel processes can each read a portion of the index segment simultaneously.' },
    ],
    vsNote: 'Full Scan vs Fast Full Scan: use Full Scan when you need sorted output; use Fast Full Scan when you only need speed. Both require the index to cover all selected columns.',
  },
}

export function FastFullScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [mode, setMode] = useState<Mode>('idle')
  const config = buildConfig(mode, isKo)

  const MODES: Mode[] = ['batch1', 'batch2', 'batch3']

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconBolt size={36} color="#7c3aed" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <ScanStepList steps={t.steps} />

      <Divider />

      <SectionTitle>{t.diagramTitle}</SectionTitle>
      <div className="mb-4">
        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.batchLabel}</p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m, i) => (
            <button key={m} onClick={() => setMode(mode === m ? 'idle' : m)}
              className={[
                'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
                mode === m
                  ? 'border-blue-400 bg-blue-100 text-blue-800 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-blue-300 hover:text-foreground',
              ].join(' ')}>
              {t.batches[i]}
            </button>
          ))}
        </div>
      </div>
      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 멀티블록 I/O 읽기' : 'Multi-block I/O Read'} />

      <Divider />

      <SectionTitle>{t.traitTitle}</SectionTitle>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {t.traits.map((tr, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="mb-2 text-lg">{tr.icon}</div>
            <div className="mb-1 text-xs font-bold">{tr.title}</div>
            <p className="text-[11px] leading-snug text-muted-foreground">{tr.desc}</p>
          </div>
        ))}
      </div>
      <InfoBox variant="tip">{t.vsNote}</InfoBox>
    </PageContainer>
  )
}
