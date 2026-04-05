import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { getLargeTable } from '@/data/largeDataGenerator'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BitmapVector {
  key: string
  bits: (0 | 1)[]
  color: string
}

type MergeOp = 'AND' | 'OR'

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'Bitmap 인덱스 구조 & 동작',
    structureTitle: 'Bitmap 인덱스란?',
    structureDesc:
      '각 고유 값마다 하나의 비트맵 벡터(0/1 배열)를 유지합니다. 각 비트는 테이블의 한 행에 대응하며, 해당 행의 컬럼 값이 이 키와 일치하면 1, 아니면 0입니다. 비트맵은 내부적으로 B-Tree 구조에 저장되어 키 범위 접근이 가능합니다.',
    vsTitle: 'B-Tree vs Bitmap 비교',
    vsRows: [
      { aspect: '카디널리티', btree: '고카디널리티 (많은 고유값)', bitmap: '저카디널리티 (적은 고유값)' },
      { aspect: 'NULL 인덱싱', btree: '❌ 모든 키가 NULL인 행 제외', bitmap: '✓ NULL도 하나의 키로 인덱싱' },
      { aspect: '공간 효율', btree: '저카디널리티에서 낭비', bitmap: '저카디널리티에서 매우 효율적' },
      { aspect: 'DML 성능', btree: '행 단위 빠른 갱신', bitmap: '행 수정 시 전체 비트맵 잠금 (OLTP 비권장)' },
      { aspect: '복수 조건 AND/OR', btree: '각 인덱스 → 병합 처리', bitmap: '비트 연산으로 초고속 병합' },
      { aspect: '사용 환경', btree: 'OLTP', bitmap: 'OLAP / DW' },
    ],
    simulTitle: '비트맵 AND / OR 시뮬레이션',
    simulDesc: '컬럼과 조건을 선택하면 비트맵 AND(교집합) 또는 OR(합집합) 연산을 시각화합니다.',
    tableLabel: '테이블',
    col1Label: '조건 1',
    col2Label: '조건 2',
    opLabel: '연산',
    runBtn: '연산 실행',
    resetBtn: '초기화',
    resultLabel: '결과 비트맵',
    rowidLabel: 'ROWID 변환',
    rowCountLabel: '선택된 행 수',
    steps: {
      fetch1: '비트맵 1 로드',
      fetch2: '비트맵 2 로드',
      merge: '비트 연산 수행',
      convert: 'Rowid 변환',
    },
    bitmapJoinTitle: 'Bitmap Join Index',
    bitmapJoinDesc:
      '조인 대상 테이블의 컬럼 값으로 비트맵을 생성합니다. 예: ORDERS.STATUS를 기반으로 CUSTOMERS 테이블 행을 비트맵으로 표현 — 조인 없이 빠른 필터링.',
    compressionTitle: '비트맵 압축',
    compressionDesc:
      'Oracle은 연속된 0 또는 1 구간을 RLE(Run-Length Encoding)로 압축합니다. 실제 데이터에서 비트맵 크기는 이론적 크기보다 훨씬 작습니다.',
  },
  en: {
    title: 'Bitmap Index Structure & Operations',
    structureTitle: 'What is a Bitmap Index?',
    structureDesc:
      'For each distinct value, a bitmap vector (array of 0/1) is maintained. Each bit corresponds to one row in the table — 1 if that row matches this key value, 0 otherwise. Bitmaps are internally stored in a B-Tree structure for key-range access.',
    vsTitle: 'B-Tree vs Bitmap Comparison',
    vsRows: [
      { aspect: 'Cardinality', btree: 'High cardinality (many distinct values)', bitmap: 'Low cardinality (few distinct values)' },
      { aspect: 'NULL indexing', btree: '❌ Rows where all keys are NULL are excluded', bitmap: '✓ NULL is indexed as a distinct key value' },
      { aspect: 'Space efficiency', btree: 'Wastes space for low-cardinality columns', bitmap: 'Very efficient for low-cardinality columns' },
      { aspect: 'DML performance', btree: 'Fast per-row updates', bitmap: 'Full bitmap lock on row change (not for OLTP)' },
      { aspect: 'Multi-predicate AND/OR', btree: 'Merge per-index results', bitmap: 'Ultra-fast bitwise merge' },
      { aspect: 'Workload', btree: 'OLTP', bitmap: 'OLAP / Data Warehouse' },
    ],
    simulTitle: 'Bitmap AND / OR Simulation',
    simulDesc: 'Select columns and predicates to visualize how Oracle merges bitmap vectors with AND (intersection) or OR (union).',
    tableLabel: 'Table',
    col1Label: 'Condition 1',
    col2Label: 'Condition 2',
    opLabel: 'Operation',
    runBtn: 'Run Operation',
    resetBtn: 'Reset',
    resultLabel: 'Result Bitmap',
    rowidLabel: 'ROWID Conversion',
    rowCountLabel: 'Selected rows',
    steps: {
      fetch1: 'Load Bitmap 1',
      fetch2: 'Load Bitmap 2',
      merge: 'Perform Bitwise Operation',
      convert: 'Convert to ROWIDs',
    },
    bitmapJoinTitle: 'Bitmap Join Index',
    bitmapJoinDesc:
      'A bitmap index built on a column from a joined table. E.g., a bitmap on ORDERS.STATUS for rows in the CUSTOMERS table — enables filtering without the join.',
    compressionTitle: 'Bitmap Compression',
    compressionDesc:
      'Oracle compresses consecutive runs of 0s or 1s using RLE (Run-Length Encoding). In real data, actual bitmap storage is far smaller than the theoretical size.',
  },
}

// ── Demo data setup ─────────────────────────────────────────────────────────--

const DEMO_SIZE = 16  // rows to show

interface ColumnDef {
  name: string
  values: string[]
  colors: Record<string, string>
}

function buildBitmapColumns(table: ReturnType<typeof getLargeTable>): ColumnDef[] {
  if (!table) return []
  const rows = table.rows.slice(0, DEMO_SIZE)
  const result: ColumnDef[] = []

  for (const col of ['GENDER', 'STATUS', 'DEPARTMENT_ID'] as const) {
    const vals = [...new Set(rows.map((r) => String(r[col])))]
    const colorPalette = ['blue', 'emerald', 'orange', 'purple', 'rose', 'amber', 'teal', 'indigo']
    result.push({
      name: col,
      values: vals,
      colors: Object.fromEntries(vals.map((v, i) => [v, colorPalette[i % colorPalette.length]])),
    })
  }
  return result
}

function buildVectors(table: ReturnType<typeof getLargeTable>, colName: string): BitmapVector[] {
  if (!table) return []
  const rows = table.rows.slice(0, DEMO_SIZE)
  const rawVals = rows.map((r) => String(r[colName]))
  const unique = [...new Set(rawVals)]
  const colorPalette: Record<string, string> = {
    M: 'blue', F: 'rose', ACTIVE: 'emerald', INACTIVE: 'slate', ON_LEAVE: 'amber',
  }

  return unique.map((key, i) => ({
    key,
    bits: rawVals.map((v) => (v === key ? 1 : 0)) as (0 | 1)[],
    color: colorPalette[key] ?? ['blue','emerald','orange','purple','rose','amber','teal','indigo'][i % 8],
  }))
}

interface Props { lang: Lang }

export function BitmapSection({ lang }: Props) {
  const t = T[lang]
  const table = getLargeTable('EMPLOYEES')
  const colDefs = buildBitmapColumns(table)

  const [col1, setCol1] = useState('GENDER')
  const [col2, setCol2] = useState('STATUS')
  const [val1, setVal1] = useState('M')
  const [val2, setVal2] = useState('ACTIVE')
  const [op, setOp] = useState<MergeOp>('AND')
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0)   // 0=idle, 1=fetch1, 2=fetch2, 3=merge, 4=rowids

  const vec1 = buildVectors(table, col1).find((v) => v.key === val1)
  const vec2 = buildVectors(table, col2).find((v) => v.key === val2)

  const resultBits: (0 | 1)[] = vec1 && vec2
    ? vec1.bits.map((b, i) => op === 'AND' ? (b & vec2.bits[i]) as 0 | 1 : (b | vec2.bits[i]) as 0 | 1)
    : []
  const matchedRows = resultBits.map((b, i) => ({ idx: i, match: b === 1 }))
  const matchCount = resultBits.filter((b) => b === 1).length

  async function runSimulation() {
    setPhase(1); await delay(800)
    setPhase(2); await delay(800)
    setPhase(3); await delay(900)
    setPhase(4)
  }
  function reset() { setPhase(0) }

  const col1Def = colDefs.find((c) => c.name === col1)
  const col2Def = colDefs.find((c) => c.name === col2)

  const rows = table?.rows.slice(0, DEMO_SIZE) ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

      {/* Structure explanation */}
      <section>
        <h2 className="mb-1 text-lg font-bold">{t.structureTitle}</h2>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.structureDesc}</p>

        {/* Live bitmap display for GENDER column */}
        <div className="overflow-x-auto rounded-xl border bg-muted/20 p-5">
          <div className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            EMPLOYEES — GENDER Bitmap Index ({DEMO_SIZE} rows)
          </div>

          {/* Row numbers */}
          <div className="mb-1 flex items-center gap-2">
            <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground/60">ROW #</span>
            <div className="flex gap-1">
              {rows.map((_, i) => (
                <span key={i} className="flex h-7 w-7 items-center justify-center font-mono text-[9px] text-muted-foreground/50">
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Actual row data */}
          <div className="mb-3 flex items-center gap-2 border-b pb-3">
            <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">DATA</span>
            <div className="flex gap-1">
              {rows.map((r, i) => (
                <span key={i} className="flex h-7 w-7 items-center justify-center rounded bg-muted font-mono text-[9px] font-bold text-foreground">
                  {String(r['GENDER'])[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Bitmap vectors */}
          {buildVectors(table, 'GENDER').map((vec) => (
            <div key={vec.key} className="mb-1 flex items-center gap-2">
              <span className="w-24 shrink-0 font-mono text-[10px] font-bold" style={{ color: `var(--color-${vec.color}-600, currentColor)` }}>
                {vec.key}
              </span>
              <div className="flex gap-1">
                {vec.bits.map((bit, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded font-mono text-[11px] font-bold',
                      bit === 1
                        ? vec.color === 'blue'   ? 'bg-blue-100 text-blue-700'
                        : vec.color === 'rose'   ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                        : 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    {bit}
                  </motion.div>
                ))}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                ({vec.bits.filter((b) => b === 1).length} rows)
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* B-Tree vs Bitmap comparison */}
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.vsTitle}</h3>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-3 divide-x border-b bg-muted/40 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="px-4 py-2">{lang === 'ko' ? '항목' : 'Aspect'}</div>
            <div className="px-4 py-2 text-blue-600">B-Tree</div>
            <div className="px-4 py-2 text-emerald-600">Bitmap</div>
          </div>
          {t.vsRows.map((row, i) => (
            <div key={i} className={cn('grid grid-cols-3 divide-x text-xs', i % 2 === 1 ? 'bg-muted/20' : '')}>
              <div className="px-4 py-2.5 font-mono text-[11px] font-semibold text-foreground">{row.aspect}</div>
              <div className="px-4 py-2.5 text-[11px] text-muted-foreground">{row.btree}</div>
              <div className="px-4 py-2.5 text-[11px] text-muted-foreground">{row.bitmap}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AND / OR Simulation */}
      <section className="rounded-xl border bg-card p-6">
        <h3 className="mb-1 text-sm font-bold">{t.simulTitle}</h3>
        <p className="mb-5 text-[11px] leading-relaxed text-muted-foreground">{t.simulDesc}</p>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <Picker label={t.col1Label} value={col1} options={['GENDER', 'STATUS']} onChange={(v) => { setCol1(v); setPhase(0) }} />
          <Picker
            label={lang === 'ko' ? '값 1' : 'Value 1'}
            value={val1}
            options={col1Def?.values ?? []}
            onChange={(v) => { setVal1(v); setPhase(0) }}
          />

          <div className="flex items-end gap-2">
            {(['AND', 'OR'] as MergeOp[]).map((o) => (
              <button
                key={o}
                onClick={() => { setOp(o); setPhase(0) }}
                className={cn(
                  'rounded-lg px-4 py-2 font-mono text-xs font-bold transition',
                  op === o
                    ? o === 'AND' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                    : 'border text-muted-foreground hover:text-foreground'
                )}
              >
                {o}
              </button>
            ))}
          </div>

          <Picker label={t.col2Label} value={col2} options={['STATUS', 'GENDER']} onChange={(v) => { setCol2(v); setPhase(0) }} />
          <Picker
            label={lang === 'ko' ? '값 2' : 'Value 2'}
            value={val2}
            options={col2Def?.values ?? []}
            onChange={(v) => { setVal2(v); setPhase(0) }}
          />

          <button
            onClick={runSimulation}
            disabled={phase > 0 && phase < 4}
            className="rounded-lg bg-slate-800 px-4 py-2 font-mono text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
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

        {/* Step indicators */}
        <div className="mb-6 flex gap-3">
          {([1,2,3,4] as const).map((s) => (
            <div key={s} className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 transition',
              phase >= s ? 'border-blue-300 bg-blue-50' : 'opacity-40'
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', phase >= s ? 'bg-blue-500' : 'bg-muted-foreground')} />
              <span className="font-mono text-[10px]">
                {s === 1 ? t.steps.fetch1 : s === 2 ? t.steps.fetch2 : s === 3 ? t.steps.merge : t.steps.convert}
              </span>
            </div>
          ))}
        </div>

        {/* Bitmap visualization */}
        <div className="space-y-3">
          {/* Vec 1 */}
          <AnimatePresence>
            {phase >= 1 && vec1 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <span className="w-40 shrink-0 font-mono text-[11px] font-bold text-blue-700">
                  {col1} = '{val1}'
                </span>
                <BitRow bits={vec1.bits} color="blue" active={phase >= 1} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Op label */}
          {phase >= 2 && (
            <div className="flex items-center gap-3">
              <span className="w-40 shrink-0" />
              <span className={cn('font-mono text-sm font-black', op === 'AND' ? 'text-blue-600' : 'text-purple-600')}>
                {op}
              </span>
            </div>
          )}

          {/* Vec 2 */}
          <AnimatePresence>
            {phase >= 2 && vec2 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <span className="w-40 shrink-0 font-mono text-[11px] font-bold text-purple-700">
                  {col2} = '{val2}'
                </span>
                <BitRow bits={vec2.bits} color="purple" active={phase >= 2} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          {phase >= 3 && <div className="border-t" />}

          {/* Result */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <span className="w-40 shrink-0 font-mono text-[11px] font-bold text-emerald-700">
                  {t.resultLabel}
                </span>
                <BitRow bits={resultBits} color="emerald" active highlight />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ROWID conversion */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"
              >
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                  {t.rowidLabel}
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedRows.filter((r) => r.match).map((r) => (
                    <span key={r.idx} className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] text-emerald-800">
                      Row {r.idx + 1}
                    </span>
                  ))}
                </div>
                <div className="mt-2 font-mono text-[11px] font-bold text-emerald-700">
                  {t.rowCountLabel}: {matchCount}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Bitmap Join Index */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-2 font-mono text-xs font-bold text-[hsl(var(--active-border))]">{t.bitmapJoinTitle}</div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.bitmapJoinDesc}</p>
          <div className="mt-3 rounded-lg bg-muted/40 p-3 font-mono text-[10px] text-foreground leading-relaxed">
            {`CREATE BITMAP INDEX ord_cust_status_bix\n  ON orders(customers.status)\n  FROM orders, customers\n  WHERE orders.customer_id = customers.customer_id;`}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-2 font-mono text-xs font-bold text-[hsl(var(--active-border))]">{t.compressionTitle}</div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">{t.compressionDesc}</p>
          <div className="space-y-1.5">
            <div>
              <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '원본' : 'Raw'}</div>
              <div className="flex gap-px flex-wrap">
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i} className={cn('flex h-5 w-5 items-center justify-center rounded-sm font-mono text-[9px]',
                    i < 12 ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-blue-700'
                  )}>{i < 12 ? 0 : 1}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 border-t border-dashed" />
              <span className="font-mono text-[10px] text-muted-foreground">RLE</span>
              <div className="h-px flex-1 border-t border-dashed" />
            </div>
            <div>
              <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '압축' : 'Compressed'}</div>
              <div className="flex gap-2">
                <span className="rounded bg-muted px-2 py-1 font-mono text-[10px]">0×12</span>
                <span className="rounded bg-blue-100 px-2 py-1 font-mono text-[10px] text-blue-700">1×8</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function BitRow({ bits, color, active, highlight }: {
  bits: (0|1)[]; color: string; active: boolean; highlight?: boolean
}) {
  const colorCls: Record<string, { one: string; zero: string }> = {
    blue:    { one: 'bg-blue-100 text-blue-700',    zero: 'bg-muted/60 text-muted-foreground' },
    purple:  { one: 'bg-purple-100 text-purple-700', zero: 'bg-muted/60 text-muted-foreground' },
    emerald: { one: 'bg-emerald-200 text-emerald-800', zero: 'bg-muted/60 text-muted-foreground' },
  }
  const c = colorCls[color] ?? colorCls.blue

  return (
    <div className="flex gap-1 flex-wrap">
      {bits.map((b, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: active ? 1 : 0.5, opacity: active ? 1 : 0 }}
          transition={{ delay: i * 0.03, duration: 0.2 }}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded font-mono text-[11px] font-bold transition-all',
            b === 1 ? c.one : c.zero,
            highlight && b === 1 ? 'ring-2 ring-emerald-400' : ''
          )}
        >
          {b}
        </motion.div>
      ))}
    </div>
  )
}

function Picker({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)) }
