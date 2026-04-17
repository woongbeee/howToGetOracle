import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import type { InstanceComponentId } from './OracleInstanceMap'
import { SectionTitle, Prose, InfoBox, Table } from '../shared'
import { TwoColLayout, MapPanel, TourPanel } from './shared'
import type { TourItem } from './shared'

const T = {
  ko: {
    mapTitle: '인스턴스 구조에서의 위치',
    processTitle: '백그라운드 프로세스',
    processDesc: 'Oracle 인스턴스는 다양한 백그라운드 프로세스를 통해 메모리 관리, I/O, 복구 등의 작업을 자동으로 처리합니다.',
    processCallout: '백그라운드 프로세스 영역',
    processExploreLabel: '프로세스별 역할 살펴보기',
    processTable: [
      ['DBWn (DB Writer)', 'Buffer Cache의 Dirty 블록을 데이터 파일에 기록. Checkpoint 신호 또는 임계값 초과 시 동작'],
      ['LGWR (Log Writer)', 'Redo Log Buffer의 내용을 Online Redo Log File에 기록. Commit 시 동기 기록'],
      ['CKPT (Checkpoint)', 'Checkpoint SCN을 컨트롤 파일·데이터 파일 헤더에 기록. DBWn에 쓰기 신호 전송'],
      ['SMON (System Monitor)', '인스턴스 복구, 임시 세그먼트 정리, Extent Coalescing 담당'],
      ['PMON (Process Monitor)', '비정상 종료된 세션 정리, 리소스 해제, Listener에 서비스 등록'],
      ['ARCn (Archiver)', 'Online Redo Log가 꽉 차면 Archive Log File로 복사 (ARCHIVELOG 모드 시)'],
      ['MMON / MMNL', '통계 수집(AWR Snapshot), 알림, 자가 진단 담당'],
    ],
    processWalTitle: 'DBWn과 LGWR의 순서',
    processWalDesc: 'Oracle은 Write-Ahead Logging을 사용합니다. 데이터 블록이 디스크에 기록되기 전에 반드시 Redo Log가 먼저 기록되어야 합니다. LGWR이 DBWn보다 항상 먼저 동작합니다.',
    processTour: [
      { ids: ['dbwr', 'disk'] as InstanceComponentId[], label: 'DBWn', desc: { ko: 'Buffer Cache → Data Files 쓰기', en: 'Writes Buffer Cache → Data Files' } },
      { ids: ['lgwr', 'redo-log-file'] as InstanceComponentId[], label: 'LGWR', desc: { ko: 'Redo Buffer → Online Redo Log 쓰기', en: 'Writes Redo Buffer → Online Redo Log' } },
      { ids: ['ckpt', 'control-file', 'disk'] as InstanceComponentId[], label: 'CKPT', desc: { ko: 'Checkpoint 정보를 Control File·Data Files에 기록', en: 'Records checkpoint to Control File & Data Files' } },
      { ids: ['smon'] as InstanceComponentId[], label: 'SMON', desc: { ko: 'Instance Recovery 및 세그먼트 정리', en: 'Instance Recovery & segment cleanup' } },
      { ids: ['pmon'] as InstanceComponentId[], label: 'PMON', desc: { ko: '실패한 세션 정리, 락 해제', en: 'Cleans up failed sessions, releases locks' } },
      { ids: ['arcn', 'redo-log-file', 'archive-log'] as InstanceComponentId[], label: 'ARCn', desc: { ko: 'Online Redo Log → Archive Log 복사', en: 'Copies Online Redo Log → Archive Log' } },
    ] satisfies TourItem[],
    tableHeaderProcess: '프로세스',
    tableHeaderRole: '역할',
    showAll: '전체 보기',
  },
  en: {
    mapTitle: 'Location in Instance Structure',
    processTitle: 'Background Processes',
    processDesc: 'Oracle background processes automatically handle memory management, I/O, recovery, and other internal tasks.',
    processCallout: 'Background Processes',
    processExploreLabel: 'Explore Each Process',
    processTable: [
      ['DBWn (DB Writer)', 'Writes dirty blocks from Buffer Cache to data files. Triggered by checkpoint or threshold.'],
      ['LGWR (Log Writer)', 'Writes Redo Log Buffer to Online Redo Log Files. Writes synchronously on COMMIT.'],
      ['CKPT (Checkpoint)', 'Records checkpoint SCN to control file and data file headers. Signals DBWn to write.'],
      ['SMON (System Monitor)', 'Handles instance recovery, temporary segment cleanup, and extent coalescing.'],
      ['PMON (Process Monitor)', 'Cleans up dead sessions, releases resources, registers services with Listener.'],
      ['ARCn (Archiver)', 'Copies online redo logs to archive logs when full (ARCHIVELOG mode).'],
      ['MMON / MMNL', 'Collects statistics (AWR snapshots), sends alerts, handles self-diagnosis.'],
    ],
    processWalTitle: 'DBWn vs LGWR Order',
    processWalDesc: 'Oracle uses Write-Ahead Logging. Redo logs must be written to disk before data blocks. LGWR always writes before DBWn.',
    processTour: [
      { ids: ['dbwr', 'disk'] as InstanceComponentId[], label: 'DBWn', desc: { ko: 'Buffer Cache → Data Files 쓰기', en: 'Writes Buffer Cache → Data Files' } },
      { ids: ['lgwr', 'redo-log-file'] as InstanceComponentId[], label: 'LGWR', desc: { ko: 'Redo Buffer → Online Redo Log 쓰기', en: 'Writes Redo Buffer → Online Redo Log' } },
      { ids: ['ckpt', 'control-file', 'disk'] as InstanceComponentId[], label: 'CKPT', desc: { ko: 'Checkpoint 정보를 Control File·Data Files에 기록', en: 'Records checkpoint to Control File & Data Files' } },
      { ids: ['smon'] as InstanceComponentId[], label: 'SMON', desc: { ko: 'Instance Recovery 및 세그먼트 정리', en: 'Instance Recovery & segment cleanup' } },
      { ids: ['pmon'] as InstanceComponentId[], label: 'PMON', desc: { ko: '실패한 세션 정리, 락 해제', en: 'Cleans up failed sessions, releases locks' } },
      { ids: ['arcn', 'redo-log-file', 'archive-log'] as InstanceComponentId[], label: 'ARCn', desc: { ko: 'Online Redo Log → Archive Log 복사', en: 'Copies Online Redo Log → Archive Log' } },
    ] satisfies TourItem[],
    tableHeaderProcess: 'Process',
    tableHeaderRole: 'Role',
    showAll: 'Show All',
  },
}

export function ProcessesSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeProcess, setActiveProcess] = useState<number | null>(null)

  const highlightIds: InstanceComponentId[] =
    activeProcess !== null
      ? t.processTour[activeProcess].ids
      : ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn']

  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={highlightIds}
          callout={activeProcess !== null ? t.processTour[activeProcess].label : t.processCallout}
        />
      }
    >
      <SectionTitle>{t.processTitle}</SectionTitle>
      <Prose>{t.processDesc}</Prose>

      <TourPanel
        tour={t.processTour}
        activeIdx={activeProcess}
        onSelect={setActiveProcess}
        accentColor="amber"
        exploreLabel={t.processExploreLabel}
        showAllLabel={t.showAll}
      />

      <Table headers={[t.tableHeaderProcess, t.tableHeaderRole]} rows={t.processTable} />
      <InfoBox color="orange" icon="⚠" title={t.processWalTitle}>{t.processWalDesc}</InfoBox>
    </TwoColLayout>
  )
}
