import {
  PageContainer, ChapterTitle, SectionTitle,
  Prose, InfoBox, Divider,
} from '../shared'
import { CLAUSE_DEMOS } from './shared'
import { ClickableSyntaxRow, SyntaxRow } from './MiniSimulator'

const T = {
  ko: {
    chapterTitle: 'SQL 기본 문법',
    clausesSectionTitle: 'ORDER BY / GROUP BY / HAVING',
    clausesSectionSubtitle: '결과를 정렬하고, 그룹으로 집계하고, 그룹 조건을 필터링하는 세 가지 절을 학습합니다.',
    orderByTitle: 'ORDER BY — 결과 정렬',
    orderByDesc: 'SELECT 결과를 하나 이상의 컬럼 기준으로 정렬합니다. ASC(오름차순, 기본값)와 DESC(내림차순)를 지정할 수 있습니다. ORDER BY는 SQL 실행 순서에서 가장 마지막에 처리됩니다.',
    orderByOps: [
      ['구문', '설명'],
      ['ORDER BY col', 'col 기준 오름차순 정렬 (ASC 기본)'],
      ['ORDER BY col DESC', 'col 기준 내림차순 정렬'],
      ['ORDER BY col1, col2', '여러 컬럼 순서대로 정렬 (1차·2차 기준)'],
      ['ORDER BY 2', 'SELECT의 두 번째 컬럼 기준 정렬'],
    ],
    groupByTitle: 'GROUP BY — 그룹 집계',
    groupByDesc: '같은 값을 가진 행들을 하나의 그룹으로 묶고, COUNT·SUM·AVG·MAX·MIN 같은 집계 함수를 적용합니다. GROUP BY에 없는 컬럼은 SELECT에서 집계 함수 없이 사용할 수 없습니다.',
    groupByOps: [
      ['함수', '설명'],
      ['COUNT(*)', '그룹 내 행 수'],
      ['AVG(col)', '그룹 내 col 평균'],
      ['SUM(col)', '그룹 내 col 합계'],
      ['MAX(col) / MIN(col)', '그룹 내 col 최댓값 / 최솟값'],
    ],
    havingTitle: 'HAVING — 그룹 조건 필터',
    havingDesc: 'WHERE는 개별 행을 필터링하지만, HAVING은 GROUP BY로 만들어진 그룹을 필터링합니다. 집계 함수 결과에 조건을 걸 때 사용합니다.',
    havingTip: 'WHERE는 집계 전(개별 행), HAVING은 집계 후(그룹) 필터입니다. 가능하면 WHERE로 먼저 행을 줄인 뒤 GROUP BY를 실행하는 것이 성능에 유리합니다.',
  },
  en: {
    chapterTitle: 'SQL Basics',
    clausesSectionTitle: 'ORDER BY / GROUP BY / HAVING',
    clausesSectionSubtitle: 'Sort results, aggregate into groups, and filter groups with these three essential clauses.',
    orderByTitle: 'ORDER BY — Sorting Results',
    orderByDesc: 'Sorts the SELECT result by one or more columns. ASC (ascending, default) or DESC (descending) can be specified. ORDER BY is the last clause processed in SQL execution order.',
    orderByOps: [
      ['Syntax', 'Description'],
      ['ORDER BY col', 'Sort by col ascending (ASC default)'],
      ['ORDER BY col DESC', 'Sort by col descending'],
      ['ORDER BY col1, col2', 'Sort by multiple columns in order'],
      ['ORDER BY 2', 'Sort by the 2nd column in SELECT'],
    ],
    groupByTitle: 'GROUP BY — Grouping & Aggregation',
    groupByDesc: 'Groups rows with the same value into a single group and applies aggregate functions like COUNT, SUM, AVG, MAX, and MIN. Columns not in GROUP BY must be wrapped in an aggregate function in SELECT.',
    groupByOps: [
      ['Function', 'Description'],
      ['COUNT(*)', 'Number of rows in the group'],
      ['AVG(col)', 'Average of col in the group'],
      ['SUM(col)', 'Sum of col in the group'],
      ['MAX(col) / MIN(col)', 'Max / min value of col in the group'],
    ],
    havingTitle: 'HAVING — Filtering Groups',
    havingDesc: 'WHERE filters individual rows, but HAVING filters the groups created by GROUP BY. Use it when you need to apply conditions on aggregate function results.',
    havingTip: 'WHERE filters before aggregation (individual rows); HAVING filters after (groups). For best performance, reduce rows with WHERE first, then aggregate.',
  },
}

export function ClausesSection({ lang, t }: { lang: 'ko' | 'en'; t: typeof T['ko'] }) {
  const orderByDemo = CLAUSE_DEMOS.find((d) => d.sectionKey === 'orderby')!
  const groupByDemo = CLAUSE_DEMOS.find((d) => d.sectionKey === 'groupby')!
  const havingDemo  = CLAUSE_DEMOS.find((d) => d.sectionKey === 'having')!

  return (
    <PageContainer className="max-w-6xl">
      <ChapterTitle icon="📋" num={1} title={t.chapterTitle} subtitle={t.clausesSectionSubtitle} />
      <SectionTitle>{t.clausesSectionTitle}</SectionTitle>

      {/* ── ORDER BY ── */}
      <ClickableSyntaxRow
        lang={lang}
        demo={orderByDemo}
        header={t.orderByOps[0]}
        rows={t.orderByOps.slice(1)}
        topContent={
          <>
            <SectionTitle>{t.orderByTitle}</SectionTitle>
            <Prose>{t.orderByDesc}</Prose>
          </>
        }
      />

      <Divider />

      {/* ── GROUP BY ── */}
      <ClickableSyntaxRow
        lang={lang}
        demo={groupByDemo}
        header={t.groupByOps[0]}
        rows={t.groupByOps.slice(1)}
        topContent={
          <>
            <SectionTitle>{t.groupByTitle}</SectionTitle>
            <Prose>{t.groupByDesc}</Prose>
          </>
        }
      />

      <Divider />

      {/* ── HAVING ── */}
      <SyntaxRow
        lang={lang}
        demo={havingDemo}
        left={
          <>
            <SectionTitle>{t.havingTitle}</SectionTitle>
            <Prose>{t.havingDesc}</Prose>
            <InfoBox color="blue" icon="💡" title="TIP">
              {t.havingTip}
            </InfoBox>
          </>
        }
      />
    </PageContainer>
  )
}

export { T as ClausesT }
