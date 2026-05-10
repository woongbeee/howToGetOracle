import {
  PageContainer,
  ChapterTitle,
  Prose,
  InfoBox,
  SqlBlock,
  Table,
  AccordionSection,
} from '../../shared'
import { useSimulationStore } from '@/store/simulationStore'
import { IconGitCommit } from '@tabler/icons-react'

const T = {
  ko: {
    chapterTitle: 'TCL — Transaction Control Language',
    chapterSubtitle:
      'TCL은 DML(INSERT·UPDATE·DELETE)로 변경한 데이터를 확정하거나 이전 상태로 되돌리는 명령어입니다. 트랜잭션 단위로 데이터의 일관성을 보장합니다.',

    txTitle: '먼저 알아두기 — 트랜잭션(Transaction)이란?',
    txDesc:
      '트랜잭션은 "하나의 작업 단위"입니다. 은행 이체를 예로 들면, A 계좌에서 출금하고 B 계좌에 입금하는 두 작업은 반드시 함께 성공하거나 함께 실패해야 합니다. 어느 하나만 성공하면 데이터가 망가집니다.\n\n트랜잭션은 이런 상황에서 데이터 무결성을 지키기 위해 존재합니다.',
    txPropHeaders: ['특성', '설명'],
    txPropRows: [
      ['Atomicity (원자성)', '트랜잭션 내 모든 작업이 전부 성공하거나 전부 실패해야 합니다.'],
      ['Consistency (일관성)', '트랜잭션 전후로 데이터베이스는 항상 일관된 상태를 유지해야 합니다.'],
      ['Isolation (격리성)', '동시에 실행 중인 트랜잭션은 서로의 중간 상태를 볼 수 없습니다.'],
      ['Durability (지속성)', 'COMMIT된 데이터는 장애가 발생해도 영구적으로 보존됩니다.'],
    ],
    txNote:
      'Oracle에서 트랜잭션은 첫 번째 DML 실행 시 자동으로 시작됩니다. COMMIT 또는 ROLLBACK이 실행되면 트랜잭션이 종료되고 다음 DML에서 새 트랜잭션이 시작됩니다.\n\nDDL(CREATE·ALTER·DROP 등)은 실행 시 자동 COMMIT되며, 이 때 진행 중이던 트랜잭션도 함께 COMMIT됩니다.',

    commitTitle: 'COMMIT — 변경 확정',
    commitDesc:
      '현재 트랜잭션에서 DML로 변경한 내용을 데이터베이스에 영구적으로 저장합니다. COMMIT 이후에는 ROLLBACK으로 되돌릴 수 없습니다.',
    commitExample: `-- 신규 직원 삽입
INSERT INTO employees (emp_id, name, salary)
VALUES (101, 'Alice', 6000);

-- 기존 직원 급여 인상
UPDATE employees SET salary = 7000 WHERE emp_id = 55;

-- 두 변경 사항을 모두 영구 저장
COMMIT;`,
    commitTip:
      '자동 COMMIT(AUTOCOMMIT ON) 환경에서는 DML 하나마다 즉시 COMMIT됩니다. 실수로 잘못된 데이터를 저장하면 되돌릴 수 없으니, 운영 환경에서는 AUTOCOMMIT을 끄고 직접 COMMIT하는 것이 안전합니다.',

    rollbackTitle: 'ROLLBACK — 변경 취소',
    rollbackDesc:
      'COMMIT되지 않은 DML 변경 사항을 모두 취소하고 마지막 COMMIT 시점으로 되돌립니다. SAVEPOINT를 지정한 경우 해당 지점까지만 되돌릴 수도 있습니다.',
    rollbackExample: `-- 실수로 잘못된 급여 업데이트
UPDATE employees SET salary = 0 WHERE dept_id = 10;

-- 아직 COMMIT 전이면 전부 취소 가능
ROLLBACK;

-- SAVEPOINT를 지정한 경우 — 해당 지점까지만 되돌리기
SAVEPOINT before_update;

UPDATE employees SET salary = 9999 WHERE emp_id = 101;

-- before_update 시점으로만 되돌림 (그 이전 변경은 유지)
ROLLBACK TO before_update;`,

    savepointTitle: 'SAVEPOINT — 중간 저장점',
    savepointDesc:
      '트랜잭션 도중 중간 복구 지점을 만들어 둡니다. 문제가 생겼을 때 트랜잭션 전체를 롤백하지 않고 특정 지점까지만 되돌릴 수 있어 복잡한 작업에서 유용합니다.',
    savepointExample: `-- 1단계: 부서 추가
INSERT INTO departments (dept_id, name) VALUES (90, 'AI팀');
SAVEPOINT after_dept;      -- 부서 추가 후 저장점

-- 2단계: 직원 배정
INSERT INTO employees (emp_id, name, dept_id) VALUES (201, 'Bob', 90);
SAVEPOINT after_emp;       -- 직원 추가 후 저장점

-- 3단계: 급여 설정 — 실수 발생!
UPDATE employees SET salary = -500 WHERE emp_id = 201;

-- 3단계만 취소, 1·2단계는 유지
ROLLBACK TO after_emp;

-- 올바른 급여로 다시 업데이트
UPDATE employees SET salary = 5000 WHERE emp_id = 201;

-- 전체 확정
COMMIT;`,
    savepointTip:
      'SAVEPOINT 이름은 트랜잭션 내에서 고유해야 합니다. 같은 이름으로 다시 SAVEPOINT를 설정하면 이전 저장점이 덮어씌워집니다.',

    compareTitle: 'COMMIT vs ROLLBACK 비교',
    compareHeaders: ['구분', 'COMMIT', 'ROLLBACK'],
    compareRows: [
      ['효과', '변경 사항 영구 저장', '변경 사항 전부 취소'],
      ['이후 복구', '불가 (영구 확정)', '가능 (이전 COMMIT 상태로)'],
      ['트랜잭션', '종료 후 새 트랜잭션 시작', '종료 후 새 트랜잭션 시작'],
      ['DDL 실행 시', '자동으로 COMMIT 발생', '—'],
      ['접속 종료 시', '정상 종료 → 자동 COMMIT', '비정상 종료 → 자동 ROLLBACK'],
    ],
  },
  en: {
    chapterTitle: 'TCL — Transaction Control Language',
    chapterSubtitle:
      'TCL commands commit or roll back changes made by DML statements (INSERT, UPDATE, DELETE). They ensure data consistency at the transaction level.',

    txTitle: 'Prerequisites — What is a Transaction?',
    txDesc:
      'A transaction is a single unit of work. Take a bank transfer: withdrawing from account A and depositing into account B must either both succeed or both fail — if only one side completes, the data is corrupted.\n\nTransactions exist to protect data integrity in exactly these situations.',
    txPropHeaders: ['Property', 'Description'],
    txPropRows: [
      ['Atomicity', 'All operations in a transaction must fully succeed or fully fail together.'],
      ['Consistency', 'The database must remain in a consistent state before and after the transaction.'],
      ['Isolation', 'Concurrent transactions cannot see each other\'s intermediate state.'],
      ['Durability', 'Once committed, data survives even system failures.'],
    ],
    txNote:
      'In Oracle, a transaction starts automatically when the first DML statement is executed. It ends when COMMIT or ROLLBACK is issued, and a new transaction begins with the next DML.\n\nDDL statements (CREATE, ALTER, DROP, etc.) are auto-committed on execution, which also commits any in-progress transaction at that point.',

    commitTitle: 'COMMIT — Saving Changes',
    commitDesc:
      'Permanently saves all DML changes made in the current transaction. After a COMMIT, the changes cannot be undone with ROLLBACK.',
    commitExample: `-- Insert a new employee
INSERT INTO employees (emp_id, name, salary)
VALUES (101, 'Alice', 6000);

-- Raise an existing employee's salary
UPDATE employees SET salary = 7000 WHERE emp_id = 55;

-- Permanently save both changes
COMMIT;`,
    commitTip:
      'In AUTOCOMMIT ON mode, every DML statement is committed immediately. A mistake cannot be rolled back. In production environments, keep AUTOCOMMIT off and commit explicitly.',

    rollbackTitle: 'ROLLBACK — Undoing Changes',
    rollbackDesc:
      'Discards all uncommitted DML changes and restores the database to the state at the last COMMIT. If SAVEPOINTs were set, you can roll back to a specific point instead.',
    rollbackExample: `-- Accidentally wipe all salaries in department 10
UPDATE employees SET salary = 0 WHERE dept_id = 10;

-- Not committed yet — undo everything
ROLLBACK;

-- Using a SAVEPOINT to roll back only part of the transaction
SAVEPOINT before_update;

UPDATE employees SET salary = 9999 WHERE emp_id = 101;

-- Roll back only to the savepoint (earlier changes are kept)
ROLLBACK TO before_update;`,

    savepointTitle: 'SAVEPOINT — Checkpoint Within a Transaction',
    savepointDesc:
      'Creates a named restore point mid-transaction. If something goes wrong, you can roll back to that point without discarding the entire transaction — useful for complex multi-step operations.',
    savepointExample: `-- Step 1: add department
INSERT INTO departments (dept_id, name) VALUES (90, 'AI Team');
SAVEPOINT after_dept;      -- checkpoint after department insert

-- Step 2: assign employee
INSERT INTO employees (emp_id, name, dept_id) VALUES (201, 'Bob', 90);
SAVEPOINT after_emp;       -- checkpoint after employee insert

-- Step 3: set salary — oops, wrong value!
UPDATE employees SET salary = -500 WHERE emp_id = 201;

-- Undo only step 3; steps 1 and 2 are kept
ROLLBACK TO after_emp;

-- Re-apply step 3 with the correct salary
UPDATE employees SET salary = 5000 WHERE emp_id = 201;

-- Commit everything
COMMIT;`,
    savepointTip:
      'SAVEPOINT names must be unique within a transaction. Reusing the same name overwrites the previous savepoint with that name.',

    compareTitle: 'COMMIT vs ROLLBACK',
    compareHeaders: ['', 'COMMIT', 'ROLLBACK'],
    compareRows: [
      ['Effect', 'Permanently saves changes', 'Discards all uncommitted changes'],
      ['Recovery after', 'Not possible — permanently committed', 'Possible — restores to last COMMIT'],
      ['Transaction', 'Ends; new transaction starts next DML', 'Ends; new transaction starts next DML'],
      ['On DDL execution', 'Auto-COMMIT triggered', '—'],
      ['On session end', 'Normal exit → auto COMMIT', 'Abnormal exit → auto ROLLBACK'],
    ],
  },
}

export function TCLSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <PageContainer>
      <ChapterTitle icon={<IconGitCommit size={36} color="#f97316" stroke={1.5} />} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      <div className="mt-6">
        {/* 트랜잭션 개념 */}
        <AccordionSection title={t.txTitle}>
          <Prose>{t.txDesc}</Prose>
          <p className="mb-2 text-sm font-bold">
            {lang === 'ko' ? 'ACID 특성' : 'ACID Properties'}
          </p>
          <Table headers={t.txPropHeaders} rows={t.txPropRows} />
          <InfoBox variant="note">
            <span style={{ whiteSpace: 'pre-line' }}>{t.txNote}</span>
          </InfoBox>
        </AccordionSection>

        {/* COMMIT */}
        <AccordionSection title={t.commitTitle}>
          <Prose>{t.commitDesc}</Prose>
          <SqlBlock sql={t.commitExample} />
          <InfoBox variant="warning">
            {t.commitTip}
          </InfoBox>
        </AccordionSection>

        {/* ROLLBACK */}
        <AccordionSection title={t.rollbackTitle}>
          <Prose>{t.rollbackDesc}</Prose>
          <SqlBlock sql={t.rollbackExample} />
        </AccordionSection>

        {/* SAVEPOINT */}
        <AccordionSection title={t.savepointTitle}>
          <Prose>{t.savepointDesc}</Prose>
          <SqlBlock sql={t.savepointExample} />
          <InfoBox variant="tip">
            {t.savepointTip}
          </InfoBox>
        </AccordionSection>

        {/* 비교 표 */}
        <AccordionSection title={t.compareTitle}>
          <Table headers={t.compareHeaders} rows={t.compareRows} />
        </AccordionSection>
      </div>
    </PageContainer>
  )
}
