import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle, SubTitle, Prose, InfoBox, Divider,
} from '../shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'rollup' | 'cube' | 'pivot'

// ── Data ───────────────────────────────────────────────────────────────────

interface EmpRow { first_name: string; dept_id: number; job_title: string; salary: number }

const EMPS: EmpRow[] = [
  { first_name: 'Alice',  dept_id: 10, job_title: 'Engineer', salary: 7200 },
  { first_name: 'Bob',    dept_id: 20, job_title: 'Analyst',  salary: 5400 },
  { first_name: 'Carol',  dept_id: 10, job_title: 'Engineer', salary: 8100 },
  { first_name: 'David',  dept_id: 30, job_title: 'Support',  salary: 4900 },
  { first_name: 'Eva',    dept_id: 20, job_title: 'Analyst',  salary: 6300 },
  { first_name: 'Frank',  dept_id: 30, job_title: 'Support',  salary: 3800 },
  { first_name: 'Grace',  dept_id: 10, job_title: 'Lead',     salary: 9500 },
  { first_name: 'Henry',  dept_id: 20, job_title: 'Analyst',  salary: 5900 },
]

// ── ROLLUP computation ─────────────────────────────────────────────────────

interface RollupRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _level: 'detail' | 'subtotal' | 'grand'
}

function computeRollup(): RollupRow[] {
  const result: RollupRow[] = []
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)

  for (const dept of depts) {
    const deptRows = EMPS.filter((e) => e.dept_id === dept)
    const jobs = [...new Set(deptRows.map((e) => e.job_title))].sort()
    for (const job of jobs) {
      const rows = deptRows.filter((e) => e.job_title === job)
      result.push({ dept_id: dept, job_title: job, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _level: 'detail' })
    }
    result.push({ dept_id: dept, job_title: null, total_sal: deptRows.reduce((s, r) => s + r.salary, 0), cnt: deptRows.length, _level: 'subtotal' })
  }
  result.push({ dept_id: null, job_title: null, total_sal: EMPS.reduce((s, r) => s + r.salary, 0), cnt: EMPS.length, _level: 'grand' })
  return result
}

// ── CUBE computation ───────────────────────────────────────────────────────

interface CubeRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _grouping: string
}

function computeCube(): CubeRow[] {
  const result: CubeRow[] = []
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const jobs  = [...new Set(EMPS.map((e) => e.job_title))].sort()

  // (dept, job) — detail
  for (const dept of depts) {
    for (const job of jobs) {
      const rows = EMPS.filter((e) => e.dept_id === dept && e.job_title === job)
      if (rows.length === 0) continue
      result.push({ dept_id: dept, job_title: job, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _grouping: 'dept+job' })
    }
  }
  // (dept, ALL) — subtotal by dept
  for (const dept of depts) {
    const rows = EMPS.filter((e) => e.dept_id === dept)
    result.push({ dept_id: dept, job_title: null, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _grouping: 'dept' })
  }
  // (ALL, job) — subtotal by job
  for (const job of jobs) {
    const rows = EMPS.filter((e) => e.job_title === job)
    result.push({ dept_id: null, job_title: job, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _grouping: 'job' })
  }
  // (ALL, ALL) — grand total
  result.push({ dept_id: null, job_title: null, total_sal: EMPS.reduce((s, r) => s + r.salary, 0), cnt: EMPS.length, _grouping: 'grand' })
  return result
}

// ── PIVOT computation ──────────────────────────────────────────────────────

interface PivotRow { dept_id: number; Engineer: number | null; Analyst: number | null; Support: number | null; Lead: number | null }

function computePivot(): PivotRow[] {
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const pivotJobs = ['Engineer', 'Analyst', 'Support', 'Lead'] as const
  return depts.map((dept) => {
    const row: PivotRow = { dept_id: dept, Engineer: null, Analyst: null, Support: null, Lead: null }
    for (const job of pivotJobs) {
      const rows = EMPS.filter((e) => e.dept_id === dept && e.job_title === job)
      row[job] = rows.length > 0 ? rows.reduce((s, r) => s + r.salary, 0) : null
    }
    return row
  })
}

// ── SQL strings ────────────────────────────────────────────────────────────

const ROLLUP_SQL = `SELECT dept_id, job_title,
       SUM(salary) AS total_sal,
       COUNT(*)    AS cnt
FROM   employees
GROUP BY ROLLUP(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const CUBE_SQL = `SELECT dept_id, job_title,
       SUM(salary) AS total_sal,
       COUNT(*)    AS cnt
FROM   employees
GROUP BY CUBE(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const PIVOT_SQL = `SELECT *
FROM (
  SELECT dept_id, job_title, salary
  FROM   employees
)
PIVOT (
  SUM(salary)
  FOR job_title IN (
    'Engineer' AS Engineer,
    'Analyst'  AS Analyst,
    'Support'  AS Support,
    'Lead'     AS Lead
  )
)
ORDER BY dept_id`

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: 'ROLLUP / CUBE / PIVOT',
    chapterSubtitle: 'GROUP BY를 확장해 소계·총계·교차 집계를 한 번에 구하는 Oracle 집계 구문입니다.',
    tabRollup: 'ROLLUP',
    tabCube:   'CUBE',
    tabPivot:  'PIVOT',

    rollupTitle: 'ROLLUP — 계층적 소계',
    rollupDesc:  'ROLLUP(A, B)는 (A, B) 상세 집계 → (A) 부서 소계 → () 전체 총계 순서로 행을 자동 추가합니다. 계층이 왼쪽에서 오른쪽으로 하나씩 제거되는 방식입니다.',
    rollupInfo:  'ROLLUP(dept_id, job_title)이 만드는 3가지 집계 수준: ① dept_id + job_title (상세) ② dept_id만 (부서 소계) ③ 전체 (총계)',

    cubeTitle: 'CUBE — 모든 조합의 소계',
    cubeDesc:  'CUBE(A, B)는 가능한 모든 컬럼 조합의 집계를 한꺼번에 만듭니다. (A, B) · (A) · (B) · () 네 가지 집계가 생깁니다. ROLLUP보다 더 많은 행이 생기고, BI 리포트처럼 행·열 모두 소계가 필요할 때 씁니다.',
    cubeInfo:  'CUBE(dept_id, job_title)이 만드는 4가지 집계: ① dept+job (상세) ② dept만 (부서별 합계) ③ job만 (직무별 합계) ④ 전체 총계',

    pivotTitle: 'PIVOT — 행을 열로 전환',
    pivotDesc:  'PIVOT은 특정 컬럼의 값을 열 헤더로 바꿔 가로 방향으로 펼칩니다. 예를 들어 job_title 값(Engineer, Analyst …)을 열로 변환하면 부서별로 직무별 급여 합계를 한 눈에 볼 수 있습니다.',
    pivotInfo:  'FOR job_title IN (...)에 나열한 값이 열 이름이 됩니다. 목록에 없는 값은 결과에서 제외됩니다.',

    nullMeaning: 'NULL = 해당 집계 수준에서 "모든 값"을 의미합니다',
    levelDetail:  '상세',
    levelSubtotal:'소계',
    levelGrand:   '총계',
    groupingLabel: (g: string) => {
      if (g === 'dept+job') return '상세 (dept+job)'
      if (g === 'dept')     return '부서 소계'
      if (g === 'job')      return '직무 소계'
      return '전체 총계'
    },
    noData: 'NULL',
  },
  en: {
    chapterTitle: 'ROLLUP / CUBE / PIVOT',
    chapterSubtitle: 'Oracle aggregation extensions that compute subtotals, grand totals, and cross-tabulations in a single query.',
    tabRollup: 'ROLLUP',
    tabCube:   'CUBE',
    tabPivot:  'PIVOT',

    rollupTitle: 'ROLLUP — Hierarchical subtotals',
    rollupDesc:  'ROLLUP(A, B) automatically adds rows for (A, B) detail → (A) subtotal → () grand total. Each level removes one column from the right.',
    rollupInfo:  'ROLLUP(dept_id, job_title) produces 3 aggregation levels: ① dept_id + job_title (detail) ② dept_id only (dept subtotal) ③ grand total',

    cubeTitle: 'CUBE — All combinations',
    cubeDesc:  'CUBE(A, B) generates aggregates for every possible column combination: (A, B) · (A) · (B) · (). More rows than ROLLUP, useful when you need subtotals in both row and column directions, like a BI report.',
    cubeInfo:  'CUBE(dept_id, job_title) produces 4 aggregation levels: ① dept+job (detail) ② dept only ③ job only ④ grand total',

    pivotTitle: 'PIVOT — Rows to columns',
    pivotDesc:  'PIVOT turns distinct values of a column into column headers. For example, turning job_title values (Engineer, Analyst …) into columns lets you see salary totals by dept and job side by side.',
    pivotInfo:  'Values listed in FOR job_title IN (...) become column names. Values not in the list are excluded from the result.',

    nullMeaning: 'NULL = "all values" at that aggregation level',
    levelDetail:   'Detail',
    levelSubtotal: 'Subtotal',
    levelGrand:    'Grand total',
    groupingLabel: (g: string) => {
      if (g === 'dept+job') return 'Detail (dept+job)'
      if (g === 'dept')     return 'Dept subtotal'
      if (g === 'job')      return 'Job subtotal'
      return 'Grand total'
    },
    noData: 'NULL',
  },
}

export { T as RollupT }

type TShape = typeof T['ko']

// ── Sub-components ─────────────────────────────────────────────────────────

function SqlBlock({ sql }: { sql: string }) {
  return (
    <div className="mb-5 rounded-xl border overflow-hidden">
      <div className="border-b px-4 py-2">
        <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL</span>
      </div>
      <div className="p-4">
        <SqlHighlight sql={sql} />
      </div>
    </div>
  )
}

function RollupTable({ t }: { t: TShape }) {
  const rows = computeRollup()
  const levelStyle: Record<string, string> = {
    detail:   '',
    subtotal: 'bg-blue-50',
    grand:    'bg-violet-50 font-semibold',
  }
  const levelBadge: Record<string, { cls: string; label: string }> = {
    detail:   { cls: 'bg-muted text-muted-foreground',   label: t.levelDetail   },
    subtotal: { cls: 'bg-blue-100 text-blue-700',        label: t.levelSubtotal },
    grand:    { cls: 'bg-violet-100 text-violet-700',    label: t.levelGrand    },
  }
  return (
    <div className="inline-block rounded-lg border overflow-hidden">
      <table className="text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {['dept_id', 'job_title', 'total_sal', 'cnt', ''].map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b last:border-0', levelStyle[row._level])}>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                {row.dept_id ?? <span className="text-muted-foreground/50 italic">NULL</span>}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                {row.job_title ?? <span className="text-muted-foreground/50 italic">NULL</span>}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.total_sal.toLocaleString()}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.cnt}</td>
              <td className="px-3 py-1.5">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', levelBadge[row._level].cls)}>
                  {levelBadge[row._level].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CubeTable({ t }: { t: TShape }) {
  const rows = computeCube()
  const groupStyle: Record<string, string> = {
    'dept+job': '',
    'dept':     'bg-blue-50',
    'job':      'bg-emerald-50',
    'grand':    'bg-violet-50',
  }
  const groupBadge: Record<string, string> = {
    'dept+job': 'bg-muted text-muted-foreground',
    'dept':     'bg-blue-100 text-blue-700',
    'job':      'bg-emerald-100 text-emerald-700',
    'grand':    'bg-violet-100 text-violet-700',
  }
  return (
    <div className="inline-block rounded-lg border overflow-hidden">
      <table className="text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {['dept_id', 'job_title', 'total_sal', 'cnt', ''].map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b last:border-0', groupStyle[row._grouping] ?? '')}>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                {row.dept_id ?? <span className="text-muted-foreground/50 italic">NULL</span>}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                {row.job_title ?? <span className="text-muted-foreground/50 italic">NULL</span>}
              </td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.total_sal.toLocaleString()}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.cnt}</td>
              <td className="px-3 py-1.5">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', groupBadge[row._grouping])}>
                  {t.groupingLabel(row._grouping)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PivotTable() {
  const rows = computePivot()
  const pivotCols = ['Engineer', 'Analyst', 'Support', 'Lead'] as const
  return (
    <div className="inline-block rounded-lg border overflow-hidden">
      <table className="text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            <th className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">dept_id</th>
            {pivotCols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap font-bold text-foreground/80">{row.dept_id}</td>
              {pivotCols.map((c) => (
                <td key={c} className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">
                  {row[c] != null ? row[c]!.toLocaleString() : <span className="text-muted-foreground/40 italic">NULL</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function RollupSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang] as TShape
  const [tab, setTab] = useState<Tab>('rollup')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'rollup', label: t.tabRollup },
    { id: 'cube',   label: t.tabCube   },
    { id: 'pivot',  label: t.tabPivot  },
  ]

  const tabColor: Record<Tab, string> = {
    rollup: 'border-blue-400 bg-blue-50 text-blue-700',
    cube:   'border-violet-400 bg-violet-50 text-violet-700',
    pivot:  'border-emerald-400 bg-emerald-50 text-emerald-700',
  }

  return (
    <PageContainer>
      <ChapterTitle icon="📊" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      {/* Tab bar */}
      <div className="mb-6 flex gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn(
              'rounded-md border px-4 py-1.5 font-mono text-[11px] font-bold transition-all',
              tab === tb.id ? tabColor[tb.id] + ' shadow-sm' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ROLLUP */}
      {tab === 'rollup' && (
        <>
          <SectionTitle>{t.rollupTitle}</SectionTitle>
          <Prose>{t.rollupDesc}</Prose>
          <InfoBox color="blue" icon="📐" title="">
            {t.rollupInfo}
          </InfoBox>
          <SqlBlock sql={ROLLUP_SQL} />
          <SubTitle>결과</SubTitle>
          <div className="mb-4">
            <RollupTable t={t} />
          </div>
          <InfoBox color="amber" icon="💡">
            {t.nullMeaning}
          </InfoBox>
        </>
      )}

      {/* CUBE */}
      {tab === 'cube' && (
        <>
          <SectionTitle>{t.cubeTitle}</SectionTitle>
          <Prose>{t.cubeDesc}</Prose>
          <InfoBox color="violet" icon="📐" title="">
            {t.cubeInfo}
          </InfoBox>

          <Divider />

          <SubTitle>ROLLUP vs CUBE</SubTitle>
          <div className="mb-5 rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/60">
                  {['', 'ROLLUP(dept, job)', 'CUBE(dept, job)'].map((h, i) => (
                    <th key={i} className="px-4 py-2 text-left font-mono font-bold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['dept + job 상세', '✅', '✅'],
                  ['dept 소계',       '✅', '✅'],
                  ['job 소계',        '❌', '✅'],
                  ['전체 총계',       '✅', '✅'],
                  ['생성 행 수',      `${computeRollup().length}행`, `${computeCube().length}행`],
                ].map((row, i) => (
                  <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 font-mono text-[11px] text-foreground/80">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SqlBlock sql={CUBE_SQL} />
          <SubTitle>결과</SubTitle>
          <div className="mb-4">
            <CubeTable t={t} />
          </div>
          <InfoBox color="amber" icon="💡">
            {t.nullMeaning}
          </InfoBox>
        </>
      )}

      {/* PIVOT */}
      {tab === 'pivot' && (
        <>
          <SectionTitle>{t.pivotTitle}</SectionTitle>
          <Prose>{t.pivotDesc}</Prose>
          <InfoBox color="emerald" icon="🔄" title="">
            {t.pivotInfo}
          </InfoBox>

          <Divider />

          <SubTitle>변환 전 — 원본 데이터 구조</SubTitle>
          <div className="mb-5 inline-block rounded-lg border overflow-hidden">
            <table className="text-xs">
              <thead>
                <tr className="border-b bg-muted/60">
                  {['dept_id', 'job_title', 'salary'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EMPS.map((e, i) => (
                  <tr key={i} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{e.dept_id}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{e.job_title}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{e.salary.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubTitle>변환 후 — PIVOT 결과 (행 → 열)</SubTitle>
          <SqlBlock sql={PIVOT_SQL} />
          <div className="mb-4">
            <PivotTable />
          </div>
          <InfoBox color="amber" icon="💡">
            {t.pivotInfo}
          </InfoBox>
        </>
      )}
    </PageContainer>
  )
}
