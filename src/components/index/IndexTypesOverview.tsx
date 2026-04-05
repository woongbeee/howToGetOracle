import { motion } from 'framer-motion'
import type { Lang } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    heading: 'Oracle 인덱스란?',
    intro:
      '인덱스는 테이블의 특정 컬럼 값을 기준으로 행을 빠르게 찾기 위한 별도의 데이터 구조입니다. 전체 테이블을 스캔하지 않고도 필요한 행을 찾을 수 있어 쿼리 성능이 크게 향상됩니다.',
    whyTitle: '인덱스가 필요한 이유',
    whyRows: [
      { without: 'Full Table Scan — 모든 블록 순차 읽기', with: '인덱스 스캔 — 소수의 블록만 읽기' },
      { without: '10,000행 테이블 → 최대 10,000번 비교', with: 'B-Tree height 4 → 최대 4번 I/O' },
      { without: 'WHERE salary > 8000: 모든 행 확인', with: 'INDEX RANGE SCAN: 범위 직접 탐색' },
    ],
    withoutLabel: '인덱스 없음',
    withLabel: '인덱스 있음',
    typesTitle: '인덱스 종류',
    types: [
      {
        name: 'B-Tree Index',
        color: 'blue',
        icon: '🌲',
        when: '고카디널리티 컬럼, PK/UK, 등호/범위 검색',
        structure: 'Root → Branch → Leaf 블록, 균형 트리',
        scan: 'Unique Scan / Range Scan / Full Scan / Skip Scan',
        example: 'EMPLOYEE_ID, EMAIL, ORDER_DATE',
        badge: '기본값',
      },
      {
        name: 'Bitmap Index',
        color: 'emerald',
        icon: '🗺',
        when: '저카디널리티 컬럼, DW/분석 쿼리, NULL 인덱싱',
        structure: '키 값별 비트맵 벡터 → B-Tree로 저장',
        scan: '비트맵 AND/OR 병합 후 Rowid 변환',
        example: 'GENDER, STATUS, PAYMENT_METHOD',
        badge: 'DW 최적',
      },
      {
        name: 'Function-Based Index',
        color: 'orange',
        icon: 'ƒ',
        when: '컬럼에 함수를 적용한 WHERE 절',
        structure: 'B-Tree 또는 Bitmap 구조 위에 함수 표현식 저장',
        scan: '표현식 일치 시 일반 B-Tree처럼 동작',
        example: 'UPPER(LAST_NAME), EXTRACT(YEAR FROM ORDER_DATE)',
        badge: 'FBI',
      },
      {
        name: 'Composite Index',
        color: 'purple',
        icon: '⊕',
        when: '여러 컬럼이 함께 WHERE/JOIN에 등장',
        structure: '(col1, col2, ...) 순서로 정렬된 B-Tree',
        scan: 'Leading column 기준 Range Scan, Skip Scan',
        example: '(DEPT_ID, JOB_ID), (CUSTOMER_ID, ORDER_DATE)',
        badge: '복합',
      },
      {
        name: 'Reverse Key Index',
        color: 'rose',
        icon: '↔',
        when: '순차 증가 PK에서 리프 블록 경합 방지 (RAC)',
        structure: '키 바이트를 역순으로 저장',
        scan: 'Unique Scan만 가능 (Range Scan 불가)',
        example: 'ORDER_ID (RAC 환경)',
        badge: 'RAC',
      },
      {
        name: 'Index-Organized Table',
        color: 'amber',
        icon: '⬡',
        when: 'PK 기반 접근이 대부분인 테이블',
        structure: '테이블 자체가 B-Tree — 별도 힙 없음',
        scan: 'PK로 직접 데이터 접근, 추가 I/O 불필요',
        example: 'DEPARTMENTS (PK 기반 조회 多)',
        badge: 'IOT',
      },
    ],
    conceptsTitle: '핵심 개념',
    concepts: [
      {
        term: 'Cardinality (카디널리티)',
        desc: '컬럼의 고유값(NDV) 수. 높을수록 B-Tree 적합, 낮을수록 Bitmap 적합. 비율 = NDV / 전체 행 수.',
      },
      {
        term: 'Clustering Factor',
        desc: '인덱스 순서와 테이블 물리 저장 순서의 일치도. 낮을수록 Range Scan I/O가 적음. ALL_INDEXES 뷰에서 확인.',
      },
      {
        term: 'Selectivity (선택도)',
        desc: '조건절이 선택하는 행의 비율 (0~1). 낮을수록 인덱스 효과 큼. CBO가 액세스 패스 결정에 사용.',
      },
      {
        term: 'Index Height',
        desc: 'Root에서 Leaf까지의 블록 수. = 쿼리당 최소 I/O 수. 대부분 2~4 수준 유지.',
      },
      {
        term: 'Null 처리',
        desc: 'B-Tree는 모든 키가 NULL인 행을 인덱싱하지 않음. Bitmap은 NULL 인덱싱 가능.',
      },
    ],
  },
  en: {
    heading: 'What is an Oracle Index?',
    intro:
      'An index is a separate data structure that allows Oracle to locate rows quickly based on specific column values, without scanning every block in the table. This dramatically reduces I/O and improves query performance.',
    whyTitle: 'Why Indexes Matter',
    whyRows: [
      { without: 'Full Table Scan — read every block sequentially', with: 'Index Scan — read only a few blocks' },
      { without: '10,000-row table → up to 10,000 comparisons', with: 'B-Tree height 4 → max 4 I/Os' },
      { without: 'WHERE salary > 8000: check every row', with: 'INDEX RANGE SCAN: navigate directly to range' },
    ],
    withoutLabel: 'Without Index',
    withLabel: 'With Index',
    typesTitle: 'Index Types',
    types: [
      {
        name: 'B-Tree Index',
        color: 'blue',
        icon: '🌲',
        when: 'High-cardinality columns, PK/UK, equality & range searches',
        structure: 'Root → Branch → Leaf blocks, balanced tree',
        scan: 'Unique Scan / Range Scan / Full Scan / Skip Scan',
        example: 'EMPLOYEE_ID, EMAIL, ORDER_DATE',
        badge: 'Default',
      },
      {
        name: 'Bitmap Index',
        color: 'emerald',
        icon: '🗺',
        when: 'Low-cardinality columns, DW/analytics, NULL indexing',
        structure: 'Bitmap vector per key value, stored in B-Tree',
        scan: 'Bitmap AND/OR merge, then convert to rowids',
        example: 'GENDER, STATUS, PAYMENT_METHOD',
        badge: 'DW Best',
      },
      {
        name: 'Function-Based Index',
        color: 'orange',
        icon: 'ƒ',
        when: 'WHERE clause applies a function to a column',
        structure: 'B-Tree or Bitmap storing the function expression result',
        scan: 'Behaves like a normal B-Tree when expression matches',
        example: 'UPPER(LAST_NAME), EXTRACT(YEAR FROM ORDER_DATE)',
        badge: 'FBI',
      },
      {
        name: 'Composite Index',
        color: 'purple',
        icon: '⊕',
        when: 'Multiple columns appear together in WHERE/JOIN',
        structure: 'B-Tree sorted by (col1, col2, ...) order',
        scan: 'Range Scan by leading column, Skip Scan for non-leading',
        example: '(DEPT_ID, JOB_ID), (CUSTOMER_ID, ORDER_DATE)',
        badge: 'Composite',
      },
      {
        name: 'Reverse Key Index',
        color: 'rose',
        icon: '↔',
        when: 'Sequential PK to avoid right-side leaf block contention (RAC)',
        structure: 'Key bytes stored in reverse order',
        scan: 'Unique Scan only — Range Scan not supported',
        example: 'ORDER_ID (in RAC environment)',
        badge: 'RAC',
      },
      {
        name: 'Index-Organized Table',
        color: 'amber',
        icon: '⬡',
        when: 'Table accessed mostly by primary key',
        structure: 'Table IS the B-Tree — no separate heap',
        scan: 'Direct data access via PK, no extra I/O',
        example: 'DEPARTMENTS (mostly PK-based lookups)',
        badge: 'IOT',
      },
    ],
    conceptsTitle: 'Key Concepts',
    concepts: [
      {
        term: 'Cardinality',
        desc: 'Number of distinct values (NDV) in a column. Higher → B-Tree. Lower → Bitmap. Ratio = NDV / total rows.',
      },
      {
        term: 'Clustering Factor',
        desc: 'How well the index order matches physical row storage. Lower = fewer I/Os for range scans. Check ALL_INDEXES.',
      },
      {
        term: 'Selectivity',
        desc: 'Fraction of rows selected by a predicate (0–1). Lower selectivity = index is more effective. Used by CBO to choose access paths.',
      },
      {
        term: 'Index Height',
        desc: 'Block depth from root to leaf = minimum I/Os per lookup. Typically stays at 2–4 for most tables.',
      },
      {
        term: 'Null Handling',
        desc: 'B-Tree does not index rows where ALL key columns are NULL. Bitmap indexes CAN store NULL values.',
      },
    ],
  },
}

const colorMap: Record<string, { border: string; bg: string; badge: string; icon: string; heading: string }> = {
  blue:    { border: 'border-blue-200',   bg: 'bg-blue-50/60',   badge: 'bg-blue-100 text-blue-700',    icon: 'bg-blue-100',   heading: 'text-blue-800' },
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100', heading: 'text-emerald-800' },
  orange:  { border: 'border-orange-200', bg: 'bg-orange-50/60', badge: 'bg-orange-100 text-orange-700', icon: 'bg-orange-100', heading: 'text-orange-800' },
  purple:  { border: 'border-purple-200', bg: 'bg-purple-50/60', badge: 'bg-purple-100 text-purple-700', icon: 'bg-purple-100', heading: 'text-purple-800' },
  rose:    { border: 'border-rose-200',   bg: 'bg-rose-50/60',   badge: 'bg-rose-100 text-rose-700',    icon: 'bg-rose-100',   heading: 'text-rose-800' },
  amber:   { border: 'border-amber-200',  bg: 'bg-amber-50/60',  badge: 'bg-amber-100 text-amber-700',  icon: 'bg-amber-100',  heading: 'text-amber-800' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  }),
}

interface Props { lang: Lang }

export function IndexTypesOverview({ lang }: Props) {
  const t = T[lang]

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-8">

      {/* Intro */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">{t.heading}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.intro}</p>
      </motion.div>

      {/* Why indexes matter — comparison table */}
      <motion.section custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.whyTitle}</h3>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-2 divide-x border-b bg-muted/40">
            <div className="px-4 py-2 font-mono text-xs font-semibold text-rose-600">{t.withoutLabel}</div>
            <div className="px-4 py-2 font-mono text-xs font-semibold text-emerald-600">{t.withLabel}</div>
          </div>
          {t.whyRows.map((row, i) => (
            <div key={i} className={cn('grid grid-cols-2 divide-x', i % 2 === 1 ? 'bg-muted/20' : '')}>
              <div className="flex items-center gap-2 px-4 py-3 font-mono text-xs text-rose-700">
                <span className="shrink-0 text-rose-400">✗</span>
                {row.without}
              </div>
              <div className="flex items-center gap-2 px-4 py-3 font-mono text-xs text-emerald-700">
                <span className="shrink-0 text-emerald-400">✓</span>
                {row.with}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Index types grid */}
      <section>
        <motion.h3
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t.typesTitle}
        </motion.h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.types.map((type, i) => {
            const c = colorMap[type.color]
            return (
              <motion.div
                key={i}
                custom={i + 3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className={cn('flex flex-col gap-3 rounded-xl border p-5', c.border, c.bg)}
              >
                <div className="flex items-start justify-between">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-lg', c.icon)}>
                    {type.icon}
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] font-bold', c.badge)}>
                    {type.badge}
                  </span>
                </div>

                <div>
                  <div className={cn('text-sm font-bold', c.heading)}>{type.name}</div>
                </div>

                <dl className="space-y-1.5">
                  <Row label={lang === 'ko' ? '적용' : 'When'} val={type.when} />
                  <Row label={lang === 'ko' ? '구조' : 'Structure'} val={type.structure} />
                  <Row label={lang === 'ko' ? '스캔' : 'Scan'} val={type.scan} />
                  <Row label={lang === 'ko' ? '예시' : 'Example'} val={type.example} mono />
                </dl>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Key concepts */}
      <section className="pb-4">
        <motion.h3
          custom={10} variants={fadeUp} initial="hidden" animate="visible"
          className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground"
        >
          {t.conceptsTitle}
        </motion.h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.concepts.map((c, i) => (
            <motion.div
              key={i}
              custom={i + 11}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border bg-card p-4"
            >
              <div className="mb-1.5 font-mono text-xs font-bold text-[hsl(var(--active-border))]">{c.term}</div>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Row({ label, val, mono = false }: { label: string; val: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 font-mono text-[10px] font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn('text-[11px] leading-snug text-foreground/80', mono && 'font-mono')}>{val}</dd>
    </div>
  )
}
