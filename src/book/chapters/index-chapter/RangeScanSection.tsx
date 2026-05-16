import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider,
} from '../shared'
import { IconArrowsHorizontal } from '@tabler/icons-react'
import { ScanDiagram, ScanStepList } from './ScanDiagram'
import type { ScanConfig, ScanStep } from './ScanDiagram'

// ── 고정 Leaf 데이터 ──────────────────────────────────────────────────────────

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

// ── 시나리오 ──────────────────────────────────────────────────────────────────

type ScenarioId = 'between' | 'gt' | 'like'

interface Scenario {
  id: ScenarioId
  labelKo: string
  labelEn: string
  sql: string
  // 조건에 맞는 key 목록
  matched: number[]
  // 방문한 key 목록 (matched 포함)
  visited: number[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'between',
    labelKo: 'BETWEEN 108 AND 128',
    labelEn: 'BETWEEN 108 AND 128',
    sql: 'WHERE employee_id BETWEEN 108 AND 128',
    matched: [108, 114, 116, 120, 124, 128],
    visited: [108, 114, 116, 120, 124, 128],
  },
  {
    id: 'gt',
    labelKo: '>= 135',
    labelEn: '>= 135',
    sql: 'WHERE employee_id >= 135',
    matched: [135, 141, 149, 155, 160, 166],
    visited: [135, 141, 149, 155, 160, 166],
  },
  {
    id: 'like',
    labelKo: 'LIKE 1__  (100~199)',
    labelEn: 'LIKE 1__  (100~199)',
    sql: "WHERE last_name LIKE '1%'",
    matched: [100, 102, 105, 108, 114, 116, 120, 124, 128, 135, 141, 149, 155, 160, 166],
    visited: [100, 102, 105, 108, 114, 116, 120, 124, 128, 135, 141, 149, 155, 160, 166],
  },
]

function buildConfig(scenario: Scenario | null, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    let hasMatch = false
    let hasVisit = false
    for (const e of leaf.entries) {
      if (!scenario) {
        entryStates[leaf.id][e.key] = 'idle'
        continue
      }
      if (scenario.matched.includes(e.key)) {
        entryStates[leaf.id][e.key] = 'matched'
        hasMatch = true
        hasVisit = true
      } else if (scenario.visited.includes(e.key)) {
        entryStates[leaf.id][e.key] = 'visited'
        hasVisit = true
      } else {
        entryStates[leaf.id][e.key] = 'idle'
      }
    }
    blockStates[leaf.id] = !scenario ? 'idle' : hasMatch ? 'matched' : hasVisit ? 'active' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: scenario ? [
      { color: 'bg-emerald-400', label: isKo ? '조건 충족 (반환)' : 'Matched (returned)' },
      { color: 'bg-slate-300',   label: isKo ? '범위 외 (건너뜀)' : 'Out of range (skipped)' },
    ] : [],
  }
}

// ── 텍스트 ────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'Index Range Scan',
    subtitle: '가장 일반적인 인덱스 스캔 방식입니다. B-Tree에서 범위의 시작점을 찾은 뒤, Leaf 블록의 연결 리스트를 따라 끝점까지 순서대로 읽습니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: 'BETWEEN, >, >=, <, <= 조건이나 LIKE \'A%\' 처럼 범위를 나타내는 조건에서 옵티마이저가 선택합니다. 인덱스 키가 정렬되어 있기 때문에 시작점을 한 번 찾으면 끝점까지 Leaf를 순서대로 훑기만 하면 됩니다.',
    howTitle: '작동 방식',
    steps: [
      { label: 'Root → Branch 탐색', detail: '트리를 내려가며 범위의 시작점이 있는 Leaf 블록을 찾습니다.', color: 'bg-amber-400' },
      { label: 'Leaf 시작점 위치', detail: '조건을 만족하는 첫 번째 키값의 위치로 이동합니다.', color: 'bg-violet-400' },
      { label: '연결 리스트 순방향 탐색', detail: 'Leaf 블록을 오른쪽 포인터로 이동하며 조건을 만족하는 키값을 수집합니다.', color: 'bg-emerald-400' },
      { label: '범위 끝에서 종료', detail: '조건을 벗어나는 키값을 만나면 탐색을 중단합니다.', color: 'bg-slate-400' },
    ] as ScanStep[],
    diagramTitle: 'Range Scan 시각화',
    scenarioLabel: '시나리오 선택',
    traitTitle: '특징',
    traits: [
      { icon: '✅', title: '결과가 정렬됨', desc: 'Leaf를 순서대로 읽으므로 별도 ORDER BY 정렬 없이 결과가 정렬되어 반환됩니다.' },
      { icon: '📌', title: '선택도가 낮을수록 유리', desc: '범위가 좁을수록 적은 블록만 읽습니다. 범위가 너무 넓으면 Full Table Scan이 더 빠를 수 있습니다.' },
      { icon: '🔗', title: 'Leaf 연결 리스트 활용', desc: '각 Leaf 블록은 앞뒤로 연결되어 있어 다음 블록을 포인터 하나로 바로 이동합니다.' },
    ],
    noteMultiBlock: 'Range Scan은 조건에 따라 여러 Leaf 블록을 읽을 수 있습니다. 각 Leaf에서 ROWID를 꺼낸 뒤 테이블 블록을 별도로 방문하므로, 결과 건수가 많을수록 랜덤 I/O도 많아집니다.',
  },
  en: {
    title: 'Index Range Scan',
    subtitle: 'The most common index scan method. Oracle finds the start of the range in the B-Tree, then follows the Leaf linked list forward until the end of the range.',
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Range Scan for range predicates: BETWEEN, >, >=, <, <=, and LIKE 'A%'. Because the index is sorted, once the start point is found Oracle just walks the Leaf blocks in order to the end point.",
    howTitle: 'How it works',
    steps: [
      { label: 'Root → Branch traversal', detail: 'Walk down the tree to find the Leaf block containing the range start.', color: 'bg-amber-400' },
      { label: 'Locate the start key', detail: 'Position at the first key that satisfies the condition.', color: 'bg-violet-400' },
      { label: 'Forward scan via linked list', detail: 'Move right through Leaf blocks collecting matching keys.', color: 'bg-emerald-400' },
      { label: 'Stop at range end', detail: 'Stop when a key outside the range is encountered.', color: 'bg-slate-400' },
    ] as ScanStep[],
    diagramTitle: 'Range Scan Visualization',
    scenarioLabel: 'Select scenario',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '✅', title: 'Results are sorted', desc: 'Reading Leaf blocks in order means results come back sorted — no extra ORDER BY sort step needed.' },
      { icon: '📌', title: 'Better with low selectivity', desc: 'A narrow range means fewer blocks read. A very wide range can make a Full Table Scan faster.' },
      { icon: '🔗', title: 'Uses Leaf linked list', desc: 'Each Leaf block has a forward pointer to the next, so moving between blocks costs a single pointer follow.' },
    ],
    noteMultiBlock: 'Range Scan may visit multiple Leaf blocks. After retrieving each ROWID, Oracle visits the table block separately — so more result rows means more random I/Os.',
  },
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function RangeScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null)
  const scenario = SCENARIOS.find((s) => s.id === selectedScenario) ?? null
  const config = buildConfig(scenario, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconArrowsHorizontal size={36} color="#7c3aed" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <ScanStepList steps={t.steps} />

      <Divider />

      {/* 다이어그램 */}
      <SectionTitle>{t.diagramTitle}</SectionTitle>

      {/* 시나리오 선택 */}
      <div className="mb-4">
        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.scenarioLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(selectedScenario === s.id ? null : s.id)}
              className={[
                'rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-all',
                selectedScenario === s.id
                  ? 'border-violet-400 bg-violet-100 font-bold text-violet-800 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
              ].join(' ')}
            >
              {isKo ? s.labelKo : s.labelEn}
            </button>
          ))}
        </div>
        {scenario && (
          <div className="mt-3 rounded-lg border bg-slate-900 px-3 py-2">
            <span className="font-mono text-[11px] text-slate-300">{scenario.sql}</span>
          </div>
        )}
      </div>

      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 탐색 경로' : 'Leaf Block Traversal'} />

      <Divider />

      {/* 특징 */}
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
      <InfoBox variant="note">{t.noteMultiBlock}</InfoBox>
    </PageContainer>
  )
}
