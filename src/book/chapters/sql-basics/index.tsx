import { useSimulationStore } from '@/store/simulationStore'
import { DdlDmlDclSection } from './commands/DdlDmlDclSection'
import { DDLSection } from './commands/DDLSection'
import { DMLSection } from './commands/DMLSection'
import { DCLSection } from './commands/DCLSection'
import { TCLSection } from './commands/TCLSection'
import { ClausesSection } from './dml-more/ClausesSection'
import { JoinSection } from './dml-more/JoinSection'
import { NullSection } from './dml-more/NullSection'
import { DateSection } from './dml-more/DateSection'
import { WindowFuncSection } from './dml-more/WindowFuncSection'
import { MergeSection } from './dml-more/MergeSection'
import { RollupSection } from './dml-more/RollupSection'
import { PivotSection } from './dml-more/PivotSection'
import { ExecutionSimulator } from './dml-more/ExecutionSection'
import { PageContainer, ChapterTitle, Prose, InfoBox, ConceptGrid, SectionTitle } from '../shared'
import {
  IconDatabase, IconSortAscending, IconArrowMerge, IconMathOff,
  IconCalendarEvent, IconChartBar, IconGitMerge, IconChartTreemap, IconLayoutColumns,
} from '@tabler/icons-react'

const DmlMoreT = {
  ko: {
    title: 'DML 더 많이 알아보기',
    subtitle: 'Oracle에서 데이터를 조회하고 가공하는 능력은 가장 핵심적인 기술입니다. 이 챕터에서는 단순 조회를 넘어 데이터를 분석하고 원하는 형태로 변환하는 방법을 깊이 있게 다룹니다.',
    whyTitle: '왜 DML을 더 깊게 배워야 할까?',
    why: 'Oracle 데이터베이스를 사용하는 대부분의 업무는 데이터를 "읽고 가공하는" 작업입니다. 테이블을 만들거나 권한을 설정하는 DDL·DCL은 한 번 설정하면 잘 바뀌지 않지만, 데이터를 조회하고 분석하는 SELECT 쿼리는 매일 수십·수백 번 실행됩니다.\n\nOracle은 단순한 SELECT * FROM 이상의 강력한 기능을 제공합니다. 여러 테이블을 JOIN으로 연결하고, GROUP BY로 통계를 내고, 윈도우 함수로 누적합·순위를 계산하고, PIVOT으로 행과 열을 뒤집는 등 — 복잡한 비즈니스 요구사항을 SQL 한 줄로 처리할 수 있습니다.\n\n이 챕터의 내용을 잘 익혀두면 Oracle에 저장된 데이터를 자유자재로 다룰 수 있게 됩니다.',
    topicsTitle: '이 챕터에서 배우는 것들',
    topics: [
      { icon: <IconSortAscending size={20} color="#3b82f6" stroke={1.5} />, title: 'ORDER BY / GROUP BY / HAVING', desc: '데이터를 정렬하고, 그룹으로 묶어 집계하고, 조건으로 필터링하는 방법', color: 'blue' },
      { icon: <IconArrowMerge size={20} color="#10b981" stroke={1.5} />, title: 'JOIN', desc: '여러 테이블을 연결해 필요한 데이터를 한 번에 조회하는 핵심 기법', color: 'emerald' },
      { icon: <IconMathOff size={20} color="#8b5cf6" stroke={1.5} />, title: 'NULL 다루기', desc: 'NULL의 특성과 NVL·COALESCE 등 Oracle 핵심 함수 활용법', color: 'violet' },
      { icon: <IconCalendarEvent size={20} color="#f97316" stroke={1.5} />, title: '날짜와 시간', desc: 'SYSDATE·TO_DATE·ADD_MONTHS 등 날짜 연산과 포맷 변환', color: 'orange' },
      { icon: <IconChartBar size={20} color="#06b6d4" stroke={1.5} />, title: '윈도우 함수', desc: '행을 그룹화하지 않고 순위·누적합·이동평균을 계산하는 분석 함수', color: 'teal' },
      { icon: <IconGitMerge size={20} color="#14b8a6" stroke={1.5} />, title: 'MERGE INTO', desc: '조건에 따라 INSERT·UPDATE·DELETE를 한 번에 처리하는 병합 구문', color: 'teal' },
      { icon: <IconChartTreemap size={20} color="#f43f5e" stroke={1.5} />, title: 'ROLLUP / CUBE / GROUPING SETS', desc: '소계·중간합계·전체합계를 한 쿼리로 만드는 고급 집계', color: 'rose' },
      { icon: <IconLayoutColumns size={20} color="#f59e0b" stroke={1.5} />, title: 'PIVOT / UNPIVOT', desc: '행과 열을 전환해 리포트 형태로 데이터를 재구성하는 방법,엑셀의 PIVOT 기능과 같습니다.', color: 'amber' },
    ],
  },
  en: {
    title: 'DML — Going Deeper',
    subtitle: 'The ability to query and transform data is the most critical skill in Oracle. This chapter goes beyond simple queries to teach you how to analyze data and shape it into exactly what you need.',
    whyTitle: 'Why go deeper into DML?',
    why: 'Most day-to-day work with Oracle revolves around reading and transforming data. DDL and DCL are set-and-forget operations, but SELECT queries run dozens or hundreds of times every day.\n\nOracle offers far more than a basic SELECT * FROM. You can JOIN multiple tables, aggregate with GROUP BY, compute running totals and rankings with window functions, and flip rows into columns with PIVOT — all in a single SQL statement.\n\nMastering this chapter means you will be able to handle any data requirement Oracle throws at you.',
    topicsTitle: 'What you will learn in this chapter',
    topics: [
      { icon: <IconSortAscending size={20} color="#3b82f6" stroke={1.5} />, title: 'ORDER BY / GROUP BY / HAVING', desc: 'Sort, group, aggregate, and filter grouped results', color: 'blue' },
      { icon: <IconArrowMerge size={20} color="#10b981" stroke={1.5} />, title: 'JOIN', desc: 'Combine rows from multiple tables to retrieve exactly the data you need', color: 'emerald' },
      { icon: <IconMathOff size={20} color="#8b5cf6" stroke={1.5} />, title: 'Handling NULL', desc: 'Understand NULL behavior and use NVL, COALESCE, and other key Oracle functions', color: 'violet' },
      { icon: <IconCalendarEvent size={20} color="#f97316" stroke={1.5} />, title: 'Date & Time', desc: 'Work with SYSDATE, TO_DATE, ADD_MONTHS, and date arithmetic', color: 'orange' },
      { icon: <IconChartBar size={20} color="#06b6d4" stroke={1.5} />, title: 'Window Functions', desc: 'Compute rankings, running totals, and moving averages without collapsing rows', color: 'teal' },
      { icon: <IconGitMerge size={20} color="#14b8a6" stroke={1.5} />, title: 'MERGE INTO', desc: 'Conditionally INSERT, UPDATE, or DELETE in a single merge statement', color: 'teal' },
      { icon: <IconChartTreemap size={20} color="#f43f5e" stroke={1.5} />, title: 'ROLLUP / CUBE / GROUPING SETS', desc: 'Generate subtotals, cross-totals, and grand totals in one query', color: 'rose' },
      { icon: <IconLayoutColumns size={20} color="#f59e0b" stroke={1.5} />, title: 'PIVOT / UNPIVOT', desc: 'Transpose rows to columns (and back) to reshape data into report format', color: 'amber' },
    ],
  },
}

interface Props {
  sectionId: string
}

export function SqlBasicsPage({ sectionId }: Props) {
  const lang = useSimulationStore((s) => s.lang)

  if (sectionId === 'sql-basics-ddl-dml-dcl') return <DdlDmlDclSection />
  if (sectionId === 'sql-basics-ddl')          return <DDLSection />
  if (sectionId === 'sql-basics-dml')          return <DMLSection />
  if (sectionId === 'sql-basics-dcl')          return <DCLSection />
  if (sectionId === 'sql-basics-tcl')          return <TCLSection />
  if (sectionId === 'sql-basics-dml-more') {
    const t = DmlMoreT[lang]
    return (
      <PageContainer>
        <ChapterTitle icon={<IconDatabase size={36} color="#3b82f6" stroke={1.5} />} title={t.title} subtitle={t.subtitle} />
        <SectionTitle>{t.whyTitle}</SectionTitle>
        <Prose>{t.why}</Prose>
        <InfoBox variant="usage">
          {lang === 'ko'
            ? 'DDL로 테이블 구조를 설계했다면, 이제 그 안의 데이터를 실제로 활용하는 단계입니다. 이 챕터를 마치면 Oracle 데이터를 조회·집계·분석하는 대부분의 업무를 처리할 수 있습니다.'
            : 'You have designed the table structure with DDL — now it is time to actually work with the data inside. After this chapter you will be able to handle the vast majority of real-world Oracle query work.'}
        </InfoBox>
        <SectionTitle>{t.topicsTitle}</SectionTitle>
        <ConceptGrid items={t.topics} />
      </PageContainer>
    )
  }
  if (sectionId === 'sql-basics-clauses')      return <ClausesSection />
  if (sectionId === 'sql-basics-join')       return <JoinSection />
  if (sectionId === 'sql-basics-null')       return <NullSection />
  if (sectionId === 'sql-basics-date')       return <DateSection />
  if (sectionId === 'sql-basics-windowFunc') return <WindowFuncSection />
  if (sectionId === 'sql-basics-merge')      return <MergeSection />
  if (sectionId === 'sql-basics-rollup')     return <RollupSection />
  if (sectionId === 'sql-basics-pivot')      return <PivotSection />
  if (sectionId === 'sql-basics-execution')  return <ExecutionSimulator />
  return null
}
