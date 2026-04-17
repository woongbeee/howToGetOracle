import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle,
  Prose, InfoBox,
} from '../shared'
import { EMPLOYEES } from './shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

interface Dept {
  dept_id: number
  dept_name: string
  location: string
}

interface JoinRow {
  emp_id:    number | null
  first_name: string | null
  dept_id:   number | null
  dept_name: string | null
  location:  string | null
  _side: 'both' | 'left' | 'right'
}

type JoinType = 'inner' | 'left' | 'right' | 'full' | 'cross'

interface JoinAnimRow extends JoinRow {
  empIdx:  number | null
  deptIdx: number | null
}

// ── Data ───────────────────────────────────────────────────────────────────

const DEPARTMENTS: Dept[] = [
  { dept_id: 10, dept_name: 'Engineering', location: 'Seoul'   },
  { dept_id: 20, dept_name: 'Analytics',   location: 'Busan'   },
  { dept_id: 30, dept_name: 'Support',     location: 'Incheon' },
  { dept_id: 40, dept_name: 'Marketing',   location: 'Daegu'   },
]

const JOIN_SQL: Record<JoinType, string> = {
  inner: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nINNER JOIN departments d\n  ON e.dept_id = d.dept_id',
  left:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nLEFT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  right: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nRIGHT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  full:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nFULL OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  cross: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nCROSS JOIN departments d',
}

const JOIN_COLOR: Record<JoinType, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  inner: { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400'   },
  left:  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  right: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  full:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'  },
  cross: { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700',   dot: 'bg-rose-400'   },
}

// ── Translation ────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: 'SQL 기본 문법',
    joinSectionTitle: 'JOIN — 테이블 결합',
    joinSectionSubtitle: '두 개 이상의 테이블을 연결 조건으로 결합하는 JOIN의 종류와 동작 방식을 시뮬레이션으로 학습합니다.',
    joinIntro: 'JOIN은 서로 다른 테이블의 행을 결합 조건(ON 절)에 따라 연결합니다. 결합 방식에 따라 INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER, CROSS JOIN으로 나뉩니다.',
    joinTypes: [
      { key: 'inner',       icon: '⟕',  color: 'blue',    title: 'INNER JOIN',        desc: '양쪽 테이블 모두에 일치하는 행만 반환합니다. 가장 일반적인 JOIN입니다.' },
      { key: 'left',        icon: '⟕',  color: 'violet',  title: 'LEFT OUTER JOIN',   desc: '왼쪽 테이블의 모든 행 + 오른쪽에서 일치하는 행. 오른쪽에 없으면 NULL.' },
      { key: 'right',       icon: '⟖',  color: 'orange',  title: 'RIGHT OUTER JOIN',  desc: '오른쪽 테이블의 모든 행 + 왼쪽에서 일치하는 행. 왼쪽에 없으면 NULL.' },
      { key: 'full',        icon: '⟗',  color: 'amber',   title: 'FULL OUTER JOIN',   desc: '양쪽 테이블의 모든 행. 일치하지 않는 쪽은 NULL로 채웁니다.' },
      { key: 'cross',       icon: '×',   color: 'rose',    title: 'CROSS JOIN',        desc: '모든 행의 조합(카테시안 곱)을 반환합니다. ON 절이 없습니다.' },
    ],
    joinRowCount: (n: number) => `${n}개 행 반환`,
    oracleTip: 'Oracle에서는 ANSI JOIN 외에 (+) 표기법으로 OUTER JOIN을 표현할 수 있습니다. WHERE e.dept_id = d.dept_id(+) 는 LEFT OUTER JOIN과 동일합니다. 신규 코드에서는 ANSI 표준 JOIN을 권장합니다.',
    oracleTipTitle: 'Oracle (+) 구문',
  },
  en: {
    chapterTitle: 'SQL Basics',
    joinSectionTitle: 'JOIN — Combining Tables',
    joinSectionSubtitle: 'Learn how JOIN connects rows from multiple tables using a join condition, with live simulations for each type.',
    joinIntro: 'JOIN connects rows from different tables based on a condition in the ON clause. The join type determines which rows are included in the result.',
    joinTypes: [
      { key: 'inner',       icon: '⟕',  color: 'blue',    title: 'INNER JOIN',        desc: 'Returns only rows with matching values in both tables. The most common join type.' },
      { key: 'left',        icon: '⟕',  color: 'violet',  title: 'LEFT OUTER JOIN',   desc: 'All rows from the left table, plus matching rows from the right. Non-matching right rows become NULL.' },
      { key: 'right',       icon: '⟖',  color: 'orange',  title: 'RIGHT OUTER JOIN',  desc: 'All rows from the right table, plus matching rows from the left. Non-matching left rows become NULL.' },
      { key: 'full',        icon: '⟗',  color: 'amber',   title: 'FULL OUTER JOIN',   desc: 'All rows from both tables. Non-matching rows on either side are filled with NULL.' },
      { key: 'cross',       icon: '×',   color: 'rose',    title: 'CROSS JOIN',        desc: 'Returns every combination of rows (Cartesian product). No ON clause.' },
    ],
    joinRowCount: (n: number) => `${n} row${n === 1 ? '' : 's'} returned`,
    oracleTip: 'Oracle also supports the (+) notation for OUTER JOINs in addition to ANSI syntax. WHERE e.dept_id = d.dept_id(+) is equivalent to a LEFT OUTER JOIN. ANSI standard JOIN syntax is recommended for new code.',
    oracleTipTitle: 'Oracle (+) Syntax',
  },
}

// ── JoinVenn ────────────────────────────────────────────────────────────────

function JoinVenn({ type }: { type: JoinType }) {
  const showLeft  = type === 'left'  || type === 'full'
  const showRight = type === 'right' || type === 'full'
  const showMid   = type !== 'cross'
  const isCross   = type === 'cross'
  return (
    <svg viewBox="0 0 100 52" className="w-20 h-10 shrink-0">
      <circle cx="35" cy="26" r="20" fill={showLeft  ? '#818cf830' : 'none'} stroke="#818cf8" strokeWidth="1.5" />
      <circle cx="65" cy="26" r="20" fill={showRight ? '#fb923c30' : 'none'} stroke="#fb923c" strokeWidth="1.5" />
      {showMid && !isCross && (
        <>
          <clipPath id={`v-${type}`}><circle cx="35" cy="26" r="20" /></clipPath>
          <circle cx="65" cy="26" r="20" fill="#6ee7b750" stroke="none" clipPath={`url(#v-${type})`} />
        </>
      )}
      {isCross && (
        <text x="50" y="30" fontSize="9" fill="#f43f5e" fontWeight="bold" textAnchor="middle">×</text>
      )}
      <text x="26" y="29" fontSize="6" fill="#6d28d9" fontWeight="bold" textAnchor="middle">EMP</text>
      <text x="74" y="29" fontSize="6" fill="#c2410c" fontWeight="bold" textAnchor="middle">DEPT</text>
    </svg>
  )
}

// ── buildAnimRows ───────────────────────────────────────────────────────────

function buildAnimRows(type: JoinType): JoinAnimRow[] {
  if (type === 'cross') {
    const rows: JoinAnimRow[] = []
    EMPLOYEES.forEach((e, ei) => {
      DEPARTMENTS.forEach((d, di) => {
        rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di })
      })
    })
    return rows
  }
  if (type === 'right') {
    const rows: JoinAnimRow[] = []
    DEPARTMENTS.forEach((d, di) => {
      const emps = EMPLOYEES.map((e, i) => ({ e, i })).filter(({ e }) => e.dept_id === d.dept_id)
      if (emps.length > 0) {
        emps.forEach(({ e, i: ei }) => rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di }))
      } else {
        rows.push({ emp_id: null, first_name: null, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'right', empIdx: null, deptIdx: di })
      }
    })
    return rows
  }
  const rows: JoinAnimRow[] = []
  const matchedDi = new Set<number>()
  EMPLOYEES.forEach((e, ei) => {
    const di = DEPARTMENTS.findIndex((d) => d.dept_id === e.dept_id)
    if (di !== -1) {
      matchedDi.add(di)
      const d = DEPARTMENTS[di]
      rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di })
    } else if (type === 'left' || type === 'full') {
      rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: e.dept_id, dept_name: null, location: null, _side: 'left', empIdx: ei, deptIdx: null })
    }
  })
  if (type === 'full') {
    DEPARTMENTS.forEach((d, di) => {
      if (!matchedDi.has(di)) {
        rows.push({ emp_id: null, first_name: null, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'right', empIdx: null, deptIdx: di })
      }
    })
  }
  return rows
}

// ── JoinAnimator ────────────────────────────────────────────────────────────

function JoinAnimator({ type, lang, joinRowCount }: { type: JoinType; lang: 'ko' | 'en'; joinRowCount: (n: number) => string }) {
  const animRows   = buildAnimRows(type)
  const c          = JOIN_COLOR[type]
  const isCross    = type === 'cross'

  const [visibleCount, setVisibleCount] = useState(0)
  const [playing, setPlaying]           = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const t = setTimeout(() => { setVisibleCount(0); setPlaying(false) }, 0)
    return () => clearTimeout(t)
  }, [type])

  function startPlay() {
    if (playing) return
    setVisibleCount(0)
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    if (visibleCount >= animRows.length) {
      const t = setTimeout(() => setPlaying(false), 0)
      return () => clearTimeout(t)
    }
    const delay = isCross ? 200 : 700
    timerRef.current = setTimeout(() => setVisibleCount((v) => v + 1), delay)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, visibleCount, animRows.length, isCross])

  const currentRow = playing && visibleCount < animRows.length ? animRows[visibleCount] : null
  const activeEmpIdx  = currentRow?.empIdx  ?? null
  const activeDeptIdx = currentRow?.deptIdx ?? null

  const doneEmpIdxs  = new Set(animRows.slice(0, visibleCount).map((r) => r.empIdx).filter((x): x is number => x !== null))
  const doneDeptIdxs = new Set(animRows.slice(0, visibleCount).map((r) => r.deptIdx).filter((x): x is number => x !== null))

  const ROW_COL: Record<JoinAnimRow['_side'], string> = {
    both:  'bg-emerald-50 border-emerald-200',
    left:  'bg-violet-50 border-violet-200',
    right: 'bg-orange-50 border-orange-200',
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-muted/60 px-3 py-2.5">
        <SqlHighlight sql={JOIN_SQL[type]} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={startPlay}
          disabled={playing}
          className={cn(
            'rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
              : `${c.border} ${c.bg} ${c.text} hover:brightness-95`,
          )}
        >
          {playing ? (lang === 'ko' ? '▶ 실행 중...' : '▶ Running...') : (lang === 'ko' ? '▶ 조인 시작' : '▶ Start Join')}
        </button>

        <button
          onClick={() => { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount((v) => Math.max(0, v - 1)) }}
          disabled={playing || visibleCount === 0}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          ← {lang === 'ko' ? '이전' : 'Prev'}
        </button>
        <button
          onClick={() => { setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); setVisibleCount((v) => Math.min(animRows.length, v + 1)) }}
          disabled={playing || visibleCount >= animRows.length}
          className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          {lang === 'ko' ? '다음' : 'Next'} →
        </button>

        <span className="font-mono text-[11px] text-muted-foreground">
          {lang === 'ko' ? `총 ${animRows.length} 단계` : `${animRows.length} steps total`}
        </span>

        {visibleCount > 0 && !playing && (
          <button
            onClick={() => setVisibleCount(0)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            {lang === 'ko' ? '초기화' : 'Reset'}
          </button>
        )}
        {visibleCount > 0 && (
          <span className={cn('ml-auto font-mono text-[11px]', c.text)}>
            {joinRowCount(visibleCount)}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* LEFT: EMPLOYEES */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-violet-600">EMPLOYEES</p>
          <div className="overflow-hidden rounded-lg border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/60">
                  {(['emp_id', 'first_name', 'dept_id'] as const).map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-mono text-[9px] font-bold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map((e, ei) => {
                  const isActive = activeEmpIdx === ei
                  const isDone   = doneEmpIdxs.has(ei) && !isActive
                  return (
                    <motion.tr
                      key={e.emp_id}
                      animate={
                        isActive ? { backgroundColor: '#fef08a', scale: 1.02 }
                        : isDone  ? { backgroundColor: '#f0fdf4', scale: 1 }
                        :           { backgroundColor: '#ffffff', scale: 1 }
                      }
                      transition={{ duration: 0.2 }}
                      className="border-b last:border-0"
                    >
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{e.emp_id}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{e.first_name}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px] font-bold', isActive ? 'text-yellow-900' : 'text-violet-700')}>{e.dept_id}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTER: arrow + venn */}
        <div className="flex flex-col items-center justify-center gap-1 pt-6">
          <JoinVenn type={type} />
          <div className="flex flex-col items-center gap-0.5">
            <motion.div
              animate={playing ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
              transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
              className={cn('font-mono text-base font-bold', c.text)}
            >
              →
            </motion.div>
            <span className="font-mono text-[9px] text-muted-foreground">ON dept_id</span>
          </div>
        </div>

        {/* RIGHT: DEPARTMENTS */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-orange-600">DEPARTMENTS</p>
          <div className="overflow-hidden rounded-lg border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/60">
                  {(['dept_id', 'dept_name', 'location'] as const).map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-mono text-[9px] font-bold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((d, di) => {
                  const isActive = activeDeptIdx === di
                  const isDone   = doneDeptIdxs.has(di) && !isActive
                  return (
                    <motion.tr
                      key={d.dept_id}
                      animate={
                        isActive ? { backgroundColor: '#fef08a', scale: 1.02 }
                        : isDone  ? { backgroundColor: '#fff7ed', scale: 1 }
                        :           { backgroundColor: '#ffffff', scale: 1 }
                      }
                      transition={{ duration: 0.2 }}
                      className="border-b last:border-0"
                    >
                      <td className={cn('px-2 py-1 font-mono text-[10px] font-bold', isActive ? 'text-yellow-900' : 'text-orange-700')}>{d.dept_id}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{d.dept_name}</td>
                      <td className={cn('px-2 py-1 font-mono text-[10px]', isActive ? 'font-bold text-yellow-800' : 'text-foreground/80')}>{d.location}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Result rows */}
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-bold text-muted-foreground">
          {lang === 'ko' ? '결과 (결합된 행)' : 'Result (joined rows)'}
        </p>
        <div className="overflow-x-auto rounded-lg border bg-card text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/60">
                {(['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((h) => (
                  <th key={h} className={cn(
                    'whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold',
                    h === 'dept_id' ? 'text-violet-600'
                    : h === 'dept_name' || h === 'location' ? 'text-orange-600'
                    : 'text-muted-foreground',
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {animRows.slice(0, visibleCount).map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: -6, backgroundColor: '#fef08a' }}
                    animate={{ opacity: 1, y: 0,  backgroundColor: row._side === 'both' ? '#f0fdf4' : row._side === 'left' ? '#f5f3ff' : '#fff7ed' }}
                    transition={{ duration: 0.3 }}
                    className={cn('border-b last:border-0', ROW_COL[row._side])}
                  >
                    {(['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((col) => {
                      const val    = row[col]
                      const isNull = val === null
                      return (
                        <td key={col} className={cn('px-2 py-1 font-mono text-[10px]', isNull ? 'italic text-muted-foreground/40' : 'text-foreground/80')}>
                          {isNull ? 'NULL' : String(val)}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {visibleCount === 0 && (
                <tr><td colSpan={5} className="py-4 text-center font-mono text-[10px] text-muted-foreground/50">
                  {lang === 'ko' ? '▶ 실행 버튼을 눌러 시작하세요' : '▶ Press Run to start'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {visibleCount > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-200" />{lang === 'ko' ? '양쪽 일치' : 'Both match'}</span>
            {(type === 'left' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-violet-200" />{lang === 'ko' ? '왼쪽만' : 'Left only'}</span>}
            {(type === 'right' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-orange-200" />{lang === 'ko' ? '오른쪽만' : 'Right only'}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── JoinSection ─────────────────────────────────────────────────────────────

export function JoinSection({ lang, t }: { lang: 'ko' | 'en'; t: typeof T['ko'] }) {
  const [activeJoin, setActiveJoin] = useState<JoinType>('inner')
  const c = JOIN_COLOR[activeJoin]

  return (
    <PageContainer className="max-w-6xl">
      <ChapterTitle icon="📋" num={1} title={t.chapterTitle} subtitle={t.joinSectionSubtitle} />
      <SectionTitle>{t.joinSectionTitle}</SectionTitle>
      <Prose>{t.joinIntro}</Prose>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        {/* LEFT: JOIN type selector */}
        <div className="flex flex-col gap-2">
          {(t.joinTypes as Array<{ key: string; icon: string; color: string; title: string; desc: string }>).map((jt) => {
            const jk = jt.key as JoinType
            const jc = JOIN_COLOR[jk]
            const isActive = activeJoin === jk
            return (
              <button
                key={jk}
                onClick={() => setActiveJoin(jk)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                  isActive ? `${jc.bg} ${jc.border} shadow-sm` : 'border-border bg-card hover:bg-muted/40',
                )}
              >
                <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold', isActive ? jc.badge : 'bg-muted text-muted-foreground')}>
                  {jt.icon}
                </div>
                <div className="min-w-0">
                  <div className={cn('font-mono text-xs font-bold', isActive ? jc.text : 'text-foreground/70')}>
                    {jt.title}
                  </div>
                  <div className={cn('mt-0.5 text-[11px] leading-snug', isActive ? jc.text + '/80' : 'text-muted-foreground')}>
                    {jt.desc}
                  </div>
                </div>
                {isActive && <span className={cn('ml-auto mt-0.5 shrink-0 text-xs', jc.text)}>◀</span>}
              </button>
            )
          })}
        </div>

        {/* RIGHT: animation simulator */}
        <div className={cn('rounded-xl border p-4 shadow-sm transition-colors', c.bg, c.border)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeJoin}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <JoinAnimator type={activeJoin} lang={lang} joinRowCount={t.joinRowCount} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-10">
        <InfoBox color="blue" icon="💡" title={t.oracleTipTitle}>
          {t.oracleTip}
        </InfoBox>
      </div>
    </PageContainer>
  )
}

export { T as JoinT }
