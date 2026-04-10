// Book structure — Table of Contents definition
// Each chapter has sections; sections can have a simulator slot

export interface BookSection {
  id: string
  title: { ko: string; en: string }
  /** If true, a simulator panel appears at the bottom of this section */
  hasSimulator?: boolean
  simulatorLabel?: { ko: string; en: string }
}

export interface BookChapter {
  id: string
  num: number
  title: { ko: string; en: string }
  icon: string
  color: string // tailwind color key
  sections: BookSection[]
}

export const BOOK_CHAPTERS: BookChapter[] = [
  {
    id: 'internals',
    num: 1,
    icon: '⚙',
    color: 'blue',
    title: { ko: '오라클 내부 구조와 프로세스', en: 'Oracle Internals & Processes' },
    sections: [
      {
        id: 'internals-overview',
        title: { ko: '아키텍처 개요', en: 'Architecture Overview' },
      },
      {
        id: 'internals-sga',
        title: { ko: 'SGA — System Global Area', en: 'SGA — System Global Area' },
      },
      {
        id: 'internals-pga',
        title: { ko: 'PGA — Program Global Area', en: 'PGA — Program Global Area' },
      },
      {
        id: 'internals-processes',
        title: { ko: '백그라운드 프로세스', en: 'Background Processes' },
      },
      {
        id: 'internals-simulator',
        title: { ko: 'Internals Simulator', en: 'Internals Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: 'Internals 시뮬레이터 실행', en: 'Launch Internals Simulator' },
      },
    ],
  },
  {
    id: 'index',
    num: 2,
    icon: '🔍',
    color: 'violet',
    title: { ko: '인덱스 원리와 활용, 스캔 방식', en: 'Index Internals & Scan Methods' },
    sections: [
      {
        id: 'index-overview',
        title: { ko: '인덱스 개요', en: 'Index Overview' },
      },
      {
        id: 'index-btree',
        title: { ko: 'B-Tree 인덱스', en: 'B-Tree Index' },
      },
      {
        id: 'index-bitmap',
        title: { ko: 'Bitmap 인덱스', en: 'Bitmap Index' },
      },
      {
        id: 'index-composite',
        title: { ko: '복합 & 기타 인덱스', en: 'Composite & Other Indexes' },
      },
      {
        id: 'index-simulator',
        title: { ko: 'Index Simulator', en: 'Index Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: 'Index 시뮬레이터 실행', en: 'Launch Index Simulator' },
      },
    ],
  },
  {
    id: 'join',
    num: 3,
    icon: '🔗',
    color: 'emerald',
    title: { ko: '조인 원리와 활용', en: 'Join Principles & Usage' },
    sections: [
      {
        id: 'join-overview',
        title: { ko: '조인 개요', en: 'Join Overview' },
      },
      {
        id: 'join-nested-loop',
        title: { ko: 'Nested Loop Join', en: 'Nested Loop Join' },
      },
      {
        id: 'join-hash',
        title: { ko: 'Hash Join', en: 'Hash Join' },
      },
      {
        id: 'join-sort-merge',
        title: { ko: 'Sort Merge Join', en: 'Sort Merge Join' },
      },
      {
        id: 'join-simulator',
        title: { ko: 'Join Simulator', en: 'Join Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: 'Join 시뮬레이터 실행', en: 'Launch Join Simulator' },
      },
    ],
  },
  {
    id: 'optimizer',
    num: 4,
    icon: '⚡',
    color: 'orange',
    title: { ko: '옵티마이저 원리', en: 'Optimizer Principles' },
    sections: [
      {
        id: 'optimizer-overview',
        title: { ko: 'CBO 개요', en: 'CBO Overview' },
      },
      {
        id: 'optimizer-stats',
        title: { ko: '통계 정보와 선택도', en: 'Statistics & Selectivity' },
      },
      {
        id: 'optimizer-access-path',
        title: { ko: '액세스 패스', en: 'Access Paths' },
      },
      {
        id: 'optimizer-plan',
        title: { ko: '실행 계획 생성', en: 'Execution Plan Generation' },
      },
      {
        id: 'optimizer-simulator',
        title: { ko: 'Optimizer Simulator', en: 'Optimizer Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: 'Optimizer 시뮬레이터 실행', en: 'Launch Optimizer Simulator' },
      },
    ],
  },
  {
    id: 'query-transform',
    num: 5,
    icon: '🔄',
    color: 'cyan',
    title: { ko: '쿼리 변환', en: 'Query Transformation' },
    sections: [
      {
        id: 'qt-overview',
        title: { ko: '쿼리 변환 개요', en: 'Query Transformation Overview' },
      },
      {
        id: 'qt-subquery-unnesting',
        title: { ko: '서브쿼리 Unnesting', en: 'Subquery Unnesting' },
      },
      {
        id: 'qt-view-merging',
        title: { ko: '뷰 Merging', en: 'View Merging' },
      },
      {
        id: 'qt-predicate-pushdown',
        title: { ko: 'Predicate Pushdown', en: 'Predicate Pushdown' },
      },
      {
        id: 'qt-simulator',
        title: { ko: 'Query Transform Simulator', en: 'Query Transform Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: '쿼리 변환 시뮬레이터 실행', en: 'Launch Query Transform Simulator' },
      },
    ],
  },
  {
    id: 'sort',
    num: 6,
    icon: '↕',
    color: 'rose',
    title: { ko: '소트 튜닝', en: 'Sort Tuning' },
    sections: [
      {
        id: 'sort-overview',
        title: { ko: '소트 연산 개요', en: 'Sort Operations Overview' },
      },
      {
        id: 'sort-memory',
        title: { ko: 'Sort Area와 Temp 세그먼트', en: 'Sort Area & Temp Segment' },
      },
      {
        id: 'sort-avoid',
        title: { ko: '소트 회피 전략', en: 'Sort Avoidance Strategies' },
      },
      {
        id: 'sort-simulator',
        title: { ko: 'Sort Simulator', en: 'Sort Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: 'Sort 시뮬레이터 실행', en: 'Launch Sort Simulator' },
      },
    ],
  },
  {
    id: 'partition',
    num: 7,
    icon: '▦',
    color: 'amber',
    title: { ko: '파티셔닝', en: 'Partitioning' },
    sections: [
      {
        id: 'partition-overview',
        title: { ko: '파티셔닝 개요', en: 'Partitioning Overview' },
      },
      {
        id: 'partition-range',
        title: { ko: 'Range / List / Hash 파티션', en: 'Range / List / Hash Partition' },
      },
      {
        id: 'partition-pruning',
        title: { ko: 'Partition Pruning', en: 'Partition Pruning' },
      },
      {
        id: 'partition-simulator',
        title: { ko: 'Partition Simulator', en: 'Partition Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: '파티션 시뮬레이터 실행', en: 'Launch Partition Simulator' },
      },
    ],
  },
  {
    id: 'parallel',
    num: 8,
    icon: '⫴',
    color: 'teal',
    title: { ko: '병렬 처리', en: 'Parallel Processing' },
    sections: [
      {
        id: 'parallel-overview',
        title: { ko: '병렬 처리 개요', en: 'Parallel Processing Overview' },
      },
      {
        id: 'parallel-dop',
        title: { ko: 'Degree of Parallelism', en: 'Degree of Parallelism' },
      },
      {
        id: 'parallel-coordinator',
        title: { ko: 'QC와 PX 서버', en: 'Query Coordinator & PX Servers' },
      },
      {
        id: 'parallel-simulator',
        title: { ko: 'Parallel Simulator', en: 'Parallel Simulator' },
        hasSimulator: true,
        simulatorLabel: { ko: '병렬 처리 시뮬레이터 실행', en: 'Launch Parallel Simulator' },
      },
    ],
  },
]

export function getChapterById(id: string): BookChapter | undefined {
  return BOOK_CHAPTERS.find((c) => c.id === id)
}

export function getSectionById(sectionId: string): { chapter: BookChapter; section: BookSection } | undefined {
  for (const chapter of BOOK_CHAPTERS) {
    const section = chapter.sections.find((s) => s.id === sectionId)
    if (section) return { chapter, section }
  }
  return undefined
}

export function getAdjacentSections(sectionId: string): {
  prev: { chapter: BookChapter; section: BookSection } | null
  next: { chapter: BookChapter; section: BookSection } | null
} {
  const allSections: Array<{ chapter: BookChapter; section: BookSection }> = []
  for (const chapter of BOOK_CHAPTERS) {
    for (const section of chapter.sections) {
      allSections.push({ chapter, section })
    }
  }
  const idx = allSections.findIndex((s) => s.section.id === sectionId)
  return {
    prev: idx > 0 ? allSections[idx - 1] : null,
    next: idx < allSections.length - 1 ? allSections[idx + 1] : null,
  }
}
