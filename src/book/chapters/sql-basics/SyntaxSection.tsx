import {
  PageContainer, ChapterTitle, SectionTitle,
  Prose, InfoBox, Divider,
} from '../shared'
import { cn } from '@/lib/utils'
import { CLAUSE_COLOR, CLAUSE_DEMOS } from './shared'
import { ClickableSyntaxRow, SyntaxRow } from './MiniSimulator'

const T = {
  ko: {
    chapterTitle: 'SQL 기본 문법',
    chapterSubtitle: 'SELECT, FROM, WHERE, UPDATE, DELETE의 핵심 문법과 실행 순서를 인터랙티브 시뮬레이션으로 학습합니다.',
    syntaxSectionTitle: '기본 문법 — SELECT / FROM / WHERE',
    syntaxIntro:
      'SQL은 관계형 데이터베이스를 다루는 표준 언어입니다. 데이터를 조회·수정·삭제하는 가장 기본적인 구문을 먼저 익힙니다.',
    clauseTitle: '핵심 절(Clause) 정리',
    clauses: [
      { kw: 'SELECT', color: 'blue',    icon: '📤', title: '컬럼 선택', desc: '반환할 컬럼 또는 표현식을 지정합니다. *는 전체 컬럼.' },
      { kw: 'FROM',   color: 'violet',  icon: '📦', title: '테이블 지정', desc: '데이터를 가져올 테이블(또는 뷰)을 지정합니다.' },
      { kw: 'WHERE',  color: 'orange',  icon: '🔎', title: '행 필터', desc: '조건에 맞는 행만 남깁니다. 인덱스 활용 여부를 결정하는 핵심.' },
      { kw: 'UPDATE', color: 'amber',   icon: '✏️',  title: '행 수정', desc: 'SET 절로 지정한 컬럼 값을 변경합니다. WHERE 없으면 전체 행 수정!' },
      { kw: 'DELETE', color: 'rose',    icon: '🗑️',  title: '행 삭제', desc: '조건에 맞는 행을 테이블에서 제거합니다. WHERE 없으면 전체 삭제!' },
    ],
    selectTitle: 'SELECT — 데이터 조회',
    selectDesc: '가장 자주 사용하는 구문입니다. SELECT 뒤에 컬럼명, FROM 뒤에 테이블명, WHERE로 조건을 붙입니다.',
    distinctTitle: 'DISTINCT — 중복 제거',
    distinctDesc: 'SELECT DISTINCT는 결과에서 중복된 행을 제거합니다. 여러 컬럼을 지정하면 해당 컬럼의 조합이 동일한 행을 중복으로 처리합니다.',
    distinctTip: 'DISTINCT는 결과 집합 전체에 Sort 또는 Hash 연산을 수행하므로 대용량 테이블에서는 성능 비용이 발생합니다. 꼭 필요할 때만 사용하고, 가능하면 WHERE로 먼저 행을 줄이세요.',
    distinctOps: [
      ['구문', '설명'],
      ['SELECT DISTINCT col', 'col 기준 중복 제거'],
      ['SELECT DISTINCT col1, col2', 'col1+col2 조합 기준 중복 제거'],
    ],
    whereTitle: 'WHERE — 행 필터링',
    whereDesc: 'WHERE 절은 TRUE인 행만 결과에 포함시킵니다. 비교 연산자(=, >, <, !=)와 논리 연산자(AND, OR, NOT), LIKE, IN, BETWEEN을 조합합니다.',
    whereOps: [
      ['연산자', '의미', '예시'],
      ['=', '동등 비교', "dept_id = 10"],
      ['!= / <>', '같지 않음', "dept_id != 10"],
      ['> / >= / < / <=', '크기 비교', "salary >= 7000"],
      ['BETWEEN a AND b', '범위 포함', "salary BETWEEN 5000 AND 7500"],
      ['LIKE', '패턴 매칭 (% : 임의문자)', "last_name LIKE 'K%'"],
      ['IN (a, b, …)', '목록 중 하나', "dept_id IN (10, 20)"],
      ['IS NULL / IS NOT NULL', 'NULL 여부', "manager_id IS NULL"],
      ['AND', '두 조건 모두 참', "dept_id = 20 AND salary >= 5500"],
      ['OR', '둘 중 하나 참', "dept_id = 10 OR dept_id = 30"],
    ],
    updateTitle: 'UPDATE — 데이터 수정',
    updateDesc: 'UPDATE는 기존 행의 값을 바꿉니다. SET 절로 새 값을 지정하고, WHERE로 대상 행을 좁힙니다. WHERE를 생략하면 테이블의 모든 행이 수정됩니다.',
    updateWarning: 'WHERE 절 없이 UPDATE를 실행하면 테이블 전체 행이 수정됩니다. 항상 먼저 SELECT로 대상 행을 확인하세요.',
    deleteTitle: 'DELETE — 데이터 삭제',
    deleteDesc: 'DELETE FROM 테이블명 WHERE 조건 형식으로 특정 행을 삭제합니다. TRUNCATE TABLE과 달리 WHERE로 대상을 지정할 수 있고, ROLLBACK도 가능합니다.',
    deleteTip: 'DELETE는 행 단위로 Undo 로그를 남겨 느릴 수 있습니다. 전체 삭제라면 TRUNCATE TABLE이 훨씬 빠릅니다.',
  },
  en: {
    chapterTitle: 'SQL Basics',
    chapterSubtitle: 'Learn SELECT, FROM, WHERE, UPDATE, and DELETE through interactive simulations with step-by-step execution visualization.',
    syntaxSectionTitle: 'Core Syntax — SELECT / FROM / WHERE',
    syntaxIntro:
      'SQL is the standard language for relational databases. Start with the most fundamental statements for querying, modifying, and deleting data.',
    clauseTitle: 'Key Clause Reference',
    clauses: [
      { kw: 'SELECT', color: 'blue',    icon: '📤', title: 'Column Selection', desc: 'Specifies which columns or expressions to return. * means all columns.' },
      { kw: 'FROM',   color: 'violet',  icon: '📦', title: 'Table Source',     desc: 'Specifies the table or view to retrieve data from.' },
      { kw: 'WHERE',  color: 'orange',  icon: '🔎', title: 'Row Filter',       desc: 'Keeps only rows matching the condition. Key to index usage decisions.' },
      { kw: 'UPDATE', color: 'amber',   icon: '✏️',  title: 'Modify Rows',     desc: 'Changes column values via SET. Omitting WHERE updates ALL rows!' },
      { kw: 'DELETE', color: 'rose',    icon: '🗑️',  title: 'Remove Rows',     desc: 'Removes matching rows. Omitting WHERE deletes ALL rows!' },
    ],
    selectTitle: 'SELECT — Querying Data',
    selectDesc: 'The most common SQL statement. List columns after SELECT, the table after FROM, and add conditions with WHERE.',
    distinctTitle: 'DISTINCT — Removing Duplicates',
    distinctDesc: 'SELECT DISTINCT eliminates duplicate rows from the result. When multiple columns are specified, rows where all listed column values are identical are considered duplicates.',
    distinctTip: 'DISTINCT triggers a Sort or Hash operation over the entire result set, which can be costly on large tables. Use it only when necessary, and reduce rows with WHERE first.',
    distinctOps: [
      ['Syntax', 'Description'],
      ['SELECT DISTINCT col', 'Remove duplicates by col'],
      ['SELECT DISTINCT col1, col2', 'Remove duplicates by col1+col2 combination'],
    ],
    whereTitle: 'WHERE — Filtering Rows',
    whereDesc: 'WHERE keeps only rows where the condition evaluates to TRUE. Combine comparison operators (=, >, <, !=) with AND, OR, NOT, LIKE, IN, and BETWEEN.',
    whereOps: [
      ['Operator', 'Meaning', 'Example'],
      ['=', 'Equality', "dept_id = 10"],
      ['!= / <>', 'Not equal', "dept_id != 10"],
      ['> / >= / < / <=', 'Comparison', "salary >= 7000"],
      ['BETWEEN a AND b', 'Range inclusive', "salary BETWEEN 5000 AND 7500"],
      ['LIKE', 'Pattern match (% = wildcard)', "last_name LIKE 'K%'"],
      ['IN (a, b, …)', 'Value in list', "dept_id IN (10, 20)"],
      ['IS NULL / IS NOT NULL', 'NULL check', "manager_id IS NULL"],
      ['AND', 'Both conditions true', "dept_id = 20 AND salary >= 5500"],
      ['OR', 'Either condition true', "dept_id = 10 OR dept_id = 30"],
    ],
    updateTitle: 'UPDATE — Modifying Data',
    updateDesc: 'UPDATE changes existing row values. Use SET to assign new values and WHERE to target specific rows. Omitting WHERE updates every row in the table.',
    updateWarning: 'Running UPDATE without a WHERE clause modifies every row in the table. Always verify your target rows with a SELECT first.',
    deleteTitle: 'DELETE — Removing Data',
    deleteDesc: 'DELETE FROM table_name WHERE condition removes specific rows. Unlike TRUNCATE TABLE, you can target rows with WHERE, and the operation can be rolled back.',
    deleteTip: 'DELETE writes per-row undo logs and can be slow for large deletions. Use TRUNCATE TABLE for full-table removal — it is much faster.',
  },
}

export function SyntaxSection({ lang, t }: { lang: 'ko' | 'en'; t: typeof T['ko'] }) {
  const introDemo    = CLAUSE_DEMOS.find((d) => d.sectionKey === 'intro')!
  const selectDemo   = CLAUSE_DEMOS.find((d) => d.sectionKey === 'select')!
  const distinctDemo = CLAUSE_DEMOS.find((d) => d.sectionKey === 'distinct')!
  const whereDemo    = CLAUSE_DEMOS.find((d) => d.sectionKey === 'where')!
  const updateDemo   = CLAUSE_DEMOS.find((d) => d.sectionKey === 'update')!
  const deleteDemo   = CLAUSE_DEMOS.find((d) => d.sectionKey === 'delete')!

  return (
    <PageContainer className="max-w-6xl">
      <ChapterTitle icon="📋" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.syntaxSectionTitle}</SectionTitle>

      {/* ── Intro: clause overview ── */}
      <SyntaxRow
        lang={lang}
        demo={introDemo}
        left={
          <>
            <Prose>{t.syntaxIntro}</Prose>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {t.clauses.map((c) => (
                <div key={c.kw} className={cn('rounded-lg border p-3', CLAUSE_COLOR[c.color])}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-base">{c.icon}</span>
                    <code className="rounded bg-current/10 px-1.5 py-0.5 font-mono text-xs font-bold">{c.kw}</code>
                  </div>
                  <div className="mb-0.5 text-xs font-bold">{c.title}</div>
                  <div className="text-xs leading-relaxed opacity-80">{c.desc}</div>
                </div>
              ))}
            </div>
          </>
        }
      />

      <Divider />

      {/* ── SELECT ── */}
      <SyntaxRow
        lang={lang}
        demo={selectDemo}
        left={
          <>
            <SectionTitle>{t.selectTitle}</SectionTitle>
            <Prose>{t.selectDesc}</Prose>
          </>
        }
      />

      <Divider />

      {/* ── DISTINCT ── */}
      <ClickableSyntaxRow
        lang={lang}
        demo={distinctDemo}
        header={t.distinctOps[0]}
        rows={t.distinctOps.slice(1)}
        topContent={
          <>
            <SectionTitle>{t.distinctTitle}</SectionTitle>
            <Prose>{t.distinctDesc}</Prose>
          </>
        }
        bottomContent={
          <InfoBox color="blue" icon="💡" title="TIP">
            {t.distinctTip}
          </InfoBox>
        }
      />

      <Divider />

      {/* ── WHERE ── */}
      <ClickableSyntaxRow
        lang={lang}
        demo={whereDemo}
        header={t.whereOps[0]}
        rows={t.whereOps.slice(1)}
        topContent={
          <>
            <SectionTitle>{t.whereTitle}</SectionTitle>
            <Prose>{t.whereDesc}</Prose>
          </>
        }
      />

      <Divider />

      {/* ── UPDATE ── */}
      <SyntaxRow
        lang={lang}
        demo={updateDemo}
        left={
          <>
            <SectionTitle>{t.updateTitle}</SectionTitle>
            <Prose>{t.updateDesc}</Prose>
            <InfoBox color="orange" icon="⚠️" title={lang === 'ko' ? '주의' : 'Warning'}>
              {t.updateWarning}
            </InfoBox>
          </>
        }
      />

      <Divider />

      {/* ── DELETE ── */}
      <SyntaxRow
        lang={lang}
        demo={deleteDemo}
        left={
          <>
            <SectionTitle>{t.deleteTitle}</SectionTitle>
            <Prose>{t.deleteDesc}</Prose>
            <InfoBox color="blue" icon="💡" title="TIP">
              {t.deleteTip}
            </InfoBox>
          </>
        }
      />
    </PageContainer>
  )
}

export { T as SyntaxT }
