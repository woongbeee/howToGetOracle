import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider,
} from '../shared'
import { IconScanEye } from '@tabler/icons-react'
import { ScanDiagram, ScanStepList } from './ScanDiagram'
import type { ScanConfig, ScanStep } from './ScanDiagram'

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

type Mode = 'full' | 'idle'

function buildConfig(mode: Mode, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    for (const e of leaf.entries) {
      entryStates[leaf.id][e.key] = mode === 'full' ? 'visited' : 'idle'
    }
    blockStates[leaf.id] = mode === 'full' ? 'active' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: mode === 'full' ? [
      { color: 'bg-blue-400',  label: isKo ? '방문 (정렬 순 읽기)' : 'Visited (sorted order)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Full Scan',
    subtitle: '인덱스의 모든 Leaf 블록을 처음부터 끝까지 순서대로 읽습니다. 테이블 풀 스캔 대신 인덱스만 읽어 I/O를 줄이거나, 정렬된 결과를 보장할 때 사용합니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: '인덱스 컬럼만으로 결과를 만들 수 있을 때(Covering Index), 또는 ORDER BY 절의 컬럼이 인덱스와 일치해 별도 정렬 없이 결과를 돌려줄 수 있을 때 옵티마이저가 선택합니다. WHERE 조건 없이 전체 인덱스를 읽어야 할 때도 사용됩니다.',
    howTitle: '작동 방식',
    steps: [
      { label: 'Root에서 가장 왼쪽 Leaf 탐색', detail: '트리를 따라 내려가 첫 번째(가장 작은) Leaf 블록을 찾습니다.', color: 'bg-amber-400' },
      { label: '모든 Leaf를 순서대로 읽기', detail: '오른쪽 포인터를 따라 마지막 Leaf까지 한 블록씩 읽습니다.', color: 'bg-blue-400' },
      { label: '단일 블록 I/O', detail: 'Full Scan은 Leaf를 1개씩 읽습니다(단일 블록 I/O). 반면 Fast Full Scan은 여러 블록을 한 번에 읽습니다.', color: 'bg-violet-400' },
    ] as ScanStep[],
    diagramTitle: 'Full Scan 시각화',
    showBtn: '전체 스캔 표시',
    hideBtn: '초기화',
    traitTitle: '특징',
    traits: [
      { icon: '📋', title: '결과가 정렬됨', desc: 'Leaf를 키값 순서대로 읽으므로 결과가 정렬되어 나옵니다. ORDER BY 절이 있을 때 추가 정렬 없이 결과를 반환할 수 있습니다.' },
      { icon: '🔍', title: '테이블 블록 접근 최소화', desc: '인덱스 컬럼만 SELECT할 경우 테이블 블록을 전혀 읽지 않아도 됩니다(Index-Only Scan).' },
      { icon: '🐢', title: 'Fast Full Scan보다 느림', desc: '단일 블록 I/O를 사용하므로 같은 양의 데이터를 읽을 때 Fast Full Scan보다 느립니다.' },
    ],
    vsNote: 'Full Scan과 Fast Full Scan의 핵심 차이: Full Scan은 Leaf를 순서대로 1블록씩 읽어 정렬을 보장하지만, Fast Full Scan은 멀티블록 I/O로 더 빠르게 읽되 정렬을 보장하지 않습니다.',
  },
  en: {
    title: 'Index Full Scan',
    subtitle: "Reads every Leaf block from the leftmost to the rightmost in sorted order. Used to avoid a table full scan when only indexed columns are needed, or to return results in sorted order without an extra sort.",
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Index Full Scan when all required columns are in the index (Covering Index), when the ORDER BY matches the index so no extra sort is needed, or when a full index read is cheaper than a full table scan.",
    howTitle: 'How it works',
    steps: [
      { label: 'Find the leftmost Leaf', detail: 'Descend the tree to the first (smallest) Leaf block.', color: 'bg-amber-400' },
      { label: 'Read all Leaf blocks in order', detail: 'Follow the right pointer through every Leaf to the last one.', color: 'bg-blue-400' },
      { label: 'Single-block I/O', detail: 'Full Scan reads one Leaf at a time (single-block I/O). Fast Full Scan reads multiple blocks per I/O call.', color: 'bg-violet-400' },
    ] as ScanStep[],
    diagramTitle: 'Full Scan Visualization',
    showBtn: 'Show full scan',
    hideBtn: 'Reset',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '📋', title: 'Results are sorted', desc: 'Reading Leafs in key order means results come back sorted — an ORDER BY can be satisfied without an extra sort step.' },
      { icon: '🔍', title: 'Avoids table I/O', desc: 'If only indexed columns are selected, Oracle never touches the table blocks (Index-Only Scan).' },
      { icon: '🐢', title: 'Slower than Fast Full Scan', desc: 'Single-block I/O means more I/O calls than Fast Full Scan for the same amount of data.' },
    ],
    vsNote: 'Key difference from Fast Full Scan: Full Scan reads Leafs one block at a time in order (sorted, slower); Fast Full Scan uses multi-block I/O (faster, but unordered).',
  },
}

export function FullScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [mode, setMode] = useState<Mode>('idle')
  const config = buildConfig(mode, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconScanEye size={36} color="#7c3aed" stroke={1.5} />}
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
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode(mode === 'full' ? 'idle' : 'full')}
          className={[
            'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
            mode === 'full'
              ? 'border-blue-400 bg-blue-100 text-blue-800 shadow-sm'
              : 'border-border text-muted-foreground hover:border-blue-300 hover:text-foreground',
          ].join(' ')}
        >
          {mode === 'full' ? t.hideBtn : t.showBtn}
        </button>
      </div>
      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 순차 탐색' : 'Sequential Leaf Traversal'} />

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
