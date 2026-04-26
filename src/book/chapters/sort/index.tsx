import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose,
  InfoBox, Table, ConceptGrid, SimulatorPlaceholder, WipBanner
} from '../shared'

const T = {
  ko: {
    chapterTitle: '소트 튜닝',
    chapterSubtitle: 'Oracle의 소트 연산 메커니즘과 성능 튜닝 전략을 학습합니다.',
    simDesc: 'Sort 시뮬레이터 — 소트 연산의 메모리/디스크 처리를 시뮬레이션합니다.',

    overviewTitle: '소트 연산 개요',
    overviewDesc: 'ORDER BY, GROUP BY, DISTINCT, UNION, 윈도우 함수 등 많은 SQL 연산이 내부적으로 소트를 수행합니다. 소트는 PGA의 Sort Area에서 처리되며, 메모리가 부족하면 Temp 세그먼트(디스크)를 사용합니다.',
    overviewItems: [
      { icon: '↕', title: 'ORDER BY', desc: '결과를 정렬하여 반환. 인덱스로 순서가 보장되면 소트 생략 가능.', color: 'blue' },
      { icon: '📊', title: 'GROUP BY', desc: '그룹화 연산. Hash Aggregate로 처리하면 소트 불필요.', color: 'orange' },
      { icon: '🔀', title: 'UNION / INTERSECT', desc: '중복 제거를 위한 소트. UNION ALL은 소트 없음.', color: 'violet' },
      { icon: '🔗', title: 'Sort-Merge Join', desc: '조인 키로 양쪽 테이블을 정렬 후 병합.', color: 'emerald' },
    ],

    memTitle: 'Sort Area와 Temp 세그먼트',
    memDesc: '소트는 PGA의 Sort Area에서 처리됩니다. 데이터가 Sort Area를 초과하면 Temp 테이블스페이스의 Temp 세그먼트(디스크)로 Spill합니다.',
    memTable: [
      ['메모리 소트', 'Sort Area만 사용', 'PGA_AGGREGATE_TARGET 이내', '빠름'],
      ['디스크 소트', 'Temp 세그먼트 사용', 'Sort Area 초과 시 발생', '느림 (10~100배)'],
    ],
    memInfo: 'PGA_AGGREGATE_TARGET 또는 PGA_AGGREGATE_LIMIT으로 전체 PGA 사용량을 제어합니다. WORK_AREA_SIZE_POLICY=AUTO (기본값) 설정 시 Oracle이 자동으로 Sort Area 크기를 결정합니다.',

    avoidTitle: '소트 회피 전략',
    avoidDesc: '소트를 완전히 제거하거나 비용을 줄이는 것이 성능 튜닝의 핵심입니다.',
    avoidTable: [
      ['인덱스 활용', 'ORDER BY 컬럼에 인덱스가 있으면 정렬 생략', '인덱스 Range Scan 순서가 ORDER BY와 일치해야 함'],
      ['UNION → UNION ALL', '중복이 없거나 중복 허용 시 UNION ALL 사용', '중복 제거 소트 제거'],
      ['Hash GROUP BY', 'GROUP BY를 Hash Aggregate로 처리', '11g 이후 기본 동작'],
      ['PGA 크기 증가', 'PGA_AGGREGATE_TARGET 값을 늘림', '디스크 소트 방지'],
      ['윈도우 함수 순서', 'ORDER BY 방향을 인덱스와 일치시킴', '소트 재사용 가능'],
    ],
  },
  en: {
    chapterTitle: 'Sort Tuning',
    chapterSubtitle: 'Learn Oracle\'s sort operation mechanisms and performance tuning strategies.',
    simDesc: 'Sort Simulator — Simulate sort operation memory/disk processing.',

    overviewTitle: 'Sort Operations Overview',
    overviewDesc: 'Many SQL operations internally require sorting: ORDER BY, GROUP BY, DISTINCT, UNION, window functions. Sorting happens in the PGA Sort Area; if memory is insufficient, Oracle spills to the Temp segment on disk.',
    overviewItems: [
      { icon: '↕', title: 'ORDER BY', desc: 'Sorts the result set. Sort can be eliminated if an index guarantees the order.', color: 'blue' },
      { icon: '📊', title: 'GROUP BY', desc: 'Grouping operation. Hash Aggregate processing eliminates sort.', color: 'orange' },
      { icon: '🔀', title: 'UNION / INTERSECT', desc: 'Sort for deduplication. UNION ALL requires no sort.', color: 'violet' },
      { icon: '🔗', title: 'Sort-Merge Join', desc: 'Sorts both tables on join key, then merges.', color: 'emerald' },
    ],

    memTitle: 'Sort Area & Temp Segment',
    memDesc: 'Sorting occurs in the PGA Sort Area. If data exceeds the Sort Area, Oracle spills to the Temp segment (Temp tablespace on disk).',
    memTable: [
      ['In-memory sort', 'Uses only Sort Area', 'Within PGA_AGGREGATE_TARGET', 'Fast'],
      ['Disk sort', 'Uses Temp segment', 'Triggered when Sort Area is exceeded', 'Slow (10–100x)'],
    ],
    memInfo: 'Control total PGA usage with PGA_AGGREGATE_TARGET or PGA_AGGREGATE_LIMIT. With WORK_AREA_SIZE_POLICY=AUTO (default), Oracle automatically determines Sort Area size.',

    avoidTitle: 'Sort Avoidance Strategies',
    avoidDesc: 'Eliminating or reducing sort cost is central to SQL performance tuning.',
    avoidTable: [
      ['Use index', 'Index on ORDER BY column eliminates sort', 'Index Range Scan order must match ORDER BY'],
      ['UNION → UNION ALL', 'Use UNION ALL when duplicates are absent or acceptable', 'Removes deduplication sort'],
      ['Hash GROUP BY', 'Process GROUP BY with Hash Aggregate', 'Default behavior since 11g'],
      ['Increase PGA', 'Raise PGA_AGGREGATE_TARGET value', 'Prevents disk spill'],
      ['Window function order', 'Match ORDER BY direction with index', 'Enables sort reuse'],
    ],
  },
}

export function SortPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'sort-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="↕" num={6} title="Sort Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Sort Simulator" color="rose" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <WipBanner />
      {sectionId === 'sort-overview' && (
        <>
          <ChapterTitle icon="↕" num={6} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
          <SectionTitle>{t.overviewTitle}</SectionTitle>
          <Prose>{t.overviewDesc}</Prose>
          <ConceptGrid items={t.overviewItems} />
        </>
      )}
      {sectionId === 'sort-memory' && (
        <>
          <SectionTitle>{t.memTitle}</SectionTitle>
          <Prose>{t.memDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '소트 유형' : 'Sort Type', lang === 'ko' ? '특징' : 'Description', lang === 'ko' ? '발생 조건' : 'Condition', lang === 'ko' ? '성능' : 'Performance']}
            rows={t.memTable}
          />
          <InfoBox color="blue" icon="💡" title="PGA_AGGREGATE_TARGET">
            {t.memInfo}
          </InfoBox>
        </>
      )}
      {sectionId === 'sort-avoid' && (
        <>
          <SectionTitle>{t.avoidTitle}</SectionTitle>
          <Prose>{t.avoidDesc}</Prose>
          <Table
            headers={[lang === 'ko' ? '전략' : 'Strategy', lang === 'ko' ? '방법' : 'How', lang === 'ko' ? '주의사항' : 'Notes']}
            rows={t.avoidTable}
          />
        </>
      )}
    </PageContainer>
  )
}
