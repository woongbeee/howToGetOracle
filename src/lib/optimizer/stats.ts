// ─── Table Statistics (simulated Oracle DBMS_STATS data) ──────────────────
// These approximate the statistics Oracle's CBO uses.
// Based on the actual row counts in our HR and CO sample schemas.

import type { TableStats } from './types'

export const TABLE_STATS: Record<string, TableStats> = {
  // ── HR Schema ──────────────────────────────────────────────────────────
  REGIONS: {
    tableName: 'REGIONS',
    numRows: 4,
    numBlocks: 1,
    avgRowLen: 20,
    columns: [
      { columnName: 'REGION_ID',   ndv: 4,  nullCount: 0, low: 1, high: 4,  hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'REGION_NAME', ndv: 4,  nullCount: 0, low: 0, high: 4,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
  COUNTRIES: {
    tableName: 'COUNTRIES',
    numRows: 25,
    numBlocks: 2,
    avgRowLen: 40,
    columns: [
      { columnName: 'COUNTRY_ID',   ndv: 25, nullCount: 0, low: 0, high: 25, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'COUNTRY_NAME', ndv: 25, nullCount: 0, low: 0, high: 25, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'REGION_ID',    ndv: 4,  nullCount: 0, low: 1, high: 4,  hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
    ],
  },
  LOCATIONS: {
    tableName: 'LOCATIONS',
    numRows: 23,
    numBlocks: 3,
    avgRowLen: 60,
    columns: [
      { columnName: 'LOCATION_ID',  ndv: 23, nullCount: 0, low: 1000, high: 3200, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'CITY',         ndv: 22, nullCount: 0, low: 0,    high: 22,   hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'COUNTRY_ID',   ndv: 14, nullCount: 0, low: 0,    high: 14,   hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
    ],
  },
  DEPARTMENTS: {
    tableName: 'DEPARTMENTS',
    numRows: 27,
    numBlocks: 3,
    avgRowLen: 50,
    columns: [
      { columnName: 'DEPARTMENT_ID',   ndv: 27, nullCount: 0, low: 10,  high: 270, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'DEPARTMENT_NAME', ndv: 27, nullCount: 0, low: 0,   high: 27,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'MANAGER_ID',      ndv: 19, nullCount: 1, low: 100, high: 205, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'LOCATION_ID',     ndv: 7,  nullCount: 1, low: 1400,high: 2700,hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
    ],
  },
  JOBS: {
    tableName: 'JOBS',
    numRows: 19,
    numBlocks: 2,
    avgRowLen: 40,
    columns: [
      { columnName: 'JOB_ID',    ndv: 19, nullCount: 0, low: 0, high: 19, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'JOB_TITLE', ndv: 19, nullCount: 0, low: 0, high: 19, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'MIN_SALARY',ndv: 17, nullCount: 0, low: 2100, high: 20000, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'MAX_SALARY',ndv: 18, nullCount: 0, low: 4500, high: 40000, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
  EMPLOYEES: {
    tableName: 'EMPLOYEES',
    numRows: 15,
    numBlocks: 2,
    avgRowLen: 70,
    columns: [
      { columnName: 'EMPLOYEE_ID',   ndv: 15,  nullCount: 0, low: 100, high: 201, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'FIRST_NAME',    ndv: 15,  nullCount: 0, low: 0,   high: 15,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'LAST_NAME',     ndv: 15,  nullCount: 0, low: 0,   high: 15,  hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'EMAIL',         ndv: 15,  nullCount: 0, low: 0,   high: 15,  hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'SALARY',        ndv: 14,  nullCount: 0, low: 2700,high: 24000,hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'DEPARTMENT_ID', ndv: 8,   nullCount: 0, low: 10,  high: 100, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'JOB_ID',        ndv: 12,  nullCount: 0, low: 0,   high: 12,  hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'MANAGER_ID',    ndv: 8,   nullCount: 1, low: 100, high: 201, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
    ],
  },
  JOB_HISTORY: {
    tableName: 'JOB_HISTORY',
    numRows: 10,
    numBlocks: 1,
    avgRowLen: 55,
    columns: [
      { columnName: 'EMPLOYEE_ID',   ndv: 8,  nullCount: 0, low: 100, high: 200, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'START_DATE',    ndv: 10, nullCount: 0, low: 0,   high: 10,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'END_DATE',      ndv: 10, nullCount: 0, low: 0,   high: 10,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'JOB_ID',        ndv: 8,  nullCount: 0, low: 0,   high: 8,   hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'DEPARTMENT_ID', ndv: 7,  nullCount: 0, low: 20,  high: 110, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
    ],
  },
  // ── CO Schema ──────────────────────────────────────────────────────────
  CUSTOMERS: {
    tableName: 'CUSTOMERS',
    numRows: 10,
    numBlocks: 2,
    avgRowLen: 80,
    columns: [
      { columnName: 'CUSTOMER_ID',   ndv: 10, nullCount: 0, low: 1,  high: 10, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'EMAIL_ADDRESS', ndv: 10, nullCount: 0, low: 0,  high: 10, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'FULL_NAME',     ndv: 10, nullCount: 0, low: 0,  high: 10, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
  STORES: {
    tableName: 'STORES',
    numRows: 5,
    numBlocks: 1,
    avgRowLen: 60,
    columns: [
      { columnName: 'STORE_ID',   ndv: 5, nullCount: 0, low: 1, high: 5, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'STORE_NAME', ndv: 5, nullCount: 0, low: 0, high: 5, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
  PRODUCTS: {
    tableName: 'PRODUCTS',
    numRows: 10,
    numBlocks: 2,
    avgRowLen: 65,
    columns: [
      { columnName: 'PRODUCT_ID',   ndv: 10, nullCount: 0, low: 1,   high: 10,   hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'PRODUCT_NAME', ndv: 10, nullCount: 0, low: 0,   high: 10,   hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'UNIT_PRICE',   ndv: 10, nullCount: 0, low: 100, high: 2000, hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
  ORDERS: {
    tableName: 'ORDERS',
    numRows: 10,
    numBlocks: 2,
    avgRowLen: 55,
    columns: [
      { columnName: 'ORDER_ID',    ndv: 10, nullCount: 0, low: 1,  high: 10, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'CUSTOMER_ID', ndv: 7,  nullCount: 0, low: 1,  high: 10, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'STORE_ID',    ndv: 5,  nullCount: 0, low: 1,  high: 5,  hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'ORDER_DATE',  ndv: 9,  nullCount: 0, low: 0,  high: 9,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
  ORDER_ITEMS: {
    tableName: 'ORDER_ITEMS',
    numRows: 20,
    numBlocks: 3,
    avgRowLen: 45,
    columns: [
      { columnName: 'ORDER_ID',    ndv: 10, nullCount: 0, low: 1,  high: 10, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: true },
      { columnName: 'LINE_ITEM_ID',ndv: 20, nullCount: 0, low: 1,  high: 5,  hasIndex: true,  isIndexLeadingCol: false, isPrimaryKey: true },
      { columnName: 'PRODUCT_ID',  ndv: 10, nullCount: 0, low: 1,  high: 10, hasIndex: true,  isIndexLeadingCol: true,  isPrimaryKey: false },
      { columnName: 'UNIT_PRICE',  ndv: 10, nullCount: 0, low: 100,high: 2000,hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
      { columnName: 'QUANTITY',    ndv: 5,  nullCount: 0, low: 1,  high: 5,  hasIndex: false, isIndexLeadingCol: false, isPrimaryKey: false },
    ],
  },
}

export function getTableStats(tableName: string): TableStats | null {
  return TABLE_STATS[tableName.toUpperCase()] ?? null
}

export function getColumnStats(tableName: string, columnName: string) {
  const ts = getTableStats(tableName)
  if (!ts) return null
  return ts.columns.find((c) => c.columnName === columnName.toUpperCase()) ?? null
}
