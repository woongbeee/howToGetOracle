import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SimulatorPlaceholder } from '../shared'
import { IndexTypesOverview } from './IndexTypesOverview'
import { BTreeSection } from './BTreeSection'
import { RowidSection } from './RowidSection'
import { RangeScanSection } from './RangeScanSection'
import { UniqueScanSection } from './UniqueScanSection'
import { FullScanSection } from './FullScanSection'
import { FastFullScanSection } from './FastFullScanSection'
import { SkipScanSection } from './SkipScanSection'
import { IndexUnusableSection } from './IndexUnusableSection'
import { BitmapSection } from './BitmapSection'
import { CompositeSection } from './CompositeSection'

const T = {
  ko: {
    chapterTitle: '인덱스 원리와 활용, 스캔 방식',
    chapterSubtitle: 'Oracle 인덱스의 종류와 내부 구조, 스캔 알고리즘을 인터랙티브 시각화로 학습합니다.',
    simDesc: '인덱스 스캔 시뮬레이터 — SQL 쿼리를 입력해 어떤 인덱스 스캔이 수행되는지 직접 확인하세요.',
  },
  en: {
    chapterTitle: 'Index Internals & Scan Methods',
    chapterSubtitle: 'Learn Oracle index types, internal structure, and scan algorithms through interactive visualizations.',
    simDesc: 'Index Scan Simulator — Enter a SQL query to see which index scans are performed.',
  },
}

// ── Layout wrapper: main content (left, scrollable) + glossary panel (right) ──

function IndexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto">
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function IndexChapterPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'index-overview') {
    return (
      <IndexLayout>
        <IndexTypesOverview />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-btree') {
    return (
      <IndexLayout>
        <BTreeSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-btree-rowid') {
    return (
      <IndexLayout>
        <RowidSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-unusable')       return <IndexLayout><IndexUnusableSection /></IndexLayout>

  if (sectionId === 'index-scan-range')     return <IndexLayout><RangeScanSection /></IndexLayout>
  if (sectionId === 'index-scan-unique')    return <IndexLayout><UniqueScanSection /></IndexLayout>
  if (sectionId === 'index-scan-full')      return <IndexLayout><FullScanSection /></IndexLayout>
  if (sectionId === 'index-scan-fast-full') return <IndexLayout><FastFullScanSection /></IndexLayout>
  if (sectionId === 'index-scan-skip')      return <IndexLayout><SkipScanSection /></IndexLayout>

  if (sectionId === 'index-bitmap') {
    return (
      <IndexLayout>
        <BitmapSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-composite') {
    return (
      <IndexLayout>
        <CompositeSection />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="🔍" title="Index Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Index Simulator" color="violet" />
      </PageContainer>
    )
  }

  return null
}
