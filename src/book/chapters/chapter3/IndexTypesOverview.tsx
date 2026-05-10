import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { SectionTitle, SubTitle, Prose, InfoBox, Divider } from '../shared'

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  ko: {
    whatTitle: '인덱스란?',
    whatDesc:
      '인덱스는 테이블 또는 테이블 클러스터의 데이터 접근 속도를 높이기 위한 선택적 스키마 오브젝트입니다. 책 뒤의 색인처럼, 전체 내용을 처음부터 읽지 않고 원하는 항목을 바로 찾을 수 있게 해줍니다.',
    whatPoints: [
      { icon: '🔗', text: '테이블과 논리적·물리적으로 독립 — 인덱스를 삭제하거나 생성해도 테이블 데이터에는 영향 없음' },
      { icon: '⚡', text: '쿼리 실행 속도에만 영향 — 결과의 정확성은 인덱스 유무와 무관' },
      { icon: '🔄', text: 'DML(INSERT/UPDATE/DELETE) 발생 시 데이터베이스가 자동으로 유지 관리' },
    ],

    whenTitle: '인덱스를 만들어야 할 때',
    whenItems: [
      {
        ok: true,
        title: '조회 빈도가 높고 결과 행이 적을 때',
        desc: '쿼리가 전체 행의 소수만 반환하는 경우, 인덱스 스캔이 Full Table Scan보다 유리합니다.',
        example: 'WHERE employee_id = 145  -- 1행만 반환',
      },
      {
        ok: true,
        title: '참조 무결성 제약(FK)이 있는 컬럼',
        desc: '부모 테이블 삭제 시 자식 테이블을 잠글 수 있어, FK 컬럼에 인덱스가 없으면 Lock 문제가 발생합니다.',
        example: 'FOREIGN KEY (department_id) REFERENCES departments(department_id)',
      },
      {
        ok: false,
        title: '결과 행이 전체의 대부분일 때',
        desc: '인덱스를 거쳐 블록을 하나씩 찾는 것보다 Full Table Scan이 오히려 빠릅니다.',
        example: 'WHERE salary > 1000  -- 대부분의 행이 해당',
      },
      {
        ok: false,
        title: 'DML이 매우 빈번한 작은 테이블',
        desc: '인덱스 유지 비용이 조회 이득보다 클 수 있습니다.',
        example: '수백 행 미만의 코드 테이블',
      },
    ],
    whenOk: '인덱스 생성 권장',
    whenNo: '인덱스 생성 비권장',

    costTitle: '인덱스의 대가',
    costItems: [
      { icon: '💾', title: '디스크 공간', desc: '인덱스 세그먼트가 별도 공간을 차지합니다. 테이블과 다른 테이블스페이스에 저장할 수 있습니다.' },
      { icon: '🔄', title: 'DML 오버헤드', desc: 'INSERT, UPDATE, DELETE 시 인덱스도 함께 갱신됩니다. 인덱스가 많을수록 DML 성능이 저하됩니다.' },
      { icon: '🧠', title: '옵티마이저 부담', desc: '인덱스가 많으면 CBO가 최적 실행 계획을 찾는 데 더 많은 시간이 걸립니다.' },
    ],

    keyVsIndexTitle: '키(Key) vs 인덱스(Index)',
    keyVsIndexDesc: '\'키\'와 \'인덱스\'는 종종 같은 의미로 쓰이지만 엄밀히는 다릅니다.',
    keyVsIndexRows: [
      { aspect: '개념', key: '논리적 개념 — 행을 고유하게 식별하는 컬럼 집합', index: '물리적 구조 — 빠른 접근을 위한 데이터 구조' },
      { aspect: 'PK / UK', key: '제약 조건으로 선언', index: '제약 선언 시 Oracle이 자동 생성' },
      { aspect: 'FK', key: '참조 무결성 제약', index: '자동 생성 안 됨 — 수동 생성 권장' },
    ],

    stateTitle: '인덱스 상태',
    stateDesc: '인덱스는 두 가지 독립적인 상태를 가집니다: Usability(유지 여부)와 Visibility(옵티마이저 사용 여부).',
    usabilityRows: [
      { state: 'Usable', dml: '✓ 유지', optimizer: '✓ 사용', space: '✓ 소비', badge: 'emerald', use: '정상 운영' },
      { state: 'Unusable', dml: '✗ 유지 안 함', optimizer: '✗ 무시', space: '✗ 없음', badge: 'rose', use: '대량 로드 성능 향상용' },
    ],
    visibilityRows: [
      { state: 'Visible', dml: '✓ 유지', optimizer: '✓ 사용', space: '✓ 소비', badge: 'emerald', use: '정상 운영' },
      { state: 'Invisible', dml: '✓ 유지', optimizer: '✗ 무시', space: '✓ 소비', badge: 'amber', use: '삭제 전 영향 테스트용' },
    ],
    stateHeaderAspect: '상태',
    stateHeaderDml: 'DML 유지',
    stateHeaderOpt: '옵티마이저',
    stateHeaderSpace: '공간',
    stateHeaderUse: '용도',

    nullTitle: 'NULL 처리 규칙',
    nullDesc: 'B-Tree 인덱스는 모든 키 컬럼이 NULL인 행을 인덱싱하지 않습니다. 이 규칙은 쿼리 작성 시 중요한 영향을 줍니다.',
    nullItems: [
      {
        icon: '🌲',
        title: 'B-Tree: NULL 행 제외',
        desc: '단일 컬럼 인덱스에서는 값이 NULL인 모든 행이 인덱스에 없습니다. WHERE col IS NULL 조건은 인덱스를 사용할 수 없습니다.',
        warn: true,
      },
      {
        icon: '🗺️',
        title: 'Bitmap: NULL도 인덱싱',
        desc: 'Bitmap 인덱스는 NULL을 하나의 키 값으로 취급합니다. NULL 값인 행도 비트맵에 포함됩니다.',
        warn: false,
      },
      {
        icon: '🔧',
        title: 'FBI로 NULL 우회',
        desc: 'Function-Based Index에서 NVL(col, 0) 같은 함수를 사용하면 B-Tree에서도 NULL 행을 인덱싱할 수 있습니다.',
        warn: false,
      },
    ],

    typesTitle: '인덱스 종류 한눈에 보기',
    types: [
      {
        name: 'B-Tree Index',
        color: 'violet',
        icon: '🌲',
        badge: '기본값',
        cardinality: '고카디널리티',
        workload: 'OLTP',
        scanTypes: 'Unique / Range / Full / Skip',
        example: 'EMPLOYEE_ID, EMAIL',
        desc: '가장 일반적인 인덱스. Root → Branch → Leaf 균형 트리 구조.',
      },
      {
        name: 'Bitmap Index',
        color: 'emerald',
        icon: '🗺️',
        badge: 'DW',
        cardinality: '저카디널리티',
        workload: 'OLAP / DW',
        scanTypes: 'Bitmap AND/OR → ROWID 변환',
        example: 'GENDER, STATUS',
        desc: '값 종류가 적은 컬럼에 유리. AND/OR 비트 연산으로 복수 조건 초고속 처리.',
      },
      {
        name: 'Function-Based Index',
        color: 'orange',
        icon: 'ƒ',
        badge: 'FBI',
        cardinality: '표현식에 따라',
        workload: 'OLTP / DW',
        scanTypes: 'B-Tree 또는 Bitmap',
        example: 'UPPER(last_name)',
        desc: '함수 또는 표현식의 결과를 키로 저장. 대소문자 무관 검색 등에 사용.',
      },
      {
        name: 'Composite Index',
        color: 'purple',
        icon: '⊕',
        badge: '복합',
        cardinality: '선두 컬럼 기준',
        workload: 'OLTP',
        scanTypes: 'Range Scan / Skip Scan',
        example: '(DEPT_ID, JOB_ID)',
        desc: '2개 이상 컬럼을 하나로 묶음. 컬럼 순서가 핵심 — 선두 컬럼이 WHERE에 있어야 함.',
      },
      {
        name: 'Reverse Key Index',
        color: 'rose',
        icon: '↔',
        badge: 'RAC',
        cardinality: '고카디널리티',
        workload: 'Oracle RAC',
        scanTypes: 'Unique Scan만 가능',
        example: 'ORDER_ID (순차 증가 PK)',
        desc: '키 바이트를 역순 저장. 순차 증가 PK의 우측 Leaf 블록 경합 분산용.',
      },
      {
        name: 'Index-Organized Table',
        color: 'amber',
        icon: '⬡',
        badge: 'IOT',
        cardinality: 'PK 기준',
        workload: 'PK 접근 위주',
        scanTypes: 'PK 기반 직접 접근',
        example: 'PK로만 조회하는 테이블',
        desc: '테이블 자체가 B-Tree. Leaf 블록에 PK + 나머지 컬럼 저장. 추가 I/O 없음.',
      },
    ],
    typeCardWhen: '카디널리티',
    typeCardWorkload: '워크로드',
    typeCardScan: '스캔',
    typeCardExample: '예시',

    noteIndependent: '인덱스는 테이블과 물리적으로 독립된 세그먼트입니다. 인덱스를 삭제해도 테이블 데이터는 보존됩니다.',
    noteDMLCost: 'DML이 많은 테이블에 인덱스를 남용하면 오히려 성능이 저하될 수 있습니다. 꼭 필요한 인덱스만 생성하세요.',
    noteNullWarning: 'WHERE col IS NULL 조건에는 B-Tree 인덱스가 사용되지 않습니다. FBI나 Bitmap 인덱스를 고려하세요.',
  },
  en: {
    whatTitle: 'What is an Index?',
    whatDesc:
      'An index is an optional schema object that speeds data access to a table or table cluster. Like a book index, it lets you jump directly to a row without scanning every page from the beginning.',
    whatPoints: [
      { icon: '🔗', text: 'Logically and physically independent from the table — dropping or creating an index does not affect table data' },
      { icon: '⚡', text: 'Affects only execution speed — query results are identical with or without an index' },
      { icon: '🔄', text: 'Automatically maintained by the database on every DML (INSERT / UPDATE / DELETE)' },
    ],

    whenTitle: 'When to Create an Index',
    whenItems: [
      {
        ok: true,
        title: 'Columns queried frequently, returning few rows',
        desc: 'An index scan is faster than a Full Table Scan when only a small fraction of rows match.',
        example: 'WHERE employee_id = 145  -- returns 1 row',
      },
      {
        ok: true,
        title: 'Foreign key columns (referential integrity)',
        desc: 'Without an index, Oracle may lock the child table when deleting the parent row.',
        example: 'FOREIGN KEY (department_id) REFERENCES departments(department_id)',
      },
      {
        ok: false,
        title: 'Queries returning most of the table',
        desc: 'Accessing each block individually via an index is slower than a single Full Table Scan.',
        example: 'WHERE salary > 1000  -- matches most rows',
      },
      {
        ok: false,
        title: 'Small tables with heavy DML',
        desc: 'Index maintenance overhead may outweigh the read benefit.',
        example: 'Lookup tables with fewer than a few hundred rows',
      },
    ],
    whenOk: 'Recommended',
    whenNo: 'Not Recommended',

    costTitle: 'The Cost of Indexes',
    costItems: [
      { icon: '💾', title: 'Disk Space', desc: 'Each index occupies a separate segment. It can be stored in a different tablespace from the table.' },
      { icon: '🔄', title: 'DML Overhead', desc: 'INSERT, UPDATE, DELETE automatically update every index on the table. More indexes = slower writes.' },
      { icon: '🧠', title: 'Optimizer Overhead', desc: 'More indexes mean more paths for the CBO to evaluate, increasing parse time.' },
    ],

    keyVsIndexTitle: 'Key vs. Index',
    keyVsIndexDesc: '"Key" and "index" are often used interchangeably, but they are distinct concepts.',
    keyVsIndexRows: [
      { aspect: 'Concept', key: 'Logical — the set of columns that uniquely identify a row', index: 'Physical structure — the data structure enabling fast access' },
      { aspect: 'PK / UK', key: 'Declared as a constraint', index: 'Oracle creates the index automatically when the constraint is declared' },
      { aspect: 'FK', key: 'Referential integrity constraint', index: 'Not auto-created — manual index creation is recommended' },
    ],

    stateTitle: 'Index States',
    stateDesc: 'An index has two independent state dimensions: Usability (whether DML maintains it) and Visibility (whether the optimizer uses it).',
    usabilityRows: [
      { state: 'Usable', dml: '✓ Maintained', optimizer: '✓ Used', space: '✓ Consumed', badge: 'emerald', use: 'Normal operation' },
      { state: 'Unusable', dml: '✗ Not maintained', optimizer: '✗ Ignored', space: '✗ None', badge: 'rose', use: 'Speed up bulk loads' },
    ],
    visibilityRows: [
      { state: 'Visible', dml: '✓ Maintained', optimizer: '✓ Used', space: '✓ Consumed', badge: 'emerald', use: 'Normal operation' },
      { state: 'Invisible', dml: '✓ Maintained', optimizer: '✗ Ignored', space: '✓ Consumed', badge: 'amber', use: 'Test before dropping' },
    ],
    stateHeaderAspect: 'State',
    stateHeaderDml: 'DML',
    stateHeaderOpt: 'Optimizer',
    stateHeaderSpace: 'Space',
    stateHeaderUse: 'Use Case',

    nullTitle: 'NULL Handling',
    nullDesc: 'B-Tree indexes do not index rows where ALL key columns are NULL. This has important implications for query design.',
    nullItems: [
      {
        icon: '🌲',
        title: 'B-Tree: NULL rows excluded',
        desc: 'In a single-column index, rows where the column is NULL are absent from the index. WHERE col IS NULL cannot use a B-Tree index.',
        warn: true,
      },
      {
        icon: '🗺️',
        title: 'Bitmap: NULL is indexed',
        desc: 'Bitmap indexes treat NULL as a distinct key value, so NULL rows are included in the bitmap.',
        warn: false,
      },
      {
        icon: '🔧',
        title: 'Workaround with FBI',
        desc: 'Use NVL(col, 0) in a Function-Based Index to index NULL rows in a B-Tree structure.',
        warn: false,
      },
    ],

    typesTitle: 'Index Types at a Glance',
    types: [
      {
        name: 'B-Tree Index',
        color: 'violet',
        icon: '🌲',
        badge: 'Default',
        cardinality: 'High cardinality',
        workload: 'OLTP',
        scanTypes: 'Unique / Range / Full / Skip',
        example: 'EMPLOYEE_ID, EMAIL',
        desc: 'The default and most common index. Balanced Root → Branch → Leaf structure.',
      },
      {
        name: 'Bitmap Index',
        color: 'emerald',
        icon: '🗺️',
        badge: 'DW',
        cardinality: 'Low cardinality',
        workload: 'OLAP / DW',
        scanTypes: 'Bitmap AND/OR → ROWID conversion',
        example: 'GENDER, STATUS',
        desc: 'Ideal for columns with few distinct values. Extremely fast multi-predicate AND/OR via bitwise operations.',
      },
      {
        name: 'Function-Based Index',
        color: 'orange',
        icon: 'ƒ',
        badge: 'FBI',
        cardinality: 'Depends on expression',
        workload: 'OLTP / DW',
        scanTypes: 'B-Tree or Bitmap',
        example: 'UPPER(last_name)',
        desc: 'Stores a function or expression result as the index key. Enables case-insensitive search and computed-value predicates.',
      },
      {
        name: 'Composite Index',
        color: 'purple',
        icon: '⊕',
        badge: 'Composite',
        cardinality: 'By leading column',
        workload: 'OLTP',
        scanTypes: 'Range Scan / Skip Scan',
        example: '(DEPT_ID, JOB_ID)',
        desc: 'Two or more columns combined. Column order matters — the leading column must appear in the WHERE clause.',
      },
      {
        name: 'Reverse Key Index',
        color: 'rose',
        icon: '↔',
        badge: 'RAC',
        cardinality: 'High cardinality',
        workload: 'Oracle RAC',
        scanTypes: 'Unique Scan only',
        example: 'ORDER_ID (sequential PK)',
        desc: 'Stores key bytes in reverse to distribute inserts across leaf blocks. Prevents right-side contention in Oracle RAC.',
      },
      {
        name: 'Index-Organized Table',
        color: 'amber',
        icon: '⬡',
        badge: 'IOT',
        cardinality: 'By PK',
        workload: 'PK-heavy access',
        scanTypes: 'Direct PK access',
        example: 'Tables accessed almost entirely by PK',
        desc: 'The table itself is the B-Tree. Leaf blocks store PK + all non-key columns. No separate table segment needed.',
      },
    ],
    typeCardWhen: 'Cardinality',
    typeCardWorkload: 'Workload',
    typeCardScan: 'Scan',
    typeCardExample: 'Example',

    noteIndependent: 'An index is a physically separate segment from the table. Dropping an index never touches the table data.',
    noteDMLCost: 'Overusing indexes on write-heavy tables degrades DML performance. Create only what is needed.',
    noteNullWarning: 'WHERE col IS NULL cannot use a B-Tree index. Consider an FBI or Bitmap index instead.',
  },
} as const

// ── Color maps ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, { border: string; bg: string; badge: string; icon: string; heading: string }> = {
  violet:  { border: 'border-violet-200',  bg: 'bg-violet-50/60',  badge: 'bg-violet-100 text-violet-700',   icon: 'bg-violet-100',  heading: 'text-violet-800' },
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100', heading: 'text-emerald-800' },
  orange:  { border: 'border-orange-200',  bg: 'bg-orange-50/60',  badge: 'bg-orange-100 text-orange-700',   icon: 'bg-orange-100',  heading: 'text-orange-800' },
  purple:  { border: 'border-purple-200',  bg: 'bg-purple-50/60',  badge: 'bg-purple-100 text-purple-700',   icon: 'bg-purple-100',  heading: 'text-purple-800' },
  rose:    { border: 'border-rose-200',    bg: 'bg-rose-50/60',    badge: 'bg-rose-100 text-rose-700',       icon: 'bg-rose-100',    heading: 'text-rose-800' },
  amber:   { border: 'border-amber-200',   bg: 'bg-amber-50/60',   badge: 'bg-amber-100 text-amber-700',     icon: 'bg-amber-100',   heading: 'text-amber-800' },
}

const BADGE_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rose:    'bg-rose-100 text-rose-700 border-rose-200',
  amber:   'bg-amber-100 text-amber-700 border-amber-200',
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

// ── StateTable sub-component ──────────────────────────────────────────────────

type StateRow = { state: string; dml: string; optimizer: string; space: string; badge: string; use: string }
type StateHeaders = { aspect: string; dml: string; optimizer: string; space: string; use: string }

function StateTable({ rows, headers }: { rows: StateRow[]; headers: StateHeaders }) {
  return (
    <div className="mb-5 overflow-hidden rounded-xl border text-xs">
      <div className="grid grid-cols-[110px_1fr_1fr_1fr_1fr] divide-x border-b bg-muted/40 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {[headers.aspect, headers.dml, headers.optimizer, headers.space, headers.use].map((h, i) => (
          <div key={i} className="px-3 py-2">{h}</div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} className={cn('grid grid-cols-[110px_1fr_1fr_1fr_1fr] divide-x', i % 2 === 1 && 'bg-muted/20')}>
          <div className="flex items-center px-3 py-2.5">
            <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold', BADGE_COLOR[row.badge])}>
              {row.state}
            </span>
          </div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.dml}</div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.optimizer}</div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.space}</div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.use}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────


export function IndexTypesOverview() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [expandedType, setExpandedType] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-2 px-8 pb-12">

      {/* ── 1. 인덱스란? ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <div className="mb-6 space-y-2">
        {t.whatPoints.map((p, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <span className="mt-0.5 text-base leading-none">{p.icon}</span>
            <p className="text-xs leading-relaxed text-muted-foreground">{p.text}</p>
          </motion.div>
        ))}
      </div>

      <InfoBox variant="note">{t.noteIndependent}</InfoBox>

      <Divider />

      {/* ── 2. 언제 인덱스를 만들까? ── */}
      <SectionTitle>{t.whenTitle}</SectionTitle>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {t.whenItems.map((item, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className={cn(
              'rounded-xl border p-4',
              item.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/40',
            )}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn('text-sm font-bold', item.ok ? 'text-emerald-500' : 'text-rose-500')}>
                {item.ok ? '✓' : '✗'}
              </span>
              <span className={cn('text-xs font-bold', item.ok ? 'text-emerald-700' : 'text-rose-700')}>
                {item.ok ? t.whenOk : t.whenNo}
              </span>
            </div>
            <p className="mb-2 text-xs font-semibold text-foreground">{item.title}</p>
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
            <code className={cn(
              'block rounded px-2 py-1 font-mono text-[10px]',
              item.ok ? 'bg-emerald-100/60 text-emerald-800' : 'bg-rose-100/60 text-rose-800',
            )}>
              {item.example}
            </code>
          </motion.div>
        ))}
      </div>

      <InfoBox variant="warning">{t.noteDMLCost}</InfoBox>

      <Divider />

      {/* ── 3. 인덱스의 대가 ── */}
      <SectionTitle>{t.costTitle}</SectionTitle>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {t.costItems.map((item, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2 rounded-xl border bg-card p-4"
          >
            <span className="text-xl">{item.icon}</span>
            <p className="text-xs font-bold">{item.title}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <Divider />

      {/* ── 4. Key vs Index ── */}
      <SectionTitle>{t.keyVsIndexTitle}</SectionTitle>
      <Prose>{t.keyVsIndexDesc}</Prose>

      <div className="mb-6 overflow-hidden rounded-xl border text-xs">
        <div className="grid grid-cols-3 divide-x border-b bg-muted/40">
          <div className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lang === 'ko' ? '항목' : 'Aspect'}
          </div>
          <div className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-600">Key</div>
          <div className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600">Index</div>
        </div>
        {t.keyVsIndexRows.map((row, i) => (
          <div key={i} className={cn('grid grid-cols-3 divide-x', i % 2 === 1 && 'bg-muted/20')}>
            <div className="px-4 py-3 font-mono text-[11px] font-semibold">{row.aspect}</div>
            <div className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{row.key}</div>
            <div className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{row.index}</div>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── 5. 인덱스 상태 ── */}
      <SectionTitle>{t.stateTitle}</SectionTitle>
      <Prose>{t.stateDesc}</Prose>

      <SubTitle>Usability</SubTitle>
      <StateTable
        rows={t.usabilityRows as unknown as StateRow[]}
        headers={{ aspect: t.stateHeaderAspect, dml: t.stateHeaderDml, optimizer: t.stateHeaderOpt, space: t.stateHeaderSpace, use: t.stateHeaderUse }}
      />

      <SubTitle>Visibility</SubTitle>
      <StateTable
        rows={t.visibilityRows as unknown as StateRow[]}
        headers={{ aspect: t.stateHeaderAspect, dml: t.stateHeaderDml, optimizer: t.stateHeaderOpt, space: t.stateHeaderSpace, use: t.stateHeaderUse }}
      />

      <InfoBox variant="tip">
        {lang === 'ko'
          ? 'Invisible 인덱스는 DML 유지는 하면서 옵티마이저에게만 숨깁니다. 운영 중인 인덱스를 삭제하기 전에 Invisible로 전환해 성능 영향을 먼저 확인하는 용도로 활용합니다.'
          : 'An Invisible index is still maintained by DML but hidden from the optimizer. Use it to safely test the impact of dropping an index in production before actually removing it.'}
      </InfoBox>

      <Divider />

      {/* ── 6. NULL 처리 ── */}
      <SectionTitle>{t.nullTitle}</SectionTitle>
      <Prose>{t.nullDesc}</Prose>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {t.nullItems.map((item, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className={cn(
              'rounded-xl border p-4',
              item.warn ? 'border-rose-200 bg-rose-50/40' : 'border-border bg-card',
            )}
          >
            <div className="mb-2 text-xl">{item.icon}</div>
            <p className={cn('mb-1.5 text-xs font-bold', item.warn ? 'text-rose-700' : 'text-foreground')}>
              {item.title}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <InfoBox variant="warning">{t.noteNullWarning}</InfoBox>

      <Divider />

      {/* ── 7. 인덱스 종류 그리드 ── */}
      <SectionTitle>{t.typesTitle}</SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.types.map((type, i) => {
          const c = TYPE_COLOR[type.color]
          const isExpanded = expandedType === type.name
          return (
            <motion.button
              key={type.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => setExpandedType(isExpanded ? null : type.name)}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-5 text-left transition-shadow hover:shadow-md',
                c.border, c.bg,
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-lg', c.icon)}>
                  {type.icon}
                </div>
                <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] font-bold', c.badge)}>
                  {type.badge}
                </span>
              </div>

              <div className={cn('text-sm font-bold', c.heading)}>{type.name}</div>
              <p className="text-[11px] leading-snug text-muted-foreground">{type.desc}</p>

              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <dl className="mt-1 space-y-1.5 border-t pt-3">
                  {([
                    [t.typeCardWhen, type.cardinality],
                    [t.typeCardWorkload, type.workload],
                    [t.typeCardScan, type.scanTypes],
                    [t.typeCardExample, type.example],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="w-16 shrink-0 font-mono text-[10px] font-semibold text-muted-foreground">{label}</dt>
                      <dd className="font-mono text-[10px] leading-snug text-foreground/80">{val}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>

              <div className="mt-auto text-right font-mono text-[9px] text-muted-foreground/50">
                {isExpanded
                  ? (lang === 'ko' ? '접기 ▲' : 'collapse ▲')
                  : (lang === 'ko' ? '자세히 ▼' : 'details ▼')}
              </div>
            </motion.button>
          )
        })}
      </div>

    </div>
  )
}
