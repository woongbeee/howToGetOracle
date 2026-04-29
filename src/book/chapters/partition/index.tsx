import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore, type Lang } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
  InfoBox, Table, ConceptGrid, SimulatorPlaceholder, Divider, WipBanner
} from '../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    chapterTitle: '파티셔닝',
    chapterSubtitle: '대용량 테이블의 관리와 쿼리 성능을 향상시키는 Oracle 파티셔닝 전략을 학습합니다.',
    simDesc: '파티션 시뮬레이터 — Partition Pruning이 어떻게 동작하는지 확인하세요.',

    overviewTitle: '파티셔닝 개요',
    overviewDesc: '파티셔닝은 하나의 대형 테이블이나 인덱스를 여러 개의 작은 물리적 조각(파티션)으로 나누는 기법입니다. 각 파티션은 독립적으로 관리될 수 있지만, SQL 관점에서는 하나의 테이블처럼 보입니다.',
    overviewItems: [
      { icon: '⚡', title: '쿼리 성능', desc: 'Partition Pruning으로 필요한 파티션만 스캔하여 I/O 대폭 감소.', color: 'blue' },
      { icon: '🔧', title: '관리 편의성', desc: '파티션 단위로 데이터 로드, 삭제, 이동, 백업이 가능.', color: 'orange' },
      { icon: '🔀', title: '병렬 처리', desc: '파티션별 병렬 쿼리로 처리 속도 향상.', color: 'violet' },
      { icon: '📦', title: '데이터 아카이빙', desc: '오래된 파티션을 DROP 또는 Exchange로 빠르게 아카이빙.', color: 'emerald' },
    ],

    typeTitle: 'Range / List / Hash 파티션',
    typeDesc: '파티셔닝 방식은 데이터 특성과 쿼리 패턴에 따라 선택합니다.',
    typeTable: [
      ['Range', '파티션 키의 범위로 분할', '날짜 컬럼 (월별, 연별 분할)', '가장 일반적'],
      ['List', '파티션 키의 특정 값 목록으로 분할', '지역 코드, 부서 코드', '값이 명확할 때'],
      ['Hash', '파티션 키의 해시 값으로 균등 분할', '균등 분산이 필요할 때', '데이터 스큐 방지'],
      ['Composite', '두 가지 방식 결합', 'Range-Hash, Range-List', '복잡한 쿼리 패턴'],
    ],

    pruningTitle: 'Partition Pruning',
    pruningDesc: 'WHERE 조건에 파티션 키가 포함되면 Oracle은 관련 파티션만 접근합니다. 이를 Partition Pruning이라 하며, 대용량 테이블 쿼리 성능의 핵심입니다.',
    pruningInfo: 'Static Pruning은 쿼리 컴파일 시 결정됩니다. Dynamic Pruning은 실행 시 바인드 변수나 조인 결과에 따라 결정됩니다.',
  },
  en: {
    chapterTitle: 'Partitioning',
    chapterSubtitle: 'Learn Oracle partitioning strategies to improve management and query performance on large tables.',
    simDesc: 'Partition Simulator — See how Partition Pruning works.',

    overviewTitle: 'Partitioning Overview',
    overviewDesc: 'Partitioning divides a large table or index into smaller physical pieces (partitions). Each partition can be managed independently, but appears as a single table to SQL.',
    overviewItems: [
      { icon: '⚡', title: 'Query Performance', desc: 'Partition Pruning scans only required partitions, dramatically reducing I/O.', color: 'blue' },
      { icon: '🔧', title: 'Manageability', desc: 'Load, delete, move, or back up data at the partition level.', color: 'orange' },
      { icon: '🔀', title: 'Parallel Processing', desc: 'Parallel queries per partition improve throughput.', color: 'violet' },
      { icon: '📦', title: 'Data Archiving', desc: 'Archive old data quickly by DROPping or EXCHANGing partitions.', color: 'emerald' },
    ],

    typeTitle: 'Range / List / Hash Partitions',
    typeDesc: 'Choose the partitioning strategy based on data characteristics and query patterns.',
    typeTable: [
      ['Range', 'Split by range of partition key', 'Date columns (monthly, yearly)', 'Most common'],
      ['List', 'Split by specific value list of partition key', 'Region codes, department codes', 'When values are discrete'],
      ['Hash', 'Even distribution by hash of partition key', 'When even distribution is needed', 'Prevents data skew'],
      ['Composite', 'Combines two methods', 'Range-Hash, Range-List', 'Complex query patterns'],
    ],

    pruningTitle: 'Partition Pruning',
    pruningDesc: 'When a WHERE clause includes the partition key, Oracle accesses only the relevant partitions. This is Partition Pruning — the key to large table query performance.',
    pruningInfo: 'Static Pruning is determined at query compile time. Dynamic Pruning is determined at runtime based on bind variables or join results.',
  },
}

export function PartitionPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'partition-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="▦" num={7} title="Partition Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Partition Simulator" color="amber" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <WipBanner />
      {sectionId === 'partition-overview' && (
        <>
          <ChapterTitle icon="▦" num={7} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Prose>{t.overviewDesc}</Prose>
          <ConceptGrid items={t.overviewItems} />
        </>
      )}
      {sectionId === 'partition-range' && (
        <>
          <SectionTitle>{t.typeTitle}</SectionTitle>
          <Prose>{t.typeDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '파티션 유형' : 'Type', lang === 'ko' ? '분할 기준' : 'Split Criteria', lang === 'ko' ? '주요 사용처' : 'Use Case', lang === 'ko' ? '특징' : 'Notes']}
            rows={t.typeTable}
          />
          <Divider />
          <PartitionVisual lang={lang} />
        </>
      )}
      {sectionId === 'partition-pruning' && (
        <>
          <SectionTitle>{t.pruningTitle}</SectionTitle>
          <Prose>{t.pruningDesc}</Prose>
          <InfoBox color="info" icon="💡" title={lang === 'ko' ? 'Static vs Dynamic Pruning' : 'Static vs Dynamic Pruning'}>
            {t.pruningInfo}
          </InfoBox>
          <Divider />
          <PruningDemo lang={lang} />
        </>
      )}
    </PageContainer>
  )
}

function PartitionVisual({ lang }: { lang: Lang }) {
  const partitions = [
    { label: lang === 'ko' ? '2023-Q1' : '2023-Q1', range: 'Jan~Mar 2023', color: 'bg-blue-50 border-blue-200' },
    { label: lang === 'ko' ? '2023-Q2' : '2023-Q2', range: 'Apr~Jun 2023', color: 'bg-violet-50 border-violet-200' },
    { label: lang === 'ko' ? '2023-Q3' : '2023-Q3', range: 'Jul~Sep 2023', color: 'bg-orange-50 border-orange-200' },
    { label: lang === 'ko' ? '2023-Q4' : '2023-Q4', range: 'Oct~Dec 2023', color: 'bg-emerald-50 border-emerald-200' },
  ]

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {lang === 'ko' ? 'Range 파티션 (분기별)' : 'Range Partition (Quarterly)'}
      </div>
      <div className="flex gap-2">
        {partitions.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn('flex flex-1 flex-col gap-1 rounded-lg border p-3', p.color)}
          >
            <span className="font-mono text-[10px] font-bold">{p.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{p.range}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PruningDemo({ lang }: { lang: Lang }) {
  const [activeQ, setActiveQ] = useState(0)
  const queries = [
    {
      sql: "WHERE order_date >= DATE '2023-07-01'\n  AND order_date < DATE '2023-10-01'",
      pruned: [false, false, true, false],
      label: lang === 'ko' ? 'Q3만 스캔 (75% 절감)' : 'Scan Q3 only (75% savings)',
    },
    {
      sql: "WHERE order_date >= DATE '2023-04-01'",
      pruned: [false, true, true, true],
      label: lang === 'ko' ? 'Q2~Q4 스캔 (25% 절감)' : 'Scan Q2–Q4 (25% savings)',
    },
    {
      sql: "WHERE customer_id = 12345",
      pruned: [true, true, true, true],
      label: lang === 'ko' ? '전체 파티션 스캔 (Pruning 없음)' : 'Scan all partitions (no pruning)',
    },
  ]

  const q = queries[activeQ]
  const partitionLabels = ['2023-Q1', '2023-Q2', '2023-Q3', '2023-Q4']

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {lang === 'ko' ? 'Partition Pruning 데모' : 'Partition Pruning Demo'}
      </div>

      <div className="mb-3 flex flex-col gap-1.5">
        {queries.map((qr, i) => (
          <button
            key={i}
            onClick={() => setActiveQ(i)}
            className={cn(
              'rounded-lg border px-3 py-2 text-left font-mono text-[11px] transition-all',
              activeQ === i ? 'border-blue-400 bg-blue-50 text-blue-800' : 'hover:bg-muted'
            )}
          >
            <span className="text-muted-foreground">{lang === 'ko' ? '쿼리' : 'Query'} {i + 1}:</span>{' '}
            <code>{qr.sql.split('\n')[0]}</code>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        {partitionLabels.map((p, i) => (
          <div key={p} className={cn(
            'flex flex-1 flex-col items-center gap-1 rounded-lg border p-2 transition-all',
            q.pruned[i]
              ? 'border-emerald-400 bg-emerald-100 text-emerald-800'
              : 'border-border bg-muted/40 text-muted-foreground opacity-40'
          )}>
            <span className="font-mono text-[10px] font-bold">{p}</span>
            <span className="font-mono text-[9px]">{q.pruned[i] ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">{q.label}</p>
    </div>
  )
}
