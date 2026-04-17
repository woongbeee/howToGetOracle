import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, ConceptGrid } from '../shared'
import { TwoColLayout, MapPanel } from './shared'

const T = {
  ko: {
    chapterTitle: '오라클 내부 구조와 프로세스',
    chapterSubtitle: 'Oracle Database가 SQL을 처리하는 방법을 인스턴스 아키텍처 수준에서 이해합니다.',
    mapTitle: '인스턴스 구조에서의 위치',
    overviewTitle: '아키텍처 개요',
    overviewDesc: 'Oracle Database는 크게 두 가지 구성 요소로 이루어집니다. 메모리 구조와 프로세스로 이루어진 Oracle Instance와 실제 데이터가 저장되는 Oracle Database(파일 세트)입니다.',
    overviewDesc2: '인스턴스는 한 번에 하나의 데이터베이스만 마운트할 수 있으며, 서버 프로세스는 클라이언트 요청을 처리하고 SGA를 통해 공유 메모리에 접근합니다.',
    overviewCallout: '전체 인스턴스 구조',
    instanceItems: [
      { icon: '🧠', title: 'Oracle Instance', desc: 'SGA(메모리) + Background Processes. 데이터베이스가 마운트되면 인스턴스가 시작됩니다.', color: 'blue' },
      { icon: '💾', title: 'Oracle Database', desc: '데이터 파일(.dbf), 리두 로그 파일(.log), 컨트롤 파일(.ctl)로 구성된 물리적 파일 집합.', color: 'orange' },
      { icon: '🔄', title: 'Server Process', desc: '클라이언트 연결당 하나 생성. SQL 파싱, 실행, 결과 반환을 담당합니다.', color: 'violet' },
      { icon: '📋', title: 'PGA', desc: 'Program Global Area. 서버 프로세스마다 독립적으로 할당되는 비공유 메모리.', color: 'emerald' },
    ],
  },
  en: {
    chapterTitle: 'Oracle Internals & Processes',
    chapterSubtitle: 'Understand how Oracle Database processes SQL at the instance architecture level.',
    mapTitle: 'Location in Instance Structure',
    overviewTitle: 'Architecture Overview',
    overviewDesc: 'An Oracle Database system consists of two main components: the Oracle Instance (memory structures + processes) and the Oracle Database (the set of physical files on disk).',
    overviewDesc2: 'An instance can only mount one database at a time. Server processes handle client requests and access shared memory through the SGA.',
    overviewCallout: 'Full Instance Structure',
    instanceItems: [
      { icon: '🧠', title: 'Oracle Instance', desc: 'SGA (memory) + Background Processes. The instance starts when a database is mounted.', color: 'blue' },
      { icon: '💾', title: 'Oracle Database', desc: 'Physical file set: data files (.dbf), redo log files (.log), and control files (.ctl).', color: 'orange' },
      { icon: '🔄', title: 'Server Process', desc: 'One created per client connection. Handles SQL parsing, execution, and result return.', color: 'violet' },
      { icon: '📋', title: 'PGA', desc: 'Program Global Area. Non-shared memory allocated independently per server process.', color: 'emerald' },
    ],
  },
}

export function OverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <TwoColLayout map={<MapPanel title={t.mapTitle} highlightIds={[]} callout={t.overviewCallout} />}>
      <ChapterTitle icon="⚙" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>
      <Prose>{t.overviewDesc2}</Prose>
      <ConceptGrid items={t.instanceItems} />
    </TwoColLayout>
  )
}
