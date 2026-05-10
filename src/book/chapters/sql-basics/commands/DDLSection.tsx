import {
  PageContainer,
  ChapterTitle,
  Prose,
  InfoBox,
  SqlBlock,
  Table,
  AccordionSection,
} from '../../shared'
import { IconTable } from '@tabler/icons-react'

const T = {
  ko: {
    chapterTitle: 'DDL — Data Definition Language',
    chapterSubtitle:
      'DDL은 테이블·인덱스·뷰·시퀀스 등 데이터베이스 객체의 구조를 정의하거나 변경하는 명령어입니다. 실행 즉시 자동 COMMIT되므로 ROLLBACK이 불가능합니다. 의도치 않은 데이터 확정을 막으려면 DDL 전에 트랜잭션을 명시적으로 마무리 해야합니다.',

    createTitle: 'CREATE TABLE — 테이블 생성',
    createDesc:
      '위에서 살펴본 데이터 타입과 제약 조건을 조합해 테이블을 정의합니다.',
    dataTypeTitle: '주요 데이터 타입',
    dataTypeHeaders: ['타입', '설명', '예시'],
    dataTypeRows: [
      [
        'NUMBER(p, s)',
        '숫자. p=전체 자릿수, s=소수점 이하 자릿수',
        'NUMBER(10,2) → 12345678.90',
      ],
      [
        'VARCHAR2(n)',
        '가변 길이 문자열. 최대 n바이트',
        "VARCHAR2(50) → 'Alice'",
      ],
      ['CHAR(n)', '고정 길이 문자열. 짧으면 공백으로 채움', "CHAR(1) → 'Y'"],
      ['DATE', '날짜+시간 (년월일시분초)', 'SYSDATE'],
      [
        'TIMESTAMP',
        'DATE보다 정밀한 날짜+시간 (나노초 단위까지)',
        'SYSTIMESTAMP',
      ],
      ['CLOB', '대용량 텍스트 (최대 4GB)', '긴 본문, JSON 등'],
      ['BLOB', '대용량 바이너리 (이미지, 파일 등)', '첨부파일'],
    ],
    varcharVsChar:
      "VARCHAR2(10)에 'Hi'를 저장하면 실제로 2바이트만 사용합니다. 반면 CHAR(10)에 'Hi'를 저장하면 나머지 8자리를 공백으로 채워 항상 10바이트를 사용합니다.\n\n" +
      "따라서 길이가 일정한 값(성별 코드 'M'/'F', 국가 코드 'KR' 등)에는 CHAR를, 길이가 제각각인 이름·이메일·주소 등에는 VARCHAR2를 사용하는 것이 일반적입니다.\n\n" +
      '주의: CHAR 컬럼에서 비교 시 Oracle은 공백을 무시하고 같다고 판단하지만, VARCHAR2와 CHAR를 혼용 비교할 때는 공백 처리 방식이 달라 예상치 못한 결과가 나올 수 있습니다.',
    prerequisiteDesc:
      'DDL 명령어를 공부하기 전에, 컬럼에 지정할 수 있는 데이터 타입과 제약 조건에 대해 먼저 알아봅니다. \n 개발 지식이 있지 않다면 어렵게 느껴질 수도 있습니다만, 앞으로 테이블을 생성하거나 컬럼을 추가하는 명령어와 함께 사용되는 걸 보면 자연스럽게 이해할 수 있으니 가볍게 개념을 이해하세요.',
    prerequisiteTitle: '먼저 알아두기 — 데이터 타입 & 제약 조건',
    constraintTitle: '제약 조건 (Constraint)',
    constraintDesc:
      '제약 조건은 컬럼에 저장될 수 있는 값의 규칙을 정의합니다. 잘못된 데이터가 들어오는 것을 데이터베이스 레벨에서 원천 차단합니다.',
    constraintHeaders: ['제약 조건', '의미'],
    constraintRows: [
      [
        'PRIMARY KEY',
        '행을 고유하게 식별하는 컬럼. NOT NULL + UNIQUE 조합. 테이블당 하나',
      ],
      ['NOT NULL', 'NULL 값 금지. 반드시 값이 있어야 함'],
      ['UNIQUE', '같은 값 중복 금지 (NULL은 여러 개 허용)'],
      [
        'FOREIGN KEY … REFERENCES',
        '다른 테이블의 PRIMARY KEY를 참조. 참조 무결성 보장',
      ],
      ['CHECK', '지정한 조건을 만족하는 값만 허용'],
      ['DEFAULT', '값을 지정하지 않을 때 자동으로 채울 기본값'],
    ],
    createExample: `CREATE TABLE employees (
  emp_id    NUMBER(6)     PRIMARY KEY,    -- 숫자 6자리, 행을 고유하게 식별하는 키
  name      VARCHAR2(50)  NOT NULL,       -- 최대 50자 문자열,  NULL 입력 불가
  email     VARCHAR2(100) UNIQUE,         -- 최대 100자, 중복 이메일을 허용하지 않음
  dept_id   NUMBER(4)     REFERENCES departments(dept_id), -- departments 테이블의 dept_id 값과 같아야 함
  salary    NUMBER(10,2)  CHECK (salary > 0),  -- 소수점 2자리 숫자, 0보다 커야 함
  hire_date DATE          DEFAULT SYSDATE,     -- 날짜, 값을 입력하지 않으면, 오늘 날짜 자동으로 입력
  status    CHAR(1)       DEFAULT 'A' NOT NULL -- 고정 1자리, 기본값 'A', NULL 입력 불가
);`,

    alterTitle: 'ALTER TABLE — 테이블 구조 변경',
    alterDesc:
      '이미 운영 중인 테이블의 구조를 바꿀 때 사용합니다. 데이터를 그대로 유지하면서 컬럼을 추가·수정·삭제하거나 제약 조건을 추가·삭제할 수 있습니다.',
    alterExample: `-- employees 테이블에 phone 컬럼 추가
ALTER TABLE employees ADD phone VARCHAR2(20);

-- 컬럼 타입·크기 변경 (이미 저장되어 있는 데이터가 변경되는 새 타입에 맞아야 함)
ALTER TABLE employees MODIFY salary NUMBER(12,2);

-- employees 테이블의 phone 컬럼의 이름을 mobile 로 변경
ALTER TABLE employees RENAME COLUMN phone TO mobile;

-- employees 테이블에서 mobile 컬럼을 삭제
ALTER TABLE employees DROP COLUMN mobile;

-- 제약 조건 추가 : salary 컬럼의 값은 항상 0보다 커야함.
ALTER TABLE employees ADD CONSTRAINT chk_salary CHECK (salary > 0);

-- 제약 조건 삭제
ALTER TABLE employees DROP CONSTRAINT chk_salary;`,
    alterTip:
      'NOT NULL 제약 조건 추가 시, 기존 행에 이미 NULL 값이 있으면 에러가 발생합니다. 먼저 UPDATE로 NULL을 채운 뒤 제약 조건을 추가하세요.',

    dropTruncateTitle: 'DROP vs TRUNCATE — 무엇이 다를까?',
    dropTruncateDesc:
      '둘 다 DDL이라 자동 COMMIT되지만, 지우는 대상이 다릅니다.',
    dropTruncateHeaders: ['구분', 'DROP TABLE', 'TRUNCATE TABLE'],
    dropTruncateRows: [
      ['지우는 대상', '테이블 구조 + 데이터 모두', '데이터만 (구조는 유지)'],
      ['ROLLBACK', '불가', '불가'],
      ['속도', '빠름', '매우 빠름 (Undo 로그 없음)'],
      ['WHERE 조건', '없음', '없음 (전체 삭제만 가능)'],
      ['재사용', '테이블 없어짐 (다시 CREATE 필요)', '빈 테이블 그대로 남음'],
    ],
    dropExample: `-- employees 테이블 완전 삭제 (데이터와 구조 모두 사라짐, 복구 불가)
DROP TABLE employees;

-- departments 테이블 삭제 — 이 테이블을 참조하는 외래키 제약 조건도 함께 제거
DROP TABLE departments CASCADE CONSTRAINTS;`,
    truncateExample: `-- employees 테이블의 전체 행을 즉시 삭제 (구조는 그대로 유지, Undo 로그 없음)
TRUNCATE TABLE employees;`,

    otherTitle: '그 밖의 DDL',
    otherDesc:
      '테이블 외에도 인덱스·뷰·시퀀스 등 다양한 객체를 DDL로 생성·삭제할 수 있습니다.',
    otherPreview:
      '인덱스·뷰·시퀀스는 이후 챕터에서 훨씬 자세히 다룹니다. 지금은 "이런 객체도 DDL로 만든다"는 정도만 알고 넘어가세요.\n\n' +
      '• 인덱스(Index) — 책의 색인처럼, 특정 컬럼 값으로 행을 빠르게 찾을 수 있게 해주는 구조입니다. 없어도 조회는 되지만, 테이블이 클수록 속도 차이가 크게 납니다.\n' +
      '• 뷰(View) — 복잡한 SELECT 쿼리에 이름을 붙여 저장한 것입니다. 실제 데이터를 따로 저장하지 않고, 조회할 때마다 원본 테이블을 읽습니다.\n' +
      '• 시퀀스(Sequence) — 1, 2, 3… 처럼 자동으로 증가하는 숫자를 만들어 주는 객체입니다. PRIMARY KEY 값을 자동으로 채번할 때 주로 씁니다.',
    otherExamples: [
      {
        cmd: 'CREATE INDEX',
        desc: '조회 성능 향상을 위한 인덱스를 생성합니다.',
        example: `-- name 컬럼에 단일 인덱스 생성 — 이름으로 검색할 때 속도 향상
CREATE INDEX idx_emp_name ON employees(name);

-- dept_id + salary 복합 인덱스 — WHERE에 두 컬럼이 함께 쓰일 때 효과적
CREATE INDEX idx_emp_dept_sal ON employees(dept_id, salary);`,
      },
      {
        cmd: 'CREATE VIEW',
        desc: '자주 쓰는 복잡한 쿼리를 뷰로 저장해 테이블처럼 조회합니다.',
        example: `-- 급여 8000 이상인 직원만 보여주는 뷰를 생성
CREATE VIEW v_high_earners AS
  SELECT emp_id, name, salary
  FROM   employees
  WHERE  salary >= 8000;

-- 일반 테이블처럼 뷰를 조회할 수 있음
SELECT * FROM v_high_earners;`,
      },
      {
        cmd: 'CREATE SEQUENCE',
        desc: '자동 증가하는 숫자를 생성합니다. 주로 PRIMARY KEY 값 채번에 사용합니다.',
        example: `-- 1부터 시작해서 1씩 증가하는 시퀀스 생성
CREATE SEQUENCE emp_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE; -- NOCACHE: 값을 미리 캐시하지 않아 번호 공백 없이 순서 보장

-- NEXTVAL로 다음 시퀀스 값을 가져와 emp_id에 자동 채번
INSERT INTO employees (emp_id, name)
VALUES (emp_seq.NEXTVAL, 'Alice');`,
      },
      {
        cmd: 'RENAME',
        desc: '테이블·뷰·시퀀스의 이름을 변경합니다.',
        example: `RENAME employees TO staff;`,
      },
    ],
  },
  en: {
    chapterTitle: 'DDL — Data Definition Language',
    chapterSubtitle:
      'DDL commands define or modify the structure of database objects such as tables, indexes, views, and sequences. They are auto-committed immediately upon execution — ROLLBACK is not possible. To avoid unintended commits, explicitly finish your transaction with COMMIT or ROLLBACK before executing DDL.',

    createTitle: 'CREATE TABLE — Creating a Table',
    createDesc:
      'Combine the data types and constraints covered above to define a table.',
    dataTypeTitle: 'Common Data Types',
    dataTypeHeaders: ['Type', 'Description', 'Example'],
    dataTypeRows: [
      [
        'NUMBER(p, s)',
        'Number. p = total digits, s = decimal places',
        'NUMBER(10,2) → 12345678.90',
      ],
      [
        'VARCHAR2(n)',
        'Variable-length string up to n bytes',
        "VARCHAR2(50) → 'Alice'",
      ],
      [
        'CHAR(n)',
        'Fixed-length string, padded with spaces if shorter',
        "CHAR(1) → 'Y'",
      ],
      ['DATE', 'Date + time (year/month/day/hour/min/sec)', 'SYSDATE'],
      [
        'TIMESTAMP',
        'Higher-precision date + time (down to nanoseconds)',
        'SYSTIMESTAMP',
      ],
      ['CLOB', 'Large text data (up to 4 GB)', 'Long text, JSON, etc.'],
      ['BLOB', 'Large binary data (images, files, etc.)', 'File attachments'],
    ],
    varcharVsChar:
      "Storing 'Hi' in VARCHAR2(10) uses only 2 bytes. Storing 'Hi' in CHAR(10) pads the remaining 8 positions with spaces, always consuming 10 bytes.\n\n" +
      "Use CHAR for values with a fixed length (e.g. gender code 'M'/'F', country code 'KR'), and VARCHAR2 for variable-length values like names, emails, or addresses.\n\n" +
      'Note: When comparing CHAR values, Oracle ignores trailing spaces and considers them equal. However, comparing VARCHAR2 and CHAR can produce unexpected results due to different whitespace handling.',
    prerequisiteDesc:
      "Before diving into DDL commands, let's first understand data types and constraints that can be assigned to columns.",
    prerequisiteTitle: 'Prerequisites — Data Types & Constraints',
    constraintTitle: 'Constraints',
    constraintDesc:
      'Constraints define rules for what values are allowed in a column. They enforce data integrity at the database level.',
    constraintHeaders: ['Constraint', 'Meaning'],
    constraintRows: [
      [
        'PRIMARY KEY',
        'Uniquely identifies each row. Combines NOT NULL + UNIQUE. One per table.',
      ],
      ['NOT NULL', 'Prohibits NULL — a value must always be provided'],
      ['UNIQUE', 'No duplicate values allowed (multiple NULLs are permitted)'],
      [
        'FOREIGN KEY … REFERENCES',
        'References a PRIMARY KEY in another table. Enforces referential integrity.',
      ],
      ['CHECK', 'Only values satisfying the specified condition are allowed'],
      ['DEFAULT', 'Value inserted automatically when no value is provided'],
    ],
    createExample: `CREATE TABLE employees (
  emp_id    NUMBER(6)     PRIMARY KEY,    -- 6-digit number, uniquely identifies each row
  name      VARCHAR2(50)  NOT NULL,       -- up to 50 chars, value required
  email     VARCHAR2(100) UNIQUE,         -- up to 100 chars, no duplicates allowed
  dept_id   NUMBER(4)     REFERENCES departments(dept_id), -- FK to departments table
  salary    NUMBER(10,2)  CHECK (salary > 0),  -- decimal number, must be positive
  hire_date DATE          DEFAULT SYSDATE,     -- date, defaults to today if omitted
  status    CHAR(1)       DEFAULT 'A' NOT NULL -- fixed 1 char, default 'A', never NULL
);`,

    alterTitle: 'ALTER TABLE — Modifying Table Structure',
    alterDesc:
      'Used to change the structure of a table already in use. You can add, modify, or remove columns and constraints while keeping existing data intact.',
    alterExample: `-- Add a new phone column to the employees table
ALTER TABLE employees ADD phone VARCHAR2(20);

-- Expand salary column size (existing data must fit the new type)
ALTER TABLE employees MODIFY salary NUMBER(12,2);

-- Rename the phone column to mobile
ALTER TABLE employees RENAME COLUMN phone TO mobile;

-- Remove the mobile column from the employees table
ALTER TABLE employees DROP COLUMN mobile;

-- Add a named CHECK constraint — salary must be greater than 0
ALTER TABLE employees ADD CONSTRAINT chk_salary CHECK (salary > 0);

-- Remove the constraint named chk_salary
ALTER TABLE employees DROP CONSTRAINT chk_salary;`,
    alterTip:
      'When adding a NOT NULL constraint, the operation fails if any existing row already contains NULL in that column. Update those rows first, then add the constraint.',

    dropTruncateTitle: 'DROP vs TRUNCATE — What is the Difference?',
    dropTruncateDesc:
      'Both are DDL and auto-committed, but they remove different things.',
    dropTruncateHeaders: ['', 'DROP TABLE', 'TRUNCATE TABLE'],
    dropTruncateRows: [
      [
        'What is removed',
        'Table structure + all data',
        'Data only (structure remains)',
      ],
      ['ROLLBACK', 'Not possible', 'Not possible'],
      ['Speed', 'Fast', 'Very fast (no undo logging)'],
      ['WHERE clause', 'N/A', 'N/A (always removes all rows)'],
      [
        'After execution',
        'Table is gone — must CREATE again',
        'Empty table remains',
      ],
    ],
    dropExample: `-- Permanently delete the employees table (data + structure both gone)
DROP TABLE employees;

-- Delete departments table — also removes any FK constraints pointing to it
DROP TABLE departments CASCADE CONSTRAINTS;`,
    truncateExample: `-- Delete all rows instantly — table structure is kept, no undo log written
TRUNCATE TABLE employees;`,

    otherTitle: 'Other DDL Commands',
    otherDesc:
      'Beyond tables, DDL can create and drop indexes, views, sequences, and more.',
    otherPreview:
      'Indexes, views, and sequences are covered in depth in later chapters. For now, just take away that these objects are also created with DDL.\n\n' +
      '• Index — Like the index of a book, it lets Oracle find rows by a column value quickly. Queries work without one, but the larger the table, the bigger the performance gap.\n' +
      '• View — A saved SELECT query with a name. It stores no data of its own — it reads from the underlying tables every time you query it.\n' +
      '• Sequence — An object that generates auto-incrementing numbers (1, 2, 3…). Commonly used to populate PRIMARY KEY values automatically.',
    otherExamples: [
      {
        cmd: 'CREATE INDEX',
        desc: 'Creates an index to speed up query performance.',
        example: `-- Single-column index on name — speeds up name-based searches
CREATE INDEX idx_emp_name ON employees(name);

-- Composite index on dept_id + salary — useful when both columns appear in WHERE
CREATE INDEX idx_emp_dept_sal ON employees(dept_id, salary);`,
      },
      {
        cmd: 'CREATE VIEW',
        desc: 'Saves a complex query as a named view that can be queried like a table.',
        example: `-- Create a view that shows only employees earning 8000 or more
CREATE VIEW v_high_earners AS
  SELECT emp_id, name, salary
  FROM   employees
  WHERE  salary >= 8000;

-- Query the view just like a regular table
SELECT * FROM v_high_earners;`,
      },
      {
        cmd: 'CREATE SEQUENCE',
        desc: 'Generates auto-incrementing numbers. Commonly used for PRIMARY KEY values.',
        example: `-- Create a sequence that starts at 1 and increments by 1 each time
CREATE SEQUENCE emp_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE; -- NOCACHE: don't pre-allocate values, safer for gap-free numbering

-- Use NEXTVAL to get the next sequence value when inserting a new row
INSERT INTO employees (emp_id, name)
VALUES (emp_seq.NEXTVAL, 'Alice');`,
      },
      {
        cmd: 'RENAME',
        desc: 'Renames a table, view, or sequence.',
        example: `RENAME employees TO staff;`,
      },
    ],
  },
}

export function DDLSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  return (
    <PageContainer>
      <ChapterTitle icon={<IconTable size={36} color="#f59e0b" stroke={1.5} />} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      <div className="mt-6">
        {/* 데이터 타입 & 제약 조건 */}
        <AccordionSection title={t.prerequisiteTitle}>
          <Prose>{t.prerequisiteDesc}</Prose>
          <p className="mb-2 text-sm font-bold">{t.dataTypeTitle}</p>
          <Table headers={t.dataTypeHeaders} rows={t.dataTypeRows} />
          <InfoBox variant="tip" lang={lang}>
            <span style={{ whiteSpace: 'pre-line' }}>{t.varcharVsChar}</span>
          </InfoBox>
          <p className="mb-2 mt-4 text-sm font-bold">{t.constraintTitle}</p>
          <Prose>{t.constraintDesc}</Prose>
          <Table headers={t.constraintHeaders} rows={t.constraintRows} />
        </AccordionSection>

        {/* CREATE TABLE */}
        <AccordionSection title={t.createTitle}>
          <Prose>{t.createDesc}</Prose>
          <SqlBlock sql={t.createExample} />
        </AccordionSection>

        {/* ALTER TABLE */}
        <AccordionSection title={t.alterTitle}>
          <Prose>{t.alterDesc}</Prose>
          <SqlBlock sql={t.alterExample} />
          <InfoBox variant="tip" lang={lang}>
            {t.alterTip}
          </InfoBox>
        </AccordionSection>

        {/* DROP vs TRUNCATE */}
        <AccordionSection title={t.dropTruncateTitle}>
          <Prose>{t.dropTruncateDesc}</Prose>
          <Table headers={t.dropTruncateHeaders} rows={t.dropTruncateRows} />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SqlBlock badge="DROP TABLE" badgeColor="violet" sql={t.dropExample} />
            <SqlBlock badge="TRUNCATE TABLE" badgeColor="violet" sql={t.truncateExample} />
          </div>
        </AccordionSection>

        {/* Other DDL */}
        <AccordionSection title={t.otherTitle}>
          <Prose>{t.otherDesc}</Prose>
          <InfoBox variant="note" lang={lang}>/
            <span style={{ whiteSpace: 'pre-line' }}>{t.otherPreview}</span>
          </InfoBox>
          <div className="space-y-5">
            {t.otherExamples.map((item) => (
              <SqlBlock
                key={item.cmd}
                badge={item.cmd}
                badgeColor="violet"
                desc={item.desc}
                sql={item.example}
              />
            ))}
          </div>
        </AccordionSection>
      </div>
    </PageContainer>
  )
}
