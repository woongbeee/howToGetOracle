import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PageContainer, ChapterTitle, Prose, Divider } from '../shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

interface FuncItem {
  name: string
  signature: string
  desc: { ko: string; en: string }
  example: string
  resultHeaders: string[]
  resultRows: (string | null)[][]
  note?: { ko: string; en: string }
}

// ── Sample data ─────────────────────────────────────────────────────────────

// [emp_id, first_name, dept_id, salary]
const EMP_ROWS = [
  ['101', 'Alice',  '10', '7200'],
  ['102', 'Bob',    '20', '5400'],
  ['103', 'Carol',  '10', '8100'],
  ['104', 'David',  '30', '4900'],
  ['105', 'Eva',    '20', '6300'],
  ['106', 'Frank',  '30', '3800'],
  ['107', 'Grace',  '10', '9500'],
  ['108', 'Henry',  '20', '5900'],
]

// ── Precomputed result rows ─────────────────────────────────────────────────

function rowNumberPartitioned(): (string | null)[][] {
  const byDept: Record<string, typeof EMP_ROWS> = {}
  for (const r of EMP_ROWS) { (byDept[r[2]] ??= []).push(r) }
  const result: (string | null)[][] = []
  for (const dept of ['10', '20', '30']) {
    byDept[dept].forEach((r, i) => result.push([r[1], r[2], r[3], String(i + 1)]))
  }
  return result
}

function rankRows(): (string | null)[][] {
  const sorted = [...EMP_ROWS].sort((a, b) => Number(b[3]) - Number(a[3]))
  let rank = 1
  return sorted.map((r, i) => {
    if (i > 0 && r[3] !== sorted[i - 1][3]) rank = i + 1
    return [r[1], r[2], r[3], String(rank)]
  })
}

function denseRankRows(): (string | null)[][] {
  const sorted = [...EMP_ROWS].sort((a, b) => Number(b[3]) - Number(a[3]))
  let rank = 1
  return sorted.map((r, i) => {
    if (i > 0 && r[3] !== sorted[i - 1][3]) rank++
    return [r[1], r[2], r[3], String(rank)]
  })
}

function lagRows(): (string | null)[][] {
  const sorted = [...EMP_ROWS].sort((a, b) => Number(a[0]) - Number(b[0]))
  return sorted.map((r, i) => {
    const prev = i > 0 ? sorted[i - 1][3] : null
    const diff = prev !== null ? String(Number(r[3]) - Number(prev)) : null
    return [r[1], r[3], prev, diff]
  })
}

function leadRows(): (string | null)[][] {
  const sorted = [...EMP_ROWS].sort((a, b) => Number(a[0]) - Number(b[0]))
  return sorted.map((r, i) => {
    const next = i < sorted.length - 1 ? sorted[i + 1][3] : null
    const diff = next !== null ? String(Number(next) - Number(r[3])) : null
    return [r[1], r[3], next, diff]
  })
}

function sumOverPartition(): (string | null)[][] {
  const deptTotals: Record<string, number> = {}
  for (const r of EMP_ROWS) deptTotals[r[2]] = (deptTotals[r[2]] ?? 0) + Number(r[3])
  return EMP_ROWS.map((r) => [r[1], r[2], r[3], String(deptTotals[r[2]])])
}

// ── Data ───────────────────────────────────────────────────────────────────

const FUNC_ITEMS: FuncItem[] = [
  {
    name: 'ROW_NUMBER',
    signature: 'ROW_NUMBER() OVER ([PARTITION BY …] ORDER BY …)',
    desc: {
      ko: '각 행에 고유한 순번을 부여합니다. 동일한 값이 있어도 순번이 중복되지 않습니다. PARTITION BY를 추가하면 그룹 내에서 순번을 다시 시작합니다.',
      en: 'Assigns a unique sequential number to each row. Even with duplicate values, no two rows share the same number. Adding PARTITION BY restarts numbering within each group.',
    },
    example:
      'SELECT first_name, dept_id, salary,\n       ROW_NUMBER() OVER\n         (PARTITION BY dept_id\n          ORDER BY salary DESC) AS rn\nFROM   employees',
    resultHeaders: ['first_name', 'dept_id', 'salary', 'rn'],
    resultRows: rowNumberPartitioned(),
    note: {
      ko: 'ROW_NUMBER는 순번에 중복이 없으므로, 각 부서에서 급여가 가장 높은 1명만 뽑을 때 WHERE rn = 1 조건으로 사용합니다.',
      en: 'Because ROW_NUMBER has no ties, WHERE rn = 1 reliably selects exactly one top-salary employee per department.',
    },
  },
  {
    name: 'RANK',
    signature: 'RANK() OVER ([PARTITION BY …] ORDER BY …)',
    desc: {
      ko: '동일한 값에 같은 순위를 부여하고, 다음 순위는 동순위 행 수만큼 건너뜁니다. 예를 들어 2위가 2명이면 다음 순위는 4위가 됩니다.',
      en: 'Assigns the same rank to equal values, then skips the next rank(s) by the number of tied rows. For example, if two rows share rank 2, the next rank is 4.',
    },
    example:
      'SELECT first_name, dept_id, salary,\n       RANK() OVER\n         (ORDER BY salary DESC) AS rnk\nFROM   employees',
    resultHeaders: ['first_name', 'dept_id', 'salary', 'rnk'],
    resultRows: rankRows(),
    note: {
      ko: '동순위 처리가 필요하지만 순위 번호에 공백이 생겨도 괜찮을 때 사용합니다. 공백 없이 연속된 순위가 필요하면 DENSE_RANK를 사용하세요.',
      en: 'Use when ties are valid but gaps in rank numbers are acceptable. Use DENSE_RANK if you need consecutive rank numbers without gaps.',
    },
  },
  {
    name: 'DENSE_RANK',
    signature: 'DENSE_RANK() OVER ([PARTITION BY …] ORDER BY …)',
    desc: {
      ko: '동일한 값에 같은 순위를 부여하되, 다음 순위를 건너뛰지 않습니다. 예를 들어 2위가 2명이면 다음 순위는 3위가 됩니다.',
      en: 'Assigns the same rank to equal values, but the next rank is consecutive (no gap). For example, if two rows share rank 2, the next rank is 3.',
    },
    example:
      'SELECT first_name, dept_id, salary,\n       DENSE_RANK() OVER\n         (ORDER BY salary DESC) AS drnk\nFROM   employees',
    resultHeaders: ['first_name', 'dept_id', 'salary', 'drnk'],
    resultRows: denseRankRows(),
    note: {
      ko: 'RANK와 달리 순위 번호가 연속적입니다. 등급이나 레벨을 부여할 때 공백 없는 연속 순위가 필요하면 DENSE_RANK를 선택하세요.',
      en: 'Unlike RANK, the rank numbers are always consecutive. Choose DENSE_RANK when you need gapless ranks, such as for grades or tiers.',
    },
  },
  {
    name: 'LAG',
    signature: 'LAG(col [, offset [, default]]) OVER (ORDER BY …)',
    desc: {
      ko: '현재 행에서 offset만큼 이전 행의 값을 반환합니다. offset 기본값은 1, default는 NULL입니다. 이전 행이 없으면 default 값을 반환합니다.',
      en: 'Returns the value from the row offset rows before the current row. Default offset is 1; default value is NULL. Returns the default if no prior row exists.',
    },
    example:
      'SELECT first_name, salary,\n       LAG(salary) OVER\n         (ORDER BY emp_id) AS prev_sal,\n       salary - LAG(salary) OVER\n         (ORDER BY emp_id) AS diff\nFROM   employees',
    resultHeaders: ['first_name', 'salary', 'prev_sal', 'diff'],
    resultRows: lagRows(),
    note: {
      ko: '연속된 행 간의 변화량(증감)을 계산하거나, 이전 달과 이번 달 데이터를 비교할 때 활용합니다.',
      en: 'Useful for calculating changes between consecutive rows or comparing current and previous period values.',
    },
  },
  {
    name: 'LEAD',
    signature: 'LEAD(col [, offset [, default]]) OVER (ORDER BY …)',
    desc: {
      ko: '현재 행에서 offset만큼 다음 행의 값을 반환합니다. LAG와 반대 방향입니다. 다음 행이 없으면 default 값을 반환합니다.',
      en: 'Returns the value from the row offset rows after the current row — the opposite direction of LAG. Returns the default if no following row exists.',
    },
    example:
      'SELECT first_name, salary,\n       LEAD(salary) OVER\n         (ORDER BY emp_id) AS next_sal,\n       LEAD(salary) OVER\n         (ORDER BY emp_id) - salary AS diff\nFROM   employees',
    resultHeaders: ['first_name', 'salary', 'next_sal', 'diff'],
    resultRows: leadRows(),
    note: {
      ko: '다음 행의 데이터를 현재 행과 함께 비교하는 데 활용합니다. 예를 들어, 다음 분기 목표와 현재 실적을 한 행에서 비교할 때 유용합니다.',
      en: 'Use to compare next-row data alongside the current row — for example, viewing current performance alongside next-quarter targets in a single row.',
    },
  },
  {
    name: 'SUM OVER',
    signature: 'SUM(col) OVER ([PARTITION BY …] [ORDER BY …])',
    desc: {
      ko: '집계 함수(SUM, AVG, COUNT 등)를 윈도우 함수로 사용합니다. GROUP BY와 달리 원본 행을 유지하면서 집계 결과를 각 행에 붙여 반환합니다. PARTITION BY로 그룹을 나눌 수 있습니다.',
      en: 'Uses aggregate functions (SUM, AVG, COUNT, etc.) as window functions. Unlike GROUP BY, the original rows are preserved and the aggregate result is attached to each row. PARTITION BY divides rows into groups.',
    },
    example:
      'SELECT first_name, dept_id, salary,\n       SUM(salary) OVER\n         (PARTITION BY dept_id) AS dept_total\nFROM   employees',
    resultHeaders: ['first_name', 'dept_id', 'salary', 'dept_total'],
    resultRows: sumOverPartition(),
    note: {
      ko: 'ORDER BY를 추가하면 누적 합계(running total)를 계산합니다. SUM(salary) OVER (ORDER BY emp_id)는 emp_id 순서로 salary를 누적합산합니다.',
      en: 'Adding ORDER BY computes a running total. SUM(salary) OVER (ORDER BY emp_id) accumulates salary in emp_id order.',
    },
  },
]

const ITEM_COLOR: Record<string, { bg: string; border: string; text: string; active: string; code: string }> = {
  'ROW_NUMBER': { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   active: 'bg-blue-100 text-blue-700',    code: 'bg-blue-50 border-blue-100'    },
  'RANK':       { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', active: 'bg-violet-100 text-violet-700', code: 'bg-violet-50 border-violet-100' },
  'DENSE_RANK': { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',active: 'bg-emerald-100 text-emerald-700',code:'bg-emerald-50 border-emerald-100'},
  'LAG':        { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', active: 'bg-orange-100 text-orange-700', code: 'bg-orange-50 border-orange-100' },
  'LEAD':       { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-800',   active: 'bg-rose-100 text-rose-700',    code: 'bg-rose-50 border-rose-100'    },
  'SUM OVER':   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  active: 'bg-amber-100 text-amber-700',   code: 'bg-amber-50 border-amber-100'  },
}

// ── ResultTable ──────────────────────────────────────────────────────────────

function ResultTable({ headers, rows }: { headers: string[]; rows: (string | null)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/60">
            {headers.map((h, i) => (
              <th
                key={h}
                className={cn(
                  'px-2.5 py-1.5 text-left font-mono text-[10px] font-bold whitespace-nowrap',
                  i === headers.length - 1 ? 'text-emerald-700' : 'text-muted-foreground',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b last:border-0">
              {row.map((cell, ci) => {
                const isNull = cell === null
                const isLast = ci === row.length - 1
                return (
                  <td
                    key={ci}
                    className={cn(
                      'px-2.5 py-1 font-mono text-[11px] whitespace-nowrap',
                      isNull ? 'italic text-muted-foreground/40' :
                      isLast ? 'font-bold text-emerald-700'      :
                               'text-foreground/80',
                    )}
                  >
                    {isNull ? 'NULL' : cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const T = {
  ko: {
    chapterTitle: '윈도우 함수',
    chapterSubtitle: '행을 그룹화하지 않고도 집계·순위·이동 참조가 가능한 윈도우 함수(OVER 절)를 알아봅니다.',
    categoryLabel: '윈도우 함수',
    exampleQuery: '예시 쿼리',
    result: '실행 결과',
    syntaxTitle: '기본 구문',
    syntaxDesc: '윈도우 함수는 OVER 절을 사용합니다. PARTITION BY로 그룹을 나누고, ORDER BY로 그룹 내 정렬 기준을 정합니다. GROUP BY와 달리 원본 행이 그대로 유지됩니다.',
    syntaxBoxLabel: '윈도우 함수 구문',
  },
  en: {
    chapterTitle: '윈도우 함수',
    chapterSubtitle: 'Learn window functions (the OVER clause) — they enable aggregation, ranking, and row-offset lookups without collapsing rows.',
    categoryLabel: 'Window Functions',
    exampleQuery: 'Example Query',
    result: 'Result',
    syntaxTitle: 'Basic Syntax',
    syntaxDesc: 'Window functions use the OVER clause. PARTITION BY divides rows into groups; ORDER BY defines the sort order within each group. Unlike GROUP BY, the original rows are preserved.',
    syntaxBoxLabel: 'Window Function Syntax',
  },
}

const SYNTAX_SQL =
  'func() OVER (\n  [PARTITION BY col]\n  [ORDER BY col [ASC|DESC]]\n)'

// ── WindowFuncSection ────────────────────────────────────────────────────────

export function WindowFuncSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [openItem, setOpenItem] = useState<string>(FUNC_ITEMS[0].name)
  const item = FUNC_ITEMS.find((f) => f.name === openItem)!
  const s = ITEM_COLOR[item.name]

  return (
    <PageContainer>
      <ChapterTitle
        icon="📋"
        num={1}
        title={t.chapterTitle}
        subtitle={t.chapterSubtitle}
      />

      {/* 기본 구문 설명 */}
      <div className="mb-2 flex flex-col gap-3 rounded-xl border bg-muted/30 px-5 py-4">
        <div>
          <p className="mb-1 font-mono text-xs font-bold text-foreground/70">{t.syntaxTitle}</p>
          <Prose>{t.syntaxDesc}</Prose>
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t.syntaxBoxLabel}
          </p>
          <div className="rounded-lg border bg-white px-4 py-3">
            <SqlHighlight sql={SYNTAX_SQL} />
          </div>
        </div>
      </div>

      <Divider />

      <div className="grid grid-cols-[160px_1fr] items-start gap-4">
        {/* LEFT: 함수 목록 */}
        <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-2">
          {FUNC_ITEMS.map((f) => {
            const fc = ITEM_COLOR[f.name]
            const isActive = f.name === openItem
            return (
              <button
                key={f.name}
                onClick={() => setOpenItem(f.name)}
                className={cn(
                  'rounded-lg px-3 py-2 text-left font-mono text-xs font-bold transition-all',
                  isActive ? fc.active : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {f.name}
              </button>
            )
          })}
        </div>

        {/* RIGHT: 상세 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-4"
          >
            {/* 헤더 */}
            <div className={cn('rounded-xl border px-4 py-3', s.bg, s.border, s.text)}>
              <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider opacity-60">
                {t.categoryLabel}
              </div>
              <div className="font-mono text-xl font-black">{item.name}</div>
              <div className={cn('mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[11px]', s.active)}>
                {item.signature}
              </div>
            </div>

            {/* 설명 */}
            <div className="rounded-xl border bg-card px-4 py-3">
              <Prose>{item.desc[lang]}</Prose>
            </div>

            {/* 예시 쿼리 */}
            <div>
              <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.exampleQuery}
              </p>
              <div className={cn('rounded-xl border px-4 py-3', s.code)}>
                <SqlHighlight sql={item.example} />
              </div>
            </div>

            {/* 실행 결과 */}
            <div>
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.result}
              </p>
              <ResultTable headers={item.resultHeaders} rows={item.resultRows} />
            </div>

            {/* 참고 */}
            {item.note && (
              <>
                <Divider />
                <div className={cn('rounded-xl border px-4 py-3 text-xs leading-relaxed', s.bg, s.border, s.text)}>
                  <span className="mr-1.5 font-bold">💡</span>{item.note[lang]}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}

export { T as WindowFuncT }
