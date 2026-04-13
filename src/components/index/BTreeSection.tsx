import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { HR_SCHEMA } from '@/data/hrSchema'

// ── EMPLOYEES 실제 데이터 ────────────────────────────────────────────────────

const EMP_TABLE = HR_SCHEMA.find((t) => t.name === 'EMPLOYEES')!

// 컬럼별로 실제 데이터를 (키, 이름) 쌍으로 추출
interface EmpEntry {
  key: number       // 인덱스 키값
  label: string     // 사람이 읽을 수 있는 레이블 (이름 또는 값 설명)
  empId: number
  name: string      // FIRST_NAME LAST_NAME
}

function buildEmpEntries(col: Col): EmpEntry[] {
  return EMP_TABLE.rows
    .filter((r) => r[col] !== null)
    .map((r) => ({
      key: r[col] as number,
      label: col === 'EMPLOYEE_ID'
        ? `${r.FIRST_NAME} ${r.LAST_NAME}`
        : col === 'SALARY'
        ? `${r.FIRST_NAME} ${r.LAST_NAME}`
        : col === 'DEPARTMENT_ID'
        ? `${r.FIRST_NAME} ${r.LAST_NAME}`
        : `${r.FIRST_NAME} ${r.LAST_NAME}`,
      empId: r.EMPLOYEE_ID as number,
      name: `${r.FIRST_NAME} ${r.LAST_NAME}`,
    }))
    .sort((a, b) => a.key - b.key)
}

// ── B-Tree 데이터 모델 ────────────────────────────────────────────────────────

interface LeafEntry { key: number; label: string; name: string; rowid: string }
interface LeafBlock { id: string; entries: LeafEntry[]; prevId: string | null; nextId: string | null }
interface BranchBlock { id: string; keys: number[]; childIds: string[] }

function buildBTree(entries: EmpEntry[]): { root: BranchBlock; branches: BranchBlock[]; leaves: LeafBlock[] } {
  // 키 중복 제거 후 정렬 (DEPARTMENT_ID는 중복 있음 — 그룹 첫 번째만)
  const seen = new Set<number>()
  const unique = entries.filter((e) => {
    if (seen.has(e.key)) return false
    seen.add(e.key)
    return true
  })

  const LEAF_SIZE = 4
  const leaves: LeafBlock[] = []
  for (let i = 0; i < unique.length; i += LEAF_SIZE) {
    const chunk = unique.slice(i, i + LEAF_SIZE)
    leaves.push({
      id: `L${Math.floor(i / LEAF_SIZE)}`,
      entries: chunk.map((e, j) => ({
        key: e.key,
        label: e.label,
        name: e.name,
        rowid: `AAA${String(i + j).padStart(4, '0')}`,
      })),
      prevId: i > 0 ? `L${Math.floor(i / LEAF_SIZE) - 1}` : null,
      nextId: i + LEAF_SIZE < unique.length ? `L${Math.floor(i / LEAF_SIZE) + 1}` : null,
    })
  }

  const BRANCH_SIZE = 3
  const branches: BranchBlock[] = []
  for (let i = 0; i < leaves.length; i += BRANCH_SIZE) {
    const chunk = leaves.slice(i, i + BRANCH_SIZE)
    branches.push({
      id: `B${Math.floor(i / BRANCH_SIZE)}`,
      keys: chunk.slice(1).map((l) => l.entries[0].key),
      childIds: chunk.map((l) => l.id),
    })
  }

  const root: BranchBlock = {
    id: 'ROOT',
    keys: branches.slice(1).map((b) => {
      const firstLeaf = leaves.find((l) => l.id === b.childIds[0])!
      return firstLeaf.entries[0].key
    }),
    childIds: branches.map((b) => b.id),
  }

  return { root, branches, leaves }
}

// ── 스캔 타입 ─────────────────────────────────────────────────────────────────

type ScanType = 'unique' | 'range' | 'full' | 'skip'
type Col = 'EMPLOYEE_ID' | 'SALARY' | 'DEPARTMENT_ID'

interface ScanStep {
  type: 'visit-root' | 'visit-branch' | 'visit-leaf' | 'match' | 'traverse'
  blockId: string
  entryKey?: number
  message: string
}

// ── 텍스트 ────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'B-Tree 인덱스 구조 & 스캔',
    structureTitle: 'B-Tree 내부 구조',
    structureDesc: 'Oracle B-Tree 인덱스는 Root → Branch → Leaf 3계층으로 구성됩니다. Leaf 블록은 인덱스 키와 해당 행의 ROWID를 정렬된 상태로 저장하며, 양방향으로 연결되어 범위 탐색이 가능합니다.',
    colLabel: '인덱스 컬럼 선택',
    colDesc: {
      EMPLOYEE_ID: '직원 번호 — 모든 값이 고유. Unique B-Tree 인덱스의 교과서적 사례.',
      SALARY: '연봉 — 값이 다양하고 범위 검색에 자주 사용. Range Scan에 적합.',
      DEPARTMENT_ID: '부서 번호 — 소수의 값(약 10개)이 반복. Bitmap 인덱스가 더 효율적.',
    },
    scanTitle: '스캔 시뮬레이션',
    scanTypes: {
      unique: { label: 'Index Unique Scan', desc: '특정 직원 번호 하나를 찾는 = 검색' },
      range:  { label: 'Index Range Scan',  desc: '연봉 범위로 여러 직원을 찾는 BETWEEN 검색' },
      full:   { label: 'Index Full Scan',   desc: '인덱스 전체를 정렬 순서대로 읽기' },
      skip:   { label: 'Index Skip Scan',   desc: '복합 인덱스에서 선두 컬럼 조건 없이 후행 컬럼으로 검색 — 선두 컬럼 distinct 수만큼 sub-scan 반복' },
    },
    searchKey: '찾을 직원 번호 (EMPLOYEE_ID)',
    rangeFrom: '연봉 최솟값',
    rangeTo: '연봉 최댓값',
    runBtn: '스캔 실행',
    resetBtn: '초기화',
    structurePoints: [
      { icon: '⚖️', title: '균형 트리', desc: 'Root → Branch → Leaf, 항상 동일한 깊이. 어떤 행을 찾든 같은 수의 블록 읽기.' },
      { icon: '🔗', title: '이중 연결 Leaf', desc: 'Leaf 블록은 앞뒤로 연결됨. Range Scan 시 다음 블록을 포인터로 바로 이동.' },
      { icon: '🪪', title: 'ROWID 저장', desc: 'Leaf에는 키값 + ROWID. ROWID로 테이블의 정확한 블록과 행을 바로 접근.' },
      { icon: '📌', title: 'Branch는 분기점', desc: 'Branch 블록에는 Leaf로 가는 길잡이 키만 저장. 실제 데이터는 항상 Leaf에.' },
    ],
    blockLegend: { root: 'Root', branch: 'Branch', leaf: 'Leaf', match: '검색 결과' },
    noMatch: '일치하는 행 없음',
    keyFound: (key: number, name: string, rowid: string) => `EMPLOYEE_ID=${key} (${name}) 발견 → ROWID: ${rowid}`,
    keyNotFound: (key: number) => `EMPLOYEE_ID=${key} — 없는 직원 번호`,
    salaryMatch: (key: number, name: string) => `SALARY=${key.toLocaleString()} (${name}) 매치`,
    visitRoot: 'Root 블록 — 어느 Branch로 갈지 결정',
    visitBranch: (id: string) => `Branch ${id} — Leaf 범위 좁히기`,
    visitLeaf: (id: string) => `Leaf ${id} — 실제 키값 비교`,
    traverseNext: '→ 연결 리스트로 다음 Leaf 이동',
    fullReadLeaf: (id: string) => `Leaf ${id} 순서대로 읽기`,
    skipIndex: '복합 인덱스 (DEPARTMENT_ID, SALARY)',
    skipQuery: 'WHERE SALARY = ?  ← 선두 컬럼(DEPARTMENT_ID) 조건 없음',
    skipSalaryLabel: '찾을 연봉 (SALARY)',
    skipExplain: (ndv: number) => `선두 컬럼 DEPARTMENT_ID의 고유값이 ${ndv}개이므로, ${ndv}번의 Sub-Scan으로 나누어 탐색합니다.`,
    skipSubScanStart: (dept: number) => `▶ Sub-Scan: DEPARTMENT_ID=${dept} 범위 시작`,
    skipSubScanRoot: (dept: number) => `Root → DEPARTMENT_ID=${dept} 시작 위치로 이동`,
    skipSubScanLeaf: (dept: number, leafId: string) => `Leaf ${leafId} — DEPT=${dept} 범위에서 SALARY 비교`,
    skipMatch: (dept: number, salary: number, name: string) => `✓ DEPT=${dept}, SALARY=${salary.toLocaleString()} (${name})`,
    skipNoMatch: (dept: number) => `DEPT=${dept} 범위에서 해당 SALARY 없음 → 다음 DEPT로 Skip`,
    skipDone: '모든 DEPARTMENT_ID 범위 탐색 완료',
    statsTitle: '컬럼 통계',
    ndv: '고유값 수 (NDV)',
    recommended: '권장 인덱스',
    highCard: '고카디널리티 → B-Tree 인덱스 적합',
    lowCard: '저카디널리티 → Bitmap 인덱스가 더 효율적',
  },
  en: {
    title: 'B-Tree Index Structure & Scans',
    structureTitle: 'B-Tree Internal Structure',
    structureDesc: 'An Oracle B-Tree index has three levels: Root → Branch → Leaf. Leaf blocks store sorted index keys and ROWIDs, doubly linked for efficient range traversal.',
    colLabel: 'Select Index Column',
    colDesc: {
      EMPLOYEE_ID: 'Employee ID — every value is unique. The classic use case for a Unique B-Tree index.',
      SALARY: 'Salary — varied values, often searched by range. Well suited for Range Scans.',
      DEPARTMENT_ID: 'Department ID — only ~10 distinct values, repeated many times. Bitmap index is more efficient.',
    },
    scanTypes: {
      unique: { label: 'Index Unique Scan', desc: 'Find one specific employee by ID (= predicate)' },
      range:  { label: 'Index Range Scan',  desc: 'Find employees within a salary range (BETWEEN)' },
      full:   { label: 'Index Full Scan',   desc: 'Read the entire index in sorted order' },
      skip:   { label: 'Index Skip Scan',   desc: 'Composite index, non-leading column only — Oracle runs one sub-scan per distinct leading column value' },
    },
    searchKey: 'Employee ID to find',
    rangeFrom: 'Salary minimum',
    rangeTo: 'Salary maximum',
    runBtn: 'Run Scan',
    resetBtn: 'Reset',
    structurePoints: [
      { icon: '⚖️', title: 'Balanced Tree', desc: 'Root → Branch → Leaf, always the same depth. Equal block reads for any row.' },
      { icon: '🔗', title: 'Doubly Linked Leaves', desc: 'Leaf blocks are linked both ways. Range Scan moves to the next block via pointer.' },
      { icon: '🪪', title: 'ROWID Storage', desc: 'Leaf holds key + ROWID. ROWID pinpoints the exact block and row in the table.' },
      { icon: '📌', title: 'Branch as a Signpost', desc: 'Branch blocks only store guide keys to Leaves. Actual data is always in Leaf blocks.' },
    ],
    blockLegend: { root: 'Root', branch: 'Branch', leaf: 'Leaf', match: 'Match' },
    noMatch: 'No matching rows',
    keyFound: (key: number, name: string, rowid: string) => `EMPLOYEE_ID=${key} (${name}) found → ROWID: ${rowid}`,
    keyNotFound: (key: number) => `EMPLOYEE_ID=${key} — not found`,
    salaryMatch: (key: number, name: string) => `SALARY=${key.toLocaleString()} (${name}) matched`,
    visitRoot: 'Root block — decide which Branch to follow',
    visitBranch: (id: string) => `Branch ${id} — narrow down to Leaf range`,
    visitLeaf: (id: string) => `Leaf ${id} — compare actual key values`,
    traverseNext: '→ Move to next Leaf via linked list',
    fullReadLeaf: (id: string) => `Read Leaf ${id} in order`,
    skipIndex: 'Composite Index (DEPARTMENT_ID, SALARY)',
    skipQuery: 'WHERE SALARY = ?  ← no leading column (DEPARTMENT_ID) condition',
    skipSalaryLabel: 'Salary to find',
    skipExplain: (ndv: number) => `DEPARTMENT_ID has ${ndv} distinct values → Oracle splits into ${ndv} Sub-Scans.`,
    skipSubScanStart: (dept: number) => `▶ Sub-Scan: DEPARTMENT_ID=${dept} range start`,
    skipSubScanRoot: (dept: number) => `Root → navigate to DEPARTMENT_ID=${dept} start position`,
    skipSubScanLeaf: (dept: number, leafId: string) => `Leaf ${leafId} — compare SALARY within DEPT=${dept} range`,
    skipMatch: (dept: number, salary: number, name: string) => `✓ DEPT=${dept}, SALARY=${salary.toLocaleString()} (${name})`,
    skipNoMatch: (dept: number) => `No matching SALARY in DEPT=${dept} range → Skip to next DEPT`,
    skipDone: 'All DEPARTMENT_ID ranges scanned',
    statsTitle: 'Column Statistics',
    ndv: 'Distinct Values (NDV)',
    recommended: 'Recommended Index',
    highCard: 'High cardinality → B-Tree index is ideal',
    lowCard: 'Low cardinality → Bitmap index is more efficient',
    scanTitle: 'Scan Simulation',
    colLabel_en: 'Select Index Column',
  },
}

const COLUMNS: Col[] = ['EMPLOYEE_ID', 'SALARY', 'DEPARTMENT_ID']

const COL_META: Record<Col, { ndv: number; recommended: string; recommendedEn: string }> = {
  EMPLOYEE_ID:   { ndv: 19, recommended: 'Unique B-Tree', recommendedEn: 'Unique B-Tree' },
  SALARY:        { ndv: 16, recommended: 'B-Tree (범위 검색)', recommendedEn: 'B-Tree (Range Scan)' },
  DEPARTMENT_ID: { ndv: 10, recommended: 'Bitmap 인덱스', recommendedEn: 'Bitmap Index' },
}

interface Props { lang: Lang }

export function BTreeSection({ lang }: Props) {
  const t = T[lang]
  const isKo = lang === 'ko'

  const [selectedCol, setSelectedCol] = useState<Col>('EMPLOYEE_ID')
  const [scanType, setScanType] = useState<ScanType>('unique')
  const [searchKey, setSearchKey] = useState(145)   // John Russell
  const [rangeFrom, setRangeFrom] = useState(6000)
  const [rangeTo, setRangeTo] = useState(14000)
  const [skipSalary, setSkipSalary] = useState(9000) // Skip Scan 전용 검색 SALARY

  // Skip Scan용 복합 인덱스 (DEPARTMENT_ID, SALARY) 데이터
  // DEPARTMENT_ID distinct values와 각 부서의 직원(SALARY 오름차순)
  const SKIP_DEPTS = [...new Set(
    EMP_TABLE.rows
      .filter((r) => r.DEPARTMENT_ID !== null)
      .map((r) => r.DEPARTMENT_ID as number)
  )].sort((a, b) => a - b)

  // 복합 인덱스 Leaf: (DEPT, SALARY) 오름차순 정렬된 전체 항목
  const skipLeafEntries = EMP_TABLE.rows
    .filter((r) => r.DEPARTMENT_ID !== null && r.SALARY !== null)
    .map((r) => ({
      dept: r.DEPARTMENT_ID as number,
      salary: r.SALARY as number,
      name: `${r.FIRST_NAME} ${r.LAST_NAME}`,
      rowid: `AAA${String(r.EMPLOYEE_ID).padStart(4, '0')}`,
    }))
    .sort((a, b) => a.dept - b.dept || a.salary - b.salary)

  // 각 DEPT별로 Leaf 블록 묶음 생성 (시각화용)
  interface SkipLeafEntry { dept: number; salary: number; name: string; rowid: string }
  interface SkipLeafBlock { id: string; dept: number; entries: SkipLeafEntry[] }
  const skipLeafBlocks: SkipLeafBlock[] = SKIP_DEPTS.map((dept) => ({
    id: `D${dept}`,
    dept,
    entries: skipLeafEntries.filter((e) => e.dept === dept),
  }))

  const empEntries = buildEmpEntries(selectedCol)
  const { root, branches, leaves } = buildBTree(empEntries)

  const [steps, setSteps] = useState<ScanStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [highlightedBlocks, setHighlightedBlocks] = useState<Set<string>>(new Set())
  const [matchedKeys, setMatchedKeys] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function buildScanSteps(): ScanStep[] {
    const result: ScanStep[] = []

    if (scanType === 'unique') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: t.visitRoot })
      const targetBranch = branches.find((b) => {
        const first = leaves.find((l) => l.id === b.childIds[0])!
        const last  = leaves.find((l) => l.id === b.childIds[b.childIds.length - 1])!
        return (first.entries[0]?.key ?? 0) <= searchKey &&
               searchKey <= (last.entries[last.entries.length - 1]?.key ?? Infinity)
      }) ?? branches[0]
      result.push({ type: 'visit-branch', blockId: targetBranch.id, message: t.visitBranch(targetBranch.id) })
      const targetLeaf = leaves.find((l) => l.entries.some((e) => e.key === searchKey))
        ?? leaves.find((l) => l.id === targetBranch.childIds[0])!
      result.push({ type: 'visit-leaf', blockId: targetLeaf.id, message: t.visitLeaf(targetLeaf.id) })
      const match = targetLeaf.entries.find((e) => e.key === searchKey)
      if (match) {
        result.push({ type: 'match', blockId: targetLeaf.id, entryKey: match.key,
          message: t.keyFound(match.key, match.name, match.rowid) })
      } else {
        result.push({ type: 'match', blockId: targetLeaf.id, message: t.keyNotFound(searchKey) })
      }
    }

    if (scanType === 'range') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: t.visitRoot })
      let visitedBranch = false
      for (const branch of branches) {
        const firstLeaf = leaves.find((l) => l.id === branch.childIds[0])!
        const lastLeaf  = leaves.find((l) => l.id === branch.childIds[branch.childIds.length - 1])!
        if ((lastLeaf.entries.at(-1)?.key ?? 0) < rangeFrom) continue
        if ((firstLeaf.entries[0]?.key ?? 0) > rangeTo) break
        if (!visitedBranch) {
          result.push({ type: 'visit-branch', blockId: branch.id, message: t.visitBranch(branch.id) })
          visitedBranch = true
        }
        for (const leafId of branch.childIds) {
          const leaf = leaves.find((l) => l.id === leafId)!
          const lo = leaf.entries[0]?.key ?? 0
          const hi = leaf.entries.at(-1)?.key ?? 0
          if (hi < rangeFrom || lo > rangeTo) continue
          result.push({ type: 'visit-leaf', blockId: leaf.id, message: t.visitLeaf(leaf.id) })
          for (const e of leaf.entries) {
            if (e.key >= rangeFrom && e.key <= rangeTo) {
              result.push({ type: 'match', blockId: leaf.id, entryKey: e.key,
                message: t.salaryMatch(e.key, e.name) })
            }
          }
          if (hi <= rangeTo && leaf.nextId) {
            result.push({ type: 'traverse', blockId: leaf.id, message: t.traverseNext })
          }
        }
      }
    }

    if (scanType === 'full') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: t.visitRoot })
      result.push({ type: 'visit-branch', blockId: branches[0].id, message: t.visitBranch(branches[0].id) })
      for (const leaf of leaves) {
        result.push({ type: 'visit-leaf', blockId: leaf.id, message: t.fullReadLeaf(leaf.id) })
        for (const e of leaf.entries) {
          result.push({ type: 'match', blockId: leaf.id, entryKey: e.key,
            message: `${e.key} — ${e.name}` })
        }
        if (leaf.nextId) {
          result.push({ type: 'traverse', blockId: leaf.id, message: t.traverseNext })
        }
      }
    }

    if (scanType === 'skip') {
      // Skip Scan은 skipLeafBlocks 기반으로 별도 steps 생성 — blockId는 'SKIP_ROOT' / 'SKIP_Dxx'
      result.push({ type: 'visit-root', blockId: 'SKIP_ROOT', message: t.skipSubScanRoot(SKIP_DEPTS[0]) })
      for (const block of skipLeafBlocks) {
        result.push({ type: 'visit-branch', blockId: `SKIP_${block.id}`, message: t.skipSubScanStart(block.dept) })
        result.push({ type: 'visit-leaf',   blockId: `SKIP_${block.id}`, message: t.skipSubScanLeaf(block.dept, block.id) })
        const matches = block.entries.filter((e) => e.salary === skipSalary)
        if (matches.length > 0) {
          for (const m of matches) {
            result.push({ type: 'match', blockId: `SKIP_${block.id}`, entryKey: block.dept * 100000 + m.salary,
              message: t.skipMatch(block.dept, m.salary, m.name) })
          }
        } else {
          result.push({ type: 'traverse', blockId: `SKIP_${block.id}`, message: t.skipNoMatch(block.dept) })
        }
      }
      result.push({ type: 'match', blockId: 'SKIP_ROOT', message: t.skipDone })
    }

    return result
  }

  async function runScan() {
    if (isRunning) return
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
    const scanSteps = buildScanSteps()
    setSteps(scanSteps)
    setCurrentStep(-1)
    setHighlightedBlocks(new Set())
    setMatchedKeys(new Set())
    setIsRunning(true)

    for (let i = 0; i < scanSteps.length; i++) {
      const t = setTimeout(() => {
        setCurrentStep(i)
        setHighlightedBlocks((prev) => new Set([...prev, scanSteps[i].blockId]))
        if (scanSteps[i].type === 'match' && scanSteps[i].entryKey !== undefined) {
          setMatchedKeys((prev) => new Set([...prev, scanSteps[i].entryKey!]))
        }
        if (i === scanSteps.length - 1) setIsRunning(false)
      }, i * 600)
      timerRef.current.push(t)
    }
  }

  function reset() {
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
    setSteps([])
    setCurrentStep(-1)
    setHighlightedBlocks(new Set())
    setMatchedKeys(new Set())
    setIsRunning(false)
  }

  useEffect(() => { reset() }, [selectedCol, scanType])

  const meta = COL_META[selectedCol]
  const colDesc = T[lang].colDesc[selectedCol]
  const totalRows = EMP_TABLE.rows.length

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

      {/* 구조 설명 */}
      <section>
        <h2 className="mb-1 text-lg font-bold">{t.structureTitle}</h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.structureDesc}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.structurePoints.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="rounded-xl border bg-card p-4">
              <div className="mb-2 text-lg">{p.icon}</div>
              <div className="mb-1 text-xs font-bold">{p.title}</div>
              <p className="text-[11px] leading-snug text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 컬럼 선택 + B-Tree 다이어그램 */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {isKo ? t.colLabel : 'Select Index Column'}
        </h3>

        {/* 컬럼 버튼 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {COLUMNS.map((col) => (
            <button key={col} onClick={() => setSelectedCol(col)}
              className={cn(
                'rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-all',
                selectedCol === col
                  ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-xs'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}>
              {col}
            </button>
          ))}
        </div>

        {/* 컬럼 설명 */}
        <div className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-2.5">
          <span className="font-mono text-[11px] text-violet-700">{colDesc}</span>
          <span className={cn(
            'ml-2 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold',
            meta.ndv / totalRows < 0.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
          )}>
            {isKo ? meta.recommended : meta.recommendedEn}
          </span>
        </div>
      </section>

      {/* 스캔 시뮬레이션 */}
      <section className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {isKo ? t.scanTitle : 'Scan Simulation'}
        </h3>

        {/* 스캔 유형 선택 */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['unique', 'range', 'full', 'skip'] as ScanType[]).map((st) => (
            <button key={st} onClick={() => { setScanType(st); setSelectedCol(st === 'range' ? 'SALARY' : st === 'skip' ? 'DEPARTMENT_ID' : 'EMPLOYEE_ID') }}
              className={cn(
                'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                scanType === st ? 'border-violet-300 bg-violet-50 shadow-xs' : 'hover:bg-muted/40'
              )}>
              <span className={cn('font-mono text-xs font-bold', scanType === st ? 'text-violet-700' : '')}>
                {t.scanTypes[st].label}
              </span>
              <span className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{t.scanTypes[st].desc}</span>
            </button>
          ))}
        </div>

        {/* 검색 조건 입력 */}
        <div className="mb-4 flex flex-wrap items-end gap-4">
          {scanType === 'unique' && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-muted-foreground">{t.searchKey}</span>
              <div className="flex flex-wrap gap-1.5">
                {EMP_TABLE.rows.map((r) => (
                  <button key={r.EMPLOYEE_ID as number}
                    onClick={() => setSearchKey(r.EMPLOYEE_ID as number)}
                    className={cn(
                      'rounded-md border px-2 py-1 font-mono text-[10px] transition-all',
                      searchKey === r.EMPLOYEE_ID
                        ? 'border-violet-400 bg-violet-100 text-violet-800 font-bold'
                        : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground'
                    )}>
                    {r.EMPLOYEE_ID} <span className="opacity-60">{r.LAST_NAME}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {scanType === 'range' && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-muted-foreground">
                {isKo ? '연봉 범위 (SALARY)' : 'Salary range'}
              </span>
              <div className="flex items-center gap-2">
                <input type="number" value={rangeFrom}
                  onChange={(e) => setRangeFrom(Number(e.target.value))}
                  className="w-28 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs" />
                <span className="font-mono text-xs text-muted-foreground">~</span>
                <input type="number" value={rangeTo}
                  onChange={(e) => setRangeTo(Number(e.target.value))}
                  className="w-28 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs" />
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {EMP_TABLE.rows
                  .filter((r) => (r.SALARY as number) >= rangeFrom && (r.SALARY as number) <= rangeTo)
                  .map((r) => (
                    <span key={r.EMPLOYEE_ID as number}
                      className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] text-emerald-700">
                      {r.FIRST_NAME} {r.LAST_NAME} ({(r.SALARY as number).toLocaleString()})
                    </span>
                  ))}
              </div>
            </div>
          )}
          {scanType === 'skip' && (
            <div className="w-full">
              {/* Skip Scan 설명 박스 */}
              <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="mb-1 font-mono text-[10px] font-bold text-orange-700">
                  {t.skipIndex}
                </div>
                <div className="mb-1 font-mono text-[11px] text-orange-800">
                  {t.skipQuery.replace('?', String(skipSalary))}
                </div>
                <div className="font-mono text-[10px] text-orange-600">
                  {t.skipExplain(SKIP_DEPTS.length)}
                </div>
              </div>
              {/* SALARY 선택 버튼 */}
              <div className="mb-2">
                <span className="font-mono text-[10px] text-muted-foreground">{t.skipSalaryLabel}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[...new Set(EMP_TABLE.rows.map((r) => r.SALARY as number))].sort((a,b)=>a-b).map((sal) => {
                    const matches = EMP_TABLE.rows.filter((r) => r.SALARY === sal)
                    return (
                      <button key={sal} onClick={() => setSkipSalary(sal)}
                        className={cn(
                          'rounded-md border px-2 py-1 font-mono text-[10px] transition-all',
                          skipSalary === sal
                            ? 'border-orange-400 bg-orange-100 text-orange-800 font-bold'
                            : 'border-border text-muted-foreground hover:border-orange-300 hover:text-foreground'
                        )}>
                        {sal.toLocaleString()}
                        <span className="ml-1 opacity-50">({matches.length}명)</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button onClick={runScan} disabled={isRunning}
              className="rounded-lg bg-violet-600 px-4 py-2 font-mono text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">
              {t.runBtn}
            </button>
            <button onClick={reset}
              className="rounded-lg border px-4 py-2 font-mono text-xs text-muted-foreground transition hover:text-foreground">
              {t.resetBtn}
            </button>
          </div>
        </div>

        {/* 다이어그램 */}
        {scanType !== 'skip' && (
          <div className="mb-4">
            <BTreeDiagram
              root={root} branches={branches} leaves={leaves}
              highlighted={highlightedBlocks} matched={matchedKeys}
              lang={lang} t={t}
            />
          </div>
        )}
        {scanType === 'skip' && (
          <div className="mb-4">
            <SkipScanDiagram
              skipLeafBlocks={skipLeafBlocks}
              skipSalary={skipSalary}
              highlightedBlocks={highlightedBlocks}
              matchedBlockIds={new Set(steps.filter((s,i) => i <= currentStep && s.type === 'match').map(s=>s.blockId))}
              skippedBlockIds={new Set(steps.filter((s,i) => i <= currentStep && s.type === 'traverse').map(s=>s.blockId))}
              lang={lang}
            />
          </div>
        )}

        {/* 스텝 로그 */}
        {steps.length > 0 && (
          <div className="max-h-52 overflow-y-auto rounded-xl border bg-muted/40 p-3">
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: i <= currentStep ? 1 : 0.2, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex items-start gap-2 py-0.5', i === currentStep ? 'text-foreground' : 'text-muted-foreground')}>
                <span className={cn('mt-0.5 shrink-0 font-mono text-[10px]',
                  s.type === 'match'    ? 'text-emerald-500' :
                  s.type === 'traverse' ? 'text-blue-500'    : 'text-orange-400')}>
                  {s.type === 'match' ? '✓' : s.type === 'traverse' ? '→' : '▸'}
                </span>
                <span className="font-mono text-[11px] leading-snug">{s.message}</span>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── B-Tree 다이어그램 ──────────────────────────────────────────────────────────

function BTreeDiagram({ root, branches, leaves, highlighted, matched, t }: {
  root: BranchBlock; branches: BranchBlock[]; leaves: LeafBlock[]
  highlighted: Set<string>; matched: Set<number>
  lang: Lang; t: typeof T['ko']
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-slate-50 p-4">
      {/* 범례 */}
      <div className="mb-4 flex flex-wrap gap-4">
        {([
          ['root',   'bg-amber-400',  'text-amber-900',  t.blockLegend.root],
          ['branch', 'bg-blue-400',   'text-blue-900',   t.blockLegend.branch],
          ['leaf',   'bg-slate-300',  'text-slate-700',  t.blockLegend.leaf],
          ['match',  'bg-emerald-400','text-emerald-900',t.blockLegend.match],
        ] as const).map(([k, bg, tx, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded-sm', bg)} />
            <span className={cn('font-mono text-[10px]', tx)}>{label}</span>
          </div>
        ))}
      </div>

      {/* Root */}
      <div className="flex justify-center mb-2">
        <BBlock id={root.id} keys={root.keys} kind="root" highlighted={highlighted.has(root.id)} />
      </div>
      <div className="flex justify-center mb-2">
        <div className="h-6 w-px bg-slate-300" />
      </div>

      {/* Branches */}
      <div className="flex justify-center gap-4 mb-2 flex-wrap">
        {branches.map((b) => (
          <div key={b.id} className="flex flex-col items-center gap-2">
            <BBlock id={b.id} keys={b.keys} kind="branch" highlighted={highlighted.has(b.id)} />
            <div className="h-6 w-px bg-slate-300" />
          </div>
        ))}
      </div>

      {/* Leaves */}
      <div className="flex flex-wrap justify-start gap-2">
        {leaves.map((leaf) => (
          <LeafBBlock key={leaf.id} leaf={leaf}
            highlighted={highlighted.has(leaf.id)} matched={matched}
            hasPrev={leaf.prevId !== null} hasNext={leaf.nextId !== null} />
        ))}
      </div>
    </div>
  )
}

function BBlock({ id, keys, kind, highlighted }: {
  id: string; keys: number[]; kind: 'root' | 'branch'; highlighted: boolean
}) {
  const colors = kind === 'root'
    ? highlighted ? 'border-amber-500 bg-amber-100' : 'border-amber-300 bg-amber-50'
    : highlighted ? 'border-blue-500 bg-blue-100'   : 'border-blue-200 bg-blue-50/60'

  return (
    <motion.div
      animate={highlighted ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, repeat: highlighted ? Infinity : 0, repeatDelay: 0.5 }}
      className={cn('rounded-lg border-2 px-3 py-2 text-center min-w-16', colors)}>
      <div className="font-mono text-[9px] font-bold text-muted-foreground mb-1">{id}</div>
      <div className="flex gap-1 justify-center">
        {keys.map((k, i) => (
          <span key={i} className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold',
            kind === 'root' ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-800')}>
            {k}
          </span>
        ))}
        {keys.length === 0 && <span className="font-mono text-[10px] text-muted-foreground">—</span>}
      </div>
    </motion.div>
  )
}

function LeafBBlock({ leaf, highlighted, matched, hasPrev, hasNext }: {
  leaf: LeafBlock; highlighted: boolean; matched: Set<number>; hasPrev: boolean; hasNext: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {hasPrev && <span className="font-mono text-[9px] text-blue-400">←</span>}
      <motion.div
        animate={highlighted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, repeat: highlighted ? Infinity : 0, repeatDelay: 0.5 }}
        className={cn('rounded-lg border-2 p-2 min-w-[90px]',
          highlighted ? 'border-slate-500 bg-slate-100 shadow-sm' : 'border-slate-200 bg-white')}>
        <div className="mb-1 font-mono text-[8px] font-bold text-muted-foreground">{leaf.id}</div>
        <div className="space-y-0.5">
          {leaf.entries.map((e) => {
            const isMatch = matched.has(e.key)
            return (
              <AnimatePresence key={e.key}>
                <motion.div
                  initial={{ backgroundColor: 'transparent' }}
                  animate={{ backgroundColor: isMatch ? '#bbf7d0' : 'transparent' }}
                  transition={{ duration: 0.3 }}
                  className="rounded px-1 py-0.5">
                  <div className={cn('font-mono text-[10px] font-bold leading-none',
                    isMatch ? 'text-emerald-800' : 'text-foreground')}>
                    {e.key}
                  </div>
                  <div className={cn('font-mono text-[8px] leading-tight truncate max-w-[80px]',
                    isMatch ? 'text-emerald-600' : 'text-muted-foreground')}>
                    {e.name}
                  </div>
                </motion.div>
              </AnimatePresence>
            )
          })}
        </div>
      </motion.div>
      {hasNext && <span className="font-mono text-[9px] text-blue-400">→</span>}
    </div>
  )
}

// ── Skip Scan 전용 다이어그램 ──────────────────────────────────────────────────
// 복합 인덱스 (DEPARTMENT_ID, SALARY) 의 Leaf를 DEPT별로 시각화
// 각 DEPT 블록이 순서대로 sub-scan 되는 과정을 표현

interface SkipLeafEntry { dept: number; salary: number; name: string; rowid: string }
interface SkipLeafBlock { id: string; dept: number; entries: SkipLeafEntry[] }

function SkipScanDiagram({ skipLeafBlocks, skipSalary, highlightedBlocks, matchedBlockIds, skippedBlockIds, lang }: {
  skipLeafBlocks: SkipLeafBlock[]
  skipSalary: number
  highlightedBlocks: Set<string>
  matchedBlockIds: Set<string>
  skippedBlockIds: Set<string>
  lang: Lang
}) {
  const isKo = lang === 'ko'
  return (
    <div className="overflow-x-auto rounded-xl border bg-slate-50 p-3">
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {isKo
          ? `복합 인덱스 (DEPARTMENT_ID, SALARY) — Leaf 블록 구조`
          : `Composite Index (DEPARTMENT_ID, SALARY) — Leaf Block Layout`}
      </div>
      <div className="flex flex-wrap gap-2">
        {skipLeafBlocks.map((block) => {
          const blockKey = `SKIP_D${block.dept}`
          const isHighlighted = highlightedBlocks.has(blockKey)
          const isMatched = matchedBlockIds.has(blockKey)
          const isSkipped = skippedBlockIds.has(blockKey)
          return (
            <motion.div key={block.dept}
              animate={isHighlighted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, repeat: isHighlighted ? Infinity : 0, repeatDelay: 0.5 }}
              className={cn(
                'rounded-lg border-2 p-2 min-w-[80px]',
                isMatched  ? 'border-emerald-400 bg-emerald-50 shadow-sm' :
                isSkipped  ? 'border-slate-300 bg-slate-100 opacity-50' :
                isHighlighted ? 'border-orange-400 bg-orange-50 shadow-sm' :
                'border-slate-200 bg-white'
              )}>
              {/* DEPT 헤더 */}
              <div className={cn(
                'mb-1 rounded px-1.5 py-0.5 text-center font-mono text-[9px] font-bold',
                isMatched ? 'bg-emerald-200 text-emerald-800' :
                isSkipped ? 'bg-slate-200 text-slate-500' :
                'bg-orange-100 text-orange-700'
              )}>
                DEPT={block.dept}
              </div>
              {/* SALARY 목록 */}
              <div className="space-y-0.5">
                {block.entries.map((e, i) => {
                  const isTarget = e.salary === skipSalary
                  return (
                    <div key={i} className={cn(
                      'rounded px-1 py-0.5',
                      isTarget && isMatched ? 'bg-emerald-200' : ''
                    )}>
                      <div className={cn('font-mono text-[10px] font-semibold leading-none',
                        isTarget && isMatched ? 'text-emerald-800' : 'text-foreground')}>
                        {e.salary.toLocaleString()}
                      </div>
                      <div className={cn('font-mono text-[8px] leading-tight truncate max-w-[72px]',
                        isTarget && isMatched ? 'text-emerald-600' : 'text-muted-foreground')}>
                        {e.name}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Skip 표시 */}
              {isSkipped && !isMatched && (
                <div className="mt-1 text-center font-mono text-[8px] text-slate-400">skip →</div>
              )}
            </motion.div>
          )
        })}
      </div>
      <div className="mt-2 font-mono text-[9px] text-slate-400">
        {isKo
          ? `← 인덱스는 DEPARTMENT_ID 오름차순, 같은 DEPT 내에서 SALARY 오름차순으로 정렬됨`
          : `← Index is sorted by DEPARTMENT_ID asc, then SALARY asc within each DEPT`}
      </div>
    </div>
  )
}
