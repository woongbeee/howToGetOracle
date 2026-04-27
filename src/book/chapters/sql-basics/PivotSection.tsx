import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle, SubTitle, Prose, InfoBox, Divider,
} from '../shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'pivot' | 'unpivot'

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

// ── UNPIVOT computation ────────────────────────────────────────────────────

interface UnpivotRow { dept_id: number; job_title: string; total_sal: number }

function computeUnpivot(): UnpivotRow[] {
  const pivotRows = computePivot()
  const jobs = ['Engineer', 'Analyst', 'Support', 'Lead'] as const
  const result: UnpivotRow[] = []
  for (const row of pivotRows) {
    for (const job of jobs) {
      if (row[job] != null) {
        result.push({ dept_id: row.dept_id, job_title: job, total_sal: row[job]! })
      }
    }
  }
  return result.sort((a, b) => a.dept_id - b.dept_id || a.job_title.localeCompare(b.job_title))
}

// ── SQL strings ────────────────────────────────────────────────────────────

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

const UNPIVOT_SQL = `SELECT dept_id, job_title, total_sal
FROM (
  SELECT dept_id,
         SUM(CASE WHEN job_title = 'Engineer' THEN salary END) AS Engineer,
         SUM(CASE WHEN job_title = 'Analyst'  THEN salary END) AS Analyst,
         SUM(CASE WHEN job_title = 'Support'  THEN salary END) AS Support,
         SUM(CASE WHEN job_title = 'Lead'     THEN salary END) AS Lead
  FROM   employees
  GROUP BY dept_id
)
UNPIVOT (
  total_sal
  FOR job_title IN (
    Engineer AS 'Engineer',
    Analyst  AS 'Analyst',
    Support  AS 'Support',
    Lead     AS 'Lead'
  )
)
ORDER BY dept_id, job_title`

// ── T strings ─────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle:    'PIVOT / UNPIVOT',
    chapterSubtitle: '행을 열로, 열을 행으로 변환해 데이터를 교차 형태로 펼치거나 다시 정규화하는 Oracle 구문입니다.',
    tabPivot:   'PIVOT',
    tabUnpivot: 'UNPIVOT',

    pivotTitle: 'PIVOT — 행을 열로 전환',
    pivotDesc:  'PIVOT은 특정 컬럼의 값을 열 헤더로 바꿔 가로 방향으로 펼칩니다. 예를 들어 job_title 값(Engineer, Analyst …)을 열로 변환하면 부서별로 직무별 급여 합계를 한 눈에 볼 수 있습니다.',
    pivotInfo:  'FOR job_title IN (...)에 나열한 값이 열 이름이 됩니다. 목록에 없는 값은 결과에서 제외됩니다.',
    beforeTitle: '변환 전 — 원본 데이터 구조',
    afterTitle:  '변환 후 — PIVOT 결과 (행 → 열)',

    unpivotTitle: 'UNPIVOT — 열을 행으로 전환',
    unpivotDesc:  'UNPIVOT은 PIVOT의 반대입니다. 여러 열에 흩어진 값을 하나의 컬럼으로 세로로 쌓습니다. 가로로 넓게 퍼진 피벗 결과를 다시 정규화된 행 구조로 되돌릴 때 사용합니다.',
    unpivotInfo:  'UNPIVOT 절의 total_sal은 값이 담길 컬럼 이름, FOR job_title은 원래 열 이름이 들어갈 컬럼 이름, IN (...)에는 펼칠 열 목록을 나열합니다. NULL 값을 가진 열은 기본적으로 결과에서 제외됩니다.',
    unpivotBeforeTitle: '변환 전 — PIVOT 결과 (가로)',
    unpivotAfterTitle:  '변환 후 — UNPIVOT 결과 (세로)',
    unpivotNullTip: 'NULL 열은 기본으로 제외됩니다. INCLUDE NULLS 옵션을 추가하면 NULL인 행도 포함할 수 있습니다.',

    comparisonTitle: 'PIVOT vs UNPIVOT',
  },
  en: {
    chapterTitle:    'PIVOT / UNPIVOT',
    chapterSubtitle: 'Oracle syntax for rotating rows into columns (PIVOT) and columns back into rows (UNPIVOT).',
    tabPivot:   'PIVOT',
    tabUnpivot: 'UNPIVOT',

    pivotTitle: 'PIVOT — Rows to columns',
    pivotDesc:  'PIVOT turns distinct values of a column into column headers. For example, turning job_title values (Engineer, Analyst …) into columns lets you see salary totals by dept and job side by side.',
    pivotInfo:  'Values listed in FOR job_title IN (...) become column names. Values not in the list are excluded from the result.',
    beforeTitle: 'Before — source data structure',
    afterTitle:  'After — PIVOT result (rows → columns)',

    unpivotTitle: 'UNPIVOT — Columns to rows',
    unpivotDesc:  'UNPIVOT is the reverse of PIVOT. It folds multiple columns back into a single value column, stacking each as a separate row. Use it to normalize a wide pivoted result back into a row-oriented structure.',
    unpivotInfo:  'In the UNPIVOT clause: total_sal is the column that receives the values, FOR job_title names the column that stores the original column names, and IN (...) lists the columns to unfold. Columns containing NULL are excluded by default.',
    unpivotBeforeTitle: 'Before — PIVOT result (wide)',
    unpivotAfterTitle:  'After — UNPIVOT result (tall)',
    unpivotNullTip: 'NULL columns are excluded by default. Add INCLUDE NULLS to keep rows where the value is NULL.',

    comparisonTitle: 'PIVOT vs UNPIVOT',
  },
}

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

function UnpivotTable() {
  const rows = computeUnpivot()
  const DEPT_COLOR: Record<number, string> = { 10: 'bg-blue-50', 20: 'bg-violet-50', 30: 'bg-orange-50' }
  return (
    <div className="inline-block rounded-lg border overflow-hidden">
      <table className="text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {['dept_id', 'job_title', 'total_sal'].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b last:border-0', DEPT_COLOR[row.dept_id] ?? '')}>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap font-bold text-foreground/80">{row.dept_id}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.job_title}</td>
              <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.total_sal.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function PivotSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [tab, setTab] = useState<Tab>('pivot')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pivot',   label: t.tabPivot   },
    { id: 'unpivot', label: t.tabUnpivot },
  ]

  const tabColor: Record<Tab, string> = {
    pivot:   'border-emerald-400 bg-emerald-50 text-emerald-700',
    unpivot: 'border-rose-400 bg-rose-50 text-rose-700',
  }

  return (
    <PageContainer>
      <ChapterTitle icon="🔄" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

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

      {/* PIVOT */}
      {tab === 'pivot' && (
        <>
          <SectionTitle>{t.pivotTitle}</SectionTitle>
          <Prose>{t.pivotDesc}</Prose>
          <InfoBox color="emerald" icon="🔄" title="">
            {t.pivotInfo}
          </InfoBox>

          <Divider />

          <SubTitle>{t.beforeTitle}</SubTitle>
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

          <SubTitle>{t.afterTitle}</SubTitle>
          <SqlBlock sql={PIVOT_SQL} />
          <div className="mb-4">
            <PivotTable />
          </div>
          <InfoBox color="amber" icon="💡">
            {t.pivotInfo}
          </InfoBox>
        </>
      )}

      {/* UNPIVOT */}
      {tab === 'unpivot' && (
        <>
          <SectionTitle>{t.unpivotTitle}</SectionTitle>
          <Prose>{t.unpivotDesc}</Prose>
          <InfoBox color="rose" icon="↩️" title="">
            {t.unpivotInfo}
          </InfoBox>

          <Divider />

          <SubTitle>{t.unpivotBeforeTitle}</SubTitle>
          <div className="mb-5">
            <PivotTable />
          </div>

          <SubTitle>{t.unpivotAfterTitle}</SubTitle>
          <SqlBlock sql={UNPIVOT_SQL} />
          <div className="mb-4">
            <UnpivotTable />
          </div>

          <Divider />

          <SubTitle>{t.comparisonTitle}</SubTitle>
          <div className="mb-5 rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/60">
                  {['', 'PIVOT', 'UNPIVOT'].map((h, i) => (
                    <th key={i} className="px-4 py-2 text-left font-mono font-bold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(lang === 'ko' ? [
                  ['방향',      '행 → 열 (세로 → 가로)', '열 → 행 (가로 → 세로)'],
                  ['용도',      '요약·크로스탭 보고서',   '정규화·ELT 전처리'],
                  ['집계',      '필요 (SUM, AVG …)',     '불필요 (값을 그대로 세로로)'],
                  ['NULL 처리', '열 값이 없으면 NULL',    '기본 제외, INCLUDE NULLS로 포함'],
                ] : [
                  ['Direction',     'Rows → Columns (tall → wide)', 'Columns → Rows (wide → tall)'],
                  ['Use case',      'Summary / cross-tab reports',  'Normalization / ELT pre-processing'],
                  ['Aggregation',   'Required (SUM, AVG …)',        'Not needed (values kept as-is)'],
                  ['NULL handling', 'Missing combos become NULL',   'Excluded by default; use INCLUDE NULLS'],
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

          <InfoBox color="amber" icon="💡">
            {t.unpivotNullTip}
          </InfoBox>
        </>
      )}
    </PageContainer>
  )
}
