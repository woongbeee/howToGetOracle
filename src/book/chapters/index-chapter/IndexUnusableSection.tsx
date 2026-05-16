import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SqlBlock,
} from '../shared'
import { IconAlertTriangle } from '@tabler/icons-react'

interface CaseItem {
  title: string
  reason: string
  bad: string
  good: string
  goodDesc: string
}

const T = {
  ko: {
    title: '인덱스를 못 쓰는 케이스',
    subtitle: '쿼리를 잘못 작성하면 인덱스가 있어도 Full Table Scan이 발생합니다. 패턴을 익혀두면 인덱스를 최대한 활용하는 SQL을 작성할 수 있습니다.',
    introTitle: '왜 인덱스가 무시될까요?',
    introDesc: 'Oracle 옵티마이저는 인덱스 키값을 그대로 비교할 수 없을 때 인덱스를 포기하고 테이블 전체를 읽습니다. 가장 흔한 원인은 인덱스 컬럼에 함수나 연산을 적용하거나, 암묵적 형변환이 발생하거나, 부정 조건(NOT, !=)을 사용하는 경우입니다.',
    casesTitle: '케이스별 분석',
    badLabel: '인덱스 미사용 (Bad)',
    goodLabel: '인덱스 사용 (Good)',
    whyLabel: '왜 못 쓰나요?',
    fixLabel: '어떻게 고치나요?',
    cases: [
      {
        title: '1. 인덱스 컬럼에 함수 적용',
        reason: 'SUBSTR(last_name, 1, 3) 처럼 컬럼을 가공하면 인덱스에 저장된 원래 값과 직접 비교가 불가능합니다. 함수 기반 인덱스(FBI)를 따로 만들지 않는 한 Full Scan으로 전환됩니다.',
        bad: "SELECT * FROM employees\nWHERE SUBSTR(last_name, 1, 3) = 'Kim'; -- last_name 인덱스 무시",
        good: "SELECT * FROM employees\nWHERE last_name LIKE 'Kim%'; -- last_name 인덱스 사용",
        goodDesc: 'LIKE \'Kim%\' 는 B-Tree의 시작점을 찾아 Range Scan 가능. LIKE \'%Kim%\' 은 불가.',
      },
      {
        title: '2. 컬럼에 산술 연산 적용',
        reason: '컬럼 값을 연산한 결과를 비교하면 인덱스 값과 직접 매칭이 안 됩니다. 연산을 상수 쪽으로 이항해야 합니다.',
        bad: "SELECT * FROM employees\nWHERE salary * 12 > 60000000; -- salary 인덱스 무시",
        good: "SELECT * FROM employees\nWHERE salary > 60000000 / 12; -- salary 인덱스 사용\n-- 또는\nWHERE salary > 5000000;",
        goodDesc: '연산을 상수 쪽으로 옮겨 컬럼을 가공하지 않으면 Range Scan이 가능합니다.',
      },
      {
        title: '3. 암묵적 형변환 (Implicit Type Conversion)',
        reason: '컬럼 타입이 NUMBER인데 문자열 리터럴과 비교하면 Oracle이 내부적으로 TO_NUMBER()를 컬럼에 적용합니다. 이는 함수 적용과 같으므로 인덱스를 쓸 수 없습니다.',
        bad: "SELECT * FROM employees\nWHERE employee_id = '100'; -- NUMBER 컬럼을 VARCHAR와 비교 → 인덱스 무시",
        good: "SELECT * FROM employees\nWHERE employee_id = 100; -- 타입 일치 → 인덱스 사용",
        goodDesc: '항상 컬럼 타입에 맞는 리터럴을 사용하세요. VARCHAR2 컬럼은 문자열, NUMBER 컬럼은 숫자.',
      },
      {
        title: '4. 부정 조건 (!=, NOT IN, NOT LIKE)',
        reason: '인덱스는 특정 값의 위치를 가리킵니다. "이 값이 아닌 것 전부"는 위치를 특정할 수 없어 Full Scan을 유발합니다.',
        bad: "SELECT * FROM employees\nWHERE department_id != 10; -- department_id 인덱스 무시",
        good: "SELECT * FROM employees\nWHERE department_id < 10\n   OR department_id > 10; -- Range Scan 두 번으로 대체\n-- 또는 비즈니스 로직에 따라 IN 리스트 사용\nWHERE department_id IN (20, 30, 40, 50, 60, 70, 80, 90);",
        goodDesc: '범위 분리(< OR >) 또는 IN 리스트로 변환하면 인덱스를 활용할 수 있습니다. 단, 조회 비율이 높으면 Full Scan이 더 빠를 수 있습니다.',
      },
      {
        title: '5. OR 조건으로 인덱스 컬럼 분리',
        reason: 'OR 조건은 각 조건을 별도로 평가하므로 인덱스를 하나만 타거나 아예 못 탈 수 있습니다. 특히 서로 다른 컬럼에 OR을 쓰면 둘 중 하나를 Full Scan으로 처리합니다.',
        bad: "SELECT * FROM employees\nWHERE employee_id = 100\n   OR last_name = 'King'; -- 두 인덱스를 OR로 결합 → 비효율",
        good: "SELECT * FROM employees WHERE employee_id = 100\nUNION ALL\nSELECT * FROM employees WHERE last_name = 'King'\n  AND employee_id != 100; -- 각각 인덱스 사용 후 UNION ALL",
        goodDesc: 'UNION ALL로 분리하면 각 브랜치가 독립적으로 인덱스를 사용할 수 있습니다.',
      },
      {
        title: '6. LIKE \'%값%\' (선행 와일드카드)',
        reason: "B-Tree 인덱스는 왼쪽부터 정렬됩니다. '%Kim' 처럼 시작 문자를 모르면 어디서부터 읽을지 알 수 없어 Full Scan이 발생합니다.",
        bad: "SELECT * FROM employees\nWHERE last_name LIKE '%son'; -- 선행 % → Full Scan",
        good: "-- 방법 1: 후행 와일드카드만 사용\nSELECT * FROM employees\nWHERE last_name LIKE 'S%'; -- Range Scan 가능\n\n-- 방법 2: 전문 검색 인덱스(Oracle Text) 활용\n-- CONTAINS(last_name, 'son') > 0",
        goodDesc: '시작 문자가 고정되면 Range Scan이 가능합니다. 중간·끝 검색이 필요하면 Oracle Text 도입을 고려하세요.',
      },
      {
        title: '7. NULL 비교 (IS NULL)',
        reason: 'B-Tree 인덱스는 NULL을 저장하지 않습니다. IS NULL 조건은 인덱스에서 찾을 수 없어 Full Scan이 발생합니다.',
        bad: "SELECT * FROM employees\nWHERE commission_pct IS NULL; -- 인덱스 미사용",
        good: "-- 방법 1: NOT NULL 기본값으로 대체 설계\nUPDATE employees SET commission_pct = 0 WHERE commission_pct IS NULL;\n\n-- 방법 2: Bitmap 인덱스 (OLAP 환경)\n-- 방법 3: 함수 기반 인덱스\nCREATE INDEX idx_comm_null ON employees(NVL(commission_pct, -1));",
        goodDesc: 'NULL 조회가 잦다면 기본값 정책이나 함수 기반 인덱스를 고려하세요.',
      },
      {
        title: '8. 복합 인덱스에서 선두 컬럼 생략',
        reason: '복합 인덱스 (DEPT_ID, SALARY)에서 SALARY만 조건으로 쓰면 선두 컬럼이 없으므로 인덱스 시작점을 찾을 수 없습니다. Full Scan 또는 Skip Scan이 발생합니다.',
        bad: "-- 인덱스: (department_id, salary)\nSELECT * FROM employees\nWHERE salary > 5000000; -- department_id 없음 → 인덱스 비효율",
        good: "-- 방법 1: 선두 컬럼 추가\nSELECT * FROM employees\nWHERE department_id = 50 AND salary > 5000000;\n\n-- 방법 2: salary 단독 인덱스 생성\nCREATE INDEX idx_salary ON employees(salary);\n\n-- 방법 3: department_id cardinality 낮으면 Skip Scan 허용",
        goodDesc: '복합 인덱스는 선두 컬럼부터 순서대로 사용해야 합니다. 선두 컬럼이 없는 조건은 별도 단일 인덱스를 검토하세요.',
      },
    ] as CaseItem[],
    summaryTitle: '핵심 원칙 요약',
    summaryNote: '인덱스 컬럼은 가공하지 말 것. WHERE 절 좌변에 컬럼을 그대로 두고, 함수·연산·형변환은 우변(상수 쪽)에서 처리하세요. 이 원칙 하나만 지켜도 대부분의 인덱스 누락을 막을 수 있습니다.',
    hintsTitle: '실행 계획으로 확인하는 방법',
    hintsDesc: 'EXPLAIN PLAN 또는 AUTOTRACE로 실행 계획을 확인할 때, Operation 컬럼에 TABLE ACCESS FULL이 보이면 인덱스가 사용되지 않은 것입니다. INDEX RANGE SCAN, INDEX UNIQUE SCAN 등이 보이면 인덱스를 타고 있는 것입니다.',
    explainSql: "-- 실행 계획 확인\nEXPLAIN PLAN FOR\n  SELECT * FROM employees WHERE salary > 5000000;\n\nSELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);\n\n-- 또는 세션에서 바로 확인\nSET AUTOTRACE TRACEONLY EXPLAIN\nSELECT * FROM employees WHERE salary > 5000000;",
  },
  en: {
    title: 'When Indexes Are Not Used',
    subtitle: 'Even with an index in place, a poorly written query can force a Full Table Scan. Learn these patterns to write SQL that makes full use of your indexes.',
    introTitle: 'Why does Oracle ignore an index?',
    introDesc: 'The optimizer skips an index when it cannot compare the stored key values directly. The most common causes are: applying a function or arithmetic to the indexed column, implicit type conversion, and negative predicates (NOT, !=).',
    casesTitle: 'Case-by-Case Analysis',
    badLabel: 'No Index (Bad)',
    goodLabel: 'Index Used (Good)',
    whyLabel: 'Why is the index skipped?',
    fixLabel: 'How to fix it?',
    cases: [
      {
        title: '1. Function applied to the indexed column',
        reason: "When you apply a function like SUBSTR(last_name, 1, 3), the result can't be compared directly against the stored index keys. Oracle has to scan every row unless a Function-Based Index (FBI) exists.",
        bad: "SELECT * FROM employees\nWHERE SUBSTR(last_name, 1, 3) = 'Kim'; -- index on last_name is ignored",
        good: "SELECT * FROM employees\nWHERE last_name LIKE 'Kim%'; -- index Range Scan is used",
        goodDesc: "LIKE 'Kim%' anchors the start, so Oracle can Range Scan. LIKE '%Kim%' is still a full scan.",
      },
      {
        title: '2. Arithmetic on the indexed column',
        reason: "Performing arithmetic on the column transforms the value, so Oracle can't match it against stored index keys. Move the arithmetic to the constant side.",
        bad: "SELECT * FROM employees\nWHERE salary * 12 > 60000000; -- index on salary is ignored",
        good: "SELECT * FROM employees\nWHERE salary > 60000000 / 12; -- index Range Scan is used\n-- or simply\nWHERE salary > 5000000;",
        goodDesc: 'Moving the operation to the constant side leaves the column untouched and allows Range Scan.',
      },
      {
        title: '3. Implicit type conversion',
        reason: "If the column is NUMBER but you compare it to a string literal, Oracle internally applies TO_NUMBER() to the column — equivalent to wrapping it in a function. The index is skipped.",
        bad: "SELECT * FROM employees\nWHERE employee_id = '100'; -- NUMBER vs VARCHAR → index ignored",
        good: "SELECT * FROM employees\nWHERE employee_id = 100; -- matching types → index used",
        goodDesc: "Always use a literal that matches the column's data type. NUMBER columns need numeric literals; VARCHAR2 columns need string literals.",
      },
      {
        title: '4. Negative predicates (!=, NOT IN, NOT LIKE)',
        reason: 'An index points to where a value IS, not where it is NOT. "Everything except X" has no single starting position in the B-Tree, so Oracle resorts to a full scan.',
        bad: "SELECT * FROM employees\nWHERE department_id != 10; -- index on department_id is ignored",
        good: "SELECT * FROM employees\nWHERE department_id < 10\n   OR department_id > 10; -- two Range Scans\n-- or use an explicit IN list\nWHERE department_id IN (20, 30, 40, 50, 60, 70, 80, 90);",
        goodDesc: 'Splitting into range conditions or an IN list allows Range Scan. Note: if selectivity is low, a Full Table Scan may still be faster.',
      },
      {
        title: '5. OR across different indexed columns',
        reason: 'OR conditions are evaluated independently. When two different columns are joined by OR, Oracle may have to do a Full Scan for at least one side.',
        bad: "SELECT * FROM employees\nWHERE employee_id = 100\n   OR last_name = 'King'; -- sub-optimal index usage",
        good: "SELECT * FROM employees WHERE employee_id = 100\nUNION ALL\nSELECT * FROM employees WHERE last_name = 'King'\n  AND employee_id != 100; -- each branch uses its own index",
        goodDesc: 'UNION ALL lets each branch run its own index scan independently.',
      },
      {
        title: "6. LIKE '%value%' (leading wildcard)",
        reason: "B-Tree indexes are sorted left-to-right. A leading wildcard like '%son' means there is no fixed starting point, so Oracle must scan all rows.",
        bad: "SELECT * FROM employees\nWHERE last_name LIKE '%son'; -- leading % forces Full Scan",
        good: "-- Option 1: anchor the prefix\nSELECT * FROM employees\nWHERE last_name LIKE 'S%'; -- Range Scan\n\n-- Option 2: use Oracle Text for full substring search\n-- CONTAINS(last_name, 'son') > 0",
        goodDesc: 'Fix the leading character to enable Range Scan. For infix/suffix search, consider Oracle Text.',
      },
      {
        title: '7. IS NULL comparison',
        reason: 'B-Tree indexes do not store NULL entries. IS NULL cannot be resolved from the index and forces a Full Scan.',
        bad: "SELECT * FROM employees\nWHERE commission_pct IS NULL; -- no index hit",
        good: "-- Option 1: replace NULL with a sentinel value\nUPDATE employees SET commission_pct = 0 WHERE commission_pct IS NULL;\n\n-- Option 2: Bitmap index (OLAP)\n-- Option 3: Function-Based Index\nCREATE INDEX idx_comm_null ON employees(NVL(commission_pct, -1));",
        goodDesc: 'If IS NULL queries are frequent, consider a default-value policy or a Function-Based Index.',
      },
      {
        title: '8. Skipping the leading column of a composite index',
        reason: 'A composite index (DEPT_ID, SALARY) is sorted by DEPT_ID first. Querying only on SALARY leaves no anchor in the B-Tree — Oracle must Full Scan or fall back to Skip Scan.',
        bad: "-- Index: (department_id, salary)\nSELECT * FROM employees\nWHERE salary > 5000000; -- leading column missing → inefficient",
        good: "-- Option 1: include the leading column\nSELECT * FROM employees\nWHERE department_id = 50 AND salary > 5000000;\n\n-- Option 2: create a dedicated single-column index\nCREATE INDEX idx_salary ON employees(salary);\n\n-- Option 3: allow Skip Scan if dept cardinality is very low",
        goodDesc: 'Use composite index columns in order, starting from the leading column. For non-leading predicates, consider a separate single-column index.',
      },
    ] as CaseItem[],
    summaryTitle: 'Core Rule Summary',
    summaryNote: "Never transform the indexed column. Keep the column on the left side of the WHERE clause as-is, and move any functions, arithmetic, or type conversions to the constant (right) side. This single rule eliminates most index-bypass issues.",
    hintsTitle: 'Verifying with Execution Plans',
    hintsDesc: "When checking EXPLAIN PLAN or AUTOTRACE output, TABLE ACCESS FULL in the Operation column means no index was used. INDEX RANGE SCAN, INDEX UNIQUE SCAN, etc. confirm the index is being used.",
    explainSql: "-- View the execution plan\nEXPLAIN PLAN FOR\n  SELECT * FROM employees WHERE salary > 5000000;\n\nSELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);\n\n-- Or trace inline\nSET AUTOTRACE TRACEONLY EXPLAIN\nSELECT * FROM employees WHERE salary > 5000000;",
  },
}

export function IndexUnusableSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'
  const [openCase, setOpenCase] = useState<number | null>(null)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconAlertTriangle size={36} color="#7c3aed" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.introTitle}</SectionTitle>
      <Prose>{t.introDesc}</Prose>

      <Divider />

      <SectionTitle>{t.casesTitle}</SectionTitle>
      <div className="flex flex-col gap-3">
        {t.cases.map((c, i) => {
          const isOpen = openCase === i
          return (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-muted/40"
                onClick={() => setOpenCase(isOpen ? null : i)}
              >
                <span>{c.title}</span>
                <span className="ml-3 shrink-0 font-mono text-xs text-muted-foreground">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3">
                  {/* 이유 */}
                  <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">
                    <span className="mr-1 font-semibold text-rose-600">
                      {isKo ? '왜 못 쓰나요? ' : 'Why skipped? '}
                    </span>
                    {c.reason}
                  </p>

                  {/* Bad / Good 나란히 */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-500">
                        {t.badLabel}
                      </p>
                      <SqlBlock sql={c.bad} />
                    </div>
                    <div>
                      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                        {t.goodLabel}
                      </p>
                      <SqlBlock sql={c.good} />
                      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{c.goodDesc}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Divider />

      <SectionTitle>{t.summaryTitle}</SectionTitle>
      <InfoBox variant="warning">{t.summaryNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.hintsTitle}</SectionTitle>
      <Prose>{t.hintsDesc}</Prose>
      <SqlBlock sql={t.explainSql} />
    </PageContainer>
  )
}
