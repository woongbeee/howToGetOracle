// ─── Oracle Plan Generator ────────────────────────────────────────────────
// Generates an execution plan from a parsed query using the Estimator.
// Implements Oracle's query transformation steps and plan selection logic.

import type {
  ParsedQuery, ExecutionPlan, TableAccessPlan, JoinStep,
  OptimizerResult, OptimizerPhase,
} from './types'
import { generateAccessPaths, estimateJoinCost } from './estimator'
import { getTableStats, getColumnStats } from './stats'
import { parseSQL } from './parser'

// ── Query Transformer ─────────────────────────────────────────────────────

function applyTransformations(query: ParsedQuery): { transformed: ParsedQuery; transformations: string[] } {
  const transformations: string[] = []
  const transformed = { ...query }

  // 1. View Merging — inline views (not applicable for simple queries)

  // 2. Predicate Pushing — push predicates down to base tables
  if (query.tables.length > 1 && query.predicates.length > 0) {
    transformations.push('Predicate Pushing: WHERE 조건을 개별 테이블로 내려보냄')
  }

  // 3. Subquery Unnesting — convert correlated subqueries to joins (basic detection)
  if (/\(\s*SELECT/i.test(query.rawSQL)) {
    transformations.push('Subquery Unnesting 시도: 서브쿼리를 JOIN으로 변환 검토')
  }

  // 4. OR Expansion — split OR predicates (simplified)
  const hasOr = /\bOR\b/i.test(query.rawSQL)
  if (hasOr) {
    transformations.push('OR Expansion: OR 조건을 UNION ALL로 분리 검토')
  }

  // 5. Distinct Elimination
  if (query.hasDistinct && query.tables.length === 1) {
    const ts = getTableStats(query.tables[0])
    if (ts) {
      const pkCols = ts.columns.filter((c) => c.isPrimaryKey)
      if (query.columns.some((col) => pkCols.find((pk) => pk.columnName === col.toUpperCase()))) {
        transformations.push('Distinct Elimination: PK 포함 시 DISTINCT 제거 가능')
      }
    }
  }

  // 6. Count(*) Optimization
  if (query.rawSQL.toUpperCase().includes('COUNT(*)') && query.tables.length === 1 && query.predicates.length === 0) {
    transformations.push('Count(*) Optimization: 통계에서 NUM_ROWS 직접 반환 가능')
  }

  if (transformations.length === 0) {
    transformations.push('변환 없음: 쿼리 구조가 이미 최적화됨')
  }

  return { transformed, transformations }
}

// ── Access Path Selection ─────────────────────────────────────────────────

function buildTableAccessPlans(query: ParsedQuery): TableAccessPlan[] {
  return query.tables.map((tableName) => {
    const paths = generateAccessPaths(tableName, query.predicates)
    const chosen = paths.find((p) => p.chosen) ?? paths[0]
    return { tableName, accessPaths: paths, chosen }
  })
}

// ── Join Order & Method ───────────────────────────────────────────────────

function buildJoinPlan(
  query: ParsedQuery,
  accessPlans: TableAccessPlan[],
): JoinStep[] {
  if (query.joins.length === 0 || query.tables.length < 2) return []

  const joinSteps: JoinStep[] = []

  // Determine join order: drive from smallest cardinality (simple heuristic)
  const cardMap: Record<string, number> = {}
  for (const ap of accessPlans) {
    cardMap[ap.tableName] = ap.chosen.cardinality
  }

  // Process each join condition
  for (const join of query.joins) {
    const leftCard = cardMap[join.leftTable] ?? 100
    const rightCard = cardMap[join.rightTable] ?? 100

    // Check if the right table's join column has an index
    const rightCs = getColumnStats(join.rightTable, join.rightColumn)
    const rightHasIndex = rightCs?.hasIndex ?? false

    const isEquijoin = true  // all our extracted joins are equijoins

    const { method, cost, reason } = estimateJoinCost(leftCard, rightCard, rightHasIndex, isEquijoin)

    // Output cardinality: leftCard * rightCard * join selectivity
    // Join selectivity ≈ 1 / max(NDV_left, NDV_right)
    const leftCs = getColumnStats(join.leftTable, join.leftColumn)
    const maxNdv = Math.max(leftCs?.ndv ?? leftCard, rightCs?.ndv ?? rightCard)
    const joinSel = maxNdv > 0 ? 1 / maxNdv : 0.1
    const outputCard = Math.max(1, Math.round(leftCard * rightCard * joinSel))

    joinSteps.push({
      leftTable: join.leftTable,
      rightTable: join.rightTable,
      method,
      condition: join,
      inputCardinality: { left: leftCard, right: rightCard },
      outputCardinality: outputCard,
      cost,
      reason,
    })

    // Update running cardinality for next join
    cardMap[join.rightTable] = outputCard
    cardMap[join.leftTable] = outputCard
  }

  return joinSteps
}

// ── Main Entry Point ─────────────────────────────────────────────────────

export function optimize(sql: string): OptimizerResult {
  const query = parseSQL(sql)

  // ── Phase 1: Query Transformer ──
  const { transformed, transformations } = applyTransformations(query)

  const transformerPhase: OptimizerPhase = {
    name: 'Query Transformer',
    description: '쿼리를 의미를 유지하면서 더 효율적인 동등 형태로 변환',
    details: transformations,
  }

  // ── Phase 2: Estimator ──
  const accessPlans = buildTableAccessPlans(transformed)
  const joinSteps = buildJoinPlan(transformed, accessPlans)

  const estimatorDetails: string[] = []
  for (const ap of accessPlans) {
    const ts = getTableStats(ap.tableName)
    estimatorDetails.push(
      `${ap.tableName}: ${ts?.numRows ?? '?'} rows, ` +
      `선택도 ${(ap.chosen.selectivity * 100).toFixed(1)}%, ` +
      `예상 cardinality ${ap.chosen.cardinality}`,
    )
  }

  const estimatorPhase: OptimizerPhase = {
    name: 'Estimator',
    description: 'Selectivity·Cardinality·Cost를 통계 기반으로 계산',
    details: estimatorDetails,
  }

  // ── Phase 3: Plan Generator ──
  const totalCost =
    accessPlans.reduce((sum, ap) => sum + ap.chosen.cost, 0) +
    joinSteps.reduce((sum, j) => sum + j.cost, 0)

  const estimatedRows =
    joinSteps.length > 0
      ? joinSteps[joinSteps.length - 1].outputCardinality
      : accessPlans[0]?.chosen.cardinality ?? 1

  const warnings: string[] = []
  for (const ap of accessPlans) {
    if (!getTableStats(ap.tableName)) {
      warnings.push(`${ap.tableName}: 통계 정보 없음 — analyze table 권장`)
    }
    if (ap.chosen.type === 'FULL_TABLE_SCAN' && ap.chosen.cardinality < 5) {
      warnings.push(`${ap.tableName}: FTS이지만 cardinality가 낮음 — 인덱스 추가 고려`)
    }
  }

  const planGeneratorPhase: OptimizerPhase = {
    name: 'Plan Generator',
    description: '가능한 실행 계획을 열거하고 최저 비용 계획 선택',
    details: [
      `총 예상 비용: ${totalCost.toFixed(1)}`,
      `예상 결과 rows: ${estimatedRows}`,
      ...accessPlans.map((ap) => `${ap.tableName} → ${ap.chosen.type} (비용 ${ap.chosen.cost.toFixed(1)})`),
      ...joinSteps.map((j) => `JOIN ${j.leftTable}⋈${j.rightTable} → ${j.method}`),
    ],
    cost: totalCost,
  }

  const plan: ExecutionPlan = {
    id: `plan_${Date.now()}`,
    query: transformed,
    tableAccessPlans: accessPlans,
    joinSteps,
    totalCost,
    estimatedRows,
    transformations,
    warnings,
  }

  return {
    plan,
    phases: [transformerPhase, estimatorPhase, planGeneratorPhase],
  }
}
