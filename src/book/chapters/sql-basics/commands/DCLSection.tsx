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
import { IconShieldLock } from '@tabler/icons-react'

const T = {
  ko: {
    chapterTitle: 'DCL — Data Control Language',
    chapterSubtitle:
      'DCL은 데이터베이스 사용자에게 권한을 부여하거나 회수하는 명령어입니다. 어떤 사용자가 어떤 테이블에 접근할 수 있는지, 어떤 작업을 수행할 수 있는지를 제어합니다. 실행 즉시 자동 COMMIT되며 ROLLBACK이 불가능합니다.',

    privilegeTitle: '먼저 알아두기 — 권한(Privilege)의 종류',
    privilegeDesc:
      'Oracle의 권한은 크게 두 가지로 나뉩니다. 어떤 권한을 부여하느냐에 따라 사용자가 할 수 있는 작업 범위가 달라집니다.',
    privilegeHeaders: ['종류', '설명', '예시'],
    privilegeRows: [
      [
        '시스템 권한 (System Privilege)',
        '데이터베이스 전체에 영향을 미치는 작업 권한. DBA가 부여합니다.',
        'CREATE SESSION, CREATE TABLE, CREATE VIEW',
      ],
      [
        '객체 권한 (Object Privilege)',
        '특정 테이블·뷰·시퀀스 등 개별 객체에 대한 작업 권한입니다.',
        'SELECT, INSERT, UPDATE, DELETE on 특정 테이블',
      ],
    ],
    objectPrivHeaders: ['객체 권한', '설명'],
    objectPrivRows: [
      ['SELECT', '테이블 또는 뷰를 조회할 수 있는 권한'],
      ['INSERT', '테이블에 새 행을 삽입할 수 있는 권한'],
      ['UPDATE', '테이블의 기존 행을 수정할 수 있는 권한'],
      ['DELETE', '테이블의 행을 삭제할 수 있는 권한'],
      ['EXECUTE', '저장 프로시저나 함수를 실행할 수 있는 권한'],
      ['ALL', 'SELECT·INSERT·UPDATE·DELETE 등 해당 객체의 모든 권한'],
    ],

    grantTitle: 'GRANT — 권한 부여',
    grantDesc:
      '특정 사용자에게 시스템 권한 또는 객체 권한을 부여합니다. WITH GRANT OPTION을 붙이면 권한을 받은 사용자가 다른 사용자에게 동일 권한을 다시 부여할 수 있습니다.',
    grantExample: `-- hr 사용자에게 employees 테이블 조회 권한 부여
GRANT SELECT ON employees TO hr;

-- hr 사용자에게 employees 테이블의 삽입·수정 권한 부여
GRANT INSERT, UPDATE ON employees TO hr;

-- hr 사용자가 받은 SELECT 권한을 다른 사용자에게도 줄 수 있도록 허용
GRANT SELECT ON employees TO hr WITH GRANT OPTION;

-- 모든 사용자(PUBLIC)에게 employees 조회 권한 부여
GRANT SELECT ON employees TO PUBLIC;

-- hr 사용자에게 테이블 생성 시스템 권한 부여
GRANT CREATE TABLE TO hr;`,
    grantTip:
      'WITH GRANT OPTION은 신중하게 사용하세요. 권한을 받은 사용자가 의도치 않은 대상에게 권한을 전파할 수 있습니다. 원칙적으로는 DBA만 권한을 부여하는 것이 안전합니다.',

    revokeTitle: 'REVOKE — 권한 회수',
    revokeDesc:
      '이전에 부여한 권한을 회수합니다. WITH GRANT OPTION으로 부여된 경우, 회수하면 해당 사용자가 다시 부여한 권한도 연쇄적으로 회수됩니다.',
    revokeExample: `-- hr 사용자의 employees 테이블 조회 권한 회수
REVOKE SELECT ON employees FROM hr;

-- hr 사용자의 삽입·수정 권한 동시 회수
REVOKE INSERT, UPDATE ON employees FROM hr;

-- PUBLIC에 부여한 조회 권한 회수
REVOKE SELECT ON employees FROM PUBLIC;`,

    roleTitle: '역할(Role) — 권한 묶음',
    roleDesc:
      '여러 권한을 하나의 역할(Role)로 묶어서 한 번에 부여하거나 회수할 수 있습니다. 사용자가 많을 때 개별 권한 관리보다 훨씬 편리합니다.',
    roleExample: `-- hr_readonly 역할 생성
CREATE ROLE hr_readonly;

-- 역할에 권한 부여
GRANT SELECT ON employees   TO hr_readonly;
GRANT SELECT ON departments TO hr_readonly;

-- 사용자에게 역할 부여 (권한 묶음이 한번에 적용됨)
GRANT hr_readonly TO alice;
GRANT hr_readonly TO bob;

-- 역할 회수
REVOKE hr_readonly FROM alice;`,
    roleTip:
      'Oracle은 DBA, CONNECT, RESOURCE 같은 기본 내장 역할을 제공합니다. CONNECT는 로그인 권한, RESOURCE는 테이블·시퀀스 등 객체 생성 권한 묶음입니다.',
  },
  en: {
    chapterTitle: 'DCL — Data Control Language',
    chapterSubtitle:
      'DCL commands grant or revoke privileges on database objects to control what each user can access and do. Like DDL, DCL statements are auto-committed immediately — ROLLBACK is not possible.',

    privilegeTitle: 'Prerequisites — Types of Privileges',
    privilegeDesc:
      'Oracle privileges fall into two categories. The type of privilege granted determines the scope of what a user can do.',
    privilegeHeaders: ['Type', 'Description', 'Examples'],
    privilegeRows: [
      [
        'System Privilege',
        'Database-wide operation rights. Granted by a DBA.',
        'CREATE SESSION, CREATE TABLE, CREATE VIEW',
      ],
      [
        'Object Privilege',
        'Rights to perform specific operations on a particular table, view, or sequence.',
        'SELECT, INSERT, UPDATE, DELETE on a specific table',
      ],
    ],
    objectPrivHeaders: ['Object Privilege', 'Description'],
    objectPrivRows: [
      ['SELECT', 'Query rows from a table or view'],
      ['INSERT', 'Insert new rows into a table'],
      ['UPDATE', 'Modify existing rows in a table'],
      ['DELETE', 'Delete rows from a table'],
      ['EXECUTE', 'Run a stored procedure or function'],
      ['ALL', 'All applicable privileges (SELECT, INSERT, UPDATE, DELETE, etc.)'],
    ],

    grantTitle: 'GRANT — Granting Privileges',
    grantDesc:
      'Grants system or object privileges to a user. Adding WITH GRANT OPTION allows the recipient to pass the same privilege on to other users.',
    grantExample: `-- Grant SELECT on employees to the hr user
GRANT SELECT ON employees TO hr;

-- Grant INSERT and UPDATE on employees to hr
GRANT INSERT, UPDATE ON employees TO hr;

-- Allow hr to re-grant the SELECT privilege to others
GRANT SELECT ON employees TO hr WITH GRANT OPTION;

-- Grant SELECT on employees to all users (PUBLIC)
GRANT SELECT ON employees TO PUBLIC;

-- Grant a system privilege to hr
GRANT CREATE TABLE TO hr;`,
    grantTip:
      'Use WITH GRANT OPTION carefully — the recipient can propagate the privilege to others unexpectedly. As a general rule, only DBAs should be granting privileges.',

    revokeTitle: 'REVOKE — Revoking Privileges',
    revokeDesc:
      'Removes a previously granted privilege. If the privilege was granted WITH GRANT OPTION, revoking it also cascades and removes any privileges the user passed on to others.',
    revokeExample: `-- Revoke SELECT on employees from hr
REVOKE SELECT ON employees FROM hr;

-- Revoke INSERT and UPDATE at the same time
REVOKE INSERT, UPDATE ON employees FROM hr;

-- Revoke the PUBLIC SELECT privilege
REVOKE SELECT ON employees FROM PUBLIC;`,

    roleTitle: 'Role — Bundling Privileges',
    roleDesc:
      'A role groups multiple privileges together so they can be granted or revoked in one step. Much easier to manage than assigning privileges individually when many users are involved.',
    roleExample: `-- Create a role named hr_readonly
CREATE ROLE hr_readonly;

-- Assign privileges to the role
GRANT SELECT ON employees   TO hr_readonly;
GRANT SELECT ON departments TO hr_readonly;

-- Grant the role to users — all bundled privileges apply at once
GRANT hr_readonly TO alice;
GRANT hr_readonly TO bob;

-- Revoke the role from a user
REVOKE hr_readonly FROM alice;`,
    roleTip:
      "Oracle ships with built-in roles: CONNECT (login access), RESOURCE (create tables, sequences, etc.), and DBA (full admin rights). Prefer built-in roles over custom ones when they cover your needs.",
  },
}

export function DCLSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <PageContainer>
      <ChapterTitle icon={<IconShieldLock size={36} color="#10b981" stroke={1.5} />} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      <div className="mt-6">
        {/* 권한 종류 */}
        <AccordionSection title={t.privilegeTitle}>
          <Prose>{t.privilegeDesc}</Prose>
          <Table headers={t.privilegeHeaders} rows={t.privilegeRows} />
          <p className="mb-2 mt-4 text-sm font-bold">
            {lang === 'ko' ? '주요 객체 권한' : 'Common Object Privileges'}
          </p>
          <Table headers={t.objectPrivHeaders} rows={t.objectPrivRows} />
        </AccordionSection>

        {/* GRANT */}
        <AccordionSection title={t.grantTitle}>
          <Prose>{t.grantDesc}</Prose>
          <SqlBlock sql={t.grantExample} />
          <InfoBox variant="warning">
            {t.grantTip}
          </InfoBox>
        </AccordionSection>

        {/* REVOKE */}
        <AccordionSection title={t.revokeTitle}>
          <Prose>{t.revokeDesc}</Prose>
          <SqlBlock sql={t.revokeExample} />
        </AccordionSection>

        {/* Role */}
        <AccordionSection title={t.roleTitle}>
          <Prose>{t.roleDesc}</Prose>
          <SqlBlock sql={t.roleExample} />
          <InfoBox variant="note">
            {t.roleTip}
          </InfoBox>
        </AccordionSection>
      </div>
    </PageContainer>
  )
}
