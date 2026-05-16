import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider,
} from '../shared'
import { IconTarget } from '@tabler/icons-react'
import { ScanDiagram, ScanStepList } from './ScanDiagram'
import type { ScanConfig, ScanStep } from './ScanDiagram'

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

const ALL_KEYS = LEAVES.flatMap((l) => l.entries.map((e) => e.key))

function buildConfig(targetKey: number | null, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    let hasMatch = false
    for (const e of leaf.entries) {
      if (targetKey === null) {
        entryStates[leaf.id][e.key] = 'idle'
      } else if (e.key === targetKey) {
        entryStates[leaf.id][e.key] = 'matched'
        hasMatch = true
      } else {
        entryStates[leaf.id][e.key] = 'idle'
      }
    }
    blockStates[leaf.id] = hasMatch ? 'matched' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: targetKey !== null ? [
      { color: 'bg-emerald-400', label: isKo ? '찾은 행 (즉시 종료)' : 'Found (scan stops)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Unique Scan',
    subtitle: 'PRIMARY KEY 또는 UNIQUE 인덱스에서 = 조건으로 정확히 하나의 행을 찾는 가장 효율적인 스캔입니다. 일치하는 키값을 발견하는 즉시 탐색을 멈춥니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: 'PK 또는 UNIQUE 제약이 걸린 컬럼에 = 조건을 사용할 때 옵티마이저가 선택합니다. 중복이 없음이 보장되므로 첫 번째 일치 항목을 찾으면 더 이상 탐색하지 않습니다.',
    howTitle: '작동 방식',
    steps: [
      { label: 'Root → Branch 탐색', detail: '트리를 내려가며 키값이 있는 Leaf 블록을 정확히 찾습니다.', color: 'bg-amber-400' },
      { label: '해당 Leaf에서 키값 검색', detail: '정렬된 Leaf 안에서 이진 검색으로 정확한 위치를 찾습니다.', color: 'bg-violet-400' },
      { label: 'ROWID 획득 후 즉시 종료', detail: '키값 발견 즉시 ROWID를 반환하고 스캔을 완전히 멈춥니다.', color: 'bg-emerald-400' },
    ] as ScanStep[],
    diagramTitle: 'Unique Scan 시각화',
    keyLabel: 'EMPLOYEE_ID 선택',
    traitTitle: '특징',
    traits: [
      { icon: '⚡', title: '가장 빠른 스캔', desc: 'Leaf를 하나만 방문하고 즉시 종료합니다. Row당 블록 접근 횟수가 최소입니다.' },
      { icon: '🔒', title: 'PK / UNIQUE 전용', desc: '중복이 없음이 보장된 컬럼에서만 동작합니다. 일반 인덱스에는 적용되지 않습니다.' },
      { icon: '1️⃣', title: '정확히 1건 반환', desc: '결과가 0건(없음) 또는 1건(있음)이므로 실행 계획에 ROWS=1이 표시됩니다.' },
    ],
    noteRange: 'UNIQUE 인덱스라도 = 대신 >, BETWEEN 같은 범위 조건을 쓰면 여러 행이 나올 수 있어 Range Scan으로 전환됩니다.',
  },
  en: {
    title: 'Index Unique Scan',
    subtitle: 'The most efficient scan: finds exactly one row using a = predicate on a PRIMARY KEY or UNIQUE index. The scan stops the moment the matching key is found.',
    whatTitle: 'When is it used?',
    whatDesc: 'The optimizer uses Unique Scan when a = predicate is applied to a column with a PK or UNIQUE constraint. Because no duplicates can exist, Oracle stops at the first match.',
    howTitle: 'How it works',
    steps: [
      { label: 'Root → Branch traversal', detail: 'Walk down the tree to find the exact Leaf block.', color: 'bg-amber-400' },
      { label: 'Binary search within the Leaf', detail: 'Locate the exact key position using the sorted order.', color: 'bg-violet-400' },
      { label: 'Retrieve ROWID and stop', detail: 'Return the ROWID immediately and halt the scan entirely.', color: 'bg-emerald-400' },
    ] as ScanStep[],
    diagramTitle: 'Unique Scan Visualization',
    keyLabel: 'Select EMPLOYEE_ID',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '⚡', title: 'Fastest scan', desc: 'Only one Leaf is visited and the scan stops immediately. Minimum block I/Os per row.' },
      { icon: '🔒', title: 'PK / UNIQUE only', desc: 'Only works when no duplicates can exist. Not available for regular indexes.' },
      { icon: '1️⃣', title: 'Returns exactly 1 row', desc: 'The result is either 0 rows (not found) or 1 row (found), so the plan shows ROWS=1.' },
    ],
    noteRange: 'Even on a UNIQUE index, using a range predicate (>, BETWEEN) instead of = can return multiple rows, so Oracle switches to Range Scan.',
  },
}

export function UniqueScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [selectedKey, setSelectedKey] = useState<number | null>(null)
  const config = buildConfig(selectedKey, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconTarget size={36} color="#7c3aed" stroke={1.5} />}
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
        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.keyLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_KEYS.map((key) => (
            <button key={key} onClick={() => setSelectedKey(selectedKey === key ? null : key)}
              className={[
                'rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-all',
                selectedKey === key
                  ? 'border-violet-400 bg-violet-100 font-bold text-violet-800 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
              ].join(' ')}>
              {key}
            </button>
          ))}
        </div>
      </div>
      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 탐색 경로' : 'Leaf Block Traversal'} />

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
      <InfoBox variant="note">{t.noteRange}</InfoBox>
    </PageContainer>
  )
}
