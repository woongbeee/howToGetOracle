import { useSimulationStore } from '@/store/simulationStore'
import { SectionTitle, Prose, InfoBox, ConceptGrid } from '../shared'
import { TwoColLayout, MapPanel } from './shared'

const T = {
  ko: {
    mapTitle: '인스턴스 구조에서의 위치',
    pgaTitle: 'PGA — Program Global Area',
    pgaDesc: 'PGA는 각 서버 프로세스(또는 백그라운드 프로세스)에게 독립적으로 할당되는 비공유 메모리입니다. 다른 프로세스와 공유되지 않아 lock이 필요 없습니다.',
    pgaCallout: 'PGA — 서버 프로세스 전용 메모리',
    pgaSgaVsTitle: 'SGA vs PGA',
    pgaSgaVsDesc: 'SGA는 모든 프로세스가 공유하는 메모리(공유 메모리)입니다. PGA는 각 프로세스에 독립적으로 할당되는 전용 메모리입니다. Latch, Lock 없이 PGA에 접근할 수 있어 빠릅니다.',
    pgaItems: [
      { icon: '🔐', title: 'Private SQL Area', desc: '바인드 변수 값, 런타임 메모리 등 세션 고유 정보 저장.', color: 'blue' },
      { icon: '🗂', title: 'Sort Area', desc: 'ORDER BY, GROUP BY, DISTINCT 처리 시 사용. PGA_AGGREGATE_TARGET으로 관리.', color: 'orange' },
      { icon: '🔁', title: 'Hash Area', desc: 'Hash Join 수행 시 빌드 테이블을 메모리에 적재하는 공간.', color: 'violet' },
      { icon: '📦', title: 'Bitmap Merge Area', desc: 'Bitmap Index 스캔 결과를 병합할 때 사용하는 메모리.', color: 'emerald' },
    ],
  },
  en: {
    mapTitle: 'Location in Instance Structure',
    pgaTitle: 'PGA — Program Global Area',
    pgaDesc: 'The PGA is a non-shared memory region allocated independently per server (or background) process. No locks are required since it is private.',
    pgaCallout: 'PGA — Per-Process Private Memory',
    pgaSgaVsTitle: 'SGA vs PGA',
    pgaSgaVsDesc: 'The SGA is shared by all processes. The PGA is private to each process. PGA access requires no latches or locks, making it faster.',
    pgaItems: [
      { icon: '🔐', title: 'Private SQL Area', desc: 'Stores bind variable values and session-specific runtime memory.', color: 'blue' },
      { icon: '🗂', title: 'Sort Area', desc: 'Used for ORDER BY, GROUP BY, DISTINCT operations. Managed by PGA_AGGREGATE_TARGET.', color: 'orange' },
      { icon: '🔁', title: 'Hash Area', desc: 'Loads the build table into memory for Hash Join execution.', color: 'violet' },
      { icon: '📦', title: 'Bitmap Merge Area', desc: 'Merges results from multiple bitmap index scans.', color: 'emerald' },
    ],
  },
}

export function PgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <TwoColLayout
      map={<MapPanel title={t.mapTitle} highlightIds={['server-process', 'pga']} callout={t.pgaCallout} />}
    >
      <SectionTitle>{t.pgaTitle}</SectionTitle>
      <Prose>{t.pgaDesc}</Prose>
      <ConceptGrid items={t.pgaItems} />
      <InfoBox variant="note" lang={lang}>{t.pgaSgaVsDesc}</InfoBox>
    </TwoColLayout>
  )
}
