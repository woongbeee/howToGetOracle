import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore, type Lang } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
  InfoBox, Table, ConceptGrid, SimulatorPlaceholder, Divider
} from './shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    chapterTitle: '조인 원리와 활용',
    chapterSubtitle: 'Oracle의 세 가지 조인 알고리즘(Nested Loop, Hash, Sort-Merge)의 동작 원리와 선택 기준을 학습합니다.',
    simDesc: '조인 시뮬레이터 — 쿼리를 입력하고 어떤 조인 방식이 선택되는지 확인하세요.',

    overviewTitle: '조인 개요',
    overviewDesc: 'Oracle CBO는 테이블 통계와 조인 조건을 분석하여 Nested Loop Join, Hash Join, Sort-Merge Join 중 가장 비용이 낮은 방식을 선택합니다.',
    overviewItems: [
      { icon: '🔁', title: 'Nested Loop Join', desc: '소량 데이터 또는 인덱스가 있는 경우. Outer 행마다 Inner 테이블을 반복 탐색.', color: 'blue' },
      { icon: '#️⃣', title: 'Hash Join', desc: '대용량 테이블 조인에 효율적. 빌드 테이블을 해시로 메모리에 적재 후 프로브.', color: 'orange' },
      { icon: '↕', title: 'Sort-Merge Join', desc: '양쪽 테이블을 정렬 후 병합. 정렬된 데이터나 ORDER BY가 필요할 때 유리.', color: 'violet' },
    ],

    nlTitle: 'Nested Loop Join',
    nlDesc: 'Outer 테이블의 각 행에 대해 Inner 테이블에서 매칭되는 행을 찾는 방식입니다. Inner 테이블에 인덱스가 있을 때 가장 효율적입니다.',
    nlTable: [
      ['적합한 경우', 'Outer 결과가 소량, Inner에 선택도 높은 인덱스 존재'],
      ['비효율 조건', 'Inner 테이블이 크고 인덱스가 없는 경우'],
      ['복잡도', 'O(N × M) — N: Outer 행 수, M: Inner 탐색 비용'],
      ['힌트', '/*+ USE_NL(t1 t2) */'],
    ],

    hashTitle: 'Hash Join',
    hashDesc: '작은 테이블(빌드 입력)을 해시 테이블로 PGA에 적재한 후, 큰 테이블(프로브 입력)을 스캔하며 해시 키로 매칭합니다.',
    hashTable: [
      ['적합한 경우', '대용량 테이블 조인, 등치(=) 조인 조건'],
      ['제약 사항', '등치 조인만 가능, PGA 메모리 부족 시 디스크 사용'],
      ['복잡도', 'O(N + M) — 선형 시간'],
      ['힌트', '/*+ USE_HASH(t1 t2) */'],
    ],
    hashInfo: '빌드 입력은 일반적으로 작은 테이블 (Driving Table)로 선택됩니다. PGA_AGGREGATE_TARGET이 충분해야 메모리 내에서 처리됩니다.',

    smTitle: 'Sort-Merge Join',
    smDesc: '양쪽 테이블을 조인 키로 정렬한 다음 순차적으로 병합합니다. 이미 정렬된 데이터(인덱스 Range Scan 등)에서는 정렬 비용이 발생하지 않습니다.',
    smTable: [
      ['적합한 경우', '이미 정렬된 데이터, 범위(BETWEEN, >=) 조인'],
      ['제약 사항', '양쪽 테이블 정렬 비용 발생'],
      ['복잡도', 'O(N log N + M log M + N + M)'],
      ['힌트', '/*+ USE_MERGE(t1 t2) */'],
    ],
  },
  en: {
    chapterTitle: 'Join Principles & Usage',
    chapterSubtitle: 'Learn the mechanics and selection criteria of Oracle\'s three join algorithms: Nested Loop, Hash, and Sort-Merge.',
    simDesc: 'Join Simulator — Enter a query and see which join method is selected.',

    overviewTitle: 'Join Overview',
    overviewDesc: 'The Oracle CBO analyzes table statistics and join conditions to select the lowest-cost join method among Nested Loop Join, Hash Join, and Sort-Merge Join.',
    overviewItems: [
      { icon: '🔁', title: 'Nested Loop Join', desc: 'Ideal for small datasets or indexed inner tables. Iterates inner table for each outer row.', color: 'blue' },
      { icon: '#️⃣', title: 'Hash Join', desc: 'Efficient for large table joins. Loads the build table as a hash in memory, then probes.', color: 'orange' },
      { icon: '↕', title: 'Sort-Merge Join', desc: 'Sorts both sides then merges. Efficient when data is pre-sorted or ORDER BY is needed.', color: 'violet' },
    ],

    nlTitle: 'Nested Loop Join',
    nlDesc: 'For each row in the outer table, Oracle finds matching rows in the inner table. Most efficient when the inner table has a highly selective index.',
    nlTable: [
      ['Best for', 'Small outer result set, selective index on inner table'],
      ['Inefficient when', 'Inner table is large with no useful index'],
      ['Complexity', 'O(N × M) — N: outer rows, M: inner probe cost'],
      ['Hint', '/*+ USE_NL(t1 t2) */'],
    ],

    hashTitle: 'Hash Join',
    hashDesc: 'Loads the smaller table (build input) into a hash table in PGA, then scans the larger table (probe input) matching by hash key.',
    hashTable: [
      ['Best for', 'Large table joins, equality (=) join conditions'],
      ['Limitations', 'Equality joins only; spills to disk if PGA is insufficient'],
      ['Complexity', 'O(N + M) — linear time'],
      ['Hint', '/*+ USE_HASH(t1 t2) */'],
    ],
    hashInfo: 'The build input is typically the smaller (driving) table. Sufficient PGA_AGGREGATE_TARGET is needed to keep processing in memory.',

    smTitle: 'Sort-Merge Join',
    smDesc: 'Sorts both tables on the join key, then merges them sequentially. If data is already sorted (e.g., from an index range scan), sort cost is avoided.',
    smTable: [
      ['Best for', 'Pre-sorted data, range (BETWEEN, >=) joins'],
      ['Limitations', 'Sort cost on both sides'],
      ['Complexity', 'O(N log N + M log M + N + M)'],
      ['Hint', '/*+ USE_MERGE(t1 t2) */'],
    ],
  },
}

export function JoinPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'join-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="🔗" num={3} title="Join Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Join Simulator" color="emerald" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {sectionId === 'join-overview' && (
        <>
          <ChapterTitle icon="🔗" num={3} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Prose>{t.overviewDesc}</Prose>
          <ConceptGrid items={t.overviewItems} />
          <Divider />
          <JoinComparisonTable lang={lang} />
        </>
      )}
      {sectionId === 'join-nested-loop' && (
        <>
          <SectionTitle>{t.nlTitle}</SectionTitle>
          <Prose>{t.nlDesc}</Prose>
          <Table headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']} rows={t.nlTable} />
          <Divider />
          <NestedLoopAnimation lang={lang} />
        </>
      )}
      {sectionId === 'join-hash' && (
        <>
          <SectionTitle>{t.hashTitle}</SectionTitle>
          <Prose>{t.hashDesc}</Prose>
          <Table headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']} rows={t.hashTable} />
          <InfoBox color="blue" icon="💡" title={lang === 'ko' ? '빌드 입력 선택' : 'Build Input Selection'}>
            {t.hashInfo}
          </InfoBox>
          <Divider />
          <HashJoinAnimation lang={lang} />
        </>
      )}
      {sectionId === 'join-sort-merge' && (
        <>
          <SectionTitle>{t.smTitle}</SectionTitle>
          <Prose>{t.smDesc}</Prose>
          <Table headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']} rows={t.smTable} />
        </>
      )}
    </PageContainer>
  )
}

function JoinComparisonTable({ lang }: { lang: Lang }) {
  const rows = lang === 'ko'
    ? [
        ['Nested Loop', '소량 + 인덱스', '낮음', 'O(N×M)', '온라인 트랜잭션'],
        ['Hash Join',   '대량 + 등치',   '높음', 'O(N+M)', '배치·분석 쿼리'],
        ['Sort-Merge',  '정렬됨·범위',   '중간', 'O(N log N)', '이미 정렬된 데이터'],
      ]
    : [
        ['Nested Loop', 'Small + Indexed', 'Low',    'O(N×M)',    'OLTP transactions'],
        ['Hash Join',   'Large + Equality', 'High',   'O(N+M)',    'Batch/analytics'],
        ['Sort-Merge',  'Sorted / Range',   'Medium', 'O(N log N)', 'Pre-sorted data'],
      ]
  return (
    <Table
      headers={lang === 'ko'
        ? ['조인 방식', '적합 조건', 'CPU 사용량', '복잡도', '주요 사용처']
        : ['Join Method', 'Best Condition', 'CPU', 'Complexity', 'Primary Use Case']}
      rows={rows}
    />
  )
}

function NestedLoopAnimation({ lang }: { lang: Lang }) {
  const outerRows = ['A1', 'A2', 'A3']
  const innerRows = ['B1', 'B2', 'B3']
  const [step, setStep] = useState(0)
  const maxStep = outerRows.length * innerRows.length

  const outerIdx = Math.floor(step / innerRows.length)
  const innerIdx = step % innerRows.length

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        {lang === 'ko' ? 'Nested Loop 시뮬레이션' : 'Nested Loop Simulation'}
      </div>
      <div className="flex gap-6 mb-4">
        {/* Outer table */}
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">{lang === 'ko' ? 'Outer 테이블' : 'Outer Table'}</div>
          {outerRows.map((r, i) => (
            <div key={r} className={cn(
              'rounded px-3 py-1.5 font-mono text-xs border transition-all',
              i === outerIdx && step < maxStep ? 'bg-blue-100 border-blue-400 font-bold' : 'bg-card border-border'
            )}>{r}</div>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex items-center font-mono text-muted-foreground/40 text-lg">→</div>

        {/* Inner table */}
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">{lang === 'ko' ? 'Inner 테이블' : 'Inner Table'}</div>
          {innerRows.map((r, i) => (
            <div key={r} className={cn(
              'rounded px-3 py-1.5 font-mono text-xs border transition-all',
              i === innerIdx && step < maxStep ? 'bg-orange-100 border-orange-400 font-bold' : 'bg-card border-border'
            )}>{r}</div>
          ))}
        </div>

        {/* Result */}
        <div className="flex flex-col gap-1 ml-4">
          <div className="font-mono text-[10px] text-muted-foreground mb-1">{lang === 'ko' ? '현재 매칭' : 'Current Match'}</div>
          <div className="rounded px-3 py-1.5 font-mono text-xs border bg-emerald-50 border-emerald-300 text-emerald-700">
            {step < maxStep ? `${outerRows[outerIdx]} ↔ ${innerRows[innerIdx]}` : '✓ Done'}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground mt-1">
            Step {Math.min(step + 1, maxStep)} / {maxStep}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded border px-3 py-1 font-mono text-xs disabled:opacity-40 hover:bg-muted"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <button
          onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
          disabled={step >= maxStep}
          className="rounded border px-3 py-1 font-mono text-xs disabled:opacity-40 hover:bg-muted"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>
        <button
          onClick={() => setStep(0)}
          className="rounded border px-3 py-1 font-mono text-xs hover:bg-muted text-muted-foreground"
        >
          ↺ {lang === 'ko' ? '리셋' : 'Reset'}
        </button>
      </div>
    </div>
  )
}

function HashJoinAnimation({ lang }: { lang: Lang }) {
  const buildRows = [
    { key: 10, val: 'Alice' },
    { key: 20, val: 'Bob' },
    { key: 30, val: 'Carol' },
  ]
  const probeRows = [
    { key: 20, val: 'Sales' },
    { key: 10, val: 'HR' },
    { key: 40, val: 'IT' },
  ]

  const [phase, setPhase] = useState<'build' | 'probe'>('build')
  const [probeStep, setProbeStep] = useState(0)

  const currentProbe = probeRows[probeStep]
  const match = buildRows.find((b) => b.key === currentProbe?.key)

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        {lang === 'ko' ? 'Hash Join 시뮬레이션' : 'Hash Join Simulation'}
      </div>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => { setPhase('build'); setProbeStep(0) }}
          className={cn('rounded-full px-3 py-1 font-mono text-xs border transition-all',
            phase === 'build' ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold' : 'hover:bg-muted')}
        >
          {lang === 'ko' ? '1. 빌드 단계' : '1. Build Phase'}
        </button>
        <button
          onClick={() => setPhase('probe')}
          className={cn('rounded-full px-3 py-1 font-mono text-xs border transition-all',
            phase === 'probe' ? 'bg-orange-100 border-orange-400 text-orange-700 font-bold' : 'hover:bg-muted')}
        >
          {lang === 'ko' ? '2. 프로브 단계' : '2. Probe Phase'}
        </button>
      </div>

      {phase === 'build' && (
        <div className="flex gap-4">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2">{lang === 'ko' ? '빌드 테이블 (EMPLOYEES)' : 'Build Table (EMPLOYEES)'}</div>
            {buildRows.map((r) => (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-1 rounded border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-xs"
              >
                key={r.key} → {r.val}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center font-mono text-muted-foreground/40 text-xl">→</div>
          <div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2">{lang === 'ko' ? 'Hash Table (PGA)' : 'Hash Table (PGA)'}</div>
            {buildRows.map((r) => (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-1 rounded border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-xs"
              >
                h({r.key}) → {r.val}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {phase === 'probe' && (
        <div className="flex gap-4 items-start">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2">{lang === 'ko' ? '프로브 테이블 (DEPARTMENTS)' : 'Probe Table (DEPARTMENTS)'}</div>
            {probeRows.map((r, i) => (
              <div key={r.key} className={cn(
                'mb-1 rounded border px-3 py-1.5 font-mono text-xs transition-all',
                i === probeStep ? 'border-orange-400 bg-orange-100 font-bold' : 'border-border bg-card'
              )}>
                key={r.key} → {r.val}
              </div>
            ))}
          </div>
          <div className="flex items-center font-mono text-muted-foreground/40 text-xl mt-6">↔</div>
          <div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2">{lang === 'ko' ? '결과' : 'Result'}</div>
            <div className={cn(
              'rounded border px-3 py-2 font-mono text-xs',
              match ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-rose-300 bg-rose-50 text-rose-700'
            )}>
              {currentProbe
                ? match
                  ? `✓ Match: ${currentProbe.val} ↔ ${match.val}`
                  : `✗ No match for key=${currentProbe.key}`
                : '—'}
            </div>
          </div>
        </div>
      )}

      {phase === 'probe' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setProbeStep((s) => Math.max(0, s - 1))}
            disabled={probeStep === 0}
            className="rounded border px-3 py-1 font-mono text-xs disabled:opacity-40 hover:bg-muted"
          >
            ← {lang === 'ko' ? '이전' : 'Prev'}
          </button>
          <button
            onClick={() => setProbeStep((s) => Math.min(probeRows.length - 1, s + 1))}
            disabled={probeStep >= probeRows.length - 1}
            className="rounded border px-3 py-1 font-mono text-xs disabled:opacity-40 hover:bg-muted"
          >
            {lang === 'ko' ? '다음' : 'Next'} →
          </button>
        </div>
      )}
    </div>
  )
}
