import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SimulatorPlaceholder } from './shared'
import { IndexTypesOverview } from '@/components/index/IndexTypesOverview'
import { BTreeSection } from '@/components/index/BTreeSection'
import { BitmapSection } from '@/components/index/BitmapSection'
import { CompositeSection } from '@/components/index/CompositeSection'

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

export function IndexChapterPage({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  if (sectionId === 'index-overview') {
    return (
      <div className="overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-10">
          <ChapterTitle icon="🔍" num={2} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
        </div>
        <IndexTypesOverview lang={lang} />
      </div>
    )
  }

  if (sectionId === 'index-btree') {
    return (
      <div className="overflow-y-auto">
        <BTreeSection lang={lang} />
      </div>
    )
  }

  if (sectionId === 'index-bitmap') {
    return (
      <div className="overflow-y-auto">
        <BitmapSection lang={lang} />
      </div>
    )
  }

  if (sectionId === 'index-composite') {
    return (
      <div className="overflow-y-auto">
        <CompositeSection lang={lang} />
      </div>
    )
  }

  if (sectionId === 'index-simulator') {
    return (
      <PageContainer>
        <ChapterTitle icon="🔍" num={2} title="Index Simulator" subtitle={t.simDesc} />
        <SimulatorPlaceholder label="Index Simulator" color="violet" />
      </PageContainer>
    )
  }

  return null
}
