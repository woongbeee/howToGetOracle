/**
 * Large Dataset Generator for Oracle Index Visualization
 *
 * 앱 최초 import 시 1회 생성되어 모듈 캐시에 유지됨.
 * 각 테이블은 인덱스 유형별 시나리오를 커버하는 카디널리티 프로파일을 가짐:
 *
 * EMPLOYEES  (10,000 rows) — B-Tree(PK), Bitmap(GENDER/STATUS/DEPT), 복합(DEPT+JOB)
 * PRODUCTS   (1,000 rows)  — B-Tree(PK), Unique(SKU), Bitmap(CATEGORY/STATUS)
 * ORDERS     (50,000 rows) — B-Tree(PK+FK), Range scan(ORDER_DATE), Bitmap(STATUS)
 * ORDER_ITEMS(100,000 rows) — 복합 PK(ORDER_ID+LINE_NO), FK B-Tree
 * AUDIT_LOG  (200,000 rows) — FBI(UPPER(ACTION)), 날짜 Range, 저카디널리티 Bitmap
 */

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
// 매 실행마다 동일 시드로 시작하되 약간의 entropy를 섞어 "매번 다른 느낌"을 줌
function makePrng(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 실행마다 시드를 살짝 바꿔 데이터가 매번 조금씩 달라지게 함
const SEED = (Date.now() & 0xffff) ^ 0xa3c1
const rng = makePrng(SEED)

function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}
function pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// ── Lookup pools ─────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Barbara',
  'David','Susan','Richard','Jessica','Joseph','Sarah','Thomas','Karen','Charles','Lisa',
  'Christopher','Nancy','Daniel','Betty','Matthew','Margaret','Anthony','Sandra','Mark','Ashley',
  'Donald','Emily','Steven','Dorothy','Paul','Kimberly','Andrew','Carol','Kenneth','Michelle',
  'Joshua','Amanda','Kevin','Melissa','Brian','Deborah','George','Stephanie','Timothy','Rebecca',
]

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
]

const DEPARTMENTS = [
  { id: 10, name: 'Administration' },
  { id: 20, name: 'Marketing' },
  { id: 30, name: 'Purchasing' },
  { id: 40, name: 'Human Resources' },
  { id: 50, name: 'Shipping' },
  { id: 60, name: 'IT' },
  { id: 70, name: 'Public Relations' },
  { id: 80, name: 'Sales' },
  { id: 90, name: 'Executive' },
  { id: 100, name: 'Finance' },
  { id: 110, name: 'Accounting' },
  { id: 120, name: 'Operations' },
]

const JOB_IDS = [
  'AD_PRES','AD_VP','AD_ASST',
  'FI_MGR','FI_ACCOUNT',
  'AC_MGR','AC_ACCOUNT',
  'SA_MAN','SA_REP',
  'PU_MAN','PU_CLERK',
  'ST_MAN','ST_CLERK',
  'IT_PROG',
  'MK_MAN','MK_REP',
  'HR_REP','PR_REP',
]

// 저카디널리티 컬럼 — Bitmap 인덱스 시나리오용
const GENDERS = ['M', 'F'] as const
const EMP_STATUS = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const
const EMP_STATUS_WEIGHTS = [80, 12, 8] as const

const PRODUCT_CATEGORIES = ['Electronics','Clothing','Books','Home & Garden','Sports','Toys','Food','Automotive'] as const
const PRODUCT_STATUS = ['AVAILABLE','DISCONTINUED','OUT_OF_STOCK'] as const
const PRODUCT_STATUS_WEIGHTS = [70, 15, 15] as const

const ORDER_STATUS = ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED'] as const
const ORDER_STATUS_WEIGHTS = [5, 10, 15, 60, 7, 3] as const

const PAYMENT_METHODS = ['CREDIT_CARD','DEBIT_CARD','PAYPAL','BANK_TRANSFER','CASH'] as const
const PAYMENT_WEIGHTS = [45, 25, 20, 7, 3] as const

const AUDIT_ACTIONS = ['SELECT','INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT'] as const
const AUDIT_WEIGHTS = [50, 15, 20, 5, 5, 4, 1] as const

// ── Date helpers ─────────────────────────────────────────────────────────────

function randDate(fromYear: number, toYear: number): string {
  const from = new Date(fromYear, 0, 1).getTime()
  const to   = new Date(toYear, 11, 31).getTime()
  const ts   = from + rng() * (to - from)
  return new Date(ts).toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// ── Row type ─────────────────────────────────────────────────────────────────

export type LargeRow = Record<string, string | number | null>

export interface LargeColumn {
  name: string
  type: string
  /** 해당 컬럼이 어떤 인덱스 유형에 적합한지 힌트 */
  indexHint?: 'btree-unique' | 'btree-nonunique' | 'bitmap' | 'composite' | 'fbi' | 'range'
}

export interface LargeTable {
  name: string
  description: string
  /** 테이블 특징 설명 — 인덱스 패널에서 사용 */
  indexProfile: string
  columns: LargeColumn[]
  rows: LargeRow[]
  /** 컬럼별 카디널리티 통계 (NDV 추정치) */
  columnStats: Record<string, { ndv: number; nullPct: number }>
}

// ── Generators ───────────────────────────────────────────────────────────────

function generateEmployees(count: number): LargeTable {
  const rows: LargeRow[] = []

  for (let i = 1; i <= count; i++) {
    const dept = pick(DEPARTMENTS)
    const hireDate = randDate(2010, 2024)
    const salary = randInt(2000, 30000)
    rows.push({
      EMPLOYEE_ID:   i,
      FIRST_NAME:    pick(FIRST_NAMES),
      LAST_NAME:     pick(LAST_NAMES),
      EMAIL:         `emp${i}@company.com`,
      DEPARTMENT_ID: dept.id,
      JOB_ID:        pick(JOB_IDS),
      SALARY:        salary,
      HIRE_DATE:     hireDate,
      GENDER:        pick(GENDERS),
      STATUS:        pickWeighted(EMP_STATUS, EMP_STATUS_WEIGHTS),
      MANAGER_ID:    i === 1 ? null : randInt(1, Math.max(1, i - 1)),
    })
  }

  return {
    name: 'EMPLOYEES',
    description: '직원 정보 테이블 (대용량)',
    indexProfile:
      'EMPLOYEE_ID(PK, Unique B-Tree) · DEPARTMENT_ID(Non-Unique B-Tree, FK) · ' +
      'GENDER/STATUS(Bitmap, 저카디널리티) · (DEPARTMENT_ID, JOB_ID)(복합 B-Tree)',
    columns: [
      { name: 'EMPLOYEE_ID',   type: 'NUMBER(8)',      indexHint: 'btree-unique' },
      { name: 'FIRST_NAME',    type: 'VARCHAR2(50)' },
      { name: 'LAST_NAME',     type: 'VARCHAR2(50)' },
      { name: 'EMAIL',         type: 'VARCHAR2(100)',  indexHint: 'btree-unique' },
      { name: 'DEPARTMENT_ID', type: 'NUMBER(4)',      indexHint: 'btree-nonunique' },
      { name: 'JOB_ID',        type: 'VARCHAR2(10)',   indexHint: 'composite' },
      { name: 'SALARY',        type: 'NUMBER(10,2)',   indexHint: 'range' },
      { name: 'HIRE_DATE',     type: 'DATE',           indexHint: 'range' },
      { name: 'GENDER',        type: 'CHAR(1)',        indexHint: 'bitmap' },
      { name: 'STATUS',        type: 'VARCHAR2(20)',   indexHint: 'bitmap' },
      { name: 'MANAGER_ID',    type: 'NUMBER(8)',      indexHint: 'btree-nonunique' },
    ],
    rows,
    columnStats: {
      EMPLOYEE_ID:   { ndv: count,       nullPct: 0 },
      FIRST_NAME:    { ndv: 50,          nullPct: 0 },
      LAST_NAME:     { ndv: 50,          nullPct: 0 },
      EMAIL:         { ndv: count,       nullPct: 0 },
      DEPARTMENT_ID: { ndv: DEPARTMENTS.length, nullPct: 0 },
      JOB_ID:        { ndv: JOB_IDS.length,     nullPct: 0 },
      SALARY:        { ndv: Math.round(count * 0.6), nullPct: 0 },
      HIRE_DATE:     { ndv: Math.round(count * 0.7), nullPct: 0 },
      GENDER:        { ndv: 2,           nullPct: 0 },
      STATUS:        { ndv: 3,           nullPct: 0 },
      MANAGER_ID:    { ndv: Math.round(count * 0.05), nullPct: 1 },
    },
  }
}

function generateProducts(count: number): LargeTable {
  const rows: LargeRow[] = []

  for (let i = 1; i <= count; i++) {
    const category = pick(PRODUCT_CATEGORIES)
    const basePrice = randInt(5, 5000)
    rows.push({
      PRODUCT_ID:   i,
      SKU:          `SKU-${String(i).padStart(6, '0')}`,
      PRODUCT_NAME: `${category} Item ${i}`,
      CATEGORY:     category,
      UNIT_PRICE:   basePrice,
      STOCK_QTY:    randInt(0, 5000),
      STATUS:       pickWeighted(PRODUCT_STATUS, PRODUCT_STATUS_WEIGHTS),
      CREATED_DATE: randDate(2018, 2024),
    })
  }

  return {
    name: 'PRODUCTS',
    description: '상품 정보 테이블 (대용량)',
    indexProfile:
      'PRODUCT_ID(PK, Unique B-Tree) · SKU(Unique B-Tree) · ' +
      'CATEGORY/STATUS(Bitmap, 저카디널리티) · UNIT_PRICE(Range 스캔)',
    columns: [
      { name: 'PRODUCT_ID',   type: 'NUMBER(8)',      indexHint: 'btree-unique' },
      { name: 'SKU',          type: 'VARCHAR2(20)',   indexHint: 'btree-unique' },
      { name: 'PRODUCT_NAME', type: 'VARCHAR2(200)' },
      { name: 'CATEGORY',     type: 'VARCHAR2(50)',   indexHint: 'bitmap' },
      { name: 'UNIT_PRICE',   type: 'NUMBER(10,2)',   indexHint: 'range' },
      { name: 'STOCK_QTY',    type: 'NUMBER(8)',      indexHint: 'range' },
      { name: 'STATUS',       type: 'VARCHAR2(20)',   indexHint: 'bitmap' },
      { name: 'CREATED_DATE', type: 'DATE',           indexHint: 'range' },
    ],
    rows,
    columnStats: {
      PRODUCT_ID:   { ndv: count,   nullPct: 0 },
      SKU:          { ndv: count,   nullPct: 0 },
      PRODUCT_NAME: { ndv: count,   nullPct: 0 },
      CATEGORY:     { ndv: PRODUCT_CATEGORIES.length, nullPct: 0 },
      UNIT_PRICE:   { ndv: Math.round(count * 0.8), nullPct: 0 },
      STOCK_QTY:    { ndv: Math.round(count * 0.9), nullPct: 0 },
      STATUS:       { ndv: 3,       nullPct: 0 },
      CREATED_DATE: { ndv: Math.round(count * 0.5), nullPct: 0 },
    },
  }
}

function generateOrders(count: number, customerCount: number, storeCount: number): LargeTable {
  const rows: LargeRow[] = []

  for (let i = 1; i <= count; i++) {
    const orderDate = randDate(2020, 2024)
    const status = pickWeighted(ORDER_STATUS, ORDER_STATUS_WEIGHTS)
    const deliveryDate =
      status === 'DELIVERED' || status === 'RETURNED'
        ? addDays(orderDate, randInt(3, 14))
        : null
    rows.push({
      ORDER_ID:        i,
      CUSTOMER_ID:     randInt(1, customerCount),
      STORE_ID:        randInt(1, storeCount),
      ORDER_DATE:      orderDate,
      DELIVERY_DATE:   deliveryDate,
      STATUS:          status,
      PAYMENT_METHOD:  pickWeighted(PAYMENT_METHODS, PAYMENT_WEIGHTS),
      TOTAL_AMOUNT:    randInt(10, 50000),
    })
  }

  return {
    name: 'ORDERS',
    description: '주문 정보 테이블 (대용량)',
    indexProfile:
      'ORDER_ID(PK, Unique B-Tree) · CUSTOMER_ID/STORE_ID(Non-Unique B-Tree, FK) · ' +
      'STATUS/PAYMENT_METHOD(Bitmap) · ORDER_DATE(Range 스캔) · (CUSTOMER_ID, ORDER_DATE)(복합)',
    columns: [
      { name: 'ORDER_ID',       type: 'NUMBER(10)',    indexHint: 'btree-unique' },
      { name: 'CUSTOMER_ID',    type: 'NUMBER(8)',     indexHint: 'btree-nonunique' },
      { name: 'STORE_ID',       type: 'NUMBER(4)',     indexHint: 'btree-nonunique' },
      { name: 'ORDER_DATE',     type: 'DATE',          indexHint: 'range' },
      { name: 'DELIVERY_DATE',  type: 'DATE',          indexHint: 'range' },
      { name: 'STATUS',         type: 'VARCHAR2(20)',  indexHint: 'bitmap' },
      { name: 'PAYMENT_METHOD', type: 'VARCHAR2(30)',  indexHint: 'bitmap' },
      { name: 'TOTAL_AMOUNT',   type: 'NUMBER(12,2)',  indexHint: 'range' },
    ],
    rows,
    columnStats: {
      ORDER_ID:       { ndv: count, nullPct: 0 },
      CUSTOMER_ID:    { ndv: customerCount, nullPct: 0 },
      STORE_ID:       { ndv: storeCount,    nullPct: 0 },
      ORDER_DATE:     { ndv: Math.round(count * 0.2), nullPct: 0 },
      DELIVERY_DATE:  { ndv: Math.round(count * 0.15), nullPct: 30 },
      STATUS:         { ndv: ORDER_STATUS.length,  nullPct: 0 },
      PAYMENT_METHOD: { ndv: PAYMENT_METHODS.length, nullPct: 0 },
      TOTAL_AMOUNT:   { ndv: Math.round(count * 0.5), nullPct: 0 },
    },
  }
}

function generateOrderItems(count: number, orderCount: number, productCount: number): LargeTable {
  const rows: LargeRow[] = []

  // order당 line_no 추적
  const lineNoMap = new Map<number, number>()

  for (let i = 1; i <= count; i++) {
    const orderId = randInt(1, orderCount)
    const lineNo  = (lineNoMap.get(orderId) ?? 0) + 1
    lineNoMap.set(orderId, lineNo)
    const qty        = randInt(1, 20)
    const unitPrice  = randInt(5, 5000)
    rows.push({
      ORDER_ID:   orderId,
      LINE_NO:    lineNo,
      PRODUCT_ID: randInt(1, productCount),
      QUANTITY:   qty,
      UNIT_PRICE: unitPrice,
      LINE_TOTAL: qty * unitPrice,
    })
  }

  return {
    name: 'ORDER_ITEMS',
    description: '주문 항목 테이블 (대용량)',
    indexProfile:
      '(ORDER_ID, LINE_NO)(복합 PK, Unique) · PRODUCT_ID(Non-Unique B-Tree, FK) · ' +
      'ORDER_ID(Non-Unique B-Tree — ORDER JOIN 최적화)',
    columns: [
      { name: 'ORDER_ID',   type: 'NUMBER(10)',   indexHint: 'composite' },
      { name: 'LINE_NO',    type: 'NUMBER(4)',    indexHint: 'composite' },
      { name: 'PRODUCT_ID', type: 'NUMBER(8)',    indexHint: 'btree-nonunique' },
      { name: 'QUANTITY',   type: 'NUMBER(6)',    indexHint: 'range' },
      { name: 'UNIT_PRICE', type: 'NUMBER(10,2)', indexHint: 'range' },
      { name: 'LINE_TOTAL', type: 'NUMBER(14,2)', indexHint: 'fbi' },
    ],
    rows,
    columnStats: {
      ORDER_ID:   { ndv: orderCount,         nullPct: 0 },
      LINE_NO:    { ndv: 20,                 nullPct: 0 },
      PRODUCT_ID: { ndv: productCount,       nullPct: 0 },
      QUANTITY:   { ndv: 20,                 nullPct: 0 },
      UNIT_PRICE: { ndv: Math.round(count * 0.3), nullPct: 0 },
      LINE_TOTAL: { ndv: Math.round(count * 0.6), nullPct: 0 },
    },
  }
}

function generateAuditLog(count: number, empCount: number): LargeTable {
  const rows: LargeRow[] = []

  for (let i = 1; i <= count; i++) {
    const action = pickWeighted(AUDIT_ACTIONS, AUDIT_WEIGHTS)
    const actionTs = randDate(2023, 2024)
    rows.push({
      LOG_ID:       i,
      EMPLOYEE_ID:  randInt(1, empCount),
      ACTION:       action,
      ACTION_UPPER: action,           // FBI 시나리오: UPPER(ACTION)
      TABLE_NAME:   pick(['EMPLOYEES','ORDERS','PRODUCTS','ORDER_ITEMS']),
      LOG_DATE:     actionTs,
      IP_ADDRESS:   `192.168.${randInt(0, 255)}.${randInt(1, 254)}`,
      SUCCESS:      rng() > 0.05 ? 'Y' : 'N',
    })
  }

  return {
    name: 'AUDIT_LOG',
    description: '감사 로그 테이블 (대용량)',
    indexProfile:
      'LOG_ID(PK, Unique B-Tree) · UPPER(ACTION)(FBI — Function-Based Index) · ' +
      'LOG_DATE(Range 스캔) · SUCCESS/ACTION(Bitmap, 저카디널리티)',
    columns: [
      { name: 'LOG_ID',       type: 'NUMBER(12)',   indexHint: 'btree-unique' },
      { name: 'EMPLOYEE_ID',  type: 'NUMBER(8)',    indexHint: 'btree-nonunique' },
      { name: 'ACTION',       type: 'VARCHAR2(20)', indexHint: 'bitmap' },
      { name: 'ACTION_UPPER', type: 'VARCHAR2(20)', indexHint: 'fbi' },
      { name: 'TABLE_NAME',   type: 'VARCHAR2(50)', indexHint: 'bitmap' },
      { name: 'LOG_DATE',     type: 'DATE',         indexHint: 'range' },
      { name: 'IP_ADDRESS',   type: 'VARCHAR2(15)' },
      { name: 'SUCCESS',      type: 'CHAR(1)',      indexHint: 'bitmap' },
    ],
    rows,
    columnStats: {
      LOG_ID:       { ndv: count,         nullPct: 0 },
      EMPLOYEE_ID:  { ndv: empCount,      nullPct: 0 },
      ACTION:       { ndv: AUDIT_ACTIONS.length, nullPct: 0 },
      ACTION_UPPER: { ndv: AUDIT_ACTIONS.length, nullPct: 0 },
      TABLE_NAME:   { ndv: 4,             nullPct: 0 },
      LOG_DATE:     { ndv: Math.round(count * 0.05), nullPct: 0 },
      IP_ADDRESS:   { ndv: Math.round(count * 0.01), nullPct: 0 },
      SUCCESS:      { ndv: 2,             nullPct: 0 },
    },
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface LargeDataset {
  employees:  LargeTable
  products:   LargeTable
  orders:     LargeTable
  orderItems: LargeTable
  auditLog:   LargeTable
  /** 생성 소요 시간 ms */
  generatedAt: number
  elapsedMs:   number
}

/**
 * 대용량 데이터를 생성한다.
 * 모듈 캐시로 1회만 실행되므로 호출 비용 없음.
 *
 * @param scale 1.0 = 기본 크기 (EMP 10k, ORD 50k, ITEMS 100k, LOG 200k)
 *              0.1 ~ 2.0 범위를 권장. 기본값 1.0
 */
export function generateLargeDataset(scale = 1.0): LargeDataset {
  const t0 = performance.now()

  const EMP_COUNT   = Math.max(100,   Math.round(10_000  * scale))
  const PROD_COUNT  = Math.max(50,    Math.round(1_000   * scale))
  const ORD_COUNT   = Math.max(500,   Math.round(50_000  * scale))
  const ITEMS_COUNT = Math.max(1_000, Math.round(100_000 * scale))
  const LOG_COUNT   = Math.max(2_000, Math.round(200_000 * scale))

  // CO_SCHEMA의 STORES 기준 (10개)
  const STORE_COUNT = 10

  const employees  = generateEmployees(EMP_COUNT)
  const products   = generateProducts(PROD_COUNT)
  const orders     = generateOrders(ORD_COUNT, EMP_COUNT, STORE_COUNT)
  const orderItems = generateOrderItems(ITEMS_COUNT, ORD_COUNT, PROD_COUNT)
  const auditLog   = generateAuditLog(LOG_COUNT, EMP_COUNT)

  return {
    employees,
    products,
    orders,
    orderItems,
    auditLog,
    generatedAt: Date.now(),
    elapsedMs:   Math.round(performance.now() - t0),
  }
}

// ── Module-level singleton ────────────────────────────────────────────────────
// 이 파일을 import하면 즉시 생성이 시작됨 (Vite lazy import로 defer 가능)
let _cache: LargeDataset | null = null

export function getLargeDataset(): LargeDataset {
  if (!_cache) {
    _cache = generateLargeDataset(1.0)
  }
  return _cache
}

/** 테이블 이름으로 단일 LargeTable 반환 */
export function getLargeTable(name: string): LargeTable | undefined {
  const ds = getLargeDataset()
  const map: Record<string, LargeTable> = {
    EMPLOYEES:   ds.employees,
    PRODUCTS:    ds.products,
    ORDERS:      ds.orders,
    ORDER_ITEMS: ds.orderItems,
    AUDIT_LOG:   ds.auditLog,
  }
  return map[name.toUpperCase()]
}

/** 모든 LargeTable 목록 반환 */
export function getAllLargeTables(): LargeTable[] {
  const ds = getLargeDataset()
  return [ds.employees, ds.products, ds.orders, ds.orderItems, ds.auditLog]
}

/**
 * 카디널리티 비율 계산 (0~1, 높을수록 B-Tree에 적합)
 * NDV / rowCount
 */
export function getCardinalityRatio(table: LargeTable, columnName: string): number {
  const stat = table.columnStats[columnName]
  if (!stat || table.rows.length === 0) return 0
  return Math.min(1, stat.ndv / table.rows.length)
}

/**
 * 인덱스 유형 추천
 * - ratio > 0.01  → B-Tree (고카디널리티)
 * - ratio <= 0.01 → Bitmap (저카디널리티)
 * - indexHint = 'fbi' → Function-Based Index
 * - indexHint = 'composite' → 복합 인덱스 후보
 */
export function recommendIndexType(
  table: LargeTable,
  columnName: string,
): 'btree-unique' | 'btree-nonunique' | 'bitmap' | 'composite' | 'fbi' | 'range' | 'none' {
  const col = table.columns.find((c) => c.name === columnName)
  if (!col) return 'none'
  if (col.indexHint === 'fbi' || col.indexHint === 'composite') return col.indexHint
  const ratio = getCardinalityRatio(table, columnName)
  if (col.indexHint === 'btree-unique') return 'btree-unique'
  if (ratio > 0.01) return 'btree-nonunique'
  return 'bitmap'
}
