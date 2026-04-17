// Shared data, types, and pure utility functions for sql-basics chapter sections

// ── Types ──────────────────────────────────────────────────────────────────

export interface Employee {
  emp_id: number
  first_name: string
  last_name: string
  dept_id: number
  salary: number
  job_title: string
  manager_id: number | null
}

export interface ExampleQuery {
  id: string
  label: { ko: string; en: string }
  sql: string
  type: 'SELECT' | 'UPDATE' | 'DELETE'
}

export interface ExecStep {
  id: string
  phase: string
  label: { ko: string; en: string }
  desc: { ko: string; en: string }
  color: string
  highlightClause?: string
}

export interface GroupRow {
  dept_id: number
  cnt?: number
  avg_sal?: number
  total_sal?: number
  max_sal?: number
  min_sal?: number
}

export interface ParsedQuery {
  type: 'SELECT' | 'UPDATE' | 'DELETE' | 'GROUPBY' | 'UNKNOWN'
  columns: string[]
  whereExpr: string
  setExpr: string
  matchedRows: Employee[]
  resultRows: Employee[]
  groupRows?: GroupRow[]
  groupCols?: string[]
  orderKey?: keyof Employee
  orderDir?: 'ASC' | 'DESC'
  orderKey2?: keyof Employee
  orderDir2?: 'ASC' | 'DESC'
}

export interface ClauseVariant {
  op: string
  sql: string
  type: 'SELECT' | 'UPDATE' | 'DELETE'
  desc: { ko: string; en: string }
}

export interface ClauseDemo {
  sectionKey: string
  label: { ko: string; en: string }
  sql: string
  type: 'SELECT' | 'UPDATE' | 'DELETE'
  variants?: ClauseVariant[]
}

// ── Sample data ────────────────────────────────────────────────────────────

export const EMPLOYEES: Employee[] = [
  { emp_id: 101, first_name: 'Alice',   last_name: 'Kim',    dept_id: 10, salary: 7200, job_title: 'Engineer',  manager_id: null },
  { emp_id: 102, first_name: 'Bob',     last_name: 'Park',   dept_id: 20, salary: 5400, job_title: 'Analyst',   manager_id: 101  },
  { emp_id: 103, first_name: 'Carol',   last_name: 'Lee',    dept_id: 10, salary: 8100, job_title: 'Engineer',  manager_id: 101  },
  { emp_id: 104, first_name: 'David',   last_name: 'Choi',   dept_id: 30, salary: 4900, job_title: 'Support',   manager_id: 102  },
  { emp_id: 105, first_name: 'Eva',     last_name: 'Jung',   dept_id: 20, salary: 6300, job_title: 'Analyst',   manager_id: 101  },
  { emp_id: 106, first_name: 'Frank',   last_name: 'Oh',     dept_id: 30, salary: 3800, job_title: 'Support',   manager_id: 102  },
  { emp_id: 107, first_name: 'Grace',   last_name: 'Yoon',   dept_id: 10, salary: 9500, job_title: 'Lead',      manager_id: null },
  { emp_id: 108, first_name: 'Henry',   last_name: 'Han',    dept_id: 20, salary: 5900, job_title: 'Analyst',   manager_id: 101  },
]

export const EMP_COLS: Array<keyof Employee> = ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id']

// ── Execution step definitions ──────────────────────────────────────────────

export const SELECT_STEPS: ExecStep[] = [
  {
    id: 'from',
    phase: '① FROM',
    label: { ko: 'FROM — 테이블 접근', en: 'FROM — Access table' },
    desc: {
      ko: 'Oracle이 가장 먼저 FROM 절을 처리합니다. 지정된 테이블(EMPLOYEES)을 식별하고 세그먼트를 엽니다.',
      en: 'Oracle processes FROM first. It identifies the target table (EMPLOYEES) and opens the segment.',
    },
    color: 'violet',
    highlightClause: 'FROM',
  },
  {
    id: 'where',
    phase: '② WHERE',
    label: { ko: 'WHERE — 행 필터링', en: 'WHERE — Row filtering' },
    desc: {
      ko: 'FROM으로 가져온 각 행에 WHERE 조건을 적용합니다. 조건이 TRUE인 행만 다음 단계로 넘어갑니다.',
      en: 'Each row from FROM is evaluated against the WHERE condition. Only rows where the condition is TRUE proceed.',
    },
    color: 'orange',
    highlightClause: 'WHERE',
  },
  {
    id: 'select',
    phase: '③ SELECT',
    label: { ko: 'SELECT — 컬럼 투영', en: 'SELECT — Column projection' },
    desc: {
      ko: '필터된 행에서 SELECT에 명시한 컬럼만 추출합니다. *는 모든 컬럼을 그대로 반환합니다.',
      en: 'From the filtered rows, only the columns listed in SELECT are projected. * returns all columns.',
    },
    color: 'blue',
    highlightClause: 'SELECT',
  },
  {
    id: 'result',
    phase: '④ 결과 반환',
    label: { ko: '결과 반환', en: 'Return results' },
    desc: {
      ko: '최종 결과 집합이 클라이언트(PGA)로 전달됩니다.',
      en: 'The final result set is returned to the client (PGA).',
    },
    color: 'emerald',
  },
]

export const UPDATE_STEPS: ExecStep[] = [
  {
    id: 'from',
    phase: '① FROM',
    label: { ko: 'FROM — 테이블 접근', en: 'FROM — Access table' },
    desc: {
      ko: 'UPDATE 대상 테이블(EMPLOYEES)을 식별하고 해당 세그먼트에 접근합니다.',
      en: 'Oracle identifies the target table (EMPLOYEES) and accesses the segment.',
    },
    color: 'violet',
    highlightClause: 'FROM',
  },
  {
    id: 'where',
    phase: '② WHERE',
    label: { ko: 'WHERE — 대상 행 선택', en: 'WHERE — Target row selection' },
    desc: {
      ko: 'WHERE 조건에 맞는 행을 찾습니다. 이 행들이 수정 대상이 됩니다.',
      en: 'Rows matching the WHERE condition are identified as modification targets.',
    },
    color: 'orange',
    highlightClause: 'WHERE',
  },
  {
    id: 'lock',
    phase: '③ Row Lock',
    label: { ko: 'Row Lock 획득', en: 'Acquire row locks' },
    desc: {
      ko: '수정할 행에 Row-level Lock을 겁니다. 다른 트랜잭션의 동시 수정을 방지합니다.',
      en: 'Row-level locks are acquired on the target rows to prevent concurrent modification.',
    },
    color: 'rose',
  },
  {
    id: 'undo',
    phase: '④ Undo 기록',
    label: { ko: 'Undo 세그먼트 기록', en: 'Write to undo segment' },
    desc: {
      ko: '변경 전 값을 Undo 세그먼트에 기록합니다. ROLLBACK 시 이 값으로 복원됩니다.',
      en: 'The before-image of each row is written to the undo segment for potential ROLLBACK.',
    },
    color: 'amber',
  },
  {
    id: 'set',
    phase: '⑤ SET 적용',
    label: { ko: 'SET — 값 변경', en: 'SET — Apply new values' },
    desc: {
      ko: 'SET 절의 표현식을 평가하여 새 값을 Buffer Cache의 블록에 씁니다.',
      en: 'SET expressions are evaluated and new values are written to the block in Buffer Cache.',
    },
    color: 'blue',
    highlightClause: 'SET',
  },
  {
    id: 'redo',
    phase: '⑥ Redo Log',
    label: { ko: 'Redo Log 기록', en: 'Write redo log' },
    desc: {
      ko: '변경 내용을 Redo Log Buffer에 기록합니다. 장애 복구를 위한 영구 로그입니다.',
      en: 'The change is written to the Redo Log Buffer for durability and crash recovery.',
    },
    color: 'emerald',
  },
]

export const DELETE_STEPS: ExecStep[] = [
  {
    id: 'from',
    phase: '① FROM',
    label: { ko: 'FROM — 테이블 접근', en: 'FROM — Access table' },
    desc: {
      ko: 'DELETE 대상 테이블(EMPLOYEES)을 식별하고 해당 세그먼트에 접근합니다.',
      en: 'Oracle identifies the target table (EMPLOYEES) and accesses the segment.',
    },
    color: 'violet',
    highlightClause: 'FROM',
  },
  {
    id: 'where',
    phase: '② WHERE',
    label: { ko: 'WHERE — 삭제 대상 선택', en: 'WHERE — Select rows to delete' },
    desc: {
      ko: 'WHERE 조건에 맞는 행을 찾습니다. 이 행들이 삭제 대상입니다.',
      en: 'Rows matching the WHERE condition are identified as deletion targets.',
    },
    color: 'orange',
    highlightClause: 'WHERE',
  },
  {
    id: 'lock',
    phase: '③ Row Lock',
    label: { ko: 'Row Lock 획득', en: 'Acquire row locks' },
    desc: {
      ko: '삭제할 행에 Row-level Lock을 겁니다.',
      en: 'Row-level locks are acquired on the target rows.',
    },
    color: 'rose',
  },
  {
    id: 'undo',
    phase: '④ Undo 기록',
    label: { ko: 'Undo 세그먼트 기록', en: 'Write to undo segment' },
    desc: {
      ko: '삭제될 행 전체를 Undo 세그먼트에 기록합니다. ROLLBACK하면 행이 복원됩니다.',
      en: 'The entire deleted row is written to the undo segment so ROLLBACK can restore it.',
    },
    color: 'amber',
  },
  {
    id: 'delete',
    phase: '⑤ 행 삭제',
    label: { ko: '행 삭제 마킹', en: 'Mark rows as deleted' },
    desc: {
      ko: '블록 내 해당 행에 삭제 마크(delete flag)를 설정합니다. 물리적 공간은 COMMIT 이후에도 즉시 회수되지 않습니다.',
      en: 'A delete flag is set on the row within the block. Physical space is not immediately reclaimed even after COMMIT.',
    },
    color: 'blue',
  },
  {
    id: 'redo',
    phase: '⑥ Redo Log',
    label: { ko: 'Redo Log 기록', en: 'Write redo log' },
    desc: {
      ko: '삭제 연산을 Redo Log Buffer에 기록합니다.',
      en: 'The delete operation is written to the Redo Log Buffer.',
    },
    color: 'emerald',
  },
]

// ── Color helpers ──────────────────────────────────────────────────────────

export const STEP_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200', dot: 'bg-violet-400' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-400'   },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-400'},
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',   dot: 'bg-rose-400'   },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-400'  },
}

export const CLAUSE_COLOR: Record<string, string> = {
  blue:    'border-blue-200 bg-blue-50 text-blue-800',
  violet:  'border-violet-200 bg-violet-50 text-violet-800',
  orange:  'border-orange-200 bg-orange-50 text-orange-800',
  amber:   'border-amber-200 bg-amber-50 text-amber-800',
  rose:    'border-rose-200 bg-rose-50 text-rose-800',
}

// ── Example queries ────────────────────────────────────────────────────────

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    id: 'q1',
    label: { ko: '전체 조회', en: 'Select all' },
    sql: 'SELECT * FROM employees',
    type: 'SELECT',
  },
  {
    id: 'q2',
    label: { ko: '부서 10 조회', en: 'Dept 10 filter' },
    sql: "SELECT emp_id, first_name, salary\nFROM employees\nWHERE dept_id = 10",
    type: 'SELECT',
  },
  {
    id: 'q3',
    label: { ko: '고급여 조회', en: 'High salary' },
    sql: "SELECT emp_id, first_name, last_name, salary\nFROM employees\nWHERE salary >= 7000",
    type: 'SELECT',
  },
  {
    id: 'q4',
    label: { ko: '이름 패턴 조회', en: 'LIKE pattern' },
    sql: "SELECT emp_id, first_name, last_name\nFROM employees\nWHERE last_name LIKE 'K%'",
    type: 'SELECT',
  },
  {
    id: 'q5',
    label: { ko: 'UPDATE 급여 인상', en: 'UPDATE salary' },
    sql: "UPDATE employees\nSET salary = salary * 1.10\nWHERE dept_id = 10",
    type: 'UPDATE',
  },
  {
    id: 'q6',
    label: { ko: 'DELETE 저급여 삭제', en: 'DELETE low salary' },
    sql: "DELETE FROM employees\nWHERE salary < 4500",
    type: 'DELETE',
  },
]

// ── Clause demos ────────────────────────────────────────────────────────────

export const CLAUSE_DEMOS: ClauseDemo[] = [
  {
    sectionKey: 'intro',
    sql: 'SELECT *\nFROM   employees',
    type: 'SELECT',
    label: { ko: '전체 조회', en: 'Select all' },
  },
  {
    sectionKey: 'select',
    sql: 'SELECT emp_id, first_name, dept_id, salary\nFROM   employees\nWHERE  dept_id = 10',
    type: 'SELECT',
    label: { ko: 'SELECT 예시', en: 'SELECT example' },
  },
  {
    sectionKey: 'distinct',
    sql: 'SELECT DISTINCT dept_id\nFROM   employees',
    type: 'SELECT',
    label: { ko: 'DISTINCT 예시', en: 'DISTINCT example' },
    variants: [
      {
        op: 'DISTINCT dept_id',
        sql: 'SELECT DISTINCT dept_id\nFROM   employees',
        type: 'SELECT',
        desc: { ko: 'dept_id의 중복을 제거한 고유 부서 목록', en: 'Unique department list with duplicates removed' },
      },
      {
        op: 'DISTINCT job_title',
        sql: 'SELECT DISTINCT job_title\nFROM   employees',
        type: 'SELECT',
        desc: { ko: 'job_title의 중복을 제거한 고유 직책 목록', en: 'Unique job title list with duplicates removed' },
      },
    ],
  },
  {
    sectionKey: 'where',
    sql: "SELECT *\nFROM   employees\nWHERE  salary >= 7000",
    type: 'SELECT',
    label: { ko: 'WHERE 연산자', en: 'WHERE operators' },
    variants: [
      {
        op: '=',
        sql: "SELECT *\nFROM   employees\nWHERE  dept_id = 10",
        type: 'SELECT',
        desc: { ko: 'dept_id가 정확히 10인 행', en: 'Rows where dept_id equals 10' },
      },
      {
        op: '!= / <>',
        sql: "SELECT *\nFROM   employees\nWHERE  dept_id != 10",
        type: 'SELECT',
        desc: { ko: 'dept_id가 10이 아닌 행', en: 'Rows where dept_id is not 10' },
      },
      {
        op: '>= / <=',
        sql: "SELECT *\nFROM   employees\nWHERE  salary >= 7000",
        type: 'SELECT',
        desc: { ko: '급여가 7000 이상인 행', en: 'Rows where salary is at least 7000' },
      },
      {
        op: 'BETWEEN',
        sql: "SELECT *\nFROM   employees\nWHERE  salary BETWEEN 5000 AND 7500",
        type: 'SELECT',
        desc: { ko: '급여가 5000~7500 범위인 행', en: 'Rows where salary is between 5000 and 7500' },
      },
      {
        op: 'LIKE',
        sql: "SELECT *\nFROM   employees\nWHERE  last_name LIKE 'K%'",
        type: 'SELECT',
        desc: { ko: "성(last_name)이 'K'로 시작하는 행", en: "Rows where last_name starts with 'K'" },
      },
      {
        op: 'IN',
        sql: "SELECT *\nFROM   employees\nWHERE  dept_id IN (10, 20)",
        type: 'SELECT',
        desc: { ko: 'dept_id가 10 또는 20인 행', en: 'Rows where dept_id is 10 or 20' },
      },
      {
        op: 'IS NULL',
        sql: "SELECT *\nFROM   employees\nWHERE  manager_id IS NULL",
        type: 'SELECT',
        desc: { ko: 'manager_id가 NULL인 행 (최상위 관리자)', en: 'Rows where manager_id is NULL (top-level managers)' },
      },
      {
        op: 'AND',
        sql: "SELECT *\nFROM   employees\nWHERE  dept_id = 20\n  AND  salary >= 5500",
        type: 'SELECT',
        desc: { ko: '부서 20이면서 급여 5500 이상인 행', en: 'Rows in dept 20 AND salary at least 5500' },
      },
      {
        op: 'OR',
        sql: "SELECT *\nFROM   employees\nWHERE  dept_id = 10\n  OR   dept_id = 30",
        type: 'SELECT',
        desc: { ko: '부서 10 또는 부서 30인 행', en: 'Rows in dept 10 OR dept 30' },
      },
    ],
  },
  {
    sectionKey: 'update',
    sql: 'UPDATE employees\nSET    salary = salary * 1.10\nWHERE  dept_id = 10',
    type: 'UPDATE',
    label: { ko: 'UPDATE 예시', en: 'UPDATE example' },
  },
  {
    sectionKey: 'delete',
    sql: 'DELETE FROM employees\nWHERE  salary < 4500',
    type: 'DELETE',
    label: { ko: 'DELETE 예시', en: 'DELETE example' },
  },
  {
    sectionKey: 'orderby',
    sql: 'SELECT emp_id, first_name, dept_id, salary\nFROM   employees\nORDER BY salary DESC',
    type: 'SELECT',
    label: { ko: 'ORDER BY 예시', en: 'ORDER BY example' },
    variants: [
      {
        op: 'salary DESC',
        sql: 'SELECT emp_id, first_name, dept_id, salary\nFROM   employees\nORDER BY salary DESC',
        type: 'SELECT',
        desc: { ko: '급여 내림차순 정렬', en: 'Sort by salary descending' },
      },
      {
        op: 'salary ASC',
        sql: 'SELECT emp_id, first_name, dept_id, salary\nFROM   employees\nORDER BY salary ASC',
        type: 'SELECT',
        desc: { ko: '급여 오름차순 정렬', en: 'Sort by salary ascending' },
      },
      {
        op: 'dept_id, salary',
        sql: 'SELECT emp_id, first_name, dept_id, salary\nFROM   employees\nORDER BY dept_id ASC, salary DESC',
        type: 'SELECT',
        desc: { ko: '부서 오름차순 → 같은 부서 내 급여 내림차순', en: 'Dept ascending, then salary descending within dept' },
      },
      {
        op: 'ORDER BY 2',
        sql: 'SELECT emp_id, first_name, dept_id, salary\nFROM   employees\nORDER BY 2',
        type: 'SELECT',
        desc: { ko: 'SELECT의 두 번째 컬럼(first_name) 기준 오름차순 정렬', en: 'Sort by the 2nd SELECT column (first_name) ascending' },
      },
    ],
  },
  {
    sectionKey: 'groupby',
    sql: 'SELECT dept_id, COUNT(*) AS cnt, AVG(salary) AS avg_sal\nFROM   employees\nGROUP BY dept_id',
    type: 'GROUPBY' as unknown as 'SELECT',
    label: { ko: 'GROUP BY 예시', en: 'GROUP BY example' },
    variants: [
      {
        op: 'COUNT',
        sql: 'SELECT dept_id, COUNT(*) AS cnt\nFROM   employees\nGROUP BY dept_id',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '부서별 직원 수', en: 'Employee count per department' },
      },
      {
        op: 'AVG',
        sql: 'SELECT dept_id, AVG(salary) AS avg_sal\nFROM   employees\nGROUP BY dept_id',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '부서별 평균 급여', en: 'Average salary per department' },
      },
      {
        op: 'SUM',
        sql: 'SELECT dept_id, SUM(salary) AS total_sal\nFROM   employees\nGROUP BY dept_id',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '부서별 급여 합계', en: 'Total salary per department' },
      },
      {
        op: 'MAX / MIN',
        sql: 'SELECT dept_id, MAX(salary) AS max_sal, MIN(salary) AS min_sal\nFROM   employees\nGROUP BY dept_id',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '부서별 최고·최저 급여', en: 'Max and min salary per department' },
      },
    ],
  },
  {
    sectionKey: 'having',
    sql: 'SELECT dept_id, COUNT(*) AS cnt\nFROM   employees\nGROUP BY dept_id\nHAVING COUNT(*) >= 3',
    type: 'GROUPBY' as unknown as 'SELECT',
    label: { ko: 'HAVING 예시', en: 'HAVING example' },
    variants: [
      {
        op: 'COUNT >= 3',
        sql: 'SELECT dept_id, COUNT(*) AS cnt\nFROM   employees\nGROUP BY dept_id\nHAVING COUNT(*) >= 3',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '직원이 3명 이상인 부서만', en: 'Only departments with 3 or more employees' },
      },
      {
        op: 'AVG >= 6000',
        sql: 'SELECT dept_id, AVG(salary) AS avg_sal\nFROM   employees\nGROUP BY dept_id\nHAVING AVG(salary) >= 6000',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '평균 급여가 6000 이상인 부서만', en: 'Only departments with avg salary ≥ 6000' },
      },
      {
        op: 'SUM >= 15000',
        sql: 'SELECT dept_id, SUM(salary) AS total_sal\nFROM   employees\nGROUP BY dept_id\nHAVING SUM(salary) >= 15000',
        type: 'GROUPBY' as unknown as 'SELECT',
        desc: { ko: '급여 합계가 15000 이상인 부서만', en: 'Only departments with total salary ≥ 15000' },
      },
    ],
  },
]

// ── Pure utility functions ─────────────────────────────────────────────────

export function parseOrderPart(s: string, selectCols?: string[]): { key: keyof Employee; dir: 'ASC' | 'DESC' } {
  const parts = s.trim().split(/\s+/)
  const dir = parts[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
  if (/^\d+$/.test(parts[0])) {
    const pos = parseInt(parts[0]) - 1
    const colName = selectCols?.[pos] ?? EMP_COLS[pos] ?? 'emp_id'
    return { key: colName as keyof Employee, dir }
  }
  const key = parts[0].toLowerCase() as keyof Employee
  return { key, dir }
}

export function sortRows(rows: Employee[], key: keyof Employee, dir: 'ASC' | 'DESC', key2?: keyof Employee, dir2?: 'ASC' | 'DESC'): Employee[] {
  return rows.slice().sort((a, b) => {
    const av = a[key], bv = b[key]
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    if (cmp !== 0) return dir === 'DESC' ? -cmp : cmp
    if (key2) {
      const av2 = a[key2], bv2 = b[key2]
      const cmp2 = typeof av2 === 'number' && typeof bv2 === 'number' ? av2 - bv2 : String(av2).localeCompare(String(bv2))
      return dir2 === 'DESC' ? -cmp2 : cmp2
    }
    return 0
  })
}

export function parseGroupCols(selectPart: string): string[] {
  const cols: string[] = ['dept_id']
  const u = selectPart.toUpperCase()
  if (u.includes('COUNT')) cols.push('cnt')
  if (u.includes('AVG'))   cols.push('avg_sal')
  if (u.includes('SUM'))   cols.push('total_sal')
  if (u.includes('MAX'))   cols.push('max_sal')
  if (u.includes('MIN'))   cols.push('min_sal')
  return cols
}

export function evalHaving(g: GroupRow, expr: string): boolean {
  const cntGte = expr.match(/COUNT\s*\(\s*\*\s*\)\s*>=\s*(\d+)/i)
  if (cntGte) return (g.cnt ?? 0) >= parseInt(cntGte[1])
  const cntGt  = expr.match(/COUNT\s*\(\s*\*\s*\)\s*>\s*(\d+)/i)
  if (cntGt)  return (g.cnt ?? 0) > parseInt(cntGt[1])
  const cntLte = expr.match(/COUNT\s*\(\s*\*\s*\)\s*<=\s*(\d+)/i)
  if (cntLte) return (g.cnt ?? 0) <= parseInt(cntLte[1])
  const cntLt  = expr.match(/COUNT\s*\(\s*\*\s*\)\s*<\s*(\d+)/i)
  if (cntLt)  return (g.cnt ?? 0) < parseInt(cntLt[1])
  const avgGte = expr.match(/AVG\s*\(\s*salary\s*\)\s*>=\s*(\d+)/i)
  if (avgGte) return (g.avg_sal ?? 0) >= parseInt(avgGte[1])
  const sumGte = expr.match(/SUM\s*\(\s*salary\s*\)\s*>=\s*(\d+)/i)
  if (sumGte) return (g.total_sal ?? 0) >= parseInt(sumGte[1])
  return true
}

export function filterRows(rows: Employee[], expr: string): Employee[] {
  return rows.filter((r) => evalCond(r, expr))
}

export function evalCond(r: Employee, expr: string): boolean {
  const trimmed = expr.trim()

  const between = trimmed.match(/salary\s+BETWEEN\s+(\d+)\s+AND\s+(\d+)/i)
  if (between) return r.salary >= parseInt(between[1]) && r.salary <= parseInt(between[2])

  const u = trimmed.toUpperCase()

  const andIdx = findTopLevelAnd(u)
  if (andIdx !== -1) {
    return evalCond(r, trimmed.slice(0, andIdx).trim()) && evalCond(r, trimmed.slice(andIdx + 5).trim())
  }
  const orIdx = findTopLevelOr(u)
  if (orIdx !== -1) {
    return evalCond(r, trimmed.slice(0, orIdx).trim()) || evalCond(r, trimmed.slice(orIdx + 4).trim())
  }

  if (/manager_id\s+IS\s+NOT\s+NULL/i.test(trimmed)) return r.manager_id !== null
  if (/manager_id\s+IS\s+NULL/i.test(trimmed)) return r.manager_id === null

  const inMatch = trimmed.match(/dept_id\s+IN\s*\(([^)]+)\)/i)
  if (inMatch) {
    const vals = inMatch[1].split(',').map((v) => parseInt(v.trim()))
    return vals.includes(r.dept_id)
  }

  const inStrMatch = trimmed.match(/job_title\s+IN\s*\(([^)]+)\)/i)
  if (inStrMatch) {
    const vals = inStrMatch[1].split(',').map((v) => v.trim().replace(/'/g, '').toUpperCase())
    return vals.includes(r.job_title.toUpperCase())
  }

  const likeMatch = trimmed.match(/last_name\s+LIKE\s+'([^']+)'/i)
  if (likeMatch) {
    const pat = likeMatch[1]
    const name = r.last_name.toUpperCase()
    if (pat.startsWith('%') && pat.endsWith('%')) return name.includes(pat.slice(1, -1).toUpperCase())
    if (pat.startsWith('%')) return name.endsWith(pat.slice(1).toUpperCase())
    if (pat.endsWith('%')) return name.startsWith(pat.slice(0, -1).toUpperCase())
    return name === pat.toUpperCase()
  }

  const likeFirst = trimmed.match(/first_name\s+LIKE\s+'([^']+)'/i)
  if (likeFirst) {
    const pat = likeFirst[1]
    const name = r.first_name.toUpperCase()
    if (pat.startsWith('%') && pat.endsWith('%')) return name.includes(pat.slice(1, -1).toUpperCase())
    if (pat.startsWith('%')) return name.endsWith(pat.slice(1).toUpperCase())
    if (pat.endsWith('%')) return name.startsWith(pat.slice(0, -1).toUpperCase())
    return name === pat.toUpperCase()
  }

  const deptNe = trimmed.match(/dept_id\s*(?:!=|<>)\s*(\d+)/i)
  if (deptNe) return r.dept_id !== parseInt(deptNe[1])
  const deptEq = trimmed.match(/dept_id\s*=\s*(\d+)/i)
  if (deptEq) return r.dept_id === parseInt(deptEq[1])

  const salNe = trimmed.match(/salary\s*(?:!=|<>)\s*(\d+)/i)
  if (salNe) return r.salary !== parseInt(salNe[1])
  const salGte = trimmed.match(/salary\s*>=\s*(\d+)/i)
  if (salGte) return r.salary >= parseInt(salGte[1])
  const salLte = trimmed.match(/salary\s*<=\s*(\d+)/i)
  if (salLte) return r.salary <= parseInt(salLte[1])
  const salLt = trimmed.match(/salary\s*<\s*(\d+)/i)
  if (salLt) return r.salary < parseInt(salLt[1])
  const salGt = trimmed.match(/salary\s*>\s*(\d+)/i)
  if (salGt) return r.salary > parseInt(salGt[1])
  const salEq = trimmed.match(/salary\s*=\s*(\d+)/i)
  if (salEq) return r.salary === parseInt(salEq[1])

  const jobEq = trimmed.match(/job_title\s*=\s*'([^']+)'/i)
  if (jobEq) return r.job_title.toUpperCase() === jobEq[1].toUpperCase()

  return true
}

export function findTopLevelAnd(u: string): number {
  let depth = 0
  for (let i = 0; i < u.length - 4; i++) {
    if (u[i] === '(') depth++
    else if (u[i] === ')') depth--
    else if (depth === 0 && u.slice(i, i + 5) === ' AND ') return i
  }
  return -1
}

export function findTopLevelOr(u: string): number {
  let depth = 0
  for (let i = 0; i < u.length - 3; i++) {
    if (u[i] === '(') depth++
    else if (u[i] === ')') depth--
    else if (depth === 0 && u.slice(i, i + 4) === ' OR ') return i
  }
  return -1
}

export function projectRow(r: Employee, cols: string[]): Employee {
  const out: Partial<Employee> = {}
  for (const c of cols) {
    const k = c as keyof Employee
    if (k in r) (out as Record<string, unknown>)[k] = r[k]
  }
  return out as Employee
}

export function applySet(r: Employee, setExpr: string): Employee {
  const clone = { ...r }
  const salMul = setExpr.match(/salary\s*=\s*salary\s*\*\s*([\d.]+)/i)
  if (salMul) { clone.salary = Math.round(clone.salary * parseFloat(salMul[1])) }
  const salSet = setExpr.match(/salary\s*=\s*(\d+)/i)
  if (salSet && !salMul) { clone.salary = parseInt(salSet[1]) }
  return clone
}

export function parseAndExecute(sql: string, data: Employee[]): ParsedQuery {
  const upper = sql.trim().toUpperCase()
  const EMPTY: ParsedQuery = { type: 'UNKNOWN', columns: [], whereExpr: '', setExpr: '', matchedRows: [], resultRows: [] }

  if (upper.includes('GROUP BY')) {
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+GROUP BY|\s+HAVING|$)/is)
    const havingMatch = sql.match(/HAVING\s+(.+)/i)
    const whereExpr = whereMatch ? whereMatch[1].trim() : ''
    const filtered = whereExpr ? filterRows(data, whereExpr) : [...data]

    const groups = new Map<number, Employee[]>()
    for (const r of filtered) {
      const arr = groups.get(r.dept_id) ?? []
      arr.push(r)
      groups.set(r.dept_id, arr)
    }

    let groupRows: GroupRow[] = Array.from(groups.entries()).map(([dept_id, rows]) => ({
      dept_id,
      cnt:       rows.length,
      avg_sal:   Math.round(rows.reduce((s, r) => s + r.salary, 0) / rows.length),
      total_sal: rows.reduce((s, r) => s + r.salary, 0),
      max_sal:   Math.max(...rows.map((r) => r.salary)),
      min_sal:   Math.min(...rows.map((r) => r.salary)),
    })).sort((a, b) => a.dept_id - b.dept_id)

    if (havingMatch) {
      const hExpr = havingMatch[1].trim()
      groupRows = groupRows.filter((g) => evalHaving(g, hExpr))
    }

    const selectPart = sql.substring(6, upper.indexOf('FROM')).trim()
    const groupCols = parseGroupCols(selectPart)

    return { type: 'GROUPBY', columns: [], whereExpr, setExpr: '', matchedRows: filtered, resultRows: [], groupRows, groupCols }
  }

  if (upper.startsWith('SELECT')) {
    const fromMatch = sql.match(/FROM\s+\w+/i)
    if (!fromMatch) return EMPTY

    const isDistinct = /^SELECT\s+DISTINCT\s+/i.test(sql.trim())
    const rawSelectPart = sql.substring(6, upper.indexOf('FROM')).trim()
    const selectPart = isDistinct ? rawSelectPart.replace(/^DISTINCT\s+/i, '') : rawSelectPart
    const columns = selectPart === '*' ? [] : selectPart.split(',').map((c) => c.trim().toLowerCase())

    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER BY|$)/is)
    const whereExpr = whereMatch ? whereMatch[1].trim() : ''
    const matched = whereExpr ? filterRows(data, whereExpr) : [...data]

    let distinctMatched = matched
    if (isDistinct && columns.length > 0) {
      const seen = new Set<string>()
      distinctMatched = matched.filter((r) => {
        const key = columns.map((c) => String(r[c as keyof Employee] ?? '')).join('|')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    let result = columns.length === 0 ? [...distinctMatched] : distinctMatched.map((r) => projectRow(r, columns))
    const orderMatch = sql.match(/ORDER BY\s+(.+)/i)
    let orderKey: keyof Employee | undefined
    let orderDir: 'ASC' | 'DESC' = 'ASC'
    let orderKey2: keyof Employee | undefined
    let orderDir2: 'ASC' | 'DESC' = 'ASC'

    if (orderMatch) {
      const parts = orderMatch[1].split(',').map((s) => s.trim())
      const parse1 = parseOrderPart(parts[0], columns)
      orderKey = parse1.key; orderDir = parse1.dir
      if (parts[1]) { const p2 = parseOrderPart(parts[1], columns); orderKey2 = p2.key; orderDir2 = p2.dir }
      result = sortRows([...distinctMatched], orderKey, orderDir, orderKey2, orderDir2)
        .map((r) => columns.length === 0 ? r : projectRow(r, columns))
    }

    return { type: 'SELECT', columns, whereExpr, setExpr: '', matchedRows: distinctMatched, resultRows: result, orderKey, orderDir, orderKey2, orderDir2 }
  }

  if (upper.startsWith('UPDATE')) {
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i)
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    const setExpr = setMatch ? setMatch[1].trim() : ''
    const whereExpr = whereMatch ? whereMatch[1].trim() : ''
    const matched = whereExpr ? filterRows(data, whereExpr) : [...data]
    const result = matched.map((r) => applySet(r, setExpr))

    return { type: 'UPDATE', columns: [], whereExpr, setExpr, matchedRows: matched, resultRows: result }
  }

  if (upper.startsWith('DELETE')) {
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    const whereExpr = whereMatch ? whereMatch[1].trim() : ''
    const matched = whereExpr ? filterRows(data, whereExpr) : [...data]

    return { type: 'DELETE', columns: [], whereExpr, setExpr: '', matchedRows: matched, resultRows: matched }
  }

  return EMPTY
}
