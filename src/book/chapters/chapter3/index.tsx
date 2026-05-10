import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SimulatorPlaceholder, WipBanner } from '../shared'
import { IndexTypesOverview } from './IndexTypesOverview'
import { BTreeSection } from './BTreeSection'
import { BitmapSection } from './BitmapSection'
import { CompositeSection } from './CompositeSection'
import { GlossaryPanel } from '@/book/GlossaryPanel'

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

function IndexLayout({ sectionId, children }: { sectionId: string; children: React.ReactNode }) {
  const [glossaryOpen, setGlossaryOpen] = useState(true)

  return (
    <div className="flex h-full overflow-hidden">
      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <WipBanner />
        {children}
      </div>
      <GlossaryPanel
        sectionId={sectionId}
        open={glossaryOpen}
        onToggle={() => setGlossaryOpen((v) => !v)}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function IndexChapterPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'index-overview') {
    return (
      <IndexLayout sectionId={sectionId}>
        <IndexTypesOverview lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-btree') {
    return (
      <IndexLayout sectionId={sectionId}>
        <BTreeSection lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-bitmap') {
    return (
      <IndexLayout sectionId={sectionId}>
        <BitmapSection lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-composite') {
    return (
      <IndexLayout sectionId={sectionId}>
        <CompositeSection lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-simulator') {
    return (
      <PageContainer>
        <WipBanner />
        <ChapterTitle icon="🔍" num={2} title="Index Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Index Simulator" color="violet" />
      </PageContainer>
    )
  }

  return null
}
