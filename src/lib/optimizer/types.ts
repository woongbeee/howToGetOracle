// ─── Oracle Optimizer Types ────────────────────────────────────────────────
// Based on Oracle Database 21c SQL Tuning Guide

export type AccessPathType =
  | 'FULL_TABLE_SCAN'
  | 'INDEX_UNIQUE_SCAN'
  | 'INDEX_RANGE_SCAN'
  | 'INDEX_FULL_SCAN'
  | 'INDEX_FAST_FULL_SCAN'
  | 'INDEX_SKIP_SCAN'

export type JoinMethod = 'NESTED_LOOPS' | 'HASH_JOIN' | 'SORT_MERGE_JOIN'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

export type PredicateType = 'EQUALITY' | 'RANGE' | 'LIKE' | 'IS_NULL' | 'IN'

export interface TableStats {
  tableName: string
  numRows: number
  numBlocks: number
  avgRowLen: number
  columns: ColumnStats[]
}

export interface ColumnStats {
  columnName: string
  ndv: number          // Number of Distinct Values
  nullCount: number
  low: number          // min value (numeric representation)
  high: number         // max value (numeric representation)
  hasIndex: boolean
  isIndexLeadingCol: boolean
  isPrimaryKey: boolean
}

export interface Predicate {
  table: string
  column: string
  operator: '=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IS NULL' | 'IN' | 'BETWEEN'
  value: string | number | null
  type: PredicateType
}

export interface JoinCondition {
  leftTable: string
  leftColumn: string
  rightTable: string
  rightColumn: string
  type: JoinType
}

export interface ParsedQuery {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UNKNOWN'
  tables: string[]          // FROM clause tables
  columns: string[]         // SELECT columns (or ['*'])
  predicates: Predicate[]   // WHERE conditions
  joins: JoinCondition[]    // JOIN conditions
  hasGroupBy: boolean
  hasOrderBy: boolean
  hasDistinct: boolean
  rawSQL: string
}

export interface AccessPath {
  type: AccessPathType
  tableName: string
  indexName?: string
  selectivity: number   // 0..1
  cardinality: number   // estimated rows returned
  cost: number          // total estimated cost (I/O + CPU)
  ioCost: number
  cpuCost: number
  chosen: boolean
  reason: string
}

export interface TableAccessPlan {
  tableName: string
  accessPaths: AccessPath[]   // all candidate paths
  chosen: AccessPath          // lowest-cost path
}

export interface JoinStep {
  leftTable: string
  rightTable: string
  method: JoinMethod
  condition: JoinCondition
  inputCardinality: { left: number; right: number }
  outputCardinality: number
  cost: number
  reason: string
}

export interface ExecutionPlan {
  id: string
  query: ParsedQuery
  tableAccessPlans: TableAccessPlan[]
  joinSteps: JoinStep[]
  totalCost: number
  estimatedRows: number
  transformations: string[]   // Query Transformer steps applied
  warnings: string[]
}

export interface OptimizerResult {
  plan: ExecutionPlan
  phases: OptimizerPhase[]
}

export interface OptimizerPhase {
  name: 'Query Transformer' | 'Estimator' | 'Plan Generator'
  description: string
  details: string[]
  cost?: number
}
