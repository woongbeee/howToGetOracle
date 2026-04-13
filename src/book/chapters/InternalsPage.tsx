import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { useInternalsStore } from '@/store/internalsStore'
import type { InstanceComponentId } from './OracleInstanceMap'
import {
  ChapterTitle, SectionTitle, SubTitle, Prose,
  InfoBox, Table, ConceptGrid, Divider,
} from './shared'
import { cn } from '@/lib/utils'
import { OracleInstanceMap } from './OracleInstanceMap'
import { OracleDiagram } from '@/components/OracleDiagram'
import { QueryInput, LiveLog, SummaryTimeline } from '@/components/QueryInput'
import { OptimizerPanel } from '@/components/OptimizerPanel'
import { SchemaDiagramView } from '@/components/SchemaDiagram'
import { SchemaView, TableView } from '@/components/DataPanel'
import { SCHEMAS } from '@/data/index'
import type { SchemaTable } from '@/data/types'

// ── Bilingual strings ──────────────────────────────────────────────────────

const STORAGE_T = {
  ko: {
    chapterTitle: '오라클 내부 구조와 프로세스',
    chapterSubtitle: 'Oracle Database가 데이터를 물리적으로 저장하고 관리하는 방식을 이해합니다.',
    sectionTitle: '데이터 저장 구조',
    sectionDesc: 'Oracle은 데이터를 Block → Extent → Segment → Tablespace의 4계층 구조로 관리합니다. 각 계층은 논리적 단위이며, 물리적으로는 데이터 파일(.dbf)에 매핑됩니다.',
    hierarchyLabel: '저장 계층 구조',

    blockTitle: 'Block — 최소 I/O 단위',
    blockDesc: 'Oracle이 데이터를 읽고 쓰는 최소 단위입니다. 기본 크기는 8KB이며, DB_BLOCK_SIZE 파라미터로 설정합니다. Buffer Cache도 블록 단위로 데이터를 캐싱합니다.',
    blockDetail: [
      ['블록 크기', '기본 8KB. DB_BLOCK_SIZE로 설정하며 생성 후 변경 불가'],
      ['블록 기본 정보', '이 블록의 종류(데이터·인덱스 등), 디스크 위치, 마지막으로 변경된 시점을 기록'],
      ['Transaction Header', '이 블록을 동시에 수정할 수 있는 트랜잭션 수를 관리. INITRANS(기본 슬롯 수)·MAXTRANS(최대 슬롯 수)로 설정'],
      ['Table Directory', '이 블록에 데이터가 있는 테이블 목록(클러스터 블록용)'],
      ['Row Directory', '각 행의 블록 내 오프셋 포인터 배열'],
      ['PCTFREE', 'UPDATE로 행이 늘어날 때를 대비해 예약하는 빈 공간 비율 (기본 10%)'],
      ['PCTUSED', '사용 공간이 이 비율 아래로 떨어지면 블록을 Freelist에 다시 등록 (기본 40%)'],
    ],
    blockNote: 'Buffer Cache는 데이터 파일의 블록을 메모리에 올려둡니다. 동일 블록 재접근 시 디스크 I/O 없이 메모리에서 읽습니다.',

    extentTitle: 'Extent — 연속 블록의 묶음',
    extentDesc: '논리적으로 연속된 Block들의 집합입니다. Extent 단위로 세그먼트에 공간을 할당합니다. 연속된 블록 배치로 Sequential I/O 성능을 높입니다.',
    extentDetail: [
      ['할당 단위', '세그먼트가 공간 부족 시 Extent 단위로 추가 할당'],
      ['INITIAL', '세그먼트 생성 시 첫 번째로 할당되는 Extent 크기'],
      ['NEXT', '추가 Extent 할당 시 크기 (Locally Managed Tablespace에서 자동)'],
      ['Locally Managed', 'Extent 할당 정보를 Tablespace 비트맵으로 관리 (권장)'],
    ],

    segmentTitle: 'Segment — 오브젝트 저장 공간',
    segmentDesc: '하나의 데이터베이스 오브젝트(테이블, 인덱스 등)가 사용하는 Extent 집합입니다. 테이블 하나 = 하나의 Segment(파티션 테이블은 파티션당 하나).',
    segmentTypes: [
      { icon: '🗄', title: 'Table Segment', desc: '일반 테이블 데이터 저장', color: 'blue' },
      { icon: '🔍', title: 'Index Segment', desc: '인덱스 구조(B-Tree·Bitmap) 저장', color: 'violet' },
      { icon: '↩', title: 'Undo Segment', desc: 'ROLLBACK·Read Consistency용 이전 이미지 보관', color: 'orange' },
      { icon: '📦', title: 'Temp Segment', desc: '정렬·해시 조인 등 임시 작업 공간', color: 'emerald' },
    ],

    tablespaceTitle: 'Tablespace — 논리적 저장 컨테이너',
    tablespaceDesc: '하나 이상의 데이터 파일(.dbf)로 구성된 논리적 저장 단위입니다. DBA가 스토리지를 논리적으로 분리하고 관리하는 단위입니다.',
    tablespaceTable: [
      ['SYSTEM', '데이터 딕셔너리 저장. 항상 온라인. 사용자 오브젝트 저장 금지'],
      ['SYSAUX', 'AWR, Streams 등 Oracle 내부 컴포넌트 저장'],
      ['UNDO', 'Undo 데이터 저장. UNDO_TABLESPACE 파라미터로 지정'],
      ['TEMP', '정렬·해시 조인 임시 데이터. 트랜잭션 종료 시 자동 해제'],
      ['USERS (사용자)', 'DBA가 생성하는 사용자 데이터 저장 공간'],
    ],
    tablespaceNote: '물리적으로는 .dbf 데이터 파일이지만, DBA는 Tablespace라는 논리 이름으로만 관리합니다. 파일을 추가하거나 Autoextend를 설정해 공간을 늘릴 수 있습니다.',

    flowTitle: '계층 간 관계',
    flowDesc: 'INSERT 시 Oracle이 공간을 할당하는 흐름: Tablespace 내 사용 가능한 Extent → Extent 내 빈 Block → Block에 Row 기록.',
    infoTitle: '핵심 정리',
    infoBody: 'Block이 I/O의 기본 단위이고, Extent가 할당의 기본 단위이며, Segment가 오브젝트와 1:1 대응하고, Tablespace가 DBA 관리의 논리 단위입니다.',
  },
  en: {
    chapterTitle: 'Oracle Internals & Processes',
    chapterSubtitle: 'Understand how Oracle Database physically stores and manages data.',
    sectionTitle: 'Data Storage Structure',
    sectionDesc: 'Oracle organizes data in a 4-tier hierarchy: Block → Extent → Segment → Tablespace. Each tier is a logical unit that ultimately maps to physical data files (.dbf).',
    hierarchyLabel: 'Storage Hierarchy',

    blockTitle: 'Block — Smallest I/O Unit',
    blockDesc: 'The smallest unit Oracle uses for reading and writing data. The default size is 8KB, set by the DB_BLOCK_SIZE parameter. The Buffer Cache also caches data at the block level.',
    blockDetail: [
      ['Block Size', 'Default 8KB. Set by DB_BLOCK_SIZE; cannot be changed after creation.'],
      ['Block Metadata', 'Records this block\'s type (data, index, etc.), its location on disk, and when it was last modified.'],
      ['Transaction Header', 'Tracks how many transactions can modify this block simultaneously. Configured with INITRANS (default slots) and MAXTRANS (maximum slots).'],
      ['Table Directory', 'List of tables with data in this block (used for clustered tables).'],
      ['Row Directory', 'Array of in-block offset pointers, one per row.'],
      ['PCTFREE', 'Free space reserved for UPDATE row growth (default 10%). New INSERTs stop when free space hits this threshold.'],
      ['PCTUSED', 'Block re-added to Freelist when used space drops below this percentage (default 40%).'],
    ],
    blockNote: 'The Buffer Cache loads data file blocks into memory. Repeated access to the same block is served from memory without disk I/O.',

    extentTitle: 'Extent — Group of Contiguous Blocks',
    extentDesc: 'A logically contiguous set of Blocks. Space is allocated to segments in Extent units. Contiguous block placement improves sequential I/O performance.',
    extentDetail: [
      ['Allocation Unit', 'When a segment runs out of space, another Extent is allocated.'],
      ['INITIAL', 'Size of the first Extent allocated when a segment is created.'],
      ['NEXT', 'Size of subsequent Extent allocations (auto-managed in Locally Managed Tablespaces).'],
      ['Locally Managed', 'Extent allocation tracked via a tablespace bitmap (recommended).'],
    ],

    segmentTitle: 'Segment — Object Storage Space',
    segmentDesc: 'The set of Extents used by a single database object (table, index, etc.). One table = one Segment (partitioned tables have one Segment per partition).',
    segmentTypes: [
      { icon: '🗄', title: 'Table Segment', desc: 'Stores regular table row data', color: 'blue' },
      { icon: '🔍', title: 'Index Segment', desc: 'Stores index structures (B-Tree / Bitmap)', color: 'violet' },
      { icon: '↩', title: 'Undo Segment', desc: 'Holds before-images for ROLLBACK & Read Consistency', color: 'orange' },
      { icon: '📦', title: 'Temp Segment', desc: 'Scratch space for sort and hash-join operations', color: 'emerald' },
    ],

    tablespaceTitle: 'Tablespace — Logical Storage Container',
    tablespaceDesc: 'A logical storage unit composed of one or more data files (.dbf). DBAs use tablespaces to logically separate and manage storage.',
    tablespaceTable: [
      ['SYSTEM', 'Stores the data dictionary. Always online. Do not store user objects here.'],
      ['SYSAUX', 'Stores internal Oracle components: AWR, Streams, etc.'],
      ['UNDO', 'Stores undo data. Designated by the UNDO_TABLESPACE parameter.'],
      ['TEMP', 'Temporary data for sort/hash-join. Auto-released at transaction end.'],
      ['USERS (custom)', 'User-created tablespace for application data.'],
    ],
    tablespaceNote: 'Physically these are .dbf data files, but DBAs manage them using logical tablespace names. You can add files or enable Autoextend to grow the space.',

    flowTitle: 'Hierarchy Relationship',
    flowDesc: 'Space allocation flow on INSERT: find a free Extent in the Tablespace → find a free Block in the Extent → write the Row into the Block.',
    infoTitle: 'Key Takeaway',
    infoBody: 'Block is the I/O unit. Extent is the allocation unit. Segment maps 1:1 to a database object. Tablespace is the DBA\'s logical management unit.',
  },
}

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

    sgaTitle: 'SGA — System Global Area',
    sgaDesc: 'SGA는 모든 서버 프로세스와 백그라운드 프로세스가 공유하는 메모리 영역입니다. Oracle 인스턴스 시작 시 할당되며, 종료 시 해제됩니다.',
    sgaCallout: 'SGA 전체 영역',
    sgaExploreLabel: 'SGA 구성 요소 살펴보기',
    sgaComponents: [
      ['Buffer Cache', '디스크에서 읽은 데이터 블록을 캐싱. Hit 시 물리적 I/O 없이 데이터 접근 가능'],
      ['Library Cache', '파싱된 SQL 커서, 실행 계획을 저장. Soft Parse로 재사용 가능'],
      ['Dictionary Cache', '테이블·컬럼·권한 등 메타데이터(데이터 딕셔너리) 캐싱'],
      ['Redo Log Buffer', 'DML 변경사항을 LGWR가 Redo Log File에 플러시하기 전 임시 보관'],
      ['Large Pool', '대용량 메모리 할당을 위한 영역 (Parallel Query, RMAN 등)'],
      ['Java Pool', 'Oracle JVM을 위한 메모리 영역'],
    ],
    sgaInfo: 'SGA_TARGET 파라미터로 SGA 전체 크기를 자동 관리(ASMM)할 수 있습니다. Oracle 11g 이후 AMM(Automatic Memory Management)으로 SGA+PGA를 함께 관리할 수 있습니다.',
    sgaMemMgmtTitle: '자동 메모리 관리',
    bufferCacheTitle: 'Buffer Cache 동작 원리',
    sgaTour: [
      { ids: ['library-cache'] as InstanceComponentId[], label: 'Library Cache', desc: { ko: '파싱된 SQL과 실행 계획 캐시. Soft Parse 시 재사용됩니다.', en: 'Caches parsed SQL and execution plans. Reused on Soft Parse.' } },
      { ids: ['dict-cache'] as InstanceComponentId[], label: 'Dictionary Cache', desc: { ko: '테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱합니다.', en: 'Caches data dictionary metadata: tables, columns, privileges.' } },
      { ids: ['buffer-cache'] as InstanceComponentId[], label: 'Buffer Cache', desc: { ko: '데이터 파일에서 읽은 블록을 메모리에 유지합니다. Cache Hit 시 디스크 I/O가 발생하지 않습니다.', en: 'Keeps data blocks in memory. Cache hits avoid disk I/O.' } },
      { ids: ['redo-buffer'] as InstanceComponentId[], label: 'Redo Log Buffer', desc: { ko: 'DML 변경사항을 임시 보관. LGWR가 Online Redo Log에 플러시합니다.', en: 'Temporarily holds DML changes. LGWR flushes to Online Redo Log.' } },
    ],

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
    ],

    simTitle: 'Internals Simulator',
    simDesc: 'SQL을 입력하고 Oracle 인스턴스 내부에서 어떤 컴포넌트가 어떻게 활성화되는지 직접 확인해보세요.',
    tableHeaderComponent: '컴포넌트',
    tableHeaderRole: '역할',
    tableHeaderProcess: '프로세스',
    showAll: '전체 보기',
    execSummary: '처리 요약',
    liveLog: '실시간 로그',
    bufferSteps: [
      { id: 'sql',   label: 'SQL 요청',          desc: '서버 프로세스가 데이터 블록 필요' },
      { id: 'check', label: 'Buffer Cache 확인', desc: '블록이 이미 메모리에 있는가?' },
      { id: 'hit',   label: 'Cache Hit ✓',       desc: '메모리에서 직접 읽기 (Logical I/O)' },
      { id: 'miss',  label: 'Cache Miss ✗',      desc: '디스크에서 블록 읽기 (Physical I/O)' },
    ],
    bufferStepHint: '— 우측 지도에서 Buffer Cache 위치 확인',
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

    sgaTitle: 'SGA — System Global Area',
    sgaDesc: 'The SGA is a shared memory region used by all server and background processes. It is allocated when the Oracle instance starts and released when it shuts down.',
    sgaCallout: 'SGA — Shared Memory Region',
    sgaExploreLabel: 'Explore SGA Components',
    sgaComponents: [
      ['Buffer Cache', 'Caches data blocks read from disk. Cache hits eliminate physical I/O.'],
      ['Library Cache', 'Stores parsed SQL cursors and execution plans. Enables soft parse reuse.'],
      ['Dictionary Cache', 'Caches metadata (tables, columns, privileges) from the data dictionary.'],
      ['Redo Log Buffer', 'Temporarily holds DML changes before LGWR flushes them to redo log files.'],
      ['Large Pool', 'Memory for large allocations: Parallel Query, RMAN backups, etc.'],
      ['Java Pool', 'Memory reserved for the Oracle JVM.'],
    ],
    sgaInfo: 'SGA_TARGET enables Automatic Shared Memory Management (ASMM). From Oracle 11g, AMM (Automatic Memory Management) can manage both SGA and PGA together.',
    sgaMemMgmtTitle: 'Automatic Memory Management',
    bufferCacheTitle: 'How Buffer Cache Works',
    sgaTour: [
      { ids: ['library-cache'] as InstanceComponentId[], label: 'Library Cache', desc: { ko: '파싱된 SQL과 실행 계획 캐시. Soft Parse 시 재사용됩니다.', en: 'Caches parsed SQL and execution plans. Reused on Soft Parse.' } },
      { ids: ['dict-cache'] as InstanceComponentId[], label: 'Dictionary Cache', desc: { ko: '테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱합니다.', en: 'Caches data dictionary metadata: tables, columns, privileges.' } },
      { ids: ['buffer-cache'] as InstanceComponentId[], label: 'Buffer Cache', desc: { ko: '데이터 파일에서 읽은 블록을 메모리에 유지합니다. Cache Hit 시 디스크 I/O가 발생하지 않습니다.', en: 'Keeps data blocks in memory. Cache hits avoid disk I/O.' } },
      { ids: ['redo-buffer'] as InstanceComponentId[], label: 'Redo Log Buffer', desc: { ko: 'DML 변경사항을 임시 보관. LGWR가 Online Redo Log에 플러시합니다.', en: 'Temporarily holds DML changes. LGWR flushes to Online Redo Log.' } },
    ],

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
    ],

    simTitle: 'Internals Simulator',
    simDesc: 'Enter a SQL query and watch which Oracle instance components activate and how.',
    tableHeaderComponent: 'Component',
    tableHeaderRole: 'Role',
    tableHeaderProcess: 'Process',
    showAll: 'Show All',
    execSummary: 'Execution Summary',
    liveLog: 'Live Log',
    bufferSteps: [
      { id: 'sql',   label: 'SQL Request',        desc: 'Server process needs a data block' },
      { id: 'check', label: 'Buffer Cache Check', desc: 'Is the block already in memory?' },
      { id: 'hit',   label: 'Cache Hit ✓',        desc: 'Read from memory (Logical I/O)' },
      { id: 'miss',  label: 'Cache Miss ✗',       desc: 'Read from disk (Physical I/O)' },
    ],
    bufferStepHint: '— See Buffer Cache highlighted on the right',
  },
}

// ── Shared layout primitives ───────────────────────────────────────────────

function TwoColLayout({ children, map }: { children: React.ReactNode; map: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">{children}</div>
        <aside className="w-80 shrink-0 xl:w-96">
          <div className="sticky top-6">{map}</div>
        </aside>
      </div>
    </div>
  )
}

function MapPanel({ title, highlightIds, callout }: {
  title: string
  highlightIds: InstanceComponentId[]
  callout?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <OracleInstanceMap highlightIds={highlightIds} callout={callout} />
    </div>
  )
}

// ── Shared TourPanel (SGA & Processes reuse) ──────────────────────────────

type TourItem = {
  ids: InstanceComponentId[]
  label: string
  desc: { ko: string; en: string }
}

function TourPanel({
  tour,
  activeIdx,
  onSelect,
  accentColor,
  exploreLabel,
  showAllLabel,
  lang,
}: {
  tour: TourItem[]
  activeIdx: number | null
  onSelect: (i: number | null) => void
  accentColor: 'blue' | 'amber'
  exploreLabel: string
  showAllLabel: string
  lang: 'ko' | 'en'
}) {
  const active = accentColor === 'blue'
    ? { btn: 'border-blue-400 bg-blue-100 text-blue-700 font-bold shadow-sm', hover: 'hover:border-blue-300 hover:bg-blue-50', card: 'border-blue-200 bg-blue-50', title: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' }
    : { btn: 'border-amber-400 bg-amber-100 text-amber-700 font-bold shadow-sm', hover: 'hover:border-amber-300 hover:bg-amber-50', card: 'border-amber-200 bg-amber-50', title: 'text-amber-700', badge: 'bg-amber-200 text-amber-800' }

  return (
    <>
      <SubTitle>{exploreLabel}</SubTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {tour.map((item, i) => (
          <button
            key={item.label}
            onClick={() => onSelect(activeIdx === i ? null : i)}
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-xs transition-all',
              activeIdx === i ? active.btn : `${active.hover} text-muted-foreground`
            )}
          >
            {item.label}
          </button>
        ))}
        {activeIdx !== null && (
          <button
            onClick={() => onSelect(null)}
            className="rounded-full border border-dashed px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ {showAllLabel}
          </button>
        )}
      </div>

      {activeIdx !== null && (
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mb-4 rounded-lg border p-3', active.card)}
        >
          <div className={cn('mb-1 font-mono text-xs font-bold', active.title)}>
            {tour[activeIdx].label}
          </div>
          <p className="font-mono text-xs text-muted-foreground">{tour[activeIdx].desc[lang]}</p>
          {accentColor === 'amber' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tour[activeIdx].ids.map((id) => (
                <span key={id} className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold', active.badge)}>
                  {id}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}

// ── Page component ─────────────────────────────────────────────────────────

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-simulator') return <InternalsSimulatorSection />

  return (
    <>
      {sectionId === 'internals-storage'   && <StorageSection />}
      {sectionId === 'internals-overview'  && <OverviewSection />}
      {sectionId === 'internals-sga'       && <SgaSection />}
      {sectionId === 'internals-pga'       && <PgaSection />}
      {sectionId === 'internals-processes' && <ProcessesSection />}
    </>
  )
}

// ── Storage Structure ──────────────────────────────────────────────────────

// Visual: Block anatomy diagram
function BlockDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between bg-slate-700 px-4 py-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-200">
          Oracle Data Block — 8KB
        </span>
        <span className="font-mono text-[10px] text-slate-400">DB_BLOCK_SIZE</span>
      </div>

      {/* Block body — top label */}
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-1 border-b border-slate-200">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
          {isKo ? '▲ 상단 (낮은 주소)' : '▲ Top (low address)'}
        </span>
      </div>

      <div className="flex">
        {/* Left: block layout */}
        <div className="flex-1 divide-y divide-slate-200">

          {/* ── Block Header ── */}
          <div className="bg-blue-50 px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">BLOCK HEADER</span>
              <span className="font-mono text-[10px] text-blue-500">
                {isKo ? '고정 크기 · 블록 최상단' : 'Fixed size · top of block'}
              </span>
            </div>
            {/* Common header */}
            <div className="rounded border border-blue-200 bg-blue-100 px-3 py-1.5 mb-1">
              <div className="font-mono text-[10px] font-bold text-blue-800">
                {isKo ? '블록 기본 정보' : 'Block Metadata'}
              </div>
              <div className="font-mono text-[9px] text-blue-600 mt-0.5">
                {isKo
                  ? '이 블록의 종류·위치·마지막 변경 시점을 기록합니다'
                  : 'Records this block\'s type, location, and last modification time'}
              </div>
            </div>
            {/* ITL */}
            <div className="rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="font-mono text-[10px] font-bold text-indigo-800">
                  Transaction Header
                </div>
                <span className="rounded bg-indigo-200 px-1 py-0.5 font-mono text-[8px] text-indigo-700">
                  {isKo ? '동시 접근 슬롯' : 'Concurrent access slots'}
                </span>
              </div>
              <div className="mb-1.5 font-mono text-[9px] text-indigo-600">
                {isKo
                  ? '이 블록을 동시에 수정할 수 있는 트랜잭션 수를 제어합니다.'
                  : 'Controls how many transactions can modify this block at the same time.'}
              </div>
              {/* Slots visual */}
              <div className="flex gap-1">
                {[
                  { label: isKo ? '트랜잭션 1' : 'Txn 1', active: true },
                  { label: isKo ? '트랜잭션 2' : 'Txn 2', active: true },
                  { label: isKo ? '빈 슬롯' : 'Free', active: false },
                  { label: isKo ? '빈 슬롯' : 'Free', active: false },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded border px-1 py-1.5 text-center',
                      s.active
                        ? 'border-indigo-300 bg-indigo-100'
                        : 'border-indigo-100 bg-white'
                    )}
                  >
                    <div className={cn('font-mono text-[8px] font-bold', s.active ? 'text-indigo-700' : 'text-indigo-300')}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 font-mono text-[9px] text-indigo-500">
                {isKo
                  ? 'INITRANS: 기본 슬롯 수 / MAXTRANS: 최대 슬롯 수 설정'
                  : 'INITRANS: default slots / MAXTRANS: maximum slots'}
              </div>
            </div>
          </div>

          {/* ── Data Header ── */}
          <div className="bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded bg-slate-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">DATA HEADER</span>
              <span className="font-mono text-[10px] text-slate-500">
                {isKo ? '가변 크기 · 헤더 하단' : 'Variable size · below header'}
              </span>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 rounded border border-slate-300 bg-slate-100 px-3 py-1.5">
                <div className="font-mono text-[10px] font-bold text-slate-700">Table Directory</div>
                <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                  {isKo ? '이 블록에 데이터가 있는 테이블 목록' : 'Tables having rows in this block'}
                </div>
              </div>
              <div className="flex-1 rounded border border-slate-300 bg-slate-100 px-3 py-1.5">
                <div className="font-mono text-[10px] font-bold text-slate-700">Row Directory</div>
                <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                  {isKo ? '각 행의 블록 내 오프셋 포인터' : 'In-block offset pointer per row'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Free Space ── */}
          <div className="relative px-4 py-0">
            {/* PCTFREE band */}
            <div className="border-b border-dashed border-green-400 bg-green-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded bg-green-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">PCTFREE</span>
                  <span className="ml-2 font-mono text-[9px] text-green-700">
                    {isKo ? 'UPDATE 예약 공간 (기본 10%)' : 'Reserved for UPDATE growth (default 10%)'}
                  </span>
                </div>
                <span className="font-mono text-[9px] font-bold text-green-600">10%</span>
              </div>
              <div className="mt-1 font-mono text-[9px] text-green-600">
                {isKo
                  ? 'INSERT는 이 경계에 도달하면 이 블록에 더 이상 삽입하지 않음'
                  : 'INSERT stops adding to this block when free space hits this line'}
              </div>
            </div>
            {/* PCTUSED band */}
            <div className="border-b border-dashed border-yellow-400 bg-yellow-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded bg-yellow-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">PCTUSED</span>
                  <span className="ml-2 font-mono text-[9px] text-yellow-700">
                    {isKo ? 'Freelist 복귀 임계값 (기본 40%)' : 'Freelist re-entry threshold (default 40%)'}
                  </span>
                </div>
                <span className="font-mono text-[9px] font-bold text-yellow-600">40%</span>
              </div>
              <div className="mt-1 font-mono text-[9px] text-yellow-600">
                {isKo
                  ? 'DELETE 후 사용량이 이 값 이하가 되면 블록을 Freelist에 다시 등록'
                  : 'Block re-added to Freelist when used space falls below this after DELETE'}
              </div>
            </div>
          </div>

          {/* ── Row Data ── */}
          <div className="bg-orange-50 px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded bg-orange-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">ROW DATA</span>
              <span className="font-mono text-[10px] text-orange-600">
                {isKo ? '블록 하단에서 위로 ↑ 채워짐' : 'Fills upward ↑ from block bottom'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {['Row 3 (최신)', 'Row 2', 'Row 1 (최초 삽입)'].map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded border border-orange-200 bg-orange-100 px-3 py-1">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                    <div className="h-2 w-2 rounded-full bg-orange-300" />
                  </div>
                  <span className="font-mono text-[9px] text-orange-700">{isKo ? r : r.replace('최신', 'newest').replace('최초 삽입', 'first inserted')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: address arrows */}
        <div className="flex w-10 flex-col items-center justify-between bg-slate-50 py-3 border-l border-slate-200">
          <div className="flex flex-col items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <div className="h-full w-px bg-gradient-to-b from-blue-300 via-slate-300 to-orange-300 my-1" style={{ minHeight: 120 }} />
            <div className="h-2 w-2 rounded-full bg-orange-400" />
          </div>
        </div>
      </div>

      {/* Bottom label */}
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-1 border-t border-slate-200">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
          {isKo ? '▼ 하단 (높은 주소)' : '▼ Bottom (high address)'}
        </span>
      </div>
    </div>
  )
}

// Visual: Hierarchy diagram Block→Extent→Segment→Tablespace
function StorageHierarchyDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const labels = lang === 'ko'
    ? { ts: 'Tablespace', seg: 'Segment', ext: 'Extent', blk: 'Block', datafile: '데이터 파일 (.dbf)', rowLabel: 'Row' }
    : { ts: 'Tablespace', seg: 'Segment', ext: 'Extent', blk: 'Block', datafile: 'Data File (.dbf)', rowLabel: 'Row' }

  const blocks = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-5 shadow-sm">
      {/* Tablespace */}
      <div className="rounded-xl border-2 border-blue-400 bg-blue-50/60 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-blue-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">TS</span>
          <span className="font-mono text-xs font-bold text-blue-700">{labels.ts}</span>
          <span className="ml-auto font-mono text-[10px] text-blue-400">{labels.datafile}</span>
        </div>

        {/* Segment */}
        <div className="rounded-lg border-2 border-violet-400 bg-violet-50/60 p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-violet-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">SEG</span>
            <span className="font-mono text-xs font-bold text-violet-700">{labels.seg}</span>
            <span className="ml-auto font-mono text-[10px] text-violet-400">e.g. EMPLOYEES table</span>
          </div>

          <div className="flex gap-2">
            {/* Extent 1 */}
            <div className="flex-1 rounded-lg border-2 border-emerald-400 bg-emerald-50/60 p-2">
              <div className="mb-1.5 flex items-center gap-1">
                <span className="rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">EXT 1</span>
                <span className="font-mono text-[10px] font-semibold text-emerald-700">{labels.ext}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {blocks.slice(0, 4).map((b) => (
                  <div key={b} className="flex flex-col items-center rounded border border-orange-300 bg-orange-100 px-1 py-1.5">
                    <span className="font-mono text-[8px] font-bold text-orange-700">{labels.blk}</span>
                    <span className="font-mono text-[7px] text-orange-500">{b}</span>
                    <div className="mt-1 flex flex-col gap-0.5 w-full">
                      {[1,2,3].map(r => (
                        <div key={r} className="h-1 w-full rounded-sm bg-orange-300 opacity-70" title={labels.rowLabel} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extent 2 */}
            <div className="flex-1 rounded-lg border-2 border-emerald-400 bg-emerald-50/60 p-2">
              <div className="mb-1.5 flex items-center gap-1">
                <span className="rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">EXT 2</span>
                <span className="font-mono text-[10px] font-semibold text-emerald-700">{labels.ext}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {blocks.slice(4).map((b) => (
                  <div key={b} className="flex flex-col items-center rounded border border-orange-300 bg-orange-100 px-1 py-1.5">
                    <span className="font-mono text-[8px] font-bold text-orange-700">{labels.blk}</span>
                    <span className="font-mono text-[7px] text-orange-500">{b}</span>
                    <div className="mt-1 flex flex-col gap-0.5 w-full">
                      {[1,2].map(r => (
                        <div key={r} className="h-1 w-full rounded-sm bg-orange-300 opacity-70" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { color: 'bg-blue-500', label: labels.ts },
          { color: 'bg-violet-500', label: labels.seg },
          { color: 'bg-emerald-500', label: labels.ext },
          { color: 'bg-orange-400', label: labels.blk },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
            <span className="font-mono text-[10px] font-semibold text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Visual: INSERT space allocation flow
function InsertFlowDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const steps = lang === 'ko'
    ? [
        { icon: '🔢', label: 'INSERT 실행', desc: 'Row 저장 공간 필요' },
        { icon: '📁', label: 'Tablespace 확인', desc: '사용 가능한 Segment 탐색' },
        { icon: '📦', label: 'Segment → Extent', desc: '빈 Extent가 없으면 신규 할당' },
        { icon: '🧱', label: 'Extent → Block', desc: 'PCTFREE 이하 여유 블록 선택' },
        { icon: '✏', label: 'Block에 Row 기록', desc: 'Redo Log → Block 순서로 저장' },
      ]
    : [
        { icon: '🔢', label: 'INSERT Executes', desc: 'Row needs storage space' },
        { icon: '📁', label: 'Check Tablespace', desc: 'Find segment with available space' },
        { icon: '📦', label: 'Segment → Extent', desc: 'Allocate new Extent if none free' },
        { icon: '🧱', label: 'Extent → Block', desc: 'Find block with space below PCTFREE' },
        { icon: '✏', label: 'Write Row to Block', desc: 'Redo Log written first, then Block' },
      ]

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-50 text-sm">
              {s.icon}
            </div>
            {i < steps.length - 1 && <div className="mt-1 h-4 w-px bg-blue-200" />}
          </div>
          <div className="pt-1">
            <div className="font-mono text-xs font-bold text-slate-700">{s.label}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StorageSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = STORAGE_T[lang]

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <ChapterTitle icon="⚙" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.sectionTitle}</SectionTitle>
      <Prose>{t.sectionDesc}</Prose>

      {/* Hierarchy visual */}
      <SubTitle>{t.hierarchyLabel}</SubTitle>
      <StorageHierarchyDiagram lang={lang} />

      <Divider />

      {/* Two-column: Block + Extent */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Block */}
        <div>
          <SubTitle>{t.blockTitle}</SubTitle>
          <Prose>{t.blockDesc}</Prose>
          <BlockDiagram lang={lang} />
          <div className="mt-3">
            <Table headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']} rows={t.blockDetail} />
          </div>
          <InfoBox color="blue" icon="💡" title={lang === 'ko' ? 'Buffer Cache와의 관계' : 'Relationship with Buffer Cache'}>
            {t.blockNote}
          </InfoBox>
        </div>

        {/* Extent */}
        <div>
          <SubTitle>{t.extentTitle}</SubTitle>
          <Prose>{t.extentDesc}</Prose>

          {/* Extent visual */}
          <div className="mb-4 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              {lang === 'ko' ? 'Extent 내부 (연속 블록)' : 'Inside an Extent (contiguous blocks)'}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center justify-center rounded border border-orange-300 bg-orange-100 py-2.5"
                >
                  <span className="font-mono text-[9px] font-bold text-orange-700">B{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="h-px flex-1 bg-emerald-300" />
              <span className="font-mono text-[9px] text-emerald-600">
                {lang === 'ko' ? '연속된 블록 주소' : 'Contiguous block addresses'}
              </span>
              <div className="h-px flex-1 bg-emerald-300" />
            </div>
          </div>

          <Table headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']} rows={t.extentDetail} />
        </div>
      </div>

      <Divider />

      {/* Segment */}
      <SubTitle>{t.segmentTitle}</SubTitle>
      <Prose>{t.segmentDesc}</Prose>
      <ConceptGrid items={t.segmentTypes} />

      <Divider />

      {/* Tablespace */}
      <SubTitle>{t.tablespaceTitle}</SubTitle>
      <Prose>{t.tablespaceDesc}</Prose>

      {/* Tablespace → File visual */}
      <div className="mb-4 flex flex-col gap-2 overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row">
        {['SYSTEM', 'UNDO', 'TEMP', 'USERS'].map((ts, i) => (
          <div key={ts} className="flex-1 rounded-lg border border-blue-300 bg-white p-2 text-center shadow-sm">
            <div className="font-mono text-[10px] font-bold text-blue-700">{ts}</div>
            <div className="mt-1.5 flex flex-col gap-1">
              {Array.from({ length: i === 0 ? 2 : 1 }).map((_, j) => (
                <div key={j} className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-1">
                  <span className="text-[10px]">📄</span>
                  <span className="font-mono text-[9px] text-slate-500">{ts.toLowerCase()}{j + 1 > 1 ? `0${j+1}` : '01'}.dbf</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Table
        headers={[lang === 'ko' ? 'Tablespace' : 'Tablespace', lang === 'ko' ? '용도' : 'Purpose']}
        rows={t.tablespaceTable}
      />
      <InfoBox color="orange" icon="📁" title={lang === 'ko' ? '논리 vs 물리' : 'Logical vs Physical'}>
        {t.tablespaceNote}
      </InfoBox>

      <Divider />

      {/* INSERT flow */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <SubTitle>{t.flowTitle}</SubTitle>
          <Prose>{t.flowDesc}</Prose>
          <InsertFlowDiagram lang={lang} />
        </div>
        <div className="flex items-center">
          <InfoBox color="blue" icon="🔑" title={t.infoTitle}>
            {t.infoBody}
          </InfoBox>
        </div>
      </div>
    </div>
  )
}

// ── Overview ───────────────────────────────────────────────────────────────

function OverviewSection() {
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

// ── SGA ────────────────────────────────────────────────────────────────────

function SgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [tourIdx, setTourIdx] = useState<number | null>(null)

  const highlightIds: InstanceComponentId[] =
    tourIdx !== null
      ? t.sgaTour[tourIdx].ids
      : ['sga', 'library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer']

  return (
    <TwoColLayout
      map={
        <MapPanel
          title={t.mapTitle}
          highlightIds={highlightIds}
          callout={tourIdx !== null ? t.sgaTour[tourIdx].label : t.sgaCallout}
        />
      }
    >
      <SectionTitle>{t.sgaTitle}</SectionTitle>
      <Prose>{t.sgaDesc}</Prose>

      <TourPanel
        tour={t.sgaTour}
        activeIdx={tourIdx}
        onSelect={setTourIdx}
        accentColor="blue"
        exploreLabel={t.sgaExploreLabel}
        showAllLabel={t.showAll}
        lang={lang}
      />

      <Table headers={[t.tableHeaderComponent, t.tableHeaderRole]} rows={t.sgaComponents} />
      <InfoBox color="blue" icon="💡" title={t.sgaMemMgmtTitle}>{t.sgaInfo}</InfoBox>

      <Divider />
      <SubTitle>{t.bufferCacheTitle}</SubTitle>
      <BufferCacheFlow onHighlight={(id) => setTourIdx(id === 'buffer-cache' ? 2 : null)} />
    </TwoColLayout>
  )
}

// ── PGA ────────────────────────────────────────────────────────────────────

function PgaSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <TwoColLayout
      map={<MapPanel title={t.mapTitle} highlightIds={['server-process', 'pga']} callout={t.pgaCallout} />}
    >
      <SectionTitle>{t.pgaTitle}</SectionTitle>
      <Prose>{t.pgaDesc}</Prose>
      <ConceptGrid items={t.pgaItems} />
      <InfoBox color="emerald" icon="🔐" title={t.pgaSgaVsTitle}>{t.pgaSgaVsDesc}</InfoBox>
    </TwoColLayout>
  )
}

// ── Processes ──────────────────────────────────────────────────────────────

function ProcessesSection() {
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
        lang={lang}
      />

      <Table headers={[t.tableHeaderProcess, t.tableHeaderRole]} rows={t.processTable} />
      <InfoBox color="orange" icon="⚠" title={t.processWalTitle}>{t.processWalDesc}</InfoBox>
    </TwoColLayout>
  )
}

// ── Internals Simulator ────────────────────────────────────────────────────

type SimTab = 'simulator' | 'erd'

function InternalsSimulatorSection() {
  const optimizerResult    = useInternalsStore((s) => s.optimizerResult)
  const isComplete         = useInternalsStore((s) => s.isComplete)
  const highlightedStep    = useInternalsStore((s) => s.highlightedStep)
  const setHighlightedStep = useInternalsStore((s) => s.setHighlightedStep)
  const lang               = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeTab, setActiveTab] = useState<SimTab>('simulator')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b bg-muted/30">
        <div className="px-4 py-2.5">
          <h2 className="text-sm font-bold leading-none">{t.simTitle}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t.simDesc}</p>
        </div>
        <div className="ml-auto flex h-full shrink-0 items-stretch gap-px border-l pr-1">
          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              'flex items-center gap-1.5 px-4 font-mono text-xs font-semibold transition-colors',
              activeTab === 'simulator'
                ? 'border-b-2 border-foreground bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-[11px]">⚙</span>
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-4 font-mono text-xs font-semibold transition-colors',
              activeTab === 'erd'
                ? 'border-b-2 border-violet-500 bg-background text-violet-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-[11px]">⬡</span>
            Schema / ERD
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' ? (
            <motion.div
              key="simulator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full flex-col overflow-hidden"
            >
              {/* Top: OracleDiagram (70%) + Optimizer (right 30%) */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="min-h-0 overflow-hidden" style={{ width: '70%', flexShrink: 0 }}>
                  <OracleDiagram compact />
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l bg-card">
                  <div className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      CBO Optimizer
                    </span>
                    {optimizerResult && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        cost {optimizerResult.plan.totalCost.toFixed(1)} · {optimizerResult.plan.estimatedRows} rows
                      </span>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <OptimizerPanel result={optimizerResult} />
                  </div>
                </div>
              </div>

              {/* Bottom: SQL input (left 70%) + Log/Summary (right 30%) */}
              <div className="flex shrink-0 border-t" style={{ height: '220px' }}>
                <div className="flex min-h-0 flex-col overflow-hidden border-r" style={{ width: '70%', flexShrink: 0 }}>
                  <div className="shrink-0 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      SQL Input
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <QueryInput />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
                  <div className="shrink-0 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isComplete ? t.execSummary : t.liveLog}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <SummaryTimeline selectedStep={highlightedStep} onSelect={setHighlightedStep} />
                        </motion.div>
                      ) : (
                        <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                          <LiveLog />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="erd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <ErdPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── ERD Panel ──────────────────────────────────────────────────────────────

type ErdLeftView = 'schema' | 'data'

function ErdPanel() {
  const [selectedSchema, setSelectedSchema] = useState(SCHEMAS[0])
  const [leftView, setLeftView] = useState<ErdLeftView>('schema')
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null)
  const [panelWidth, setPanelWidth] = useState(288)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleSchemaChange = (s: typeof SCHEMAS[0]) => {
    setSelectedSchema(s)
    setSelectedTable(null)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      setPanelWidth(Math.min(520, Math.max(180, startWidth.current + e.clientX - startX.current)))
    }
    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="flex shrink-0 flex-col overflow-hidden bg-card" style={{ width: panelWidth }}>
        {/* Schema tabs */}
        <div className="flex shrink-0 border-b">
          {SCHEMAS.map((s) => (
            <button
              key={s.name}
              onClick={() => handleSchemaChange(s)}
              className={cn(
                'flex-1 py-2 font-mono text-xs font-semibold transition-colors',
                selectedSchema.name === s.name
                  ? 'border-b-2 border-violet-500 text-violet-600'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* View toggle: Schema / Data */}
        <div className="flex shrink-0 border-b">
          {(['schema', 'data'] as ErdLeftView[]).map((v) => (
            <button
              key={v}
              onClick={() => setLeftView(v)}
              className={cn(
                'flex-1 py-1.5 font-mono text-[11px] font-medium transition-colors',
                leftView === v
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'schema' ? 'Schema' : 'Table Data'}
            </button>
          ))}
        </div>

        {/* Table picker (only in Data view) */}
        {leftView === 'data' && (
          <div className="flex shrink-0 flex-wrap gap-1 border-b bg-muted/30 px-3 py-2">
            {selectedSchema.tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t)}
                className={cn(
                  'rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors',
                  selectedTable?.name === t.name
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {leftView === 'schema' && <SchemaView schema={selectedSchema} />}
          {leftView === 'data' && selectedTable && <TableView table={selectedTable} />}
          {leftView === 'data' && !selectedTable && (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              위에서 테이블을 선택하세요
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-violet-400 active:bg-violet-500"
      >
        <div className="absolute h-8 w-3 rounded-full bg-border transition-colors group-hover:bg-violet-400" />
      </div>

      {/* ERD diagram */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <SchemaDiagramView lockedSchema={selectedSchema.name} onSchemaChange={handleSchemaChange} />
      </div>
    </div>
  )
}

// ── Buffer Cache Flow ──────────────────────────────────────────────────────

function BufferCacheFlow({ onHighlight }: { onHighlight: (id: string | null) => void }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [active, setActive] = useState(0)

  const STEP_COLORS = ['bg-muted border-border', 'bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-300', 'bg-orange-50 border-orange-300']

  const handleClick = (i: number) => {
    setActive(i)
    const id = t.bufferSteps[i].id
    onHighlight(id === 'check' || id === 'hit' || id === 'miss' ? 'buffer-cache' : null)
  }

  return (
    <div className="mb-6 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap gap-2">
        {t.bufferSteps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleClick(i)}
            className={cn(
              'flex min-w-28 flex-1 flex-col gap-1 rounded-lg border p-3 text-left transition-all',
              STEP_COLORS[i],
              active === i ? 'shadow-sm ring-2 ring-blue-400 ring-offset-1' : 'opacity-60 hover:opacity-90'
            )}
          >
            <span className="font-mono text-[10px] font-bold">{s.label}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{s.desc}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          Step {active + 1}/{t.bufferSteps.length}: {t.bufferSteps[active].label}
          {['check', 'hit', 'miss'].includes(t.bufferSteps[active].id) && ` ${t.bufferStepHint}`}
        </span>
      </div>
    </div>
  )
}
