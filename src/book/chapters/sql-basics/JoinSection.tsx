import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, Prose, InfoBox, SectionTitle, SubTitle,
} from '../shared'
import { SqlHighlight } from './SqlHighlight'
import { useSimulationStore } from '@/store/simulationStore'

// ── Types ──────────────────────────────────────────────────────────────────
interface JoinRow {
  emp_id:    number | null
  first_name: string | null
  dept_id:   number | null
  dept_name: string | null
  location:  string | null
  _side: 'both' | 'left' | 'right'
}

type JoinType = 'inner' | 'left' | 'right' | 'full' | 'cross'
type PageTab = 'join' | 'hierarchy'

interface JoinAnimRow extends JoinRow {
  empIdx:  number | null
  deptIdx: number | null
}

// ── Data ───────────────────────────────────────────────────────────────────

const EMPLOYEES: Array<{ emp_id: number; first_name: string; dept_id: number | null }> = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10   },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20   },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10   },
  { emp_id: 104, first_name: 'David',  dept_id: 30   },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20   },
  { emp_id: 106, first_name: 'Frank',  dept_id: 30   },
  { emp_id: 107, first_name: 'Grace',  dept_id: 10   },
  { emp_id: 108, first_name: 'Henry',  dept_id: 20   },
  { emp_id: 109, first_name: 'Iris',   dept_id: null },
]

const DEPARTMENTS: Array<{ dept_id: number; dept_name: string; location: string }> = [
  { dept_id: 10, dept_name: 'Engineering', location: 'Seoul'   },
  { dept_id: 20, dept_name: 'Analytics',   location: 'Busan'   },
  { dept_id: 30, dept_name: 'Support',     location: 'Incheon' },
  { dept_id: 40, dept_name: 'Marketing',   location: 'Daegu'   },
]

const EMP_ORG: Array<{ emp_id: number; first_name: string; dept_id: number; manager_id: number | null }> = [
  { emp_id: 100, first_name: 'King',   dept_id: 10, manager_id: null },
  { emp_id: 101, first_name: 'Alice',  dept_id: 10, manager_id: 100 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20, manager_id: 100 },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10, manager_id: 101 },
  { emp_id: 104, first_name: 'David',  dept_id: 30, manager_id: 102 },
  { emp_id: 105, first_name: 'Eva',    dept_id: 20, manager_id: 102 },
  { emp_id: 106, first_name: 'Frank',  dept_id: 30, manager_id: 101 },
]

interface HierNode {
  emp_id: number
  first_name: string
  manager_id: number | null
  level: number
  path: string
}

function buildHierarchy(startId: number | null, maxLevel: number): HierNode[] {
  const result: HierNode[] = []

  function pushNode(e: typeof EMP_ORG[number], lvl: number, pathSoFar: string) {
    const path = pathSoFar ? `${pathSoFar}/${e.first_name}` : e.first_name
    result.push({ emp_id: e.emp_id, first_name: e.first_name, manager_id: e.manager_id, level: lvl, path })
    if (lvl < maxLevel) {
      EMP_ORG.filter((c) => c.manager_id === e.emp_id).forEach((c) => pushNode(c, lvl + 1, path))
    }
  }

  if (startId === null) {
    const root = EMP_ORG.find((e) => e.manager_id === null)
    if (root) pushNode(root, 1, '')
  } else {
    const start = EMP_ORG.find((e) => e.emp_id === startId)
    if (start) pushNode(start, 1, '')
  }

  return result
}

const JOIN_SQL: Record<JoinType, string> = {
  inner: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nINNER JOIN departments d\n  ON e.dept_id = d.dept_id',
  left:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nLEFT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  right: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nRIGHT OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  full:  'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nFULL OUTER JOIN departments d\n  ON e.dept_id = d.dept_id',
  cross: 'SELECT e.emp_id, e.first_name,\n       d.dept_name, d.location\nFROM   employees   e\nCROSS JOIN departments d',
}

const C = {
  bg:     'bg-muted/40',
  border: 'border-border',
  text:   'text-foreground/80',
  badge:  'bg-ios-blue-light text-ios-blue-dark',
}

const JOIN_COLOR: Record<JoinType, { border: string; bg: string; text: string; badge: string }> = {
  inner: { border: 'border-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  left:  { border: 'border-blue-400',    bg: 'bg-blue-50',     text: 'text-blue-800',    badge: 'bg-blue-100 text-blue-700' },
  right: { border: 'border-violet-400',  bg: 'bg-violet-50',   text: 'text-violet-800',  badge: 'bg-violet-100 text-violet-700' },
  full:  { border: 'border-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-800',   badge: 'bg-amber-100 text-amber-700' },
  cross: { border: 'border-rose-400',    bg: 'bg-rose-50',     text: 'text-rose-800',    badge: 'bg-rose-100 text-rose-700' },
}

// ── Translation ────────────────────────────────────────────────────────────

const T = {
  ko: {
    chapterTitle: 'JOIN — 테이블 결합',
    joinSectionSubtitle: '두 개 이상의 테이블을 결합해서 데이터를 찾는 JOIN의 종류와 동작 방식을 알아봅니다.',
    joinIntro: 'JOIN은 서로 다른 테이블의 행을 결합 조건(ON 절)에 따라 연결해 결과 집합을 만듭니다. 결합 방식에 따라 INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER, CROSS JOIN으로 나뉩니다.',
    pageTabs: [
      { key: 'join',      label: 'JOIN 종류' },
      { key: 'hierarchy', label: '계층형 질의' },
    ],
    joinTypes: [
      { key: 'inner', icon: '⟕', title: 'INNER JOIN',       desc: '양쪽 테이블 모두에서 조건을 만족하는 행만 반환합니다. 가장 일반적인 JOIN입니다.' },
      { key: 'left',  icon: '⟕', title: 'LEFT OUTER JOIN',  desc: '왼쪽 테이블의 모든 행 + 오른쪽 테이블에서 조건에 맞는 행. 오른쪽 테이블에 조건을 만족하는 행이 없으면 NULL.' },
      { key: 'right', icon: '⟖', title: 'RIGHT OUTER JOIN', desc: '오른쪽 테이블의 모든 행 + 왼쪽 테이블에서 조건에 맞는 행. 왼쪽 테이블에 조건을 만족하는 행이 없으면 NULL.' },
      { key: 'full',  icon: '⟗', title: 'FULL OUTER JOIN',  desc: '양쪽 테이블의 모든 행. 조건을 만족하지 않는 쪽은 NULL로 채웁니다.' },
      { key: 'cross', icon: '×',  title: 'CROSS JOIN',       desc: '모든 행의 조합(CARTESIAN JOIN)을 반환합니다. ON 절이 없습니다.' },
    ],
    joinQueryDesc: {
      inner: 'employees(직원) 테이블과 departments(부서) 테이블에서 dept_id(부서 번호)가 같은 행을 찾습니다.',
      left:  'employees(직원) 테이블의 모든 행을 가져오고, dept_id가 일치하는 departments(부서) 행을 결합합니다. 일치하는 부서가 없으면 dept_name, location은 NULL로 채웁니다.',
      right: 'departments(부서) 테이블의 모든 행을 가져오고, dept_id가 일치하는 employees(직원) 행을 결합합니다. 소속 직원이 없는 부서도 결과에 포함되며, emp_id, first_name은 NULL로 채웁니다.',
      full:  'employees(직원)와 departments(부서) 양쪽 테이블의 모든 행을 가져옵니다. dept_id가 일치하지 않는 행은 상대 테이블 컬럼을 NULL로 채웁니다.',
      cross: 'employees(직원) 테이블의 모든 행과 departments(부서) 테이블의 모든 행을 조합합니다. ON 조건 없이 가능한 모든 쌍을 반환합니다.',
    },
    joinRowCount: (n: number) => `${n}개 행 반환`,
    ansiTitle: 'ANSI란?',
    ansiDesc: 'ANSI(American National Standards Institute)는 미국 국가 표준 협회로, SQL의 공통 문법 표준을 정의합니다. INNER JOIN, LEFT OUTER JOIN 같은 JOIN 문법은 ANSI SQL 표준에 포함되어 있어 Oracle, MySQL, PostgreSQL 등 대부분의 데이터베이스에서 동일하게 동작합니다.',
    oracleTip: 'Oracle에서는 ANSI JOIN 외에 (+) 표기법으로 OUTER JOIN을 표현할 수 있습니다. WHERE e.dept_id = d.dept_id(+) 는 LEFT OUTER JOIN과 동일합니다. 신규 코드에서는 ANSI 표준 JOIN을 권장합니다.',
    oracleTipTitle: 'Oracle (+) 구문',
    hierTitle: '계층형 질의 (Hierarchical Query)',
    hierSubtitle: 'CONNECT BY로 부모-자식 관계를 재귀적으로 탐색합니다.',
    hierIntro: 'Oracle의 CONNECT BY 절은 부모-자식 관계를 가진 데이터를 계층 구조로 탐색합니다. 셀프 조인과 달리 몇 단계가 되더라도 하나의 쿼리로 표현할 수 있어 조직도, 카테고리 트리, BOM(Bill of Materials) 등에 자주 사용됩니다.',
    hierClauses: [
      { clause: 'START WITH',        desc: '계층 탐색을 시작할 루트 조건을 지정합니다. 이 조건을 만족하는 행이 LEVEL = 1이 됩니다.' },
      { clause: 'CONNECT BY PRIOR',  desc: '부모-자식 관계를 정의합니다. PRIOR 키워드가 붙은 컬럼이 "현재 행의 부모"를 참조합니다.' },
      { clause: 'LEVEL',             desc: '현재 행의 깊이(계층 레벨)를 나타내는 의사 컬럼(Pseudocolumn)입니다. 루트가 1, 자식이 2, 손자가 3...' },
      { clause: 'SYS_CONNECT_BY_PATH', desc: '루트에서 현재 행까지의 경로를 문자열로 반환합니다. SYS_CONNECT_BY_PATH(col, \'/\') 형태로 사용합니다.' },
      { clause: 'CONNECT_BY_ROOT',   desc: '현재 행이 속한 계층의 루트 값을 반환합니다.' },
      { clause: 'NOCYCLE',           desc: '순환 참조가 있는 데이터에서도 오류 없이 실행되도록 합니다. CONNECT_BY_ISCYCLE로 순환 여부를 확인할 수 있습니다.' },
    ],
    hierSqlBasic: 'SELECT emp_id,\n       LPAD(\' \', (LEVEL-1)*4) || first_name AS name,\n       manager_id,\n       LEVEL\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR emp_id = manager_id',
    hierSqlPath: 'SELECT emp_id,\n       LPAD(\' \', (LEVEL-1)*4) || first_name AS name,\n       LEVEL,\n       SYS_CONNECT_BY_PATH(first_name, \'/\') AS path\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR emp_id = manager_id',
    hierTabBasic: '기본 계층 탐색',
    hierTabPath: 'SYS_CONNECT_BY_PATH',
    hierDescBasic: 'manager_id IS NULL 조건으로 최상위 관리자(King)에서 시작합니다. CONNECT BY PRIOR emp_id = manager_id 는 "현재 행의 emp_id = 자식 행의 manager_id" 관계로 아래 방향 탐색합니다. LPAD로 LEVEL 만큼 들여쓰기해 트리 구조를 시각화합니다.',
    hierDescPath: 'SYS_CONNECT_BY_PATH(first_name, \'/\')는 루트부터 현재 행까지의 이름을 /로 구분한 경로 문자열을 반환합니다. 특정 직원의 조직 상위 경로를 한눈에 파악하는 데 유용합니다.',
    hierLevelLabel: 'LEVEL',
    hierPathLabel: 'path',
    hierNote: 'CONNECT BY는 Oracle 전용 문법입니다. SQL:1999 표준의 재귀 CTE(WITH ... AS (... UNION ALL ...))와 비교하면 Oracle CONNECT BY가 더 간결하지만, 표준 SQL로 이식성이 필요하면 재귀 CTE를 사용하세요.',
    hierPriorNote: 'CONNECT BY PRIOR emp_id = manager_id와 CONNECT BY emp_id = PRIOR manager_id는 반대 방향 탐색을 의미합니다. 전자는 위→아래(하향), 후자는 아래→위(상향) 탐색입니다.',
    startFrom: '시작 직원',
    allHierarchy: '전체 계층',
  },
  en: {
    chapterTitle: 'JOIN — Combining Tables',
    joinSectionSubtitle: 'Learn how JOIN connects rows from multiple tables using a join condition, with live simulations for each type.',
    joinIntro: 'JOIN connects rows from different tables based on a condition in the ON clause. The join type determines which rows are included in the result.',
    pageTabs: [
      { key: 'join',      label: 'JOIN Types' },
      { key: 'hierarchy', label: 'Hierarchical Query' },
    ],
    joinTypes: [
      { key: 'inner', icon: '⟕', title: 'INNER JOIN',       desc: 'Returns only rows with matching values in both tables. The most common join type.' },
      { key: 'left',  icon: '⟕', title: 'LEFT OUTER JOIN',  desc: 'All rows from the left table, plus matching rows from the right. Non-matching right rows become NULL.' },
      { key: 'right', icon: '⟖', title: 'RIGHT OUTER JOIN', desc: 'All rows from the right table, plus matching rows from the left. Non-matching left rows become NULL.' },
      { key: 'full',  icon: '⟗', title: 'FULL OUTER JOIN',  desc: 'All rows from both tables. Non-matching rows on either side are filled with NULL.' },
      { key: 'cross', icon: '×',  title: 'CROSS JOIN',       desc: 'Returns every combination of rows (Cartesian product). No ON clause.' },
    ],
    joinQueryDesc: {
      inner: 'Finds rows where dept_id matches in both the employees table and the departments table.',
      left:  'Returns all rows from employees, joined with matching rows from departments. If no matching department exists, dept_name and location are filled with NULL.',
      right: 'Returns all rows from departments, joined with matching rows from employees. Departments with no employees are included, with emp_id and first_name as NULL.',
      full:  'Returns all rows from both employees and departments. Rows with no match on either side have the other table\'s columns filled with NULL.',
      cross: 'Combines every row in employees with every row in departments. Returns all possible pairs with no ON condition.',
    },
    joinRowCount: (n: number) => `${n} row${n === 1 ? '' : 's'} returned`,
    ansiTitle: 'What is ANSI?',
    ansiDesc: 'ANSI (American National Standards Institute) defines common SQL syntax standards. JOIN syntax such as INNER JOIN and LEFT OUTER JOIN is part of the ANSI SQL standard, meaning it works the same way across most databases including Oracle, MySQL, and PostgreSQL.',
    oracleTip: 'Oracle also supports the (+) notation for OUTER JOINs in addition to ANSI syntax. WHERE e.dept_id = d.dept_id(+) is equivalent to a LEFT OUTER JOIN. ANSI standard JOIN syntax is recommended for new code.',
    oracleTipTitle: 'Oracle (+) Syntax',
    hierTitle: 'Hierarchical Query (CONNECT BY)',
    hierSubtitle: 'Recursively traverse parent-child relationships with CONNECT BY.',
    hierIntro: 'Oracle\'s CONNECT BY clause traverses data with parent-child relationships as a tree structure. Unlike self joins, any depth of hierarchy can be expressed in a single query — making it ideal for org charts, category trees, and BOMs (Bill of Materials).',
    hierClauses: [
      { clause: 'START WITH',        desc: 'Specifies the root condition to begin hierarchy traversal. Rows matching this condition get LEVEL = 1.' },
      { clause: 'CONNECT BY PRIOR',  desc: 'Defines the parent-child relationship. The column with PRIOR refers to the current row\'s parent.' },
      { clause: 'LEVEL',             desc: 'A pseudocolumn representing the depth of the current row in the hierarchy. Root = 1, children = 2, grandchildren = 3...' },
      { clause: 'SYS_CONNECT_BY_PATH', desc: 'Returns the path from the root to the current row as a string. Used as SYS_CONNECT_BY_PATH(col, \'/\').' },
      { clause: 'CONNECT_BY_ROOT',   desc: 'Returns the root value of the hierarchy that the current row belongs to.' },
      { clause: 'NOCYCLE',           desc: 'Prevents errors when the data contains cycles. Use CONNECT_BY_ISCYCLE to identify cyclic rows.' },
    ],
    hierSqlBasic: 'SELECT emp_id,\n       LPAD(\' \', (LEVEL-1)*4) || first_name AS name,\n       manager_id,\n       LEVEL\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR emp_id = manager_id',
    hierSqlPath: 'SELECT emp_id,\n       LPAD(\' \', (LEVEL-1)*4) || first_name AS name,\n       LEVEL,\n       SYS_CONNECT_BY_PATH(first_name, \'/\') AS path\nFROM   employees\nSTART WITH manager_id IS NULL\nCONNECT BY PRIOR emp_id = manager_id',
    hierTabBasic: 'Basic Traversal',
    hierTabPath: 'SYS_CONNECT_BY_PATH',
    hierDescBasic: 'The query starts from the top-level manager (King) using manager_id IS NULL. CONNECT BY PRIOR emp_id = manager_id means "the current row\'s emp_id equals the child\'s manager_id" — a top-down traversal. LPAD indents each row by (LEVEL - 1) × 4 spaces to visualize the tree.',
    hierDescPath: 'SYS_CONNECT_BY_PATH(first_name, \'/\') returns the path from the root to the current row as names separated by /. This is useful for quickly seeing an employee\'s full organizational path.',
    hierLevelLabel: 'LEVEL',
    hierPathLabel: 'path',
    hierNote: 'CONNECT BY is Oracle-specific syntax. The SQL:1999 standard equivalent is a recursive CTE (WITH ... AS (... UNION ALL ...)). CONNECT BY is more concise in Oracle, but use recursive CTEs if portability across databases is needed.',
    hierPriorNote: 'CONNECT BY PRIOR emp_id = manager_id and CONNECT BY emp_id = PRIOR manager_id traverse in opposite directions. The former is top-down (parent → child); the latter is bottom-up (child → parent).',
    startFrom: 'Start from',
    allHierarchy: 'All hierarchy',
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
      const matched = EMPLOYEES.map((e, i) => ({ e, i })).filter(({ e }) => e.dept_id === d.dept_id)
      if (matched.length > 0) {
        matched.forEach(({ e, i: ei }) => rows.push({ emp_id: e.emp_id, first_name: e.first_name, dept_id: d.dept_id, dept_name: d.dept_name, location: d.location, _side: 'both', empIdx: ei, deptIdx: di }))
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

function JoinAnimator({ type, joinRowCount, queryDesc }: { type: JoinType; joinRowCount: (n: number) => string; queryDesc: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const animRows = buildAnimRows(type)
  const isCross  = type === 'cross'

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
    timerRef.current = setTimeout(() => setVisibleCount((v) => v + 1), isCross ? 200 : 700)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, visibleCount, animRows.length, isCross])

  const currentRow    = playing && visibleCount < animRows.length ? animRows[visibleCount] : null
  const activeEmpIdx  = currentRow?.empIdx  ?? null
  const activeDeptIdx = currentRow?.deptIdx ?? null

  const doneEmpIdxs  = new Set(animRows.slice(0, visibleCount).map((r) => r.empIdx).filter((x): x is number => x !== null))
  const doneDeptIdxs = new Set(animRows.slice(0, visibleCount).map((r) => r.deptIdx).filter((x): x is number => x !== null))

  const ROW_COL: Record<JoinAnimRow['_side'], string> = {
    both:  'bg-ios-teal-light',
    left:  'bg-ios-blue-light',
    right: 'bg-muted/50',
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-muted/60 px-3 py-2.5">
        <SqlHighlight sql={JOIN_SQL[type]} />
      </div>

      <div className={cn('rounded-lg border px-3 py-2 text-[12px] leading-relaxed', C.border, C.bg, C.text)}>
        {queryDesc}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={startPlay}
          disabled={playing}
          className={cn(
            'rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all',
            playing
              ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
              : `${C.border} ${C.bg} ${C.text} hover:brightness-95`,
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
          <span className={cn('ml-auto font-mono text-[11px]', C.text)}>
            {joinRowCount(visibleCount)}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* LEFT: EMPLOYEES */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-ios-blue-dark">EMPLOYEES</p>
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
                      <td className={cn('px-2 py-1 font-mono text-[10px] font-bold', e.dept_id === null ? 'italic text-muted-foreground/40' : isActive ? 'text-foreground' : 'text-ios-blue-dark')}>
                        {e.dept_id ?? 'NULL'}
                      </td>
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
              className={cn('font-mono text-base font-bold', C.text)}
            >
              →
            </motion.div>
            <span className="font-mono text-[9px] text-muted-foreground">ON dept_id</span>
          </div>
        </div>

        {/* RIGHT: DEPARTMENTS */}
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold text-muted-foreground">DEPARTMENTS</p>
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
                      <td className={cn('px-2 py-1 font-mono text-[10px] font-bold', isActive ? 'text-foreground' : 'text-foreground/70')}>{d.dept_id}</td>
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
          {lang === 'ko' ? '결과' : 'Result'}
        </p>
        <div className="overflow-x-auto rounded-lg border bg-card text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/60">
                {(['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((h) => (
                  <th key={h} className={cn(
                    'whitespace-nowrap px-2 py-1.5 text-left font-mono text-[10px] font-bold',
                    h === 'dept_id' ? 'text-ios-blue-dark'
                    : h === 'dept_name' || h === 'location' ? 'text-foreground/60'
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
                    animate={{ opacity: 1, y: 0,  backgroundColor: row._side === 'both' ? '#e5f5fc' : row._side === 'left' ? '#e8f3ff' : '#f4f4f5' }}
                    transition={{ duration: 0.3 }}
                    className={cn('border-b last:border-0', ROW_COL[row._side])}
                  >
                    {(['emp_id', 'first_name', 'dept_id', 'dept_name', 'location'] as const).map((col) => {
                      const val = row[col]
                      return (
                        <td key={col} className={cn('px-2 py-1 font-mono text-[10px]', val === null ? 'italic text-muted-foreground/40' : 'text-foreground/80')}>
                          {val ?? 'NULL'}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {visibleCount === 0 && (
                <tr><td colSpan={5} className="py-4 text-center font-mono text-[10px] text-muted-foreground/50">
                  {lang === 'ko' ? '▶ 조인 시작을 클릭해 시작하세요' : '▶ Press Run to start'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {visibleCount > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-ios-teal/40" />{lang === 'ko' ? '양쪽 일치' : 'Both match'}</span>
            {(type === 'left' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-ios-blue/30" />{lang === 'ko' ? '왼쪽만' : 'Left only'}</span>}
            {(type === 'right' || type === 'full') && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/20" />{lang === 'ko' ? '오른쪽만' : 'Right only'}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── HierarchyPage ─────────────────────────────────────────────────────────────

type HierTab = 'basic' | 'path'

function HierarchyPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t    = T[lang]
  const [hierTab, setHierTab] = useState<HierTab>('basic')
  const [startId, setStartId] = useState<number | null>(null)

  const hierNodes = buildHierarchy(startId, 5)
  const resultIds = new Set(hierNodes.map((n) => n.emp_id))

  const startOptions: Array<{ label: string; id: number | null }> = [
    { label: t.allHierarchy, id: null },
    ...EMP_ORG.filter((e) => e.manager_id === null || EMP_ORG.some((c) => c.manager_id === e.emp_id)).map((e) => ({
      label: e.first_name,
      id: e.emp_id,
    })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle>{t.hierTitle}</SectionTitle>
        <SubTitle>{t.hierSubtitle}</SubTitle>
        <Prose>{t.hierIntro}</Prose>
      </div>

      {/* Clause reference table */}
      <div>
        <p className="mb-2 font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
          {lang === 'ko' ? '주요 키워드' : 'Key Keywords'}
        </p>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="px-3 py-2 text-left font-mono text-[10px] font-bold text-ios-teal-dark whitespace-nowrap">Keyword</th>
                <th className="px-3 py-2 text-left font-mono text-[10px] font-bold text-muted-foreground">{lang === 'ko' ? '설명' : 'Description'}</th>
              </tr>
            </thead>
            <tbody>
              {t.hierClauses.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-[11px] font-bold text-ios-teal-dark whitespace-nowrap">{row.clause}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-foreground/80 leading-relaxed">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="mb-4 flex gap-2">
          {(['basic', 'path'] as HierTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setHierTab(tab)}
              className={cn(
                'rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all',
                hierTab === tab
                  ? 'border-ios-teal/30 bg-ios-teal-light text-ios-teal-dark'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
              )}
            >
              {tab === 'basic' ? t.hierTabBasic : t.hierTabPath}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* SQL + desc */}
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border bg-muted/60 px-3 py-2.5">
              <SqlHighlight sql={hierTab === 'basic' ? t.hierSqlBasic : t.hierSqlPath} />
            </div>
            <div className="rounded-lg border border-ios-teal/20 bg-ios-teal-light px-3 py-2 text-[12px] leading-relaxed text-ios-teal-dark">
              {hierTab === 'basic' ? t.hierDescBasic : t.hierDescPath}
            </div>
          </div>

          {/* Right column: start buttons → query result → source table */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{t.startFrom}:</span>
              {startOptions.map((opt) => (
                <button
                  key={opt.id ?? 'all'}
                  onClick={() => setStartId(opt.id)}
                  className={cn(
                    'rounded-md border px-2.5 py-0.5 font-mono text-[11px] transition-all',
                    startId === opt.id
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-700 font-bold'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Query result table */}
            <div className="overflow-x-auto rounded-lg border bg-card text-xs">
              <div className="border-b bg-muted/40 px-3 py-1.5 font-mono text-[10px] font-bold text-muted-foreground">
                {lang === 'ko' ? '쿼리 결과' : 'Query Result'}
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/60">
                    {hierTab === 'basic'
                      ? ['emp_id', 'name (LPAD)', 'manager_id', t.hierLevelLabel].map((h) => (
                          <th key={h} className="px-3 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))
                      : ['emp_id', 'name (LPAD)', t.hierLevelLabel, t.hierPathLabel].map((h) => (
                          <th key={h} className="px-3 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {hierNodes.map((node) => (
                    <tr key={node.emp_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-1.5 font-mono text-[11px] text-ios-blue-dark font-bold">{node.emp_id}</td>
                      <td className="py-1.5 pl-3 pr-4 font-mono text-[11px] whitespace-pre">
                        <span className="text-ios-teal/60">{' '.repeat((node.level - 1) * 4)}</span>
                        <span className="font-bold text-foreground/90">{node.first_name}</span>
                      </td>
                      {hierTab === 'basic' ? (
                        <>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-foreground/60">{node.manager_id ?? 'NULL'}</td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-ios-teal-dark font-bold">{node.level}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-ios-teal-dark font-bold">{node.level}</td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-foreground/60">/{node.path}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Source table */}
            <div className="overflow-x-auto rounded-lg border bg-card text-xs">
              <div className="border-b bg-muted/40 px-3 py-1.5 font-mono text-[10px] font-bold text-muted-foreground">
                employees
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/60">
                    {['name', 'emp_id', 'manager_id'].map((h) => (
                      <th key={h} className="px-3 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EMP_ORG.map((emp) => (
                    <tr key={emp.emp_id} className={cn('border-b last:border-0', resultIds.has(emp.emp_id) ? 'bg-cyan-50/60 dark:bg-cyan-950/20' : 'opacity-40')}>
                      <td className="px-3 py-1.5 font-mono text-[11px] font-bold text-foreground/90">{emp.first_name}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-ios-blue-dark font-bold">{emp.emp_id}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-foreground/60">{emp.manager_id ?? 'NULL'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <InfoBox variant="warning" lang={lang}>
          {t.hierPriorNote}
        </InfoBox>
        <InfoBox variant="tip" lang={lang}>
          {t.hierNote}
        </InfoBox>
      </div>
    </div>
  )
}

// ── JoinSection ─────────────────────────────────────────────────────────────

export function JoinSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t    = T[lang]
  const [activeJoin, setActiveJoin] = useState<JoinType>('inner')
  const [pageTab, setPageTab]       = useState<PageTab>('join')

  return (
    <PageContainer className="max-w-6xl">
      <ChapterTitle icon="📋" num={1} title={t.chapterTitle} subtitle={t.joinSectionSubtitle} />

      {/* Top-level page tab switcher */}
      <div className="flex gap-2 border-b border-border pb-3">
        {t.pageTabs.map((tab) => {
          const isActive = pageTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setPageTab(tab.key as PageTab)}
              className={cn(
                'rounded-lg border px-4 py-1.5 font-mono text-xs font-bold transition-all',
                isActive
                  ? 'border-ios-blue/30 bg-ios-blue-light text-ios-blue-dark'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {pageTab === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <Prose className="pt-[10px]">{t.joinIntro}</Prose>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
              {/* LEFT: JOIN type selector */}
              <div className="flex flex-col gap-2">
                {(t.joinTypes as Array<{ key: string; icon: string; title: string; desc: string }>).map((jt) => {
                  const jk = jt.key as JoinType
                  const isActive = activeJoin === jk
                  return (
                    <button
                      key={jk}
                      onClick={() => setActiveJoin(jk)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                        isActive
                          ? `${JOIN_COLOR[jk].bg} ${JOIN_COLOR[jk].border} shadow-sm`
                          : 'border-border bg-card hover:bg-muted/40',
                      )}
                    >
                      <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold', isActive ? JOIN_COLOR[jk].badge : 'bg-muted text-muted-foreground')}>
                        {jt.icon}
                      </div>
                      <div className="min-w-0">
                        <div className={cn('font-mono text-xs font-bold', isActive ? JOIN_COLOR[jk].text : 'text-foreground/70')}>
                          {jt.title}
                        </div>
                        <div className={cn('mt-0.5 text-[11px] leading-snug', isActive ? 'text-foreground/70' : 'text-muted-foreground')}>
                          {jt.desc}
                        </div>
                      </div>
                      {isActive && <span className={cn('ml-auto mt-0.5 shrink-0 text-xs', JOIN_COLOR[jk].text)}>◀</span>}
                    </button>
                  )
                })}
              </div>

              {/* RIGHT: animation simulator */}
              <div className={cn('rounded-xl border p-4 shadow-sm transition-colors', C.bg, C.border)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeJoin}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <JoinAnimator
                      type={activeJoin}
                      joinRowCount={t.joinRowCount}
                      queryDesc={t.joinQueryDesc[activeJoin]}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <InfoBox variant="note" lang={lang}>
                {t.ansiDesc}
              </InfoBox>
              <InfoBox variant="tip" lang={lang}>
                {t.oracleTip}
              </InfoBox>
            </div>
          </motion.div>
        )}

        {pageTab === 'hierarchy' && (
          <motion.div
            key="hierarchy"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <HierarchyPage />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}

export { T as JoinT }
