import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
  InfoBox, ConceptGrid, SimulatorPlaceholder, Divider
} from '../shared'

const T = {
  ko: {
    chapterTitle: '쿼리 변환',
    chapterSubtitle: 'Oracle CBO가 SQL을 실행하기 전 수행하는 다양한 쿼리 변환 기법을 학습합니다.',
    simDesc: '쿼리 변환 시뮬레이터 — 변환 전후 쿼리를 비교해보세요.',

    overviewTitle: '쿼리 변환 개요',
    overviewDesc: 'Query Transformer는 원본 SQL을 의미가 동일하지만 더 효율적으로 실행할 수 있는 형태로 변환합니다. 변환 결과는 다시 Estimator와 Plan Generator로 전달됩니다.',
    overviewItems: [
      { icon: '📐', title: 'Subquery Unnesting', desc: 'WHERE 절의 서브쿼리를 조인으로 변환하여 조인 순서 최적화를 가능하게 합니다.', color: 'blue' },
      { icon: '🔀', title: 'View Merging', desc: '인라인 뷰나 저장 뷰를 바깥 쿼리에 병합하여 더 넓은 최적화 범위를 제공합니다.', color: 'orange' },
      { icon: '⬇', title: 'Predicate Pushdown', desc: '외부 WHERE 조건을 뷰 내부로 밀어 넣어 불필요한 행 처리를 줄입니다.', color: 'violet' },
      { icon: '🔁', title: 'Transitive Closure', desc: 'A=B AND B=C 조건에서 A=C를 자동으로 추가하여 더 많은 인덱스 활용 기회를 만듭니다.', color: 'emerald' },
    ],

    unnestTitle: '서브쿼리 Unnesting',
    unnestDesc: '상관 서브쿼리(Correlated Subquery)나 비상관 서브쿼리를 JOIN으로 변환합니다. 변환 후 CBO는 조인 순서와 방법을 자유롭게 선택할 수 있습니다.',
    unnestBefore: `-- 변환 전 (서브쿼리)
SELECT * FROM employees e
WHERE e.department_id IN (
  SELECT d.department_id
  FROM departments d
  WHERE d.location_id = 1700
);`,
    unnestAfter: `-- 변환 후 (조인으로 Unnesting)
SELECT e.* FROM employees e
JOIN departments d
  ON e.department_id = d.department_id
WHERE d.location_id = 1700;`,

    mergeTitle: '뷰 Merging',
    mergeDesc: '인라인 뷰를 바깥 쿼리 블록과 합쳐서 더 넓은 최적화가 가능하도록 합니다. 뷰 내에 GROUP BY, DISTINCT, ROWNUM이 있으면 Merging이 제한됩니다.',
    mergeBefore: `-- 변환 전 (인라인 뷰)
SELECT v.first_name, v.salary
FROM (
  SELECT first_name, salary, department_id
  FROM employees
  WHERE salary > 5000
) v
WHERE v.department_id = 90;`,
    mergeAfter: `-- 변환 후 (뷰 Merged)
SELECT first_name, salary
FROM employees
WHERE salary > 5000
  AND department_id = 90;`,

    pushTitle: 'Predicate Pushdown',
    pushDesc: '뷰를 Merge할 수 없는 경우, 외부 조건을 뷰 내부로 밀어 넣어 처리 행 수를 줄입니다.',

    transitiveTitle: 'Transitive Closure',
    transitiveDesc: '조인 조건에서 파생 가능한 새 조건을 자동으로 추가합니다. 이를 통해 더 많은 인덱스 사용 기회가 생깁니다.',
  },
  en: {
    chapterTitle: 'Query Transformation',
    chapterSubtitle: 'Learn the various query transformation techniques Oracle\'s CBO applies before executing SQL.',
    simDesc: 'Query Transform Simulator — Compare queries before and after transformation.',

    overviewTitle: 'Query Transformation Overview',
    overviewDesc: 'The Query Transformer rewrites the original SQL into a semantically equivalent but more efficient form. The transformed query is passed to the Estimator and Plan Generator.',
    overviewItems: [
      { icon: '📐', title: 'Subquery Unnesting', desc: 'Converts WHERE subqueries into joins, enabling join order optimization.', color: 'blue' },
      { icon: '🔀', title: 'View Merging', desc: 'Merges inline or stored views into the outer query block for broader optimization.', color: 'orange' },
      { icon: '⬇', title: 'Predicate Pushdown', desc: 'Pushes outer WHERE conditions into views to reduce unnecessary row processing.', color: 'violet' },
      { icon: '🔁', title: 'Transitive Closure', desc: 'Automatically adds A=C from A=B AND B=C to create more index access opportunities.', color: 'emerald' },
    ],

    unnestTitle: 'Subquery Unnesting',
    unnestDesc: 'Converts correlated or non-correlated subqueries into JOINs. After transformation, the CBO can freely choose join order and method.',
    unnestBefore: `-- Before (subquery)
SELECT * FROM employees e
WHERE e.department_id IN (
  SELECT d.department_id
  FROM departments d
  WHERE d.location_id = 1700
);`,
    unnestAfter: `-- After (unnested to JOIN)
SELECT e.* FROM employees e
JOIN departments d
  ON e.department_id = d.department_id
WHERE d.location_id = 1700;`,

    mergeTitle: 'View Merging',
    mergeDesc: 'Merges inline views into the outer query block for wider optimization. Merging is restricted when the view contains GROUP BY, DISTINCT, or ROWNUM.',
    mergeBefore: `-- Before (inline view)
SELECT v.first_name, v.salary
FROM (
  SELECT first_name, salary, department_id
  FROM employees
  WHERE salary > 5000
) v
WHERE v.department_id = 90;`,
    mergeAfter: `-- After (view merged)
SELECT first_name, salary
FROM employees
WHERE salary > 5000
  AND department_id = 90;`,

    pushTitle: 'Predicate Pushdown',
    pushDesc: 'When view merging is not possible, pushes outer conditions into the view to reduce the number of rows processed.',

    transitiveTitle: 'Transitive Closure',
    transitiveDesc: 'Automatically infers new predicates from join conditions (A=B AND B=C → adds A=C). This creates additional index access opportunities.',
  },
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border bg-muted/60 p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
      {code}
    </pre>
  )
}

export function QueryTransformPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'qt-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="🔄" num={5} title="Query Transform Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Query Transform Simulator" color="cyan" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {sectionId === 'qt-overview' && (
        <>
          <ChapterTitle icon="🔄" num={5} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Prose>{t.overviewDesc}</Prose>
          <ConceptGrid items={t.overviewItems} />
        </>
      )}
      {sectionId === 'qt-subquery-unnesting' && (
        <>
          <SectionTitle>{t.unnestTitle}</SectionTitle>
          <Prose>{t.unnestDesc}</Prose>
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lang === 'ko' ? '변환 전' : 'Before'}
          </div>
          <CodeBlock code={t.unnestBefore} />
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lang === 'ko' ? '변환 후' : 'After'}
          </div>
          <CodeBlock code={t.unnestAfter} />
          <InfoBox color="blue" icon="✓" title={lang === 'ko' ? '효과' : 'Effect'}>
            {lang === 'ko'
              ? '조인으로 변환 후 CBO는 Nested Loop, Hash, Sort-Merge 중 최적의 조인 방법을 자유롭게 선택할 수 있습니다.'
              : 'After converting to a join, the CBO can freely choose the optimal join method: Nested Loop, Hash, or Sort-Merge.'}
          </InfoBox>
        </>
      )}
      {sectionId === 'qt-view-merging' && (
        <>
          <SectionTitle>{t.mergeTitle}</SectionTitle>
          <Prose>{t.mergeDesc}</Prose>
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lang === 'ko' ? '변환 전' : 'Before'}
          </div>
          <CodeBlock code={t.mergeBefore} />
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lang === 'ko' ? '변환 후' : 'After'}
          </div>
          <CodeBlock code={t.mergeAfter} />
          <Divider />
          <SectionTitle>{t.pushTitle}</SectionTitle>
          <Prose>{t.pushDesc}</Prose>
        </>
      )}
      {sectionId === 'qt-predicate-pushdown' && (
        <>
          <SectionTitle>{t.pushTitle}</SectionTitle>
          <Prose>{t.pushDesc}</Prose>
          <Divider />
          <SectionTitle>{t.transitiveTitle}</SectionTitle>
          <Prose>{t.transitiveDesc}</Prose>
          <InfoBox color="emerald" icon="💡" title="Example">
            <code className="font-mono text-[11px]">
              {lang === 'ko'
                ? 'e.department_id = d.department_id AND d.department_id = 90\n→ 자동으로 e.department_id = 90 추가'
                : 'e.department_id = d.department_id AND d.department_id = 90\n→ Automatically adds e.department_id = 90'}
            </code>
          </InfoBox>
        </>
      )}
    </PageContainer>
  )
}
