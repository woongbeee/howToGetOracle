import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle, SubTitle, Prose, InfoBox, Divider,
} from '../shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'rollup' | 'cube' | 'groupingsets' | 'grouping'

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
  for (const dept of depts) {
    for (const job of jobs) {
      const rows = EMPS.filter((e) => e.dept_id === dept && e.job_title === job)
      if (rows.length === 0) continue
      result.push({ dept_id: dept, job_title: job, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _grouping: 'dept+job' })
    }
  }
  for (const dept of depts) {
    const rows = EMPS.filter((e) => e.dept_id === dept)
    result.push({ dept_id: dept, job_title: null, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _grouping: 'dept' })
  }
  for (const job of jobs) {
    const rows = EMPS.filter((e) => e.job_title === job)
    result.push({ dept_id: null, job_title: job, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _grouping: 'job' })
  }
  result.push({ dept_id: null, job_title: null, total_sal: EMPS.reduce((s, r) => s + r.salary, 0), cnt: EMPS.length, _grouping: 'grand' })
  return result
}

// ── GROUPING SETS computation ──────────────────────────────────────────────

interface GroupingSetsRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  _set: string
}

function computeGroupingSets(): GroupingSetsRow[] {
  const result: GroupingSetsRow[] = []
  const depts = [...new Set(EMPS.map((e) => e.dept_id))].sort((a, b) => a - b)
  const jobs  = [...new Set(EMPS.map((e) => e.job_title))].sort()
  // (dept_id) 집계
  for (const dept of depts) {
    const rows = EMPS.filter((e) => e.dept_id === dept)
    result.push({ dept_id: dept, job_title: null, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _set: 'dept' })
  }
  // (job_title) 집계
  for (const job of jobs) {
    const rows = EMPS.filter((e) => e.job_title === job)
    result.push({ dept_id: null, job_title: job, total_sal: rows.reduce((s, r) => s + r.salary, 0), cnt: rows.length, _set: 'job' })
  }
  return result
}

// ── GROUPING() function computation ───────────────────────────────────────

interface GroupingFnRow {
  dept_id: number | null
  job_title: string | null
  total_sal: number
  cnt: number
  grp_dept: number   // GROUPING(dept_id)
  grp_job: number    // GROUPING(job_title)
  _level: 'detail' | 'subtotal' | 'grand'
}

function computeGroupingFn(): GroupingFnRow[] {
  const rollup = computeRollup()
  return rollup.map((r) => ({
    dept_id:   r.dept_id,
    job_title: r.job_title,
    total_sal: r.total_sal,
    cnt:       r.cnt,
    grp_dept:  r.dept_id   === null ? 1 : 0,
    grp_job:   r.job_title === null ? 1 : 0,
    _level:    r._level,
  }))
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

const GROUPING_SETS_SQL = `SELECT dept_id, job_title,
       SUM(salary) AS total_sal,
       COUNT(*)    AS cnt
FROM   employees
GROUP BY GROUPING SETS (
  (dept_id),
  (job_title)
)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const GROUPING_SETS_EQ_SQL = `-- GROUPING SETS는 여러 GROUP BY를 UNION ALL한 것과 같습니다
SELECT dept_id, NULL AS job_title, SUM(salary), COUNT(*) FROM employees GROUP BY dept_id
UNION ALL
SELECT NULL, job_title, SUM(salary), COUNT(*) FROM employees GROUP BY job_title`

const GROUPING_FN_SQL = `SELECT dept_id, job_title,
       SUM(salary)        AS total_sal,
       COUNT(*)           AS cnt,
       GROUPING(dept_id)  AS grp_dept,
       GROUPING(job_title) AS grp_job
FROM   employees
GROUP BY ROLLUP(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

const GROUPING_CASE_SQL = `SELECT
  CASE GROUPING(dept_id)
    WHEN 1 THEN '전체'
    ELSE TO_CHAR(dept_id)
  END AS dept_label,
  CASE GROUPING(job_title)
    WHEN 1 THEN '소계'
    ELSE job_title
  END AS job_label,
  SUM(salary) AS total_sal
FROM   employees
GROUP BY ROLLUP(dept_id, job_title)
ORDER BY dept_id NULLS LAST, job_title NULLS LAST`

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: 'ROLLUP / CUBE / GROUPING SETS / GROUPING',
    chapterSubtitle: 'GROUP BY를 확장해 소계·총계·교차 집계를 한 번에 구하는 Oracle 집계 구문입니다.',
    tabRollup:        'ROLLUP',
    tabCube:          'CUBE',
    tabGroupingSets:  'GROUPING SETS',
    tabGrouping:      'GROUPING()',

    rollupTitle: 'ROLLUP — 계층적 소계',
    rollupDesc:  'ROLLUP(A, B)는 (A, B) 상세 집계 → (A) 부서 소계 → () 전체 총계 순서로 행을 자동 추가합니다. 계층이 왼쪽에서 오른쪽으로 하나씩 제거되는 방식입니다.',
    rollupInfo:  'ROLLUP(dept_id, job_title)이 만드는 3가지 집계 수준: ① dept_id + job_title (상세) ② dept_id만 (부서 소계) ③ 전체 (총계)',

    cubeTitle: 'CUBE — 모든 조합의 소계',
    cubeDesc:  'CUBE(A, B)는 가능한 모든 컬럼 조합의 집계를 한꺼번에 만듭니다. (A, B) · (A) · (B) · () 네 가지 집계가 생깁니다. ROLLUP보다 더 많은 행이 생기고, BI 리포트처럼 행·열 모두 소계가 필요할 때 씁니다.',
    cubeInfo:  'CUBE(dept_id, job_title)이 만드는 4가지 집계: ① dept+job (상세) ② dept만 (부서별 합계) ③ job만 (직무별 합계) ④ 전체 총계',

    groupingSetsTitle: 'GROUPING SETS — 원하는 집계 조합만 선택',
    groupingSetsDesc:  'GROUPING SETS는 ROLLUP·CUBE처럼 자동 생성하는 대신, 원하는 집계 조합을 직접 나열합니다. 필요한 집계 수준만 골라 쓸 수 있어 불필요한 소계 행을 제거할 수 있습니다.',
    groupingSetsInfo:  'GROUPING SETS ((dept_id), (job_title))은 부서별 합계와 직무별 합계만 만듭니다. CUBE처럼 상세(dept+job)나 전체 총계는 생성하지 않습니다.',
    groupingSetsEqTitle: 'GROUPING SETS = 여러 GROUP BY의 UNION ALL',
    groupingSetsEqDesc:  'GROUPING SETS는 내부적으로 각 집합을 개별 GROUP BY로 실행한 뒤 결과를 UNION ALL로 합친 것과 동일합니다. 단, GROUPING SETS는 테이블을 한 번만 스캔하므로 성능이 더 좋습니다.',

    groupingTitle: 'GROUPING() — 소계 행 식별 함수',
    groupingDesc:  'ROLLUP·CUBE·GROUPING SETS로 생성된 소계/총계 행에서 NULL은 "집계 기준에서 제외된 컬럼"을 나타냅니다. 하지만 원본 데이터에도 NULL이 있을 수 있어, NULL만 보고는 소계 행인지 실제 NULL인지 구분할 수 없습니다. GROUPING() 함수는 이 문제를 해결합니다.',
    groupingInfo:  'GROUPING(col)은 해당 컬럼이 집계에서 제외된(소계/총계) 경우 1, 실제 그룹 기준으로 사용된 경우 0을 반환합니다.',
    groupingCaseTitle: 'CASE와 결합해 레이블 표시',
    groupingCaseDesc:  'GROUPING()을 CASE 식과 함께 쓰면 NULL 대신 "전체"·"소계" 같은 의미 있는 레이블로 바꿀 수 있습니다.',

    nullMeaning: 'NULL = 해당 집계 수준에서 "모든 값"을 의미합니다',
    levelDetail:   '상세',
    levelSubtotal: '소계',
    levelGrand:    '총계',
    setBadgeDept:  '부서별',
    setBadgeJob:   '직무별',
    groupingLabel: (g: string) => {
      if (g === 'dept+job') return '상세 (dept+job)'
      if (g === 'dept')     return '부서 소계'
      if (g === 'job')      return '직무 소계'
      return '전체 총계'
    },
    result: '결과',
    comparisonTitle: 'ROLLUP vs CUBE',
  },
  en: {
    chapterTitle: 'ROLLUP / CUBE / GROUPING SETS / GROUPING',
    chapterSubtitle: 'Oracle aggregation extensions that compute subtotals, grand totals, and cross-tabulations in a single query.',
    tabRollup:        'ROLLUP',
    tabCube:          'CUBE',
    tabGroupingSets:  'GROUPING SETS',
    tabGrouping:      'GROUPING()',

    rollupTitle: 'ROLLUP — Hierarchical subtotals',
    rollupDesc:  'ROLLUP(A, B) automatically adds rows for (A, B) detail → (A) subtotal → () grand total. Each level removes one column from the right.',
    rollupInfo:  'ROLLUP(dept_id, job_title) produces 3 aggregation levels: ① dept_id + job_title (detail) ② dept_id only (dept subtotal) ③ grand total',

    cubeTitle: 'CUBE — All combinations',
    cubeDesc:  'CUBE(A, B) generates aggregates for every possible column combination: (A, B) · (A) · (B) · (). More rows than ROLLUP, useful when you need subtotals in both row and column directions, like a BI report.',
    cubeInfo:  'CUBE(dept_id, job_title) produces 4 aggregation levels: ① dept+job (detail) ② dept only ③ job only ④ grand total',

    groupingSetsTitle: 'GROUPING SETS — Pick only the groupings you need',
    groupingSetsDesc:  'Instead of auto-generating all levels like ROLLUP or CUBE, GROUPING SETS lets you list exactly which grouping combinations you want. This eliminates unnecessary subtotal rows.',
    groupingSetsInfo:  'GROUPING SETS ((dept_id), (job_title)) produces only dept-level and job-level totals — no detail (dept+job) rows and no grand total.',
    groupingSetsEqTitle: 'GROUPING SETS = UNION ALL of GROUP BYs',
    groupingSetsEqDesc:  'GROUPING SETS is logically equivalent to running each grouping as a separate GROUP BY and combining with UNION ALL. However, GROUPING SETS scans the table only once, making it more efficient.',

    groupingTitle: 'GROUPING() — Identify subtotal rows',
    groupingDesc:  'In ROLLUP/CUBE/GROUPING SETS results, NULL means "all values at this aggregation level." But source data can also contain real NULLs, making it impossible to tell them apart. The GROUPING() function solves this.',
    groupingInfo:  'GROUPING(col) returns 1 when the column is excluded from the grouping (subtotal/grand total row), and 0 when it is an actual group key.',
    groupingCaseTitle: 'Combine with CASE for readable labels',
    groupingCaseDesc:  'Use GROUPING() inside a CASE expression to replace NULL with meaningful labels like "All" or "Subtotal."',

    nullMeaning: 'NULL = "all values" at that aggregation level',
    levelDetail:   'Detail',
    levelSubtotal: 'Subtotal',
    levelGrand:    'Grand total',
    setBadgeDept:  'By dept',
    setBadgeJob:   'By job',
    groupingLabel: (g: string) => {
      if (g === 'dept+job') return 'Detail (dept+job)'
      if (g === 'dept')     return 'Dept subtotal'
      if (g === 'job')      return 'Job subtotal'
      return 'Grand total'
    },
    result: 'Result',
    comparisonTitle: 'ROLLUP vs CUBE',
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

function NullCell() {
  return <span className="text-muted-foreground/50 italic">NULL</span>
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
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id ?? <NullCell />}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.job_title ?? <NullCell />}</td>
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
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id ?? <NullCell />}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.job_title ?? <NullCell />}</td>
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

function GroupingSetsTable({ t }: { t: TShape }) {
  const rows = computeGroupingSets()
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
            <tr key={i} className={cn('border-b last:border-0', row._set === 'dept' ? 'bg-blue-50' : 'bg-emerald-50')}>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id ?? <NullCell />}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.job_title ?? <NullCell />}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.total_sal.toLocaleString()}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.cnt}</td>
              <td className="px-3 py-1.5">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold',
                  row._set === 'dept' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  {row._set === 'dept' ? t.setBadgeDept : t.setBadgeJob}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupingFnTable() {
  const rows = computeGroupingFn()
  const levelStyle: Record<string, string> = {
    detail:   '',
    subtotal: 'bg-blue-50',
    grand:    'bg-violet-50',
  }
  return (
    <div className="inline-block rounded-lg border overflow-hidden">
      <table className="text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {['dept_id', 'job_title', 'total_sal', 'cnt', 'grp_dept', 'grp_job'].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b last:border-0', levelStyle[row._level])}>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id ?? <NullCell />}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.job_title ?? <NullCell />}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.total_sal.toLocaleString()}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.cnt}</td>
              <td className="px-3 py-1.5 text-center">
                <span className={cn('rounded px-1.5 py-0.5 font-mono text-[11px] font-bold',
                  row.grp_dept === 1 ? 'bg-rose-100 text-rose-700' : 'bg-muted text-muted-foreground'
                )}>{row.grp_dept}</span>
              </td>
              <td className="px-3 py-1.5 text-center">
                <span className={cn('rounded px-1.5 py-0.5 font-mono text-[11px] font-bold',
                  row.grp_job === 1 ? 'bg-rose-100 text-rose-700' : 'bg-muted text-muted-foreground'
                )}>{row.grp_job}</span>
              </td>
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
    { id: 'rollup',       label: t.tabRollup       },
    { id: 'cube',         label: t.tabCube         },
    { id: 'groupingsets', label: t.tabGroupingSets },
    { id: 'grouping',     label: t.tabGrouping     },
  ]

  const tabColor: Record<Tab, string> = {
    rollup:       'border-blue-400 bg-blue-50 text-blue-700',
    cube:         'border-violet-400 bg-violet-50 text-violet-700',
    groupingsets: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    grouping:     'border-rose-400 bg-rose-50 text-rose-700',
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
          <SubTitle>{t.result}</SubTitle>
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

          <SubTitle>{t.comparisonTitle}</SubTitle>
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
                {(lang === 'ko' ? [
                  ['dept + job 상세', '✅', '✅'],
                  ['dept 소계',       '✅', '✅'],
                  ['job 소계',        '❌', '✅'],
                  ['전체 총계',       '✅', '✅'],
                  ['생성 행 수',      `${computeRollup().length}행`, `${computeCube().length}행`],
                ] : [
                  ['dept + job detail', '✅', '✅'],
                  ['dept subtotal',     '✅', '✅'],
                  ['job subtotal',      '❌', '✅'],
                  ['grand total',       '✅', '✅'],
                  ['rows generated',    `${computeRollup().length} rows`, `${computeCube().length} rows`],
                ]).map((row, i) => (
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
          <SubTitle>{t.result}</SubTitle>
          <div className="mb-4">
            <CubeTable t={t} />
          </div>
          <InfoBox color="amber" icon="💡">
            {t.nullMeaning}
          </InfoBox>
        </>
      )}

      {/* GROUPING SETS */}
      {tab === 'groupingsets' && (
        <>
          <SectionTitle>{t.groupingSetsTitle}</SectionTitle>
          <Prose>{t.groupingSetsDesc}</Prose>
          <InfoBox color="emerald" icon="📐" title="">
            {t.groupingSetsInfo}
          </InfoBox>
          <SqlBlock sql={GROUPING_SETS_SQL} />
          <SubTitle>{t.result}</SubTitle>
          <div className="mb-4">
            <GroupingSetsTable t={t} />
          </div>

          <Divider />

          <SubTitle>{t.groupingSetsEqTitle}</SubTitle>
          <Prose>{t.groupingSetsEqDesc}</Prose>
          <SqlBlock sql={GROUPING_SETS_EQ_SQL} />

          <InfoBox color="amber" icon="💡">
            {t.nullMeaning}
          </InfoBox>
        </>
      )}

      {/* GROUPING() */}
      {tab === 'grouping' && (
        <>
          <SectionTitle>{t.groupingTitle}</SectionTitle>
          <Prose>{t.groupingDesc}</Prose>
          <InfoBox color="rose" icon="🔍" title="">
            {t.groupingInfo}
          </InfoBox>
          <SqlBlock sql={GROUPING_FN_SQL} />
          <SubTitle>{t.result}</SubTitle>
          <div className="mb-2">
            <GroupingFnTable />
          </div>
          <p className="mb-4 font-mono text-[11px] text-muted-foreground">
            {lang === 'ko'
              ? '빨간색 1 = 소계/총계 행 (해당 컬럼이 집계에서 제외됨), 0 = 실제 그룹 키'
              : 'Red 1 = subtotal/grand-total row (column excluded from grouping), 0 = actual group key'}
          </p>

          <Divider />

          <SubTitle>{t.groupingCaseTitle}</SubTitle>
          <Prose>{t.groupingCaseDesc}</Prose>
          <SqlBlock sql={GROUPING_CASE_SQL} />
        </>
      )}
    </PageContainer>
  )
}
