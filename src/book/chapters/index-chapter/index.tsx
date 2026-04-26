import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer, ChapterTitle, SimulatorPlaceholder, WipBanner } from '../shared'
import { IndexTypesOverview } from '@/components/index/IndexTypesOverview'
import { BTreeSection } from '@/components/index/BTreeSection'
import { BitmapSection } from '@/components/index/BitmapSection'
import { CompositeSection } from '@/components/index/CompositeSection'
import { SchemaView, TableView } from '@/components/DataPanel'
import { HR_SCHEMA } from '@/data/hrSchema'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    chapterTitle: '인덱스 원리와 활용, 스캔 방식',
    chapterSubtitle: 'Oracle 인덱스의 종류와 내부 구조, 스캔 알고리즘을 인터랙티브 시각화로 학습합니다.',
    simDesc: '인덱스 스캔 시뮬레이터 — SQL 쿼리를 입력해 어떤 인덱스 스캔이 수행되는지 직접 확인하세요.',
    panelTitle: 'HR 스키마',
    tabSchema: '스키마',
    tabData: '데이터',
    selectTable: '테이블 선택',
  },
  en: {
    chapterTitle: 'Index Internals & Scan Methods',
    chapterSubtitle: 'Learn Oracle index types, internal structure, and scan algorithms through interactive visualizations.',
    simDesc: 'Index Scan Simulator — Enter a SQL query to see which index scans are performed.',
    panelTitle: 'HR Schema',
    tabSchema: 'Schema',
    tabData: 'Data',
    selectTable: 'Select Table',
  },
}

// Full HR schema object for SchemaView
const HR_SCHEMA_OBJ = { name: 'HR', label: 'Human Resources', color: 'blue', tables: HR_SCHEMA }

// ── Side panel: HR schema + per-table data ────────────────────────────────────

function HRSchemaPanel() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [tab, setTab] = useState<'schema' | 'data'>('schema')
  const [selectedTable, setSelectedTable] = useState(HR_SCHEMA[0])

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l bg-card xl:w-80">
      {/* Panel header */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet-600">
          {t.panelTitle}
        </span>
      </div>

      {/* Tab toggle */}
      <div className="flex shrink-0 border-b">
        {(['schema', 'data'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={cn(
              'flex-1 py-2 font-mono text-xs font-medium transition-colors',
              tab === v
                ? 'border-b-2 border-violet-500 text-violet-600'
                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {v === 'schema' ? t.tabSchema : t.tabData}
          </button>
        ))}
      </div>

      {/* Table picker (data tab only) */}
      {tab === 'data' && (
        <div className="flex shrink-0 flex-wrap gap-1 border-b bg-muted/30 px-2 py-2">
          {HR_SCHEMA.map((tbl) => (
            <button
              key={tbl.name}
              onClick={() => setSelectedTable(tbl)}
              className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors',
                selectedTable.name === tbl.name
                  ? 'border-violet-400 bg-violet-100 text-violet-800 font-bold'
                  : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground'
              )}
            >
              {tbl.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'schema' && <SchemaView schema={HR_SCHEMA_OBJ} />}
        {tab === 'data' && <TableView table={selectedTable} />}
      </div>
    </aside>
  )
}

// ── Layout wrapper: main content (left, scrollable) + side panel (right, fixed) ──

function IndexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="px-8 pt-6">
          <WipBanner />
        </div>
        {children}
      </div>
      <HRSchemaPanel />
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
        <div className="mx-auto max-w-4xl px-8 py-10">
          <ChapterTitle icon="🔍" num={2} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
        </div>
        <IndexTypesOverview lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-btree') {
    return (
      <IndexLayout>
        <BTreeSection lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-bitmap') {
    return (
      <IndexLayout>
        <BitmapSection lang={lang} />
      </IndexLayout>
    )
  }

  if (sectionId === 'index-composite') {
    return (
      <IndexLayout>
        <CompositeSection lang={lang} />
      </IndexLayout>
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
