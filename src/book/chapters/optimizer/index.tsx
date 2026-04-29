import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
  InfoBox, Table, ConceptGrid, SimulatorPlaceholder, Divider, WipBanner
} from '../shared'

const T = {
  ko: {
    chapterTitle: '옵티마이저 원리',
    chapterSubtitle: 'Oracle Cost-Based Optimizer(CBO)가 어떻게 통계를 수집하고 최적의 실행 계획을 생성하는지 학습합니다.',
    simDesc: 'Optimizer 시뮬레이터 — SQL을 입력하고 CBO가 생성하는 실행 계획을 확인하세요.',

    overviewTitle: 'CBO 개요',
    overviewDesc: 'Oracle CBO(Cost-Based Optimizer)는 SQL 문을 가능한 여러 실행 계획 중 비용(I/O, CPU, Network)이 가장 낮은 것을 선택합니다. 테이블 통계(행 수, 블록 수, 컬럼 분포 등)를 기반으로 비용을 추정합니다.',
    overviewItems: [
      { icon: '🔄', title: 'Query Transformer', desc: '서브쿼리 Unnesting, 뷰 Merging 등 의미는 같지만 더 효율적인 형태로 쿼리를 변환.', color: 'blue' },
      { icon: '📊', title: 'Estimator', desc: '통계와 선택도를 기반으로 각 오퍼레이션의 Cardinality, Cost를 추정.', color: 'orange' },
      { icon: '🗺', title: 'Plan Generator', desc: '가능한 실행 계획을 생성하고 비용을 비교하여 최적 계획을 선택.', color: 'violet' },
    ],

    statsTitle: '통계 정보와 선택도',
    statsDesc: 'CBO는 DBMS_STATS 패키지로 수집된 통계를 사용합니다. 통계가 오래되거나 없으면 잘못된 실행 계획이 생성될 수 있습니다.',
    statsTable: [
      ['NUM_ROWS', '테이블의 총 행 수', '고'],
      ['BLOCKS', '테이블이 사용하는 데이터 블록 수', '고'],
      ['AVG_ROW_LEN', '평균 행 길이 (바이트)', '중'],
      ['NUM_DISTINCT', '컬럼의 고유 값 수 (NDV)', '고'],
      ['DENSITY', '1/NDV, 선택도 추정에 사용', '고'],
      ['NUM_NULLS', '컬럼의 NULL 값 수', '중'],
      ['LOW_VALUE / HIGH_VALUE', '컬럼의 최솟값 / 최댓값', '중'],
    ],
    selectivityTitle: '선택도(Selectivity)',
    selectivityDesc: '선택도는 조건에 의해 필터링되는 행의 비율입니다. 선택도가 낮을수록 더 적은 행을 반환하며, 인덱스 스캔이 유리합니다.',
    selectivityTable: [
      ['등치 (col = val)',       '1 / NDV',                        '0.01 (100개 중 1개)'],
      ['범위 (col > val)',       '(MAX - val) / (MAX - MIN)',       '0.5 (절반)'],
      ['LIKE \'val%\'',          '1 / NDV × 특수 조정',             '0.05~0.1'],
      ['IS NULL',                'NUM_NULLS / NUM_ROWS',            '0.05 (5% NULL)'],
      ['IN (v1, v2, ...)',       '1 - (1 - s)^N (s: 단일 선택도)', '0.0199 (2개 IN)'],
    ],

    accessPathTitle: '액세스 패스',
    accessPathDesc: '테이블 데이터에 접근하는 방식. CBO는 선택도와 인덱스 통계를 기반으로 최적의 액세스 패스를 선택합니다.',
    accessTable: [
      ['Full Table Scan',      '전체 블록 읽기. 선택도 낮거나 인덱스 없을 때', '멀티블록 I/O 사용'],
      ['Index Unique Scan',   '고유 인덱스 = 조건. 정확히 1행 반환', '최소 비용'],
      ['Index Range Scan',    '범위 조건. 연속 리프 블록 스캔', '반환 행 수에 비례'],
      ['Index Skip Scan',     '복합 인덱스의 선두 컬럼 조건 없을 때', 'NDV 낮은 선두 컬럼'],
      ['Index Fast Full Scan','인덱스 블록 전체 읽기. 멀티블록 I/O', 'SELECT 컬럼이 인덱스에 포함 시'],
      ['Bitmap Index Scan',   '비트맵 인덱스. DW, AND/OR 연산', '선택도 낮은 컬럼'],
    ],

    planTitle: '실행 계획 생성',
    planDesc: 'Plan Generator는 가능한 조인 순서와 방법의 조합을 탐색하여 총 비용이 최소인 실행 계획을 선택합니다.',
    planInfo: 'OPTIMIZER_MODE=ALL_ROWS (기본값)는 전체 처리량을 최소화합니다. FIRST_ROWS_n은 처음 n개 행 반환을 빠르게 합니다.',
  },
  en: {
    chapterTitle: 'Optimizer Principles',
    chapterSubtitle: 'Learn how Oracle\'s Cost-Based Optimizer (CBO) collects statistics and generates the optimal execution plan.',
    simDesc: 'Optimizer Simulator — Enter a SQL query and inspect the CBO\'s execution plan.',

    overviewTitle: 'CBO Overview',
    overviewDesc: 'Oracle\'s CBO selects the execution plan with the lowest estimated cost (I/O, CPU, Network) from among all valid plans. It bases cost estimates on object statistics: row counts, block counts, column distribution, etc.',
    overviewItems: [
      { icon: '🔄', title: 'Query Transformer', desc: 'Transforms the query into a semantically equivalent but more efficient form (subquery unnesting, view merging, etc.).', color: 'blue' },
      { icon: '📊', title: 'Estimator', desc: 'Estimates cardinality and cost for each operation using statistics and selectivity.', color: 'orange' },
      { icon: '🗺', title: 'Plan Generator', desc: 'Generates candidate plans and compares their costs to select the optimal one.', color: 'violet' },
    ],

    statsTitle: 'Statistics & Selectivity',
    statsDesc: 'The CBO uses statistics collected by the DBMS_STATS package. Stale or missing statistics can lead to suboptimal plans.',
    statsTable: [
      ['NUM_ROWS', 'Total number of rows in the table', 'High'],
      ['BLOCKS', 'Number of data blocks used by the table', 'High'],
      ['AVG_ROW_LEN', 'Average row length in bytes', 'Medium'],
      ['NUM_DISTINCT', 'Number of distinct values (NDV) for a column', 'High'],
      ['DENSITY', '1/NDV, used for selectivity estimation', 'High'],
      ['NUM_NULLS', 'Number of NULL values in a column', 'Medium'],
      ['LOW_VALUE / HIGH_VALUE', 'Min/max value of a column', 'Medium'],
    ],
    selectivityTitle: 'Selectivity',
    selectivityDesc: 'Selectivity is the fraction of rows returned by a predicate. Lower selectivity means fewer rows — making index scans favorable.',
    selectivityTable: [
      ['Equality (col = val)',    '1 / NDV',                       '0.01 (1 in 100)'],
      ['Range (col > val)',       '(MAX - val) / (MAX - MIN)',      '0.5 (half)'],
      ['LIKE \'val%\'',           '1 / NDV × special adjustment',   '0.05–0.1'],
      ['IS NULL',                 'NUM_NULLS / NUM_ROWS',           '0.05 (5% nulls)'],
      ['IN (v1, v2, ...)',        '1 - (1 - s)^N (s: single sel.)', '0.0199 (2 values)'],
    ],

    accessPathTitle: 'Access Paths',
    accessPathDesc: 'How Oracle accesses table data. The CBO selects the optimal access path based on selectivity and index statistics.',
    accessTable: [
      ['Full Table Scan',      'Reads all blocks. Used when selectivity is low or no useful index.', 'Multi-block I/O'],
      ['Index Unique Scan',   'Unique index with = condition. Returns exactly 1 row.', 'Minimum cost'],
      ['Index Range Scan',    'Range condition. Scans consecutive leaf blocks.', 'Proportional to row count'],
      ['Index Skip Scan',     'No leading column predicate in composite index.', 'Low NDV leading column'],
      ['Index Fast Full Scan','Reads all index blocks. Multi-block I/O.', 'When SELECT cols are in index'],
      ['Bitmap Index Scan',   'Bitmap indexes. DW, AND/OR operations.', 'Low cardinality columns'],
    ],

    planTitle: 'Execution Plan Generation',
    planDesc: 'The Plan Generator explores combinations of join orders and methods, selecting the plan with the minimum total cost.',
    planInfo: 'OPTIMIZER_MODE=ALL_ROWS (default) minimizes total throughput. FIRST_ROWS_n optimizes for returning the first n rows quickly.',
  },
}

export function OptimizerChapterPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'optimizer-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="⚡" num={4} title="Optimizer Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Optimizer Simulator" color="orange" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <WipBanner />
      {sectionId === 'optimizer-overview' && (
        <>
          <ChapterTitle icon="⚡" num={4} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Prose>{t.overviewDesc}</Prose>
          <ConceptGrid items={t.overviewItems} />
        </>
      )}
      {sectionId === 'optimizer-stats' && (
        <>
          <SectionTitle>{t.statsTitle}</SectionTitle>
          <Prose>{t.statsDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '통계 항목' : 'Statistic', lang === 'ko' ? '설명' : 'Description', lang === 'ko' ? '중요도' : 'Importance']}
            rows={t.statsTable}
          />
          <Divider />
          <SectionTitle>{t.selectivityTitle}</SectionTitle>
          <Prose>{t.selectivityDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '조건 유형' : 'Condition Type', lang === 'ko' ? '선택도 공식' : 'Selectivity Formula', lang === 'ko' ? '예시' : 'Example']}
            rows={t.selectivityTable}
          />
        </>
      )}
      {sectionId === 'optimizer-access-path' && (
        <>
          <SectionTitle>{t.accessPathTitle}</SectionTitle>
          <Prose>{t.accessPathDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '액세스 패스' : 'Access Path', lang === 'ko' ? '사용 조건' : 'When Used', lang === 'ko' ? '특징' : 'Notes']}
            rows={t.accessTable}
          />
        </>
      )}
      {sectionId === 'optimizer-plan' && (
        <>
          <SectionTitle>{t.planTitle}</SectionTitle>
          <Prose>{t.planDesc}</Prose>
          <InfoBox variant="tip" lang={lang}>
            {t.planInfo}
          </InfoBox>
        </>
      )}
    </PageContainer>
  )
}
