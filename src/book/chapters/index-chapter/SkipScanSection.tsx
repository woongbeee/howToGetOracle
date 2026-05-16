import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider,
} from '../shared'
import { IconPlayerSkipForward } from '@tabler/icons-react'
import { ScanDiagram, ScanStepList } from './ScanDiagram'
import type { ScanConfig, ScanStep } from './ScanDiagram'

// Skip Scan: 복합 인덱스 (GENDER, SALARY)
// GENDER는 'M'/'F' 두 값만 있음 → 선두 컬럼 없이 SALARY만으로 검색 가능
const LEAVES = [
  // GENDER='F' 구간
  { id: 'F-L1', entries: [{ key: 'F/3200', rowid: 'AAA,1,1' }, { key: 'F/4800', rowid: 'AAA,1,2' }, { key: 'F/6000', rowid: 'AAA,1,3' }] },
  { id: 'F-L2', entries: [{ key: 'F/7500', rowid: 'AAA,2,1' }, { key: 'F/9000', rowid: 'AAA,2,2' }, { key: 'F/11000', rowid: 'AAA,2,3' }] },
  // GENDER='M' 구간
  { id: 'M-L1', entries: [{ key: 'M/3500', rowid: 'AAA,3,1' }, { key: 'M/5200', rowid: 'AAA,3,2' }, { key: 'M/6800', rowid: 'AAA,3,3' }] },
  { id: 'M-L2', entries: [{ key: 'M/8000', rowid: 'AAA,4,1' }, { key: 'M/9800', rowid: 'AAA,4,2' }, { key: 'M/12000', rowid: 'AAA,4,3' }] },
]

// 시나리오: SALARY >= 6000 검색
// 선두 컬럼(GENDER) 없이 두 번째 컬럼(SALARY)만 조건
// Skip Scan은 GENDER 값 각각에 대해 Range Scan을 수행
type Mode = 'idle' | 'scan'

const MATCHED_KEYS = new Set(['F/6000', 'F/7500', 'F/9000', 'F/11000', 'M/6800', 'M/8000', 'M/9800', 'M/12000'])
const SKIPPED_KEYS = new Set(['F/3200', 'F/4800', 'M/3500', 'M/5200'])

function buildConfig(mode: Mode, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    let hasMatch = false
    for (const e of leaf.entries) {
      if (mode === 'idle') {
        entryStates[leaf.id][e.key] = 'idle'
      } else if (MATCHED_KEYS.has(String(e.key))) {
        entryStates[leaf.id][e.key] = 'matched'
        hasMatch = true
      } else if (SKIPPED_KEYS.has(String(e.key))) {
        entryStates[leaf.id][e.key] = 'skipped'
      } else {
        entryStates[leaf.id][e.key] = 'idle'
      }
    }
    blockStates[leaf.id] = mode === 'idle' ? 'idle' : hasMatch ? 'matched' : 'active'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'G/SAL',
    legend: mode === 'scan' ? [
      { color: 'bg-emerald-400', label: isKo ? '조건 충족 (SALARY ≥ 6000)' : 'Matched (SALARY ≥ 6000)' },
      { color: 'bg-slate-200',   label: isKo ? '건너뜀 (SALARY < 6000)' : 'Skipped (SALARY < 6000)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Skip Scan',
    subtitle: '복합 인덱스에서 선두 컬럼이 WHERE 절에 없어도 인덱스를 활용할 수 있는 스캔입니다. 선두 컬럼의 고유값마다 내부적으로 Range Scan을 수행합니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: '복합 인덱스(GENDER, SALARY)에서 GENDER 없이 SALARY만으로 검색할 때처럼, 선두 컬럼의 Cardinality(고유값 수)가 매우 낮을 때 옵티마이저가 선택합니다. 선두 컬럼 값이 적을수록 내부 Range Scan 횟수가 적어 효율적입니다.',
    howTitle: '작동 방식',
    steps: [
      { label: '선두 컬럼 고유값 파악', detail: '옵티마이저가 선두 컬럼(GENDER)의 고유값 목록을 파악합니다. (예: F, M)', color: 'bg-amber-400' },
      { label: '각 고유값에 대해 Range Scan', detail: "GENDER='F'인 구간에서 SALARY 조건으로 Range Scan, GENDER='M' 구간에서 다시 Range Scan을 수행합니다.", color: 'bg-violet-400' },
      { label: '조건 미충족 항목 건너뜀', detail: '각 구간에서 SALARY 조건을 만족하지 않는 항목은 건너뜁니다.', color: 'bg-slate-400' },
      { label: 'ROWID 수집 후 반환', detail: '모든 구간의 결과를 합쳐 반환합니다.', color: 'bg-emerald-400' },
    ] as ScanStep[],
    diagramTitle: 'Skip Scan 시각화',
    sqlLabel: 'SQL 조건',
    sql: "WHERE salary >= 6000\n-- 인덱스: (gender, salary)\n-- gender 컬럼이 WHERE에 없지만 Skip Scan으로 인덱스 활용",
    showBtn: 'Skip Scan 실행',
    resetBtn: '초기화',
    traitTitle: '특징',
    traits: [
      { icon: '🎯', title: '선두 컬럼 없이도 인덱스 활용', desc: '선두 컬럼이 WHERE에 없어도 인덱스를 탈 수 있어 Full Table Scan을 피할 수 있습니다.' },
      { icon: '📉', title: '선두 컬럼 Cardinality가 낮을 때 유리', desc: "GENDER처럼 'M'/'F' 두 값만 있으면 내부 Range Scan이 2번뿐입니다. 고유값이 많을수록 오히려 비효율적입니다." },
      { icon: '⚠️', title: '고유값이 많으면 비효율', desc: '선두 컬럼 고유값이 100개라면 내부 Range Scan도 100번 수행됩니다. 이 경우 Full Table Scan이 더 나을 수 있습니다.' },
    ],
    cardinalityNote: 'Skip Scan의 효율은 선두 컬럼의 Cardinality에 반비례합니다. 고유값이 2~3개(성별, 상태 코드 등)일 때 가장 효과적이며, 고유값이 수백 개 이상이면 옵티마이저가 Skip Scan 대신 Full Table Scan을 선택하는 경우가 많습니다.',
  },
  en: {
    title: 'Index Skip Scan',
    subtitle: 'Allows Oracle to use a composite index even when the leading column is absent from the WHERE clause. Internally performs a Range Scan for each distinct value of the leading column.',
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Skip Scan when the leading column's cardinality (number of distinct values) is very low — for example, searching only on SALARY in a (GENDER, SALARY) composite index. The fewer distinct values the leading column has, the fewer internal Range Scans are needed.",
    howTitle: 'How it works',
    steps: [
      { label: 'Identify leading-column values', detail: "The optimizer identifies distinct values of the leading column (e.g., GENDER: F and M).", color: 'bg-amber-400' },
      { label: 'Range Scan per distinct value', detail: "Performs a Range Scan within the GENDER='F' segment, then another within GENDER='M'.", color: 'bg-violet-400' },
      { label: 'Skip non-matching entries', detail: 'Within each segment, entries that do not satisfy the SALARY condition are skipped.', color: 'bg-slate-400' },
      { label: 'Merge and return ROWIDs', detail: 'Combine results from all segments and return.', color: 'bg-emerald-400' },
    ] as ScanStep[],
    diagramTitle: 'Skip Scan Visualization',
    sqlLabel: 'SQL condition',
    sql: "WHERE salary >= 6000\n-- Index: (gender, salary)\n-- 'gender' absent from WHERE, but Skip Scan still uses the index",
    showBtn: 'Run Skip Scan',
    resetBtn: 'Reset',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '🎯', title: 'Uses index without leading column', desc: 'The index can be used even when the leading column is missing from the predicate, avoiding a full table scan.' },
      { icon: '📉', title: 'Best with low leading-column cardinality', desc: "With only 'M'/'F', just two Range Scans are needed. More distinct values means more scans and less efficiency." },
      { icon: '⚠️', title: 'Inefficient with high cardinality', desc: 'If the leading column has 100 distinct values, 100 Range Scans are performed. A Full Table Scan is often faster in that case.' },
    ],
    cardinalityNote: "Skip Scan efficiency is inversely proportional to the leading column's cardinality. It works best when the leading column has only 2–3 distinct values (gender, status codes). With hundreds of distinct values the optimizer usually prefers a Full Table Scan.",
  },
}

export function SkipScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [mode, setMode] = useState<Mode>('idle')
  const config = buildConfig(mode, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconPlayerSkipForward size={36} color="#7c3aed" stroke={1.5} />}
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
      <div className="mb-3 rounded-lg border bg-slate-900 px-3 py-2">
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.sqlLabel}</p>
        <pre className="font-mono text-[11px] leading-relaxed text-slate-300">{t.sql}</pre>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode(mode === 'scan' ? 'idle' : 'scan')}
          className={[
            'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
            mode === 'scan'
              ? 'border-violet-400 bg-violet-100 text-violet-800 shadow-sm'
              : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
          ].join(' ')}
        >
          {mode === 'scan' ? t.resetBtn : t.showBtn}
        </button>
      </div>
      <ScanDiagram config={config} title={isKo ? '(GENDER, SALARY) 복합 인덱스 Leaf 블록' : '(GENDER, SALARY) Composite Index Leaf Blocks'} />

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
      <InfoBox variant="warning">{t.cardinalityNote}</InfoBox>
    </PageContainer>
  )
}
