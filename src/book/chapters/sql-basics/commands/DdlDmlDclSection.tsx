import {
  PageContainer,
  ChapterTitle,
  Prose,
  InfoBox,
  SqlBlock,
  AccordionSection,
} from '../../shared'
import { cn } from '@/lib/utils'
import {
  IconCategory, IconTable, IconEdit, IconShieldLock, IconGitCommit,
} from '@tabler/icons-react'

const T = {
  ko: {
    chapterTitle: '오라클 명령어의 종류 알아보기',
    chapterSubtitle:
      'SQL은 관계형 데이터 베이스를 다루는 표준 언어입니다. SQL의 명령어는 역할에 따라 DDL, DML, DCL, TCL 네 가지로 분류되고, 각 역할을 이해하면 오라클이 데이터를 어떻게 다루는 지 알 수 있습니다.' +
      '각 명령어의 자세한 사용법은 앞으로 배우게되니, 여기서는 이런 뜻이구나 정도로만 읽고 넘어가면 됩니다.',

    overviewTitle: '명령어 종류 한눈에 보기',
    categories: [
      {
        abbr: 'DDL',
        full: 'Data Definition Language',
        color: 'violet',
        icon: <IconTable size={20} color="#7c3aed" stroke={1.5} />,
        title: '데이터 정의어',
        desc: '테이블·인덱스·뷰 등 데이터를 어떤 형태로 저장할 지 정의하거나 변경합니다.',
        cmds: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'],
      },
      {
        abbr: 'DML',
        full: 'Data Manipulation Language',
        color: 'blue',
        icon: <IconEdit size={20} color="#2563eb" stroke={1.5} />,
        title: '데이터 조작어',
        desc: '테이블에 저장된 실제 데이터를 조회·삽입·수정·삭제합니다.',
        cmds: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE'],
      },
      {
        abbr: 'DCL',
        full: 'Data Control Language',
        color: 'emerald',
        icon: <IconShieldLock size={20} color="#059669" stroke={1.5} />,
        title: '데이터 제어어',
        desc: '사용자에게 권한을 부여하거나 회수하여 데이터 접근을 제어하는 명령어입니다. 이 명령어로 사용자 별로 데이터 접근 권한을 다르게 부여할 수 있습니다. ',
        cmds: ['GRANT', 'REVOKE'],
      },
      {
        abbr: 'TCL',
        full: 'Transaction Control Language',
        color: 'orange',
        icon: <IconGitCommit size={20} color="#d97706" stroke={1.5} />,
        title: '트랜잭션 제어어',
        desc: 'DML로 변경한 데이터를 확정하거나 이전 상태로 되돌립니다.',
        cmds: ['COMMIT', 'ROLLBACK', 'SAVEPOINT'],
      },
    ],

    ddlTitle: 'DDL — 데이터 정의어',
    ddlDesc:
      'DDL은 테이블, 인덱스, 뷰, 시퀀스 등 데이터를 "어떻게" 저장할 지, 데이터 구조를 정의하는 명령어 입니다. ',
    ddlAutoCommit:
      'Oracle에서 DDL은 실행 즉시 자동 확정(COMMIT)되기 때문에 이전 상태으로 되돌릴 수(ROLLBACK) 없습니다. DDL을 실행하기 전에 진행 중인 DML 트랜잭션을 먼저 COMMIT 또는 ROLLBACK으로 마무리하세요.',
    ddlCmds: [
      {
        cmd: 'CREATE TABLE',
        desc: '새 테이블을 생성합니다.',
        example: `CREATE TABLE employees (
  emp_id   NUMBER       PRIMARY KEY,
  name     VARCHAR2(50) NOT NULL,
  dept_id  NUMBER,
  salary   NUMBER(10,2)
);`,
      },
      {
        cmd: 'ALTER TABLE',
        desc: '기존 테이블의 구조를 변경합니다 (컬럼 추가·수정·삭제, 제약 조건 추가 등).',
        example: `-- 컬럼 추가
ALTER TABLE employees ADD hire_date DATE;

-- 컬럼 타입 변경
ALTER TABLE employees MODIFY salary NUMBER(12,2);

-- 컬럼 삭제
ALTER TABLE employees DROP COLUMN hire_date;`,
      },
      {
        cmd: 'DROP TABLE',
        desc: '테이블과 그 안의 모든 데이터를 영구적으로 삭제합니다.',
        example: `DROP TABLE employees;

-- 관련 제약 조건도 함께 삭제
DROP TABLE employees CASCADE CONSTRAINTS;`,
      },
      {
        cmd: 'TRUNCATE TABLE',
        desc: '테이블은 남겨두고, 모든 데이터만 즉시 삭제합니다. TRUNCATE로 지워진 데이터는 ROLLBACK 할 수 없습니다.',
        example: `TRUNCATE TABLE employees;`,
      },
    ],

    dmlTitle: 'DML — 데이터 조작어',
    dmlDesc:
      'DML은 테이블에 저장된 실제 데이터를 읽고 쓰는 명령어입니다. DDL과 달리 자동 COMMIT되지 않으므로, 변경 사항을 확정하려면 COMMIT을, 취소하려면 ROLLBACK을 명시적으로 실행해야 합니다.',
    dmlCmds: [
      {
        cmd: 'INSERT',
        desc: '테이블에 새 행을 추가합니다.',
        example: `-- 전체 컬럼에 값 삽입
INSERT INTO employees VALUES (1, 'Alice', 10, 6000);

-- 특정 컬럼만 지정
INSERT INTO employees (emp_id, name, dept_id)
VALUES (2, 'Bob', 20);`,
      },
      {
        cmd: 'UPDATE',
        desc: '기존 행의 값을 수정합니다. WHERE 없이 실행하면 전체 행이 수정됩니다.',
        example: `UPDATE employees
SET    salary  = 7000,
       dept_id = 30
WHERE  emp_id  = 1;`,
      },
      {
        cmd: 'DELETE',
        desc: '조건에 맞는 행을 삭제합니다. Undo 로그를 남기므로 ROLLBACK이 가능합니다.',
        example: `DELETE FROM employees
WHERE dept_id = 20;`,
      },
      {
        cmd: 'MERGE',
        desc: '조건에 따라 INSERT 또는 UPDATE를 한 번에 처리하는 Upsert 구문입니다.',
        example: `MERGE INTO employees tgt
USING new_data src ON (tgt.emp_id = src.emp_id)
WHEN MATCHED THEN
  UPDATE SET tgt.salary = src.salary
WHEN NOT MATCHED THEN
  INSERT (emp_id, name, salary)
  VALUES (src.emp_id, src.name, src.salary);`,
      },
    ],

    dclTitle: 'DCL — 데이터 제어어',
    dclDesc:
      'DCL은 사용자나 역할(Role)에게 데이터베이스 객체에 대한 권한을 부여하거나 회수합니다. Oracle에서 DCL도 DDL처럼 자동 COMMIT됩니다.',
    dclCmds: [
      {
        cmd: 'GRANT',
        desc: '특정 사용자 또는 역할에게 권한을 부여합니다.',
        example: `-- 조회 권한 부여
GRANT SELECT ON employees TO hr_user;

-- 여러 권한 한 번에 부여
GRANT SELECT, INSERT, UPDATE ON employees TO hr_user;

-- 모든 권한 부여
GRANT ALL ON employees TO hr_user;`,
      },
      {
        cmd: 'REVOKE',
        desc: '이전에 부여한 권한을 회수합니다.',
        example: `REVOKE INSERT, UPDATE ON employees FROM hr_user;`,
      },
    ],

    roleTitle: '역할(Role)이란?',
    roleBody:
      '권한을 사용자 한 명 한 명에게 일일이 부여하면 관리가 번거롭습니다. Role은 여러 권한을 하나로 묶어 놓은 "권한 묶음"입니다.\n\n' +
      '예를 들어 HR_ROLE 이라는 Role에 employees 테이블의 SELECT·INSERT·UPDATE 권한을 미리 넣어 두면, 신규 입사자가 생길 때마다 GRANT HR_ROLE TO 사용자; 한 줄로 필요한 권한을 한꺼번에 줄 수 있습니다.\n\n' +
      '퇴사 시에도 REVOKE HR_ROLE FROM 사용자; 한 줄로 모든 권한을 한 번에 회수할 수 있어 권한 관리가 훨씬 간편해집니다.',

    tclTitle: 'TCL — 트랜잭션 제어어',
    tclDesc:
      '트랜잭션은 논리적으로 하나의 작업 단위로 묶인 DML 명령어들의 집합입니다. TCL로 트랜잭션을 확정(COMMIT)하거나 취소(ROLLBACK)할 수 있습니다.',
    tclTip:
      'DDL(CREATE, DROP 등)이나 DCL(GRANT, REVOKE)을 실행하면 Oracle이 먼저 진행 중인 트랜잭션을 자동 COMMIT합니다. 의도치 않은 확정을 막으려면 DDL 실행 전에 트랜잭션을 명시적으로 마무리하세요.',
    tclCmds: [
      {
        cmd: 'COMMIT',
        desc: '현재 트랜잭션의 모든 변경 사항을 데이터베이스에 영구적으로 반영합니다.',
        example: `UPDATE employees SET salary = 8000 WHERE emp_id = 1;
COMMIT;  -- 변경 확정`,
      },
      {
        cmd: 'ROLLBACK',
        desc: '마지막 COMMIT 이후의 모든 변경을 취소하고 이전 상태로 되돌립니다.',
        example: `DELETE FROM employees WHERE dept_id = 30;
ROLLBACK;  -- 삭제 취소`,
      },
      {
        cmd: 'SAVEPOINT',
        desc: '트랜잭션 중간에 저장 지점을 만들어, 그 지점까지만 ROLLBACK할 수 있습니다.',
        example: `INSERT INTO employees VALUES (3, 'Carol', 10, 5500);
SAVEPOINT sp1;

DELETE FROM employees WHERE emp_id = 2;
ROLLBACK TO sp1;  -- emp_id=2 삭제만 취소, Carol 삽입은 유지

COMMIT;`,
      },
    ],

    deleteCompareTitle: 'DELETE vs TRUNCATE vs DROP — 무엇이 다를까?',
    deleteCompareBody:
      '세 명령어 모두 데이터를 "지운다"는 점은 같지만, 무엇을 지우고 되돌릴 수 있는지가 다릅니다.\n\n' +
      '• DELETE (DML) — 조건에 맞는 행만 골라서 삭제합니다. 삭제하는 행 하나하나마다 Undo 로그를 기록하기 때문에 ROLLBACK으로 되돌릴 수 있습니다. 하지만 그만큼 느릴 수 있습니다.\n\n' +
      '• TRUNCATE (DDL) — 테이블의 모든 행을 한 번에 제거합니다. 행별 Undo 로그를 남기지 않아 DELETE보다 훨씬 빠르지만, 자동 COMMIT되므로 ROLLBACK 불가능합니다. 테이블 구조(컬럼 정의, 제약 조건)는 그대로 남습니다.\n\n' +
      '• DROP (DDL) — 테이블 자체를 데이터베이스에서 완전히 제거합니다. 안에 있던 데이터와 테이블 구조 모두 사라집니다. 마찬가지로 ROLLBACK 불가능합니다.',
    undoLogTitle: 'Undo 로그란?',
    undoLogBody:
      'Oracle이 DML(INSERT, UPDATE, DELETE)을 실행할 때, 변경 이전의 데이터를 Undo 세그먼트라는 별도 공간에 저장합니다. 이것이 Undo 로그입니다.\n\n' +
      'Undo 로그가 있기 때문에\n' +
      '① ROLLBACK — "아, 실수했다" 싶을 때 변경 전 상태로 되돌릴 수 있고,\n' +
      '② 읽기 일관성 — 내가 수정 중인 데이터를 다른 사용자가 조회하면 수정 전 값을 보여줄 수 있습니다.\n\n' +
      'TRUNCATE나 DROP은 Undo 로그를 남기지 않기 때문에 실행 즉시 되돌릴 방법이 없습니다. 항상 신중하게 사용하세요.',

    summaryTitle: '핵심 정리',
    summaryRows: [
      ['분류', '역할', '주요 명령어', 'Auto COMMIT'],
      ['DDL', '구조 정의', 'CREATE, ALTER, DROP, TRUNCATE', 'O (즉시)'],
      [
        'DML',
        '데이터 조작',
        'SELECT, INSERT, UPDATE, DELETE, MERGE',
        'X (명시 필요)',
      ],
      ['DCL', '권한 제어', 'GRANT, REVOKE', 'O (즉시)'],
      ['TCL', '트랜잭션 제어', 'COMMIT, ROLLBACK, SAVEPOINT', '—'],
    ],
  },
  en: {
    chapterTitle: 'Types of Oracle SQL Commands',
    chapterSubtitle:
      'SQL commands are grouped into four categories — DDL, DML, DCL, and TCL — based on their role. Understanding each category shows you how Oracle handles data. ' +
      "We'll cover each command in detail later, so for now just get a feel for what they mean.",

    overviewTitle: 'Command Categories at a Glance',
    categories: [
      {
        abbr: 'DDL',
        full: 'Data Definition Language',
        color: 'violet',
        icon: <IconTable size={20} color="#7c3aed" stroke={1.5} />,
        title: 'Data Definition',
        desc: 'Defines or modifies the structure of database objects such as tables, indexes, and views.',
        cmds: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'],
      },
      {
        abbr: 'DML',
        full: 'Data Manipulation Language',
        color: 'blue',
        icon: <IconEdit size={20} color="#2563eb" stroke={1.5} />,
        title: 'Data Manipulation',
        desc: 'Queries, inserts, updates, and deletes actual data stored in tables.',
        cmds: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE'],
      },
      {
        abbr: 'DCL',
        full: 'Data Control Language',
        color: 'emerald',
        icon: <IconShieldLock size={20} color="#059669" stroke={1.5} />,
        title: 'Data Control',
        desc: 'Grants or revokes privileges on database objects to control data access.',
        cmds: ['GRANT', 'REVOKE'],
      },
      {
        abbr: 'TCL',
        full: 'Transaction Control Language',
        color: 'orange',
        icon: <IconGitCommit size={20} color="#d97706" stroke={1.5} />,
        title: 'Transaction Control',
        desc: 'Commits DML changes permanently or rolls them back to a previous state.',
        cmds: ['COMMIT', 'ROLLBACK', 'SAVEPOINT'],
      },
    ],

    ddlTitle: 'DDL — Data Definition Language',
    ddlDesc:
      'DDL deals with the structure of database objects such as tables, indexes, views, and sequences. In Oracle, DDL is auto-committed immediately upon execution — it cannot be rolled back.',
    ddlAutoCommit:
      'Oracle DDL implicitly commits when executed. Always finish any in-progress DML transaction with an explicit COMMIT or ROLLBACK before running DDL.',
    ddlCmds: [
      {
        cmd: 'CREATE TABLE',
        desc: 'Creates a new table.',
        example: `CREATE TABLE employees (
  emp_id   NUMBER       PRIMARY KEY,
  name     VARCHAR2(50) NOT NULL,
  dept_id  NUMBER,
  salary   NUMBER(10,2)
);`,
      },
      {
        cmd: 'ALTER TABLE',
        desc: 'Modifies the structure of an existing table (add/modify/drop columns, add constraints, etc.).',
        example: `-- Add a column
ALTER TABLE employees ADD hire_date DATE;

-- Change column type
ALTER TABLE employees MODIFY salary NUMBER(12,2);

-- Drop a column
ALTER TABLE employees DROP COLUMN hire_date;`,
      },
      {
        cmd: 'DROP TABLE',
        desc: 'Permanently deletes a table and all its data.',
        example: `DROP TABLE employees;

-- Also drop related constraints
DROP TABLE employees CASCADE CONSTRAINTS;`,
      },
      {
        cmd: 'TRUNCATE TABLE',
        desc: 'Removes all rows instantly while keeping the table structure. Faster than DELETE but cannot be rolled back.',
        example: `TRUNCATE TABLE employees;`,
      },
    ],

    dmlTitle: 'DML — Data Manipulation Language',
    dmlDesc:
      'DML reads and writes the actual data stored in tables. Unlike DDL, DML is not auto-committed — you must explicitly run COMMIT to save changes or ROLLBACK to discard them.',
    dmlCmds: [
      {
        cmd: 'INSERT',
        desc: 'Adds new rows to a table.',
        example: `-- Insert into all columns
INSERT INTO employees VALUES (1, 'Alice', 10, 6000);

-- Insert into specific columns
INSERT INTO employees (emp_id, name, dept_id)
VALUES (2, 'Bob', 20);`,
      },
      {
        cmd: 'UPDATE',
        desc: 'Modifies existing rows. Without WHERE, every row is updated.',
        example: `UPDATE employees
SET    salary  = 7000,
       dept_id = 30
WHERE  emp_id  = 1;`,
      },
      {
        cmd: 'DELETE',
        desc: 'Removes matching rows. Writes undo logs, so ROLLBACK is possible.',
        example: `DELETE FROM employees
WHERE dept_id = 20;`,
      },
      {
        cmd: 'MERGE',
        desc: 'Performs INSERT or UPDATE in a single statement (upsert) based on a condition.',
        example: `MERGE INTO employees tgt
USING new_data src ON (tgt.emp_id = src.emp_id)
WHEN MATCHED THEN
  UPDATE SET tgt.salary = src.salary
WHEN NOT MATCHED THEN
  INSERT (emp_id, name, salary)
  VALUES (src.emp_id, src.name, src.salary);`,
      },
    ],

    dclTitle: 'DCL — Data Control Language',
    dclDesc:
      'DCL grants or revokes privileges on database objects for users or roles. Like DDL, DCL in Oracle is also auto-committed.',
    dclCmds: [
      {
        cmd: 'GRANT',
        desc: 'Grants a privilege to a user or role.',
        example: `-- Grant SELECT privilege
GRANT SELECT ON employees TO hr_user;

-- Grant multiple privileges at once
GRANT SELECT, INSERT, UPDATE ON employees TO hr_user;

-- Grant all privileges
GRANT ALL ON employees TO hr_user;`,
      },
      {
        cmd: 'REVOKE',
        desc: 'Revokes a previously granted privilege.',
        example: `REVOKE INSERT, UPDATE ON employees FROM hr_user;`,
      },
    ],

    tclTitle: 'TCL — Transaction Control Language',
    tclDesc:
      'A transaction is a logical unit of work composed of one or more DML statements. TCL lets you commit (permanently save) or roll back (cancel) a transaction.',
    tclTip:
      'Executing DDL (CREATE, DROP, etc.) or DCL (GRANT, REVOKE) causes Oracle to automatically commit any in-progress transaction first. Finish your transaction explicitly before running DDL to avoid unintended commits.',
    tclCmds: [
      {
        cmd: 'COMMIT',
        desc: 'Permanently saves all changes made in the current transaction.',
        example: `UPDATE employees SET salary = 8000 WHERE emp_id = 1;
COMMIT;  -- confirm changes`,
      },
      {
        cmd: 'ROLLBACK',
        desc: 'Cancels all changes since the last COMMIT and restores the previous state.',
        example: `DELETE FROM employees WHERE dept_id = 30;
ROLLBACK;  -- undo the delete`,
      },
      {
        cmd: 'SAVEPOINT',
        desc: 'Creates an intermediate save point within a transaction so you can roll back to that point.',
        example: `INSERT INTO employees VALUES (3, 'Carol', 10, 5500);
SAVEPOINT sp1;

DELETE FROM employees WHERE emp_id = 2;
ROLLBACK TO sp1;  -- only undo the delete; Carol's insert is kept

COMMIT;`,
      },
    ],

    roleTitle: 'What is a Role?',
    roleBody:
      'Granting privileges to every user individually becomes tedious to manage. A Role is a named collection of privileges — a "privilege bundle."\n\n' +
      'For example, if you create a role called HR_ROLE and add SELECT, INSERT, and UPDATE on the employees table to it, you can grant every privilege at once to a new employee with a single line: GRANT HR_ROLE TO username;\n\n' +
      'When someone leaves, REVOKE HR_ROLE FROM username; removes all associated privileges in one step — making access management far simpler.',

    deleteCompareTitle: "DELETE vs TRUNCATE vs DROP — What's the difference?",
    deleteCompareBody:
      'All three commands "delete" data, but they differ in what they remove and whether it can be undone.\n\n' +
      '• DELETE (DML) — Removes only the rows that match a condition. Each deleted row is recorded in the Undo log, so ROLLBACK is possible. This per-row logging can make it slower on large datasets.\n\n' +
      '• TRUNCATE (DDL) — Removes all rows from a table in one shot. It skips per-row Undo logging, making it much faster than DELETE — but it auto-commits, so ROLLBACK is not possible. The table structure (columns, constraints) remains intact.\n\n' +
      '• DROP (DDL) — Completely removes the table itself from the database. Both the data and the table structure are gone. Like TRUNCATE, it cannot be rolled back.',
    undoLogTitle: 'What is an Undo Log?',
    undoLogBody:
      'When Oracle executes a DML statement (INSERT, UPDATE, DELETE), it saves a copy of the data as it was before the change in a special area called the Undo Segment. This saved copy is the Undo log.\n\n' +
      'The Undo log enables two key features:\n' +
      '① ROLLBACK — if you made a mistake, Oracle can restore the data to its state before the change.\n' +
      '② Read consistency — while you are modifying data, other users who query it will see the pre-change version, not your uncommitted work.\n\n' +
      'TRUNCATE and DROP do not write Undo logs, so there is no way to recover once they execute. Always double-check before running them.',

    summaryTitle: 'Summary',
    summaryRows: [
      ['Category', 'Role', 'Key Commands', 'Auto COMMIT'],
      [
        'DDL',
        'Structure definition',
        'CREATE, ALTER, DROP, TRUNCATE',
        'Yes (immediate)',
      ],
      [
        'DML',
        'Data manipulation',
        'SELECT, INSERT, UPDATE, DELETE, MERGE',
        'No (explicit required)',
      ],
      ['DCL', 'Privilege control', 'GRANT, REVOKE', 'Yes (immediate)'],
      ['TCL', 'Transaction control', 'COMMIT, ROLLBACK, SAVEPOINT', '—'],
    ],
  },
}

const COLOR_MAP: Record<string, { card: string; badge: string; tag: string }> = {
  violet:  { card: 'border-violet-200 bg-violet-50/60',  badge: 'bg-violet-100 text-violet-700',  tag: 'bg-violet-100 text-violet-600' },
  blue:    { card: 'border-blue-200 bg-blue-50/60',      badge: 'bg-blue-100 text-blue-700',      tag: 'bg-blue-100 text-blue-600' },
  emerald: { card: 'border-emerald-200 bg-emerald-50/60',badge: 'bg-emerald-100 text-emerald-700',tag: 'bg-emerald-100 text-emerald-600' },
  orange:  { card: 'border-orange-200 bg-orange-50/60',  badge: 'bg-orange-100 text-orange-700',  tag: 'bg-orange-100 text-orange-600' },
}

export function DdlDmlDclSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle icon={<IconCategory size={36} color="#6366f1" stroke={1.5} />} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      {/* ── Overview cards ── */}
      <h2 className="mb-4 mt-8 text-xl font-bold tracking-tight">{t.overviewTitle}</h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {t.categories.map((cat) => {
          const c = COLOR_MAP[cat.color]
          return (
            <div key={cat.abbr} className={cn('rounded-xl border p-4', c.card)}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span className={cn('rounded-md px-2 py-0.5 font-mono text-sm font-bold', c.badge)}>
                  {cat.abbr}
                </span>
                <span className="text-xs text-muted-foreground">{cat.full}</span>
              </div>
              <div className="mb-1 text-sm font-semibold">{cat.title}</div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{cat.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.cmds.map((cmd) => (
                  <span key={cmd} className={cn('rounded px-1.5 py-0.5 font-mono text-[11px] font-medium', c.tag)}>
                    {cmd}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>


        {/* ── DDL ── */}
        <AccordionSection title={t.ddlTitle}>
          <Prose>{t.ddlDesc}</Prose>
          <InfoBox variant="warning" lang={lang}>{t.ddlAutoCommit}</InfoBox>
          <div className="mt-4 space-y-5">
            {t.ddlCmds.map((item) => (
              <SqlBlock key={item.cmd} badge={item.cmd} desc={item.desc} sql={item.example} badgeColor="violet" />
            ))}
          </div>
        </AccordionSection>

        {/* ── DML ── */}
        <AccordionSection title={t.dmlTitle}>
          <Prose>{t.dmlDesc}</Prose>
          <div className="mt-4 space-y-5">
            {t.dmlCmds.map((item) => (
              <SqlBlock key={item.cmd} badge={item.cmd} desc={item.desc} sql={item.example} badgeColor="blue" />
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <InfoBox variant="tip" lang={lang}>
              <span className="font-bold">{t.deleteCompareTitle}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{'\n\n' + t.deleteCompareBody}</span>
            </InfoBox>
            <InfoBox variant="note" lang={lang}>
              <span className="font-bold">{t.undoLogTitle}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{'\n\n' + t.undoLogBody}</span>
            </InfoBox>
          </div>
        </AccordionSection>

        {/* ── DCL ── */}
        <AccordionSection title={t.dclTitle}>
          <Prose>{t.dclDesc}</Prose>
          <div className="mt-4 space-y-5">
            {t.dclCmds.map((item) => (
              <SqlBlock key={item.cmd} badge={item.cmd} desc={item.desc} sql={item.example} badgeColor="emerald" />
            ))}
          </div>
          <div className="mt-6">
            <InfoBox variant="tip" lang={lang}>
              <span className="font-bold">{t.roleTitle}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{'\n\n' + t.roleBody}</span>
            </InfoBox>
          </div>
        </AccordionSection>

        {/* ── TCL ── */}
        <AccordionSection title={t.tclTitle}>
          <Prose>{t.tclDesc}</Prose>
          <InfoBox variant="note" lang={lang}>{t.tclTip}</InfoBox>
          <div className="mt-4 space-y-5">
            {t.tclCmds.map((item) => (
              <SqlBlock key={item.cmd} badge={item.cmd} desc={item.desc} sql={item.example} badgeColor="orange" />
            ))}
          </div>
        </AccordionSection>

        {/* ── Summary table ── */}
        <AccordionSection title={t.summaryTitle}>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40">
                  {t.summaryRows[0].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-mono font-semibold text-foreground/70">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.summaryRows.slice(1).map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    {row.map((cell, j) => (
                      <td key={j} className={cn('px-4 py-2.5', j === 0 ? 'font-mono font-bold' : 'text-muted-foreground')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionSection>
    </PageContainer>
  )
}


