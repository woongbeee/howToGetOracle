import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { SectionTitle, SubTitle, Prose, InfoBox } from '../shared'

function Divider() {
  return <div className="my-12 border-t" />
}

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  ko: {
    whatTitle: '인덱스란?',
    whatDesc:
      '인덱스는 테이블 데이터 접근 속도를 높이기 위한 선택적 오브젝트입니다. 책 뒤의 색인처럼, 전체 내용을 처음부터 읽지 않고 원하는 항목을 바로 찾을 수 있게 해줍니다.',
    whatHeapTitle: '테이블의 데이터는 어떤 순서로 저장될까?',
    whatHeapDesc:
      '오라클의 일반 테이블은 힙 구조(heap-organized) 입니다. 자료 구조에서 heap은 최댓값·최솟값을 빠르게 찾도록 정렬된 구조를 뜻하지만, 오라클에서는 의미가 다릅니다. 영어 단어 "heap"의 원래 뜻인 "차곡차곡 쌓아올리다"처럼, 정렬 기준 없이 크기에 맞는 빈 공간에 데이터를 적재하는 저장 방식입니다.\n\n데이터의 물리적 저장 순서와 논리적 순서가 일치하지 않으므로, 특정 행을 찾으려면 테이블 전체를 처음부터 끝까지 읽어야 합니다. 인덱스는 바로 이 문제를 해결합니다. 창고에 물건이 무작위로 쌓여 있다면 일일이 뒤져야 하지만, 창고 지도가 있으면 원하는 물건이 어디 있는지 바로 알 수 있는 것과 같습니다.',
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
        desc: '전체 데이터 중에서 소수만 쿼리할 때가 많은 경우, 인덱스 스캔이 Full Table Scan보다 유리합니다.',
        example: 'WHERE employee_id = 145  -- 1행만 반환',
      },
      {
        ok: true,
        title: '참조 무결성 제약(FK)이 있는 컬럼',
        desc: '부모 테이블의 행이 삭제되거나 수정될 때 자식 테이블에 그 값을 참조하는 행이 있는지 확인해야 하는데, 이때 FK 컬럼에 인덱스가 있으면 해당 행을 빠르게 찾아낼 수 있습니다. 또, 테이블끼리 조인할 때도 FK컬럼이 자주 연결점이 되므로 조인 계획에 유리할 수 있습니다.',
        example: 'FOREIGN KEY (department_id) REFERENCES departments(department_id)',
      },
      {
        ok: false,
        title: '테이블의 전체 또는 과반의 데이터를 조회하는 쿼리가 많을 때',
        desc: '인덱스를 거쳐 블록을 하나씩 찾는 것보다 Full Table Scan이 오히려 빠릅니다.',
        example: 'WHERE salary > 1000  -- 대부분의 행이 해당',
      },
      {
        ok: false,
        title: 'DML이 매우 빈번한 작은 테이블',
        desc: '인덱스는 항상 정렬 상태를 유지하면서 데이터를 INSERT/UPDATE/DELETE 해야 하므로, 이런 작업이 빈번한 테이블에서는 인덱스 사용의 이득보다 데이터 정렬 관리의 비용이 더 클 수 있습니다.',
        example: '수백 행 미만의 코드 테이블',
      },
    ],
    whenOk: '인덱스 생성 권장',
    whenNo: '인덱스 생성 비권장',

    costTitle: '인덱스를 사용하는 비용',
    costItems: [
      { icon: '💾', title: '디스크 공간', desc: '인덱스 세그먼트가 별도 공간을 차지합니다. 테이블과 다른 테이블스페이스에 저장할 수 있습니다.' },
      { icon: '🔄', title: 'DML 오버헤드', desc: 'INSERT, UPDATE, DELETE 시 인덱스도 함께 갱신됩니다. 인덱스가 많을수록 DML 성능이 저하됩니다.' },
      { icon: '🧠', title: '옵티마이저 부담', desc: '인덱스가 많으면 옵티마이저가 최적 실행 계획을 찾는 데 더 많은 시간이 걸립니다.' },
    ],
    optimizerNote: '옵티마이저(Optimizer)란 SQL을 실행하기 전에 "어떤 순서로, 어떤 방법으로 데이터를 읽을지"를 결정하는 Oracle의 핵심 엔진입니다. 인덱스가 많을수록 선택지가 늘어나 결정에 시간이 더 걸립니다. 옵티마이저는 이후 챕터에서 자세히 다룹니다.',

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

    typesTitle: '인덱스 종류 한눈에 보기',
    types: [
      { name: 'B-Tree Index',           color: 'violet',  icon: '🌲', badge: '기본값', desc: '가장 일반적인 인덱스. Root → Branch → Leaf 균형 트리 구조로, 대부분의 상황에서 기본으로 사용됩니다.' },
      { name: 'Bitmap Index',           color: 'emerald', icon: '🗺️', badge: 'DW',    desc: '값의 종류가 적은 컬럼에 유리합니다. 비트 연산으로 여러 조건을 동시에 처리합니다.' },
      { name: 'Function-Based Index',   color: 'orange',  icon: 'ƒ',  badge: 'FBI',   desc: '함수나 표현식의 결과를 키로 저장합니다. 대소문자 구분 없이 검색할 때 자주 활용됩니다.' },
      { name: 'Composite Index',        color: 'purple',  icon: '⊕',  badge: '복합',  desc: '2개 이상의 컬럼을 묶어 하나의 인덱스로 만듭니다. 선두 컬럼이 WHERE 조건에 있어야 효과적입니다.' },
      { name: 'Reverse Key Index',      color: 'rose',    icon: '↔',  badge: 'RAC',   desc: '키 값을 뒤집어 저장합니다. 순차 증가하는 값이 특정 블록에 몰리는 현상을 분산시킵니다.' },
      { name: 'Index-Organized Table',  color: 'amber',   icon: '⬡',  badge: 'IOT',   desc: '테이블 자체가 B-Tree 인덱스 구조입니다. 기본 키로만 조회하는 테이블에 적합합니다.' },
    ],

  },
  en: {
    whatTitle: 'What is an Index?',
    whatDesc:
      'An index is an optional object that speeds up data access on a table. Like the index at the back of a book, it lets you jump straight to what you need without reading everything from the start.',
    whatHeapTitle: 'How is data stored in a table?',
    whatHeapDesc:
      'A standard Oracle table uses heap-organized storage. In data structures, a "heap" refers to a sorted structure optimized for finding max or min values — but Oracle uses the word differently. True to its literal meaning of "to pile up," Oracle simply writes each row into any available free space, with no sorting applied.\n\nBecause physical storage order has nothing to do with logical data order, finding rows that match a condition means scanning the whole table from start to finish. An index solves this problem. Think of it as a warehouse map: instead of searching every shelf, you look up the map to find exactly where each item is.',
    whatPoints: [
      { icon: '🔗', text: 'Physically independent from the table — creating or dropping an index never touches the table data' },
      { icon: '⚡', text: 'Affects only query speed — results are identical with or without an index' },
      { icon: '🔄', text: 'Automatically maintained by Oracle on every DML (INSERT / UPDATE / DELETE)' },
    ],

    whenTitle: 'When to Create an Index',
    whenItems: [
      {
        ok: true,
        title: 'High-frequency queries that return few rows',
        desc: 'When a query touches only a small fraction of the table, an index scan is far cheaper than a Full Table Scan.',
        example: 'WHERE employee_id = 145  -- returns 1 row',
      },
      {
        ok: true,
        title: 'Foreign key columns',
        desc: 'When a parent row is deleted or updated, Oracle must verify no child rows reference it. An index on the FK column makes this lookup fast. FK columns also appear frequently in join conditions, making an index beneficial for join plans as well.',
        example: 'FOREIGN KEY (department_id) REFERENCES departments(department_id)',
      },
      {
        ok: false,
        title: 'Queries that return most of the table',
        desc: 'Fetching blocks one at a time through an index is slower than a single sequential Full Table Scan.',
        example: 'WHERE salary > 1000  -- matches most rows',
      },
      {
        ok: false,
        title: 'Small tables with heavy DML',
        desc: 'An index must stay sorted on every INSERT, UPDATE, and DELETE. On write-heavy tables, that maintenance cost can outweigh any read benefit.',
        example: 'Lookup tables with fewer than a few hundred rows',
      },
    ],
    whenOk: 'Recommended',
    whenNo: 'Not Recommended',

    costTitle: 'The Cost of Indexes',
    costItems: [
      { icon: '💾', title: 'Disk Space', desc: 'Each index is a separate segment and occupies its own storage. It can be placed in a different tablespace from the table.' },
      { icon: '🔄', title: 'DML Overhead', desc: 'Every INSERT, UPDATE, and DELETE must also update all indexes on the table. The more indexes, the higher the write cost.' },
      { icon: '🧠', title: 'Optimizer Overhead', desc: 'More indexes give the optimizer more execution paths to evaluate, which increases parse time.' },
    ],
    optimizerNote: 'The Optimizer is Oracle\'s core engine that decides how to execute a SQL statement — which path to take, which indexes to use, and in what order to read data. The more indexes exist, the more choices it has to evaluate. We\'ll cover the Optimizer in depth in a later chapter.',

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

    typesTitle: 'Index Types at a Glance',
    types: [
      { name: 'B-Tree Index',           color: 'violet',  icon: '🌲', badge: 'Default', desc: 'The most common index type. Uses a balanced Root → Branch → Leaf tree structure and works well in most situations.' },
      { name: 'Bitmap Index',           color: 'emerald', icon: '🗺️', badge: 'DW',      desc: 'Best for columns with few distinct values. Uses bitwise operations to process multiple conditions at once.' },
      { name: 'Function-Based Index',   color: 'orange',  icon: 'ƒ',  badge: 'FBI',     desc: 'Stores the result of a function or expression as the key. Commonly used for case-insensitive searches.' },
      { name: 'Composite Index',        color: 'purple',  icon: '⊕',  badge: 'Composite', desc: 'Combines two or more columns into a single index. Most effective when the leading column appears in the WHERE clause.' },
      { name: 'Reverse Key Index',      color: 'rose',    icon: '↔',  badge: 'RAC',     desc: 'Stores key bytes in reverse order. Spreads inserts across leaf blocks to avoid hot-block contention on sequential keys.' },
      { name: 'Index-Organized Table',  color: 'amber',   icon: '⬡',  badge: 'IOT',     desc: 'The table itself is the B-Tree index. Well-suited for tables accessed almost exclusively by primary key.' },
    ],

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

  return (
    <div className="mx-auto max-w-6xl space-y-2 px-8 pb-12">

      {/* ── 1. 인덱스란? ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
        <p className="mb-2 text-xs font-bold text-amber-800">{t.whatHeapTitle}</p>
        <Prose className="text-[12px] text-amber-900/80">{t.whatHeapDesc}</Prose>
      </div>

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

      <InfoBox variant="note">{t.optimizerNote}</InfoBox>

      <Divider />

      {/* ── 4. 인덱스 종류 ── */}
      <SectionTitle>{t.typesTitle}</SectionTitle>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.types.map((type, i) => {
          const c = TYPE_COLOR[type.color]
          return (
            <motion.div
              key={type.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-5',
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
            </motion.div>
          )
        })}
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

    </div>
  )
}
