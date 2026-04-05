import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    compositeTitle: '복합 인덱스 (Composite Index)',
    compositeDesc:
      '두 개 이상의 컬럼을 하나의 인덱스로 묶습니다. 컬럼 순서가 핵심 — Leading Column이 WHERE 절에 없으면 인덱스를 효율적으로 사용할 수 없습니다. Leading Column의 카디널리티가 낮다면 Index Skip Scan이 유효할 수 있습니다.',
    orderTitle: '컬럼 순서 규칙',
    orderRules: [
      { rule: 'Leading Column 포함 → Index Range Scan', ok: true, example: 'WHERE dept_id = 60' },
      { rule: 'Leading + 추가 컬럼 → 더 좁은 범위', ok: true, example: 'WHERE dept_id = 60 AND job_id = \'IT_PROG\'' },
      { rule: 'Leading Column 없음 → Full Table Scan (또는 Skip Scan)', ok: false, example: 'WHERE job_id = \'IT_PROG\' (dept_id 없음)' },
      { rule: 'Non-leading만 → Skip Scan (저카디널리티 Leading인 경우)', ok: null, example: 'WHERE salary = 9000 (DEPT_ID 저카디널리티라면)' },
    ],
    skipTitle: 'Index Skip Scan 원리',
    skipDesc:
      'Leading 컬럼의 고유값 수가 적을 때(低카디널리티), Oracle은 인덱스를 논리적으로 분할해 Leading Column의 각 고유값마다 별도 탐색을 수행합니다. 예: (GENDER, EMAIL)에서 GENDER = M/F 2개이므로 Sub-index M과 Sub-index F를 순서대로 탐색.',
    skipSteps: ['GENDER = M 서브인덱스 탐색', 'EMAIL 조건 적용', 'GENDER = F 서브인덱스 탐색', 'EMAIL 조건 적용', '결과 병합'],
    fbiTitle: 'Function-Based Index (FBI)',
    fbiDesc:
      '컬럼에 함수를 적용한 표현식을 인덱스 키로 저장합니다. WHERE UPPER(last_name) = \'SMITH\' 처럼 함수가 적용된 WHERE 절에서 인덱스를 사용할 수 있게 합니다. CBO가 표현식 트리를 대소문자 무시, 공백 무시로 매칭합니다.',
    fbiExamples: [
      { expr: 'UPPER(last_name)', use: '대소문자 무관 검색', sql: "WHERE UPPER(last_name) = 'SMITH'" },
      { expr: '12 * salary * commission_pct', use: '연봉 계산 조건', sql: "WHERE (12 * salary * commission_pct) < 30000" },
      { expr: 'EXTRACT(YEAR FROM hire_date)', use: '연도별 검색', sql: "WHERE EXTRACT(YEAR FROM hire_date) = 2023" },
    ],
    reverseTitle: 'Reverse Key Index',
    reverseDesc:
      '키 바이트를 역순으로 저장합니다. 순차 증가 PK (ORDER_ID 1,2,3...)는 항상 가장 오른쪽 Leaf 블록에 집중 삽입되어 경합이 발생합니다. 역순 저장으로 삽입이 분산됩니다. 단, Range Scan 불가 — 역순이라 논리적 순서가 깨지기 때문.',
    reverseDemo: [
      { original: 20, hex: 'C1,15', reversed: '15,C1' },
      { original: 21, hex: 'C1,16', reversed: '16,C1' },
      { original: 22, hex: 'C1,17', reversed: '17,C1' },
    ],
    iotTitle: 'Index-Organized Table (IOT)',
    iotDesc:
      '테이블 자체가 B-Tree입니다. Leaf 블록에 PK + 나머지 컬럼 전체가 저장됩니다. PK 기반 접근이 대부분인 테이블에서는 힙 테이블 + 별도 인덱스보다 I/O가 적습니다. 이차 인덱스는 Logical ROWID(PK 인코딩)를 사용합니다.',
    iotVsHeap: {
      heap: { label: '힙 테이블', steps: ['Index Leaf → ROWID', 'Data Block 접근', '총 2 I/O'] },
      iot:  { label: 'IOT', steps: ['B-Tree Leaf에 데이터 직접 저장', '추가 I/O 없음', '총 1 I/O'] },
    },
    invisibleTitle: 'Invisible / Unusable Index',
    invisibleRows: [
      { state: 'Usable', desc: 'CBO가 사용 / DML 시 자동 유지 / 공간 소비', color: 'emerald' },
      { state: 'Unusable', desc: 'CBO 무시 / DML 유지 안 함 / 공간 소비 없음 — 대량 로드 성능 향상용', color: 'rose' },
      { state: 'Invisible', desc: 'CBO 무시 / DML 유지 함 / 공간 소비 — 삭제 전 테스트용', color: 'amber' },
    ],
  },
  en: {
    compositeTitle: 'Composite (Concatenated) Index',
    compositeDesc:
      'Combines two or more columns into a single index. Column order is critical — without the leading column in the WHERE clause, the index cannot be used efficiently. If the leading column has low cardinality, Index Skip Scan may still apply.',
    orderTitle: 'Column Order Rules',
    orderRules: [
      { rule: 'Leading column present → Index Range Scan', ok: true, example: 'WHERE dept_id = 60' },
      { rule: 'Leading + additional columns → narrower range', ok: true, example: "WHERE dept_id = 60 AND job_id = 'IT_PROG'" },
      { rule: 'No leading column → Full Table Scan (or Skip Scan)', ok: false, example: "WHERE job_id = 'IT_PROG' (no dept_id)" },
      { rule: 'Non-leading only → Skip Scan (if leading is low-cardinality)', ok: null, example: 'WHERE salary = 9000 (if DEPT_ID is low-cardinality)' },
    ],
    skipTitle: 'Index Skip Scan Explained',
    skipDesc:
      'When the leading column has few distinct values (low cardinality), Oracle logically splits the index and probes it as if there were separate indexes for each distinct leading value. E.g., composite index on (GENDER, EMAIL): since GENDER has only M/F, Oracle probes sub-index M, then sub-index F.',
    skipSteps: ['Probe GENDER = M sub-index', 'Apply EMAIL predicate', 'Probe GENDER = F sub-index', 'Apply EMAIL predicate', 'Merge results'],
    fbiTitle: 'Function-Based Index (FBI)',
    fbiDesc:
      'Stores the result of a function or expression on one or more columns as the index key. Enables index use for WHERE clauses like WHERE UPPER(last_name) = \'SMITH\'. CBO matches expression trees case-insensitively, ignoring whitespace.',
    fbiExamples: [
      { expr: 'UPPER(last_name)', use: 'Case-insensitive search', sql: "WHERE UPPER(last_name) = 'SMITH'" },
      { expr: '12 * salary * commission_pct', use: 'Annual salary predicate', sql: "WHERE (12 * salary * commission_pct) < 30000" },
      { expr: 'EXTRACT(YEAR FROM hire_date)', use: 'Year-based search', sql: "WHERE EXTRACT(YEAR FROM hire_date) = 2023" },
    ],
    reverseTitle: 'Reverse Key Index',
    reverseDesc:
      'Stores key bytes in reverse order. Sequentially increasing PKs (ORDER_ID 1, 2, 3...) cause insert contention on the rightmost leaf block. Reversing the bytes spreads inserts across all leaf blocks. Trade-off: Range Scan is impossible because logical ordering is destroyed.',
    reverseDemo: [
      { original: 20, hex: 'C1,15', reversed: '15,C1' },
      { original: 21, hex: 'C1,16', reversed: '16,C1' },
      { original: 22, hex: 'C1,17', reversed: '17,C1' },
    ],
    iotTitle: 'Index-Organized Table (IOT)',
    iotDesc:
      'The table itself is the B-Tree. Leaf blocks store the PK plus all non-key columns. For tables accessed mostly by PK, this eliminates the extra I/O of fetching from a heap table after an index probe. Secondary indexes use Logical ROWIDs (PK-encoded).',
    iotVsHeap: {
      heap: { label: 'Heap Table', steps: ['Index Leaf → ROWID', 'Fetch Data Block', 'Total: 2 I/Os'] },
      iot:  { label: 'IOT', steps: ['Data in B-Tree Leaf directly', 'No extra fetch needed', 'Total: 1 I/O'] },
    },
    invisibleTitle: 'Invisible / Unusable Index',
    invisibleRows: [
      { state: 'Usable', desc: 'Used by CBO / maintained on DML / consumes space', color: 'emerald' },
      { state: 'Unusable', desc: 'Ignored by CBO / NOT maintained on DML / no space — use for bulk loads', color: 'rose' },
      { state: 'Invisible', desc: 'Ignored by CBO / maintained on DML / consumes space — use to test before dropping', color: 'amber' },
    ],
  },
}

interface Props { lang: Lang }

export function CompositeSection({ lang }: Props) {
  const t = T[lang]
  const [skipPhase, setSkipPhase] = useState(-1)
  const [isSkipRunning, setIsSkipRunning] = useState(false)

  async function runSkipScan() {
    if (isSkipRunning) return
    setIsSkipRunning(true)
    setSkipPhase(-1)
    for (let i = 0; i < t.skipSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 700))
      setSkipPhase(i)
    }
    setIsSkipRunning(false)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

      {/* Composite index */}
      <section>
        <h2 className="mb-1 text-lg font-bold">{t.compositeTitle}</h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.compositeDesc}</p>

        {/* Column order rules */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.orderTitle}</h3>
        <div className="mb-6 overflow-hidden rounded-xl border">
          {t.orderRules.map((r, i) => (
            <div key={i} className={cn('flex items-start gap-3 border-b px-4 py-3 last:border-b-0', i % 2 === 1 ? 'bg-muted/20' : '')}>
              <span className={cn('mt-0.5 shrink-0 text-sm',
                r.ok === true ? 'text-emerald-500' : r.ok === false ? 'text-rose-500' : 'text-amber-500'
              )}>
                {r.ok === true ? '✓' : r.ok === false ? '✗' : '△'}
              </span>
              <div>
                <div className="text-xs font-semibold">{r.rule}</div>
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{r.example}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Index on (DEPT_ID, JOB_ID) visual */}
        <CompositeIndexVisual lang={lang} />
      </section>

      {/* Skip Scan */}
      <section className="rounded-xl border bg-card p-6">
        <h3 className="mb-1 text-sm font-bold">{t.skipTitle}</h3>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.skipDesc}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={runSkipScan}
            disabled={isSkipRunning}
            className="rounded-lg bg-blue-600 px-4 py-2 font-mono text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {lang === 'ko' ? 'Skip Scan 실행' : 'Run Skip Scan'}
          </button>
          <button
            onClick={() => { setSkipPhase(-1); setIsSkipRunning(false) }}
            className="rounded-lg border px-4 py-2 font-mono text-xs text-muted-foreground transition hover:text-foreground"
          >
            {lang === 'ko' ? '초기화' : 'Reset'}
          </button>
        </div>

        {/* Skip scan visualization */}
        <SkipScanViz phase={skipPhase} lang={lang} />

        {/* Steps */}
        <div className="mt-4 space-y-1">
          {t.skipSteps.map((step, i) => (
            <motion.div
              key={i}
              animate={{ opacity: skipPhase >= i ? 1 : 0.25 }}
              className="flex items-center gap-2"
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', skipPhase >= i ? 'bg-blue-500' : 'bg-muted-foreground')} />
              <span className="font-mono text-[11px]">{step}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FBI */}
      <section>
        <h3 className="mb-1 text-sm font-bold">{t.fbiTitle}</h3>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.fbiDesc}</p>
        <div className="space-y-3">
          {t.fbiExamples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-[1fr_1fr_1.5fr] gap-4 rounded-xl border bg-card px-5 py-4"
            >
              <div>
                <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '표현식' : 'Expression'}</div>
                <div className="font-mono text-xs font-bold text-orange-700">{ex.expr}</div>
              </div>
              <div>
                <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '용도' : 'Use case'}</div>
                <div className="text-xs">{ex.use}</div>
              </div>
              <div>
                <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">SQL</div>
                <div className="font-mono text-[10px] text-foreground/80">{ex.sql}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Reverse Key */}
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-bold">{t.reverseTitle}</h3>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t.reverseDesc}</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-3 divide-x border-b bg-muted/40 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div className="px-3 py-2">{lang === 'ko' ? '원본 키' : 'Original Key'}</div>
              <div className="px-3 py-2">HEX</div>
              <div className="px-3 py-2">{lang === 'ko' ? '역순 저장' : 'Reversed'}</div>
            </div>
            {t.reverseDemo.map((r, i) => (
              <div key={i} className={cn('grid grid-cols-3 divide-x font-mono text-xs', i % 2 === 1 ? 'bg-muted/20' : '')}>
                <div className="px-3 py-2 font-bold">{r.original}</div>
                <div className="px-3 py-2 text-muted-foreground">{r.hex}</div>
                <div className="px-3 py-2 text-rose-700 font-bold">{r.reversed}</div>
              </div>
            ))}
          </div>
        </div>

        {/* IOT */}
        <div>
          <h3 className="mb-1 text-sm font-bold">{t.iotTitle}</h3>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t.iotDesc}</p>
          <div className="grid grid-cols-2 gap-3">
            {(['heap', 'iot'] as const).map((k) => {
              const side = t.iotVsHeap[k]
              return (
                <div key={k} className={cn('rounded-xl border p-4',
                  k === 'iot' ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-muted/20'
                )}>
                  <div className={cn('mb-2 font-mono text-xs font-bold', k === 'iot' ? 'text-emerald-700' : 'text-foreground')}>
                    {side.label}
                  </div>
                  <ul className="space-y-1">
                    {side.steps.map((s, i) => (
                      <li key={i} className={cn('text-[11px]', i === 2 ? 'font-bold' : 'text-muted-foreground')}>{s}</li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Invisible / Unusable */}
      <section className="pb-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.invisibleTitle}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {t.invisibleRows.map((r, i) => {
            const c = r.color === 'emerald'
              ? 'border-emerald-200 bg-emerald-50/60'
              : r.color === 'rose'
              ? 'border-rose-200 bg-rose-50/60'
              : 'border-amber-200 bg-amber-50/60'
            const tc = r.color === 'emerald' ? 'text-emerald-700'
              : r.color === 'rose' ? 'text-rose-700' : 'text-amber-700'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn('rounded-xl border p-4', c)}
              >
                <div className={cn('mb-1.5 font-mono text-xs font-bold', tc)}>{r.state}</div>
                <p className="text-[11px] leading-snug text-muted-foreground">{r.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ── Composite Index Visual ─────────────────────────────────────────────────────

function CompositeIndexVisual({ lang }: { lang: Lang }) {
  const entries = [
    { dept: 10, job: 'AD_ASST', rowid: 'AAA001' },
    { dept: 20, job: 'MK_MAN',  rowid: 'AAA002' },
    { dept: 50, job: 'ST_MAN',  rowid: 'AAA003' },
    { dept: 50, job: 'ST_CLERK',rowid: 'AAA004' },
    { dept: 60, job: 'IT_PROG', rowid: 'AAA005' },
    { dept: 60, job: 'IT_PROG', rowid: 'AAA006' },
    { dept: 80, job: 'SA_MAN',  rowid: 'AAA007' },
    { dept: 90, job: 'AD_PRES', rowid: 'AAA008' },
  ]

  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="rounded-xl border bg-muted/20 p-5">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        IDX_EMP_DEPT_JOB — (DEPARTMENT_ID, JOB_ID)
      </div>
      <div className="mb-2 grid grid-cols-[80px_100px_80px] gap-2 font-mono text-[10px] font-semibold text-muted-foreground border-b pb-2">
        <span>DEPT_ID</span>
        <span>JOB_ID</span>
        <span>ROWID</span>
      </div>
      <div className="space-y-1">
        {entries.map((e, i) => {
          const leading = hovered !== null && entries[hovered].dept === e.dept
          const full    = hovered !== null && entries[hovered].dept === e.dept && entries[hovered].job === e.job
          return (
            <motion.div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              animate={{
                backgroundColor: full ? '#bbf7d0' : leading ? '#dbeafe' : 'transparent',
              }}
              className="grid cursor-pointer grid-cols-[80px_100px_80px] gap-2 rounded-lg px-2 py-1"
            >
              <span className="font-mono text-[11px] font-bold">{e.dept}</span>
              <span className="font-mono text-[11px]">{e.job}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{e.rowid}</span>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        {lang === 'ko'
          ? '파란색 = DEPT_ID만 일치 (Range Scan 가능) · 녹색 = (DEPT_ID, JOB_ID) 모두 일치'
          : 'Blue = DEPT_ID match only (Range Scan) · Green = full (DEPT_ID, JOB_ID) match'}
      </p>
    </div>
  )
}

// ── Skip Scan Visualization ────────────────────────────────────────────────────

function SkipScanViz({ phase, lang }: { phase: number; lang: Lang }) {
  // Composite index on (GENDER, EMAIL) — 2 distinct genders
  const mEntries = ['a@co', 'b@co', 'f@co', 'j@co', 'r@co']
  const fEntries = ['c@co', 'd@co', 'g@co', 'k@co', 's@co']

  return (
    <div className="flex flex-wrap gap-6 rounded-xl border bg-muted/20 p-5">
      {/* M sub-index */}
      <div className={cn('rounded-xl border-2 p-4 transition-all', phase === 0 || phase === 1 ? 'border-blue-400 bg-blue-50' : 'border-border')}>
        <div className="mb-2 font-mono text-[10px] font-bold text-blue-700">
          {lang === 'ko' ? 'GENDER = M 서브인덱스' : 'Sub-index: GENDER = M'}
        </div>
        {mEntries.map((e, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: phase === 1 ? '#bfdbfe' : 'transparent' }}
            className="rounded px-2 py-0.5 font-mono text-[10px]"
          >
            {e}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {phase >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-center font-mono text-xs text-blue-500">→</motion.div>
        )}
      </AnimatePresence>

      {/* F sub-index */}
      <div className={cn('rounded-xl border-2 p-4 transition-all', phase === 2 || phase === 3 ? 'border-rose-400 bg-rose-50' : 'border-border')}>
        <div className="mb-2 font-mono text-[10px] font-bold text-rose-700">
          {lang === 'ko' ? 'GENDER = F 서브인덱스' : 'Sub-index: GENDER = F'}
        </div>
        {fEntries.map((e, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: phase === 3 ? '#fecdd3' : 'transparent' }}
            className="rounded px-2 py-0.5 font-mono text-[10px]"
          >
            {e}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="self-center rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4"
          >
            <div className="font-mono text-[10px] font-bold text-emerald-700">
              {lang === 'ko' ? '최종 결과 병합' : 'Merged Result'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
