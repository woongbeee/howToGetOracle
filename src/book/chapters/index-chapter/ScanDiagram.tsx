// ScanDiagram — B-Tree Leaf 레이어 공통 시각화 컴포넌트
// 각 스캔 섹션에서 scanConfig만 바꿔서 재사용

import { motion } from 'framer-motion'

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface LeafEntry {
  key: number | string   // 인덱스 키 값
  rowid: string
}

export interface LeafBlock {
  id: string
  entries: LeafEntry[]
}

// 각 항목이 어떻게 표시될지
export type EntryState =
  | 'idle'       // 기본 (회색)
  | 'visited'    // 방문했지만 조건 미충족 (흐린 파란색)
  | 'matched'    // 조건 충족 (초록)
  | 'skipped'    // Skip Scan에서 건너뜀 (흐린 슬레이트)

export interface ScanConfig {
  // Leaf 블록 배열
  leaves: LeafBlock[]
  // 각 항목의 상태: leafId → key → EntryState
  entryStates: Record<string, Record<string | number, EntryState>>
  // 블록 전체 상태 (border 색)
  blockStates: Record<string, 'idle' | 'active' | 'matched' | 'skipped'>
  // 탐색 방향 화살표를 그릴 Leaf id 쌍 (순서대로)
  scanArrows: { from: string; to: string; direction: 'right' | 'left' }[]
  // 인덱스 키 컬럼 헤더 레이블
  keyLabel: string
  // Root→Branch 표시 여부 (간략 표시)
  showTree?: boolean
  // 범례
  legend: { color: string; label: string }[]
}

// ── 색상 헬퍼 ────────────────────────────────────────────────────────────────

function entryColors(state: EntryState) {
  switch (state) {
    case 'matched':  return { row: 'bg-emerald-50',  key: 'text-emerald-700 font-bold', rowid: 'text-emerald-500' }
    case 'visited':  return { row: 'bg-blue-50',     key: 'text-blue-600',              rowid: 'text-blue-400' }
    case 'skipped':  return { row: 'bg-slate-50',    key: 'text-slate-300',             rowid: 'text-slate-200' }
    default:         return { row: '',               key: 'text-slate-600',             rowid: 'text-slate-400' }
  }
}

function blockBorder(state: 'idle' | 'active' | 'matched' | 'skipped') {
  switch (state) {
    case 'active':   return 'border-violet-400 shadow-violet-100 shadow-md'
    case 'matched':  return 'border-emerald-400 shadow-emerald-100 shadow-md'
    case 'skipped':  return 'border-slate-200'
    default:         return 'border-slate-300'
  }
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function LeafBlockCard({
  block,
  states,
  blockState,
  keyLabel,
  index,
}: {
  block: LeafBlock
  states: Record<string | number, EntryState>
  blockState: 'idle' | 'active' | 'matched' | 'skipped'
  keyLabel: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={`rounded-xl border-2 bg-white transition-all duration-300 ${blockBorder(blockState)}`}
    >
      {/* 헤더 */}
      <div className="rounded-t-[10px] bg-slate-100 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-slate-500">
        LEAF {block.id}
      </div>
      {/* 컬럼 헤더 */}
      <div className="flex border-b border-slate-100 px-2 pt-1">
        <span className="w-12 shrink-0 font-mono text-[8px] font-bold text-slate-400">{keyLabel}</span>
        <span className="font-mono text-[8px] font-bold text-slate-400">ROWID</span>
      </div>
      {/* 항목 */}
      {block.entries.map((entry) => {
        const state = states[entry.key] ?? 'idle'
        const c = entryColors(state)
        return (
          <div
            key={String(entry.key)}
            className={`flex items-center gap-1 whitespace-nowrap px-2 py-0.5 transition-colors duration-200 ${c.row}`}
          >
            <span className={`w-12 shrink-0 font-mono text-[10px] ${c.key}`}>{entry.key}</span>
            <span className={`font-mono text-[9px] ${c.rowid}`}>{entry.rowid}</span>
          </div>
        )
      })}
      <div className="h-1" />
    </motion.div>
  )
}

// ── 메인 ScanDiagram ─────────────────────────────────────────────────────────

export function ScanDiagram({ config, title }: { config: ScanConfig; title: string }) {
  const { leaves, entryStates, blockStates, keyLabel, legend } = config

  return (
    <div className="overflow-x-auto rounded-2xl border bg-slate-50">
      <div className="min-w-max px-6 py-5">
        {/* 제목 */}
        <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {title}
        </p>

        {/* Root/Branch 간략 표현 */}
        <div className="mb-4 flex justify-center">
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-1.5">
            <div className="rounded bg-amber-200 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-700">ROOT</div>
            <span className="text-slate-300">→</span>
            <div className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-600">BRANCH</div>
            <span className="text-slate-300">→</span>
            <span className="font-mono text-[9px] text-slate-400">Leaf 블록들</span>
          </div>
        </div>

        {/* Leaf 블록 행 */}
        <div className="flex items-start gap-0">
          {leaves.map((leaf, i) => (
            <div key={leaf.id} className="flex items-center">
              {/* 블록 카드 */}
              <LeafBlockCard
                block={leaf}
                states={entryStates[leaf.id] ?? {}}
                blockState={blockStates[leaf.id] ?? 'idle'}
                keyLabel={keyLabel}
                index={i}
              />
              {/* 연결 화살표 */}
              {i < leaves.length - 1 && (
                <div className="flex flex-col items-center px-1.5 text-slate-300">
                  <span className="font-mono text-[9px] leading-none">←</span>
                  <span className="font-mono text-[9px] leading-none">→</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 범례 */}
        {legend.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="font-mono text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 스캔 단계 패널 ─────────────────────────────────────────────────────────────
// 각 스캔 섹션에서 steps 배열을 넘겨 쓰는 공통 패널

export interface ScanStep {
  label: string
  detail: string
  color: string  // tailwind dot 색 (bg-xxx-400)
}

export function ScanStepList({ steps }: { steps: ScanStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.2 }}
          className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3"
        >
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white ${s.color}`}>
            {i + 1}
          </span>
          <div>
            <p className="mb-0.5 font-mono text-[11px] font-bold text-foreground">{s.label}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{s.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
