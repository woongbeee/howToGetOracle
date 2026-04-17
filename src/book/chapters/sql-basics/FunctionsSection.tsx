import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PageContainer, ChapterTitle } from '../shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

interface FuncItem {
  name: string
  signature: string
  desc: { ko: string; en: string }
  example: string
  result: string
}

interface FuncGroup {
  id: string
  icon: string
  title: { ko: string; en: string }
  color: 'blue' | 'orange' | 'violet'
  items: FuncItem[]
}

// ── Data ───────────────────────────────────────────────────────────────────

const FUNC_GROUPS: FuncGroup[] = [
  {
    id: 'aggregate',
    icon: '∑',
    title: { ko: '집계 함수', en: 'Aggregate Functions' },
    color: 'blue',
    items: [
      {
        name: 'COUNT',
        signature: 'COUNT(*) / COUNT(col)',
        desc: {
          ko: '행 수를 셉니다. COUNT(*)는 NULL 포함, COUNT(col)은 NULL을 제외합니다.',
          en: 'Counts rows. COUNT(*) includes NULLs; COUNT(col) excludes them.',
        },
        example: 'SELECT COUNT(*), COUNT(salary)\nFROM   employees',
        result: 'COUNT(*): 5  /  COUNT(salary): 4',
      },
      {
        name: 'SUM',
        signature: 'SUM(col)',
        desc: {
          ko: '숫자 컬럼의 합계를 반환합니다. NULL은 무시합니다.',
          en: 'Returns the sum of a numeric column, ignoring NULLs.',
        },
        example: 'SELECT SUM(salary)\nFROM   employees\nWHERE  dept_id = 10',
        result: 'SUM(salary): 14400',
      },
      {
        name: 'AVG',
        signature: 'AVG(col)',
        desc: {
          ko: '평균값을 반환합니다. NULL 행은 분모에서 제외됩니다.',
          en: 'Returns the average. NULL rows are excluded from the denominator.',
        },
        example: 'SELECT AVG(salary)\nFROM   employees',
        result: 'AVG(salary): 6200',
      },
      {
        name: 'MAX / MIN',
        signature: 'MAX(col) / MIN(col)',
        desc: {
          ko: '최댓값·최솟값을 반환합니다. 문자열·날짜에도 사용 가능합니다.',
          en: 'Returns the maximum or minimum. Works on strings and dates too.',
        },
        example: 'SELECT MAX(salary), MIN(salary)\nFROM   employees',
        result: 'MAX: 9000  /  MIN: 4200',
      },
    ],
  },
  {
    id: 'date',
    icon: '📅',
    title: { ko: '날짜 함수', en: 'Date Functions' },
    color: 'orange',
    items: [
      {
        name: 'SYSDATE',
        signature: 'SYSDATE',
        desc: {
          ko: 'DB 서버의 현재 날짜·시간을 반환합니다. 괄호 없이 사용합니다.',
          en: 'Returns the current date and time from the DB server. No parentheses needed.',
        },
        example: 'SELECT SYSDATE,\n       SYSDATE + 7  AS next_week,\n       SYSDATE - 1  AS yesterday\nFROM   dual',
        result: '2025-04-17  /  next_week: 2025-04-24  /  yesterday: 2025-04-16',
      },
      {
        name: 'MONTHS_BETWEEN',
        signature: 'MONTHS_BETWEEN(date1, date2)',
        desc: {
          ko: '두 날짜 사이의 개월 수를 소수점으로 반환합니다.',
          en: 'Returns the number of months between two dates as a decimal.',
        },
        example: "SELECT MONTHS_BETWEEN(\n         TO_DATE('2025-04-17','YYYY-MM-DD'),\n         TO_DATE('2024-10-17','YYYY-MM-DD')\n       ) AS months\nFROM   dual",
        result: 'months: 6',
      },
      {
        name: 'ADD_MONTHS',
        signature: 'ADD_MONTHS(date, n)',
        desc: {
          ko: '날짜에 n개월을 더합니다. 음수를 넣으면 n개월을 뺍니다.',
          en: 'Adds n months to a date. Use a negative n to subtract months.',
        },
        example: 'SELECT ADD_MONTHS(SYSDATE, 3)  AS q_later,\n       ADD_MONTHS(SYSDATE, -1) AS prev_month\nFROM   dual',
        result: 'q_later: 2025-07-17  /  prev_month: 2025-03-17',
      },
      {
        name: 'TO_DATE / TO_CHAR',
        signature: "TO_DATE(str,'fmt') / TO_CHAR(date,'fmt')",
        desc: {
          ko: "문자열 → 날짜(TO_DATE), 날짜 → 문자열(TO_CHAR) 변환. 형식 마스크 예: 'YYYY-MM-DD'.",
          en: "Converts string→date (TO_DATE) or date→string (TO_CHAR). Format mask e.g. 'YYYY-MM-DD'.",
        },
        example: "SELECT TO_CHAR(SYSDATE,'YYYY-MM-DD HH24:MI') AS now,\n       TO_DATE('2025-01-01','YYYY-MM-DD')     AS new_year\nFROM   dual",
        result: "now: '2025-04-17 09:30'  /  new_year: 2025-01-01",
      },
      {
        name: 'TRUNC (날짜)',
        signature: "TRUNC(date,'fmt')",
        desc: {
          ko: "날짜를 지정 단위로 잘라냅니다. 'MM'은 월 첫날, 'YYYY'는 연 첫날.",
          en: "Truncates a date to the specified unit. 'MM' = first of month, 'YYYY' = first of year.",
        },
        example: "SELECT TRUNC(SYSDATE,'MM')   AS month_start,\n       TRUNC(SYSDATE,'YYYY') AS year_start\nFROM   dual",
        result: 'month_start: 2025-04-01  /  year_start: 2025-01-01',
      },
    ],
  },
  {
    id: 'conditional',
    icon: '⎇',
    title: { ko: '조건 함수 — NVL / DECODE / CASE', en: 'Conditional — NVL / DECODE / CASE' },
    color: 'violet',
    items: [
      {
        name: 'NVL',
        signature: 'NVL(expr, replacement)',
        desc: {
          ko: 'expr이 NULL이면 replacement를 반환합니다. NULL을 기본값으로 대체할 때 사용합니다.',
          en: 'Returns replacement when expr is NULL. Used to substitute a default for NULLs.',
        },
        example: 'SELECT first_name,\n       NVL(manager_id, 0) AS mgr\nFROM   employees',
        result: 'Alice → mgr: 0  (manager_id가 NULL이었음)',
      },
      {
        name: 'NVL2',
        signature: 'NVL2(expr, not_null_val, null_val)',
        desc: {
          ko: 'expr이 NULL이 아니면 두 번째 인수, NULL이면 세 번째 인수를 반환합니다.',
          en: 'Returns the second argument if expr is not NULL, otherwise the third.',
        },
        example: "SELECT first_name,\n       NVL2(manager_id,'팀원','리더') AS role\nFROM   employees",
        result: "Alice → '리더'  /  Bob → '팀원'",
      },
      {
        name: 'DECODE',
        signature: 'DECODE(expr, s1,r1, s2,r2, ..., default)',
        desc: {
          ko: 'expr을 순서대로 비교해 일치하는 결과를 반환합니다. 일치 없으면 default를 반환합니다. CASE의 Oracle 전용 단축 표현입니다.',
          en: 'Compares expr sequentially; returns the matching result or default. Oracle-specific shorthand for CASE.',
        },
        example: "SELECT dept_id,\n       DECODE(dept_id,\n              10,'개발팀',\n              20,'분석팀',\n              '기타') AS dept_label\nFROM   employees",
        result: '10 → 개발팀  /  20 → 분석팀  /  30 → 기타',
      },
      {
        name: 'CASE WHEN',
        signature: 'CASE WHEN cond THEN val ... ELSE val END',
        desc: {
          ko: 'ANSI 표준 조건 표현식. 등치 비교뿐 아니라 범위·복합 조건도 표현할 수 있어 DECODE보다 유연합니다.',
          en: 'ANSI standard conditional. More flexible than DECODE — supports ranges and complex conditions.',
        },
        example: "SELECT first_name, salary,\n       CASE\n         WHEN salary >= 8000 THEN '고급'\n         WHEN salary >= 5000 THEN '중급'\n         ELSE '초급'\n       END AS grade\nFROM   employees",
        result: 'Alice(9000) → 고급  /  Bob(5400) → 중급  /  Eve(4200) → 초급',
      },
    ],
  },
]

const FUNC_STYLE = {
  blue:   { tab: 'bg-blue-50 border-blue-200 text-blue-800',   active: 'bg-blue-100 text-blue-700',   code: 'bg-blue-50/60 border-blue-100' },
  orange: { tab: 'bg-orange-50 border-orange-200 text-orange-800', active: 'bg-orange-100 text-orange-700', code: 'bg-orange-50/60 border-orange-100' },
  violet: { tab: 'bg-violet-50 border-violet-200 text-violet-800', active: 'bg-violet-100 text-violet-700', code: 'bg-violet-50/60 border-violet-100' },
}

// ── FunctionsSection ────────────────────────────────────────────────────────

export function FunctionsSection({ lang }: { lang: 'ko' | 'en' }) {
  const [openGroup, setOpenGroup] = useState<string>(FUNC_GROUPS[0].id)
  const [openItem,  setOpenItem]  = useState<string>(FUNC_GROUPS[0].items[0].name)

  const group = FUNC_GROUPS.find((g) => g.id === openGroup)!
  const s = FUNC_STYLE[group.color]

  return (
    <PageContainer>
      <ChapterTitle
        icon="📋"
        num={1}
        title={lang === 'ko' ? 'Oracle 주요 함수' : 'Oracle Key Functions'}
        subtitle={
          lang === 'ko'
            ? '실무에서 자주 쓰는 집계 함수, 날짜 함수, 조건 함수를 예시와 함께 학습합니다.'
            : 'Learn the most-used aggregate, date, and conditional functions with hands-on examples.'
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FUNC_GROUPS.map((g) => {
          const gs = FUNC_STYLE[g.color]
          const isActive = g.id === openGroup
          return (
            <button
              key={g.id}
              onClick={() => { setOpenGroup(g.id); setOpenItem(g.items[0].name) }}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-xs font-bold transition-all',
                isActive ? gs.tab : 'border-border bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              <span>{g.icon}</span>
              <span>{g.title[lang]}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-[180px_1fr] items-start gap-4">
        <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-2">
          {group.items.map((item) => (
            <button
              key={item.name}
              onClick={() => setOpenItem(item.name)}
              className={cn(
                'rounded-lg px-3 py-2 text-left font-mono text-xs font-bold transition-all',
                item.name === openItem ? s.active : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {group.items.filter((item) => item.name === openItem).map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <div className={cn('rounded-xl border px-4 py-3', s.tab)}>
                <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {group.title[lang]}
                </div>
                <div className="font-mono text-xl font-black">{item.name}</div>
                <div className={cn('mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[11px]', s.active)}>
                  {item.signature}
                </div>
              </div>

              <div className="rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {item.desc[lang]}
              </div>

              <div>
                <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {lang === 'ko' ? '예시 쿼리' : 'Example Query'}
                </p>
                <div className={cn('rounded-xl border px-4 py-3', s.code)}>
                  <SqlHighlight sql={item.example} />
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {lang === 'ko' ? '실행 결과' : 'Result'}
                </p>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 font-mono text-xs text-emerald-800">
                  ✓ {item.result}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}
