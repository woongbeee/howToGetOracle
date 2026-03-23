// ─── Oracle CBO Estimator ─────────────────────────────────────────────────
// Implements Oracle's selectivity / cardinality / cost formulas.
// Reference: Oracle 21c SQL Tuning Guide, Chapters 8-10

import type { Predicate, AccessPath, TableStats } from './types'
import { getTableStats, getColumnStats } from './stats'

// Oracle system parameters (default values)
const SYSTEM_PARAMS = {
  MBRC: 8,           // multiblock read count (blocks per I/O for FTS)
  MREADTIM: 10,      // multiblock read time (ms)
  SREADTIM: 5,       // single-block read time (ms)
  CPUSPEED: 1000,    // CPU cycles per ms
  CPU_COST_FACTOR: 0.000001,  // CPU cost scaling
}

// ── Selectivity ─────────────────────────────────────────────────────────

export function computeSelectivity(predicate: Predicate): number {
  const cs = getColumnStats(predicate.table, predicate.column)
  const ts = getTableStats(predicate.table)
  if (!cs || !ts) return 0.1  // default if no stats

  const { ndv, nullCount, low, high } = cs
  const numRows = ts.numRows

  switch (predicate.type) {
    case 'EQUALITY': {
      // sel = 1 / NDV  (Oracle formula)
      return ndv > 0 ? 1 / ndv : 0.01
    }
    case 'RANGE': {
      // sel = (high - value) / (high - low)  or  (value - low) / (high - low)
      const val = typeof predicate.value === 'number' ? predicate.value : parseFloat(String(predicate.value)) || (high - low) / 2
      const range = high - low
      if (range <= 0) return 0.5
      switch (predicate.operator) {
        case '>':  return Math.max(0, (high - val) / range)
        case '>=': return Math.max(0, (high - val + 1) / range)
        case '<':  return Math.max(0, (val - low) / range)
        case '<=': return Math.max(0, (val - low + 1) / range)
        default:   return 0.5
      }
    }
    case 'LIKE': {
      // Leading wildcard: full selectivity (no index benefit)
      // Trailing wildcard: 1/NDV * sqrt(NDV)
      const val = String(predicate.value)
      if (val.startsWith('%')) return 1 / Math.sqrt(ndv) || 0.1
      return Math.min(1, 1 / Math.sqrt(ndv))
    }
    case 'IN': {
      // sel = n_values / NDV  (capped at 0.9)
      const vals = String(predicate.value).split(',').length
      return Math.min(0.9, vals / ndv)
    }
    case 'IS_NULL': {
      return numRows > 0 ? nullCount / numRows : 0.01
    }
    default:
      return 0.1
  }
}

export function combineSelectivities(sels: number[]): number {
  // Oracle multiplies independent selectivities
  return sels.reduce((acc, s) => acc * s, 1)
}

// ── Cardinality ──────────────────────────────────────────────────────────

export function computeCardinality(tableName: string, selectivity: number): number {
  const ts = getTableStats(tableName)
  if (!ts) return 100
  return Math.max(1, Math.round(ts.numRows * selectivity))
}

// ── I/O Cost ─────────────────────────────────────────────────────────────

function fullTableScanCost(ts: TableStats): number {
  // Cost = ceil(numBlocks / MBRC) * (MREADTIM / SREADTIM)
  const ioUnits = Math.ceil(ts.numBlocks / SYSTEM_PARAMS.MBRC)
  return Math.max(1, ioUnits * (SYSTEM_PARAMS.MREADTIM / SYSTEM_PARAMS.SREADTIM))
}

function indexRangeScanCost(ts: TableStats, cardinality: number): number {
  // Cost = index height + cardinality * (SREADTIM / MREADTIM)
  // Index height ≈ 2 for small tables
  const indexHeight = ts.numRows > 1000 ? 3 : 2
  const leafBlocks = Math.max(1, Math.ceil(ts.numBlocks / 4))  // ~25% index overhead
  const rowFetches = Math.max(1, cardinality)
  // Each row fetch = 1 single-block I/O (assuming no clustering)
  return indexHeight + Math.min(rowFetches, leafBlocks)
}

function indexUniqueScanCost(ts: TableStats): number {
  // Cost = index height (2-3 blocks) + 1 table block access
  return ts.numRows > 1000 ? 3 : 2
}

function indexFastFullScanCost(ts: TableStats): number {
  // Similar to FTS but only reads index blocks (~25% of table)
  const indexBlocks = Math.max(1, Math.ceil(ts.numBlocks / 4))
  return Math.ceil(indexBlocks / SYSTEM_PARAMS.MBRC) * (SYSTEM_PARAMS.MREADTIM / SYSTEM_PARAMS.SREADTIM)
}

// ── Access Path Generation ────────────────────────────────────────────────

export function generateAccessPaths(
  tableName: string,
  predicates: Predicate[],
): AccessPath[] {
  const ts = getTableStats(tableName)
  if (!ts) {
    return [{
      type: 'FULL_TABLE_SCAN',
      tableName,
      selectivity: 1,
      cardinality: 100,
      cost: 10,
      ioCost: 10,
      cpuCost: 0,
      chosen: true,
      reason: '통계 정보 없음 — Full Table Scan 선택',
    }]
  }

  const tablePreds = predicates.filter(
    (p) => p.table.toUpperCase() === tableName.toUpperCase(),
  )

  // Overall selectivity (combine all predicates)
  const sels = tablePreds.length > 0
    ? tablePreds.map(computeSelectivity)
    : [1]
  const overallSel = combineSelectivities(sels)
  const cardinality = computeCardinality(tableName, overallSel)

  const paths: AccessPath[] = []

  // ── Full Table Scan ──
  const ftsCost = fullTableScanCost(ts)
  paths.push({
    type: 'FULL_TABLE_SCAN',
    tableName,
    selectivity: overallSel,
    cardinality,
    cost: ftsCost,
    ioCost: ftsCost,
    cpuCost: Math.round(ts.numRows * SYSTEM_PARAMS.CPU_COST_FACTOR),
    chosen: false,
    reason: `전체 ${ts.numBlocks} 블록 스캔 (${ts.numRows} rows)`,
  })

  // ── Index-based paths per predicate ──
  for (const pred of tablePreds) {
    const cs = getColumnStats(tableName, pred.column)
    if (!cs?.hasIndex) continue

    const sel = computeSelectivity(pred)
    const card = computeCardinality(tableName, sel)

    if (pred.type === 'EQUALITY' && cs.isPrimaryKey) {
      // Index Unique Scan
      const cost = indexUniqueScanCost(ts)
      paths.push({
        type: 'INDEX_UNIQUE_SCAN',
        tableName,
        indexName: `${tableName}_PK`,
        selectivity: sel,
        cardinality: 1,
        cost,
        ioCost: cost,
        cpuCost: SYSTEM_PARAMS.CPU_COST_FACTOR,
        chosen: false,
        reason: `PK 동등 조건 → Index Unique Scan (비용 ${cost.toFixed(1)})`,
      })
    } else if (pred.type === 'EQUALITY' && cs.hasIndex) {
      // Index Range Scan (equality on non-PK)
      const cost = indexRangeScanCost(ts, card)
      paths.push({
        type: 'INDEX_RANGE_SCAN',
        tableName,
        indexName: `${tableName}_${cs.columnName}_IDX`,
        selectivity: sel,
        cardinality: card,
        cost,
        ioCost: cost,
        cpuCost: Math.round(card * SYSTEM_PARAMS.CPU_COST_FACTOR),
        chosen: false,
        reason: `동등 조건 (${cs.columnName}) → Index Range Scan (비용 ${cost.toFixed(1)})`,
      })
    } else if (pred.type === 'RANGE' && cs.hasIndex) {
      const cost = indexRangeScanCost(ts, card)
      paths.push({
        type: 'INDEX_RANGE_SCAN',
        tableName,
        indexName: `${tableName}_${cs.columnName}_IDX`,
        selectivity: sel,
        cardinality: card,
        cost,
        ioCost: cost,
        cpuCost: Math.round(card * SYSTEM_PARAMS.CPU_COST_FACTOR),
        chosen: false,
        reason: `범위 조건 (${cs.columnName}) → Index Range Scan (비용 ${cost.toFixed(1)})`,
      })
    } else if (pred.type === 'LIKE' && cs.hasIndex && !String(pred.value).startsWith('%')) {
      const cost = indexRangeScanCost(ts, card)
      paths.push({
        type: 'INDEX_RANGE_SCAN',
        tableName,
        indexName: `${tableName}_${cs.columnName}_IDX`,
        selectivity: sel,
        cardinality: card,
        cost,
        ioCost: cost,
        cpuCost: Math.round(card * SYSTEM_PARAMS.CPU_COST_FACTOR),
        chosen: false,
        reason: `LIKE (선행 패턴) → Index Range Scan (비용 ${cost.toFixed(1)})`,
      })
    }
  }

  // ── Index Fast Full Scan (for column-subset queries) ──
  // Offered when selectivity > 0.3 but cheaper than FTS on index-only access
  const ffsCost = indexFastFullScanCost(ts)
  if (ffsCost < ftsCost * 0.7 && tablePreds.length === 0) {
    paths.push({
      type: 'INDEX_FAST_FULL_SCAN',
      tableName,
      indexName: `${tableName}_PK`,
      selectivity: 1,
      cardinality: ts.numRows,
      cost: ffsCost,
      ioCost: ffsCost,
      cpuCost: Math.round(ts.numRows * SYSTEM_PARAMS.CPU_COST_FACTOR),
      chosen: false,
      reason: `인덱스만으로 결과 충족 → Index Fast Full Scan (비용 ${ffsCost.toFixed(1)})`,
    })
  }

  // ── Choose lowest-cost path ──
  paths.sort((a, b) => a.cost - b.cost)
  paths[0].chosen = true

  return paths
}

// ── Join Cost Estimation ──────────────────────────────────────────────────

export function estimateJoinCost(
  leftCard: number,
  rightCard: number,
  rightHasIndex: boolean,
  isEquijoin: boolean,
): { method: import('./types').JoinMethod; cost: number; reason: string } {
  const nlCost = leftCard * (rightHasIndex ? Math.log2(rightCard + 1) : rightCard)
  const hashCost = leftCard + rightCard + Math.sqrt(leftCard * rightCard) * 0.5
  const smjCost = (leftCard + rightCard) * Math.log2(leftCard + rightCard + 1)

  if (!isEquijoin) {
    return {
      method: 'SORT_MERGE_JOIN',
      cost: smjCost,
      reason: `비등호 조인 → Sort-Merge Join 선택 (비용 ${smjCost.toFixed(1)})`,
    }
  }

  const costs: Array<{ method: import('./types').JoinMethod; cost: number; reason: string }> = [
    {
      method: 'NESTED_LOOPS',
      cost: nlCost,
      reason: rightHasIndex
        ? `Inner 테이블에 인덱스 있음 → Nested Loops 유리 (비용 ${nlCost.toFixed(1)})`
        : `소규모 테이블 → Nested Loops (비용 ${nlCost.toFixed(1)})`,
    },
    {
      method: 'HASH_JOIN',
      cost: hashCost,
      reason: `대용량 equijoin → Hash Join (비용 ${hashCost.toFixed(1)})`,
    },
    {
      method: 'SORT_MERGE_JOIN',
      cost: smjCost,
      reason: `정렬 후 병합 → Sort-Merge Join (비용 ${smjCost.toFixed(1)})`,
    },
  ]

  costs.sort((a, b) => a.cost - b.cost)
  return costs[0]
}
