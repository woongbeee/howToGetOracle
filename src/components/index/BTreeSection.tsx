import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { getLargeTable } from '@/data/largeDataGenerator'

// ── B-Tree data model ─────────────────────────────────────────────────────────

interface LeafEntry { key: number; rowid: string }
interface LeafBlock { id: string; entries: LeafEntry[]; prevId: string | null; nextId: string | null }
interface BranchBlock { id: string; keys: number[]; childIds: string[] }

/** Build a small demo B-Tree from sorted numeric keys */
function buildBTree(keys: number[]): {
  root: BranchBlock
  branches: BranchBlock[]
  leaves: LeafBlock[]
} {
  const sorted = [...new Set(keys)].sort((a, b) => a - b)

  // Split into leaf blocks of 4 entries each
  const leaves: LeafBlock[] = []
  for (let i = 0; i < sorted.length; i += 4) {
    const chunk = sorted.slice(i, i + 4)
    leaves.push({
      id: `L${Math.floor(i / 4)}`,
      entries: chunk.map((k, j) => ({ key: k, rowid: `AAA${String(i + j).padStart(4, '0')}` })),
      prevId: i > 0 ? `L${Math.floor(i / 4) - 1}` : null,
      nextId: i + 4 < sorted.length ? `L${Math.floor(i / 4) + 1}` : null,
    })
  }

  // Build one branch level
  const branches: BranchBlock[] = []
  for (let i = 0; i < leaves.length; i += 3) {
    const chunk = leaves.slice(i, i + 3)
    branches.push({
      id: `B${Math.floor(i / 3)}`,
      keys: chunk.slice(1).map((l) => l.entries[0].key),
      childIds: chunk.map((l) => l.id),
    })
  }

  // Root
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

// ── Scan simulation types ─────────────────────────────────────────────────────

type ScanType = 'unique' | 'range' | 'full' | 'skip'

interface ScanStep {
  type: 'visit-root' | 'visit-branch' | 'visit-leaf' | 'match' | 'traverse'
  blockId: string
  entryKey?: number
  message: string
}

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'B-Tree 인덱스 구조 & 스캔',
    structureTitle: 'B-Tree 내부 구조',
    structureDesc:
      'Oracle B-Tree 인덱스는 Root → Branch → Leaf 3계층으로 구성됩니다. 모든 Leaf 블록은 동일한 깊이(Balanced)를 가지며, 이중 연결 리스트로 순방향/역방향 탐색이 가능합니다. 각 Leaf 항목에는 정렬된 키 값과 해당 행의 ROWID가 저장됩니다.',
    datasetTitle: 'EMPLOYEES 테이블 기반 인덱스',
    columnLabel: '인덱스 컬럼',
    scanTitle: '스캔 시뮬레이션',
    scanTypes: {
      unique: { label: 'Unique Scan', desc: '단일 키 등호 검색. EMPLOYEE_ID = N' },
      range: { label: 'Range Scan', desc: '범위 검색. SALARY BETWEEN low AND high' },
      full: { label: 'Full Index Scan', desc: '정렬 순서로 전체 인덱스 읽기' },
      skip: { label: 'Skip Scan', desc: 'Leading 컬럼 미지정 — 논리적 서브인덱스 탐색' },
    },
    searchKey: '검색 키',
    rangeFrom: '범위 시작',
    rangeTo: '범위 끝',
    runBtn: '스캔 실행',
    resetBtn: '초기화',
    statsTitle: '컬럼 통계 (EMPLOYEES)',
    ndv: 'NDV (고유값 수)',
    ratio: '카디널리티 비율',
    recommended: '권장 인덱스',
    blockLegend: { root: 'Root', branch: 'Branch', leaf: 'Leaf', match: '매칭 항목' },
    structurePoints: [
      { icon: '🌲', title: '균형 트리 (Balanced)', desc: '모든 Leaf 블록이 항상 같은 깊이 유지. 어느 키든 동일한 수의 I/O.' },
      { icon: '🔗', title: '이중 연결 Leaf', desc: 'Leaf 블록은 양방향 포인터로 연결 — Range Scan 시 순차 탐색 가능.' },
      { icon: '🪪', title: 'ROWID 저장', desc: 'Leaf 항목 = 키 값 + ROWID. ROWID로 힙 테이블의 정확한 블록/행 위치 지정.' },
      { icon: '🗜', title: '최소 Prefix 분기', desc: 'Branch 블록에는 분기 결정에 필요한 최소 Prefix만 저장 → 공간 효율 극대화.' },
    ],
  },
  en: {
    title: 'B-Tree Index Structure & Scans',
    structureTitle: 'B-Tree Internal Structure',
    structureDesc:
      'An Oracle B-Tree index has three levels: Root → Branch → Leaf. All leaf blocks stay at the same depth (balanced), and are doubly linked for forward/backward range traversal. Each leaf entry holds a sorted key value plus the ROWID of the corresponding table row.',
    datasetTitle: 'Index on EMPLOYEES Table',
    columnLabel: 'Index Column',
    scanTitle: 'Scan Simulation',
    scanTypes: {
      unique: { label: 'Unique Scan', desc: 'Single-key equality. EMPLOYEE_ID = N' },
      range: { label: 'Range Scan', desc: 'Range predicate. SALARY BETWEEN low AND high' },
      full: { label: 'Full Index Scan', desc: 'Read entire index in sorted order' },
      skip: { label: 'Skip Scan', desc: 'Leading column absent — logical sub-index probing' },
    },
    searchKey: 'Search Key',
    rangeFrom: 'Range From',
    rangeTo: 'Range To',
    runBtn: 'Run Scan',
    resetBtn: 'Reset',
    statsTitle: 'Column Stats (EMPLOYEES)',
    ndv: 'NDV (distinct values)',
    ratio: 'Cardinality Ratio',
    recommended: 'Recommended Index',
    blockLegend: { root: 'Root', branch: 'Branch', leaf: 'Leaf', match: 'Match' },
    structurePoints: [
      { icon: '🌲', title: 'Balanced Tree', desc: 'All leaf blocks always at the same depth. Equal I/Os for any key.' },
      { icon: '🔗', title: 'Doubly Linked Leaves', desc: 'Leaf blocks are linked in both directions — enables sequential Range Scan.' },
      { icon: '🪪', title: 'ROWID Storage', desc: 'Leaf entry = key + ROWID. ROWID pinpoints the exact block and row in the heap table.' },
      { icon: '🗜', title: 'Minimum Prefix Branching', desc: 'Branch blocks store the shortest prefix needed for branching → maximizes space efficiency.' },
    ],
  },
}

const COLUMNS = ['EMPLOYEE_ID', 'SALARY', 'DEPARTMENT_ID', 'HIRE_DATE'] as const
type Col = (typeof COLUMNS)[number]

const COL_META: Record<Col, { ndv: number; recommended: string }> = {
  EMPLOYEE_ID:   { ndv: 10000, recommended: 'Unique B-Tree' },
  SALARY:        { ndv: 6000,  recommended: 'B-Tree (Range)' },
  DEPARTMENT_ID: { ndv: 12,    recommended: 'Bitmap' },
  HIRE_DATE:     { ndv: 7000,  recommended: 'B-Tree (Range)' },
}

interface Props { lang: Lang }

export function BTreeSection({ lang }: Props) {
  const t = T[lang]
  const table = getLargeTable('EMPLOYEES')

  const [selectedCol, setSelectedCol] = useState<Col>('EMPLOYEE_ID')
  const [scanType, setScanType] = useState<ScanType>('unique')
  const [searchKey, setSearchKey] = useState(1042)
  const [rangeFrom, setRangeFrom] = useState(5000)
  const [rangeTo, setRangeTo] = useState(9000)

  // Build demo tree from a sample of 20 keys
  const sampleKeys = table
    ? (table.rows.slice(0, 100).map((r) => {
        if (selectedCol === 'EMPLOYEE_ID') return r.EMPLOYEE_ID as number
        if (selectedCol === 'SALARY')      return r.SALARY as number
        if (selectedCol === 'DEPARTMENT_ID') return r.DEPARTMENT_ID as number
        return 0
      }).filter((v) => v > 0).slice(0, 20))
    : [101,104,108,114,121,145,200,201,203,204,1001,1200,1500,2000,2500,3000,4000,5000,7500,9000]

  const { root, branches, leaves } = buildBTree(sampleKeys)

  // Scan animation state
  const [steps, setSteps] = useState<ScanStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [highlightedBlocks, setHighlightedBlocks] = useState<Set<string>>(new Set())
  const [matchedKeys, setMatchedKeys] = useState<Set<number>>(new Set())
  const stepRef = useRef(currentStep)
  stepRef.current = currentStep

  function buildScanSteps(): ScanStep[] {
    const result: ScanStep[] = []

    if (scanType === 'unique') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: lang === 'ko' ? 'Root 블록에서 탐색 시작' : 'Start at Root block' })
      const targetBranch = branches.find((b) => {
        const first = leaves.find((l) => l.id === b.childIds[0])!
        const last  = leaves.find((l) => l.id === b.childIds[b.childIds.length - 1])!
        return (first.entries[0]?.key ?? 0) <= searchKey && searchKey <= (last.entries[last.entries.length - 1]?.key ?? Infinity)
      }) ?? branches[0]
      result.push({ type: 'visit-branch', blockId: targetBranch.id, message: lang === 'ko' ? `Branch ${targetBranch.id} 진입` : `Enter Branch ${targetBranch.id}` })
      const targetLeaf = leaves.find((l) => l.entries.some((e) => e.key === searchKey)) ?? leaves[0]
      result.push({ type: 'visit-leaf', blockId: targetLeaf.id, message: lang === 'ko' ? `Leaf ${targetLeaf.id}에서 키 탐색` : `Probe Leaf ${targetLeaf.id}` })
      const match = targetLeaf.entries.find((e) => e.key === searchKey)
      if (match) {
        result.push({ type: 'match', blockId: targetLeaf.id, entryKey: match.key, message: lang === 'ko' ? `키 ${match.key} 발견 → ROWID ${match.rowid}` : `Key ${match.key} found → ROWID ${match.rowid}` })
      } else {
        result.push({ type: 'match', blockId: targetLeaf.id, message: lang === 'ko' ? '키 없음 (결과 0건)' : 'Key not found (0 rows)' })
      }
    }

    if (scanType === 'range') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: lang === 'ko' ? 'Root에서 시작 키 위치 탐색' : 'Probe Root for start of range' })
      let started = false
      for (const branch of branches) {
        const firstLeaf = leaves.find((l) => l.id === branch.childIds[0])!
        const lastLeaf  = leaves.find((l) => l.id === branch.childIds[branch.childIds.length - 1])!
        if (lastLeaf.entries[lastLeaf.entries.length - 1]?.key < rangeFrom) continue
        if (firstLeaf.entries[0]?.key > rangeTo) break
        if (!started) {
          result.push({ type: 'visit-branch', blockId: branch.id, message: lang === 'ko' ? `Branch ${branch.id} — 범위 포함` : `Branch ${branch.id} — covers range` })
          started = true
        }
        for (const leafId of branch.childIds) {
          const leaf = leaves.find((l) => l.id === leafId)!
          const lo = leaf.entries[0]?.key ?? 0
          const hi = leaf.entries[leaf.entries.length - 1]?.key ?? 0
          if (hi < rangeFrom || lo > rangeTo) continue
          result.push({ type: 'visit-leaf', blockId: leaf.id, message: lang === 'ko' ? `Leaf ${leaf.id} 스캔` : `Scan Leaf ${leaf.id}` })
          for (const e of leaf.entries) {
            if (e.key >= rangeFrom && e.key <= rangeTo) {
              result.push({ type: 'match', blockId: leaf.id, entryKey: e.key, message: lang === 'ko' ? `매치: ${e.key}` : `Match: ${e.key}` })
            }
          }
          if (lo <= rangeTo && nextLeafExists(leaf)) {
            result.push({ type: 'traverse', blockId: leaf.id, message: lang === 'ko' ? `→ 다음 Leaf 이동 (이중 연결 리스트)` : `→ Traverse to next Leaf (doubly linked)` })
          }
        }
      }
    }

    if (scanType === 'full') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: lang === 'ko' ? 'Root에서 가장 왼쪽 Leaf 탐색' : 'Find leftmost Leaf from Root' })
      result.push({ type: 'visit-branch', blockId: branches[0].id, message: lang === 'ko' ? '첫 번째 Branch 통과' : 'Pass through first Branch' })
      for (const leaf of leaves) {
        result.push({ type: 'visit-leaf', blockId: leaf.id, message: lang === 'ko' ? `Leaf ${leaf.id} 순서대로 읽기` : `Read Leaf ${leaf.id} in order` })
        for (const e of leaf.entries) {
          result.push({ type: 'match', blockId: leaf.id, entryKey: e.key, message: `${e.key}` })
        }
        if (leaf.nextId) {
          result.push({ type: 'traverse', blockId: leaf.id, message: lang === 'ko' ? '→ 다음 Leaf' : '→ Next Leaf' })
        }
      }
    }

    if (scanType === 'skip') {
      result.push({ type: 'visit-root', blockId: 'ROOT', message: lang === 'ko' ? 'Skip Scan: Leading 컬럼 없이 탐색 시작' : 'Skip Scan: probe without leading column' })
      for (const branch of branches) {
        result.push({ type: 'visit-branch', blockId: branch.id, message: lang === 'ko' ? `논리적 서브인덱스 탐색: ${branch.id}` : `Probe logical sub-index: ${branch.id}` })
        for (const leafId of branch.childIds) {
          const leaf = leaves.find((l) => l.id === leafId)!
          result.push({ type: 'visit-leaf', blockId: leaf.id, message: lang === 'ko' ? `Leaf ${leaf.id} — non-leading 조건 평가` : `Leaf ${leaf.id} — evaluate non-leading predicate` })
        }
      }
    }

    return result
  }

  function nextLeafExists(leaf: LeafBlock) { return leaf.nextId !== null }

  async function runScan() {
    if (isRunning) return
    const scanSteps = buildScanSteps()
    setSteps(scanSteps)
    setCurrentStep(-1)
    setHighlightedBlocks(new Set())
    setMatchedKeys(new Set())
    setIsRunning(true)

    for (let i = 0; i < scanSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 600))
      setCurrentStep(i)
      setHighlightedBlocks((prev) => new Set([...prev, scanSteps[i].blockId]))
      if (scanSteps[i].type === 'match' && scanSteps[i].entryKey !== undefined) {
        setMatchedKeys((prev) => new Set([...prev, scanSteps[i].entryKey!]))
      }
    }
    setIsRunning(false)
  }

  function reset() {
    setSteps([])
    setCurrentStep(-1)
    setHighlightedBlocks(new Set())
    setMatchedKeys(new Set())
    setIsRunning(false)
  }

  // Reset when scan type or column changes
  useEffect(() => { reset() }, [selectedCol, scanType])

  const meta = COL_META[selectedCol]

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">

      {/* Structure explanation */}
      <section>
        <h2 className="mb-1 text-lg font-bold">{t.structureTitle}</h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.structureDesc}</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.structurePoints.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="mb-2 text-lg">{p.icon}</div>
              <div className="mb-1 text-xs font-bold">{p.title}</div>
              <p className="text-[11px] leading-snug text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Column selector & stats */}
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.datasetTitle}</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {COLUMNS.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCol(col)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-all',
                  selectedCol === col
                    ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {col}
              </button>
            ))}
          </div>

          {/* B-Tree diagram */}
          <BTreeDiagram
            root={root}
            branches={branches}
            leaves={leaves}
            highlighted={highlightedBlocks}
            matched={matchedKeys}
            lang={lang}
            t={t}
          />
        </div>

        {/* Stats panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h4 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.statsTitle}</h4>
            <dl className="space-y-3">
              <Stat label={t.ndv} value={meta.ndv.toLocaleString()} />
              <Stat
                label={t.ratio}
                value={`${(meta.ndv / 10000 * 100).toFixed(1)}%`}
                bar={meta.ndv / 10000}
                color={meta.ndv / 10000 > 0.05 ? 'blue' : 'emerald'}
              />
              <Stat label={t.recommended} value={meta.recommended} highlight />
            </dl>
          </div>

          {/* Cardinality visual */}
          <CardinalityBar lang={lang} col={selectedCol} ndv={meta.ndv} total={10000} />
        </div>
      </section>

      {/* Scan simulator */}
      <section className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.scanTitle}</h3>

        <div className="mb-5 flex flex-wrap gap-2">
          {(['unique', 'range', 'full', 'skip'] as ScanType[]).map((st) => (
            <button
              key={st}
              onClick={() => setScanType(st)}
              className={cn(
                'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                scanType === st ? 'border-blue-300 bg-blue-50 shadow-xs' : 'hover:border-border/80 hover:bg-muted/40'
              )}
              style={{ minWidth: 140 }}
            >
              <span className={cn('font-mono text-xs font-bold', scanType === st ? 'text-blue-700' : '')}>
                {t.scanTypes[st].label}
              </span>
              <span className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{t.scanTypes[st].desc}</span>
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-4">
          {scanType === 'unique' && (
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-muted-foreground">{t.searchKey}</span>
              <input
                type="number"
                value={searchKey}
                onChange={(e) => setSearchKey(Number(e.target.value))}
                className="w-32 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
              />
            </label>
          )}
          {scanType === 'range' && (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-muted-foreground">{t.rangeFrom}</span>
                <input
                  type="number"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(Number(e.target.value))}
                  className="w-32 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-muted-foreground">{t.rangeTo}</span>
                <input
                  type="number"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(Number(e.target.value))}
                  className="w-32 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
                />
              </label>
            </>
          )}
          <button
            onClick={runScan}
            disabled={isRunning}
            className="rounded-lg bg-blue-600 px-4 py-2 font-mono text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {t.runBtn}
          </button>
          <button
            onClick={reset}
            className="rounded-lg border px-4 py-2 font-mono text-xs text-muted-foreground transition hover:text-foreground"
          >
            {t.resetBtn}
          </button>
        </div>

        {/* Step log */}
        {steps.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/40 p-3">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: i <= currentStep ? 1 : 0.2, x: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'flex items-start gap-2 py-0.5',
                  i === currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <span className={cn('mt-0.5 font-mono text-[10px]',
                  s.type === 'match' ? 'text-emerald-500' :
                  s.type === 'traverse' ? 'text-blue-500' : 'text-orange-400'
                )}>
                  {s.type === 'match' ? '✓' : s.type === 'traverse' ? '→' : '▸'}
                </span>
                <span className="font-mono text-[11px]">{s.message}</span>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── B-Tree Diagram ─────────────────────────────────────────────────────────────

interface BTreeDiagramProps {
  root: BranchBlock
  branches: BranchBlock[]
  leaves: LeafBlock[]
  highlighted: Set<string>
  matched: Set<number>
  lang: Lang
  t: typeof T['ko']
}

function BTreeDiagram({ root, branches, leaves, highlighted, matched, t }: BTreeDiagramProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-muted/20 p-4">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {([['root','bg-amber-400','text-amber-900'], ['branch','bg-blue-400','text-blue-900'], ['leaf','bg-slate-300','text-slate-800'], ['match','bg-emerald-400','text-emerald-900']] as const).map(([k, bg, tx]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded-sm', bg)} />
            <span className={cn('font-mono text-[10px]', tx)}>{t.blockLegend[k as keyof typeof t.blockLegend]}</span>
          </div>
        ))}
      </div>

      {/* Root */}
      <div className="flex justify-center mb-2">
        <BBlock id={root.id} keys={root.keys} kind="root" highlighted={highlighted.has(root.id)} />
      </div>

      {/* Connector to branches */}
      <div className="flex justify-center mb-2">
        <div className="h-6 w-px bg-border" />
      </div>

      {/* Branches */}
      <div className="flex justify-center gap-6 mb-2 flex-wrap">
        {branches.map((b) => (
          <div key={b.id} className="flex flex-col items-center gap-2">
            <BBlock id={b.id} keys={b.keys} kind="branch" highlighted={highlighted.has(b.id)} />
            <div className="h-6 w-px bg-border" />
          </div>
        ))}
      </div>

      {/* Leaves */}
      <div className="flex justify-start gap-2 flex-wrap">
        {leaves.map((leaf) => (
          <div key={leaf.id} className="flex flex-col items-center gap-1">
            <LeafBBlock
              leaf={leaf}
              highlighted={highlighted.has(leaf.id)}
              matched={matched}
              hasPrev={leaf.prevId !== null}
              hasNext={leaf.nextId !== null}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function BBlock({ id, keys, kind, highlighted }: { id: string; keys: number[]; kind: 'root' | 'branch'; highlighted: boolean }) {
  const baseColor = kind === 'root'
    ? (highlighted ? 'border-amber-500 bg-amber-100' : 'border-amber-300 bg-amber-50')
    : (highlighted ? 'border-blue-500 bg-blue-100' : 'border-blue-200 bg-blue-50/60')

  return (
    <motion.div
      animate={highlighted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, repeat: highlighted ? Infinity : 0, repeatDelay: 0.4 }}
      className={cn('rounded-lg border-2 px-3 py-2 text-center', baseColor)}
    >
      <div className="font-mono text-[10px] font-bold text-muted-foreground mb-1">{id}</div>
      <div className="flex gap-1">
        {keys.map((k, i) => (
          <span key={i} className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold',
            kind === 'root' ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-800'
          )}>{k}</span>
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
      {hasPrev && <span className="font-mono text-[10px] text-blue-400">←</span>}
      <motion.div
        animate={highlighted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, repeat: highlighted ? Infinity : 0, repeatDelay: 0.4 }}
        className={cn(
          'rounded-lg border-2 p-2',
          highlighted ? 'border-slate-500 bg-slate-100 shadow-sm' : 'border-slate-200 bg-slate-50/60'
        )}
      >
        <div className="mb-1 font-mono text-[9px] font-bold text-muted-foreground">{leaf.id}</div>
        <div className="space-y-0.5">
          {leaf.entries.map((e) => (
            <AnimatePresence key={e.key}>
              <motion.div
                initial={{ backgroundColor: 'transparent' }}
                animate={matched.has(e.key) ? { backgroundColor: '#86efac' } : { backgroundColor: 'transparent' }}
                transition={{ duration: 0.3 }}
                className="flex gap-1.5 rounded px-1 py-0.5"
              >
                <span className={cn('font-mono text-[10px] font-semibold', matched.has(e.key) ? 'text-emerald-800' : 'text-foreground')}>
                  {e.key}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">{e.rowid}</span>
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      </motion.div>
      {hasNext && <span className="font-mono text-[10px] text-blue-400">→</span>}
    </div>
  )
}

// ── Stat helpers ──────────────────────────────────────────────────────────────

function Stat({ label, value, bar, color, highlight }: {
  label: string; value: string; bar?: number; color?: 'blue' | 'emerald'; highlight?: boolean
}) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <dt className="font-mono text-[10px] text-muted-foreground">{label}</dt>
        <dd className={cn('font-mono text-xs font-bold', highlight ? 'text-[hsl(var(--active-border))]' : '')}>{value}</dd>
      </div>
      {bar !== undefined && (
        <div className="h-1.5 w-full rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bar * 100}%` }}
            transition={{ duration: 0.6 }}
            className={cn('h-full rounded-full', color === 'emerald' ? 'bg-emerald-400' : 'bg-blue-400')}
          />
        </div>
      )}
    </div>
  )
}

function CardinalityBar({ lang, col, ndv, total }: { lang: Lang; col: string; ndv: number; total: number }) {
  const ratio = ndv / total
  const isBitmap = ratio < 0.05

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {col}
      </div>
      <div className="mb-1 h-4 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          key={col}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={cn('h-full rounded-full', isBitmap ? 'bg-emerald-400' : 'bg-blue-400')}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">
          NDV {ndv.toLocaleString()} / {total.toLocaleString()}
        </span>
        <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] font-bold',
          isBitmap ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        )}>
          {isBitmap ? 'Bitmap' : 'B-Tree'}
        </span>
      </div>
      {isBitmap && (
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          {lang === 'ko'
            ? '저카디널리티 → Bitmap 인덱스 권장. B-Tree는 비효율적.'
            : 'Low cardinality → Bitmap index recommended. B-Tree is inefficient.'}
        </p>
      )}
    </div>
  )
}
