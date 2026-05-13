import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, Prose, InfoBox } from '../shared'
import { OracleInstanceMap } from './OracleInstanceMap'
import type { InstanceComponentId } from './OracleInstanceMap'
import { cn } from '@/lib/utils'

export { BufferCachePage } from './BufferCachePage'
export { UpdateFlowPage } from './UpdateFlowPage'

// ── Tour items ─────────────────────────────────────────────────────────────

type DetailRow = { termKo: string; termEn: string; descKo: string; descEn: string }

type TourEntry = {
  mapId: InstanceComponentId        // OracleInstanceMap에서 data-component-id와 1:1 대응
  highlightIds: InstanceComponentId[] // 다이어그램에서 하이라이트할 블록들
  labelKo: string
  labelEn: string
  titleKo: string
  titleEn: string
  descKo: string
  descEn: string
  details: DetailRow[]
  accentCls: string
  badgeCls: string
}

const TOUR: TourEntry[] = [
  {
    mapId: 'server-process',
    highlightIds: ['server-process'],
    labelKo: 'Server Process',
    labelEn: 'Server Process',
    titleKo: 'Server Process — 내 SQL을 대신 처리해 주는 대리인',
    titleEn: "Server Process — Your SQL's Personal Agent",
    descKo: '사용자가 SQL을 보내면 Oracle은 그 요청만을 전담하는 Server Process를 만듭니다. 마치 식당에서 나만 담당하는 웨이터가 배정되는 것처럼요. 이 프로세스가 SQL의 의미를 해석하고, 가장 빠른 실행 방법을 찾고, 실제로 데이터를 가져와 사용자에게 돌려줍니다.',
    descEn: 'When you send a SQL statement, Oracle creates a Server Process dedicated to your request — like a waiter assigned just to your table. It interprets your SQL, finds the fastest way to execute it, fetches the data, and returns the results.',
    details: [
      {
        termKo: 'Dedicated Server (전용 서버)',
        termEn: 'Dedicated Server',
        descKo: '연결 1개당 프로세스 1개가 배정됩니다. 가장 일반적인 방식으로, 프로세스가 항상 나만 담당하므로 응답이 빠릅니다. 단, 연결이 수천 개로 늘어나면 그만큼 프로세스도 많아져 메모리를 많이 씁니다.',
        descEn: 'One process is assigned per connection — the most common setup. Your process is always yours, so response is fast. The downside: thousands of connections mean thousands of processes, consuming a lot of memory.',
      },
      {
        termKo: 'Shared Server (공유 서버)',
        termEn: 'Shared Server',
        descKo: '여러 세션이 소수의 프로세스 풀을 돌아가며 씁니다. 연결 수가 매우 많지만 동시 작업은 적을 때 메모리를 절약할 수 있습니다. 단, 요청이 몰리면 대기가 생길 수 있습니다.',
        descEn: 'Multiple sessions share a small pool of processes in rotation. Saves memory when there are many connections but few simultaneous active requests. The trade-off: requests may queue when the pool is busy.',
      },
    ],
    accentCls: 'border-teal-200 bg-teal-50',
    badgeCls: 'bg-teal-500',
  },
  {
    mapId: 'pga',
    highlightIds: ['pga'],
    labelKo: 'PGA',
    labelEn: 'PGA',
    titleKo: 'PGA — 내 세션만 쓰는 개인 작업 공간',
    titleEn: 'PGA — Your Session\'s Private Workspace',
    descKo: 'Program Global Area. Server Process 하나에 독점적으로 할당되는 메모리입니다. 다른 세션과 절대 공유하지 않는 나만의 작업 공간입니다. SQL을 실행하는 동안 필요한 임시 계산 공간이 모두 여기에 들어갑니다.',
    descEn: 'Program Global Area — memory owned exclusively by one Server Process. It is your private workspace, never shared with other sessions. All temporary computation needed while your SQL runs happens here.',
    details: [
      {
        termKo: 'Sort Area (정렬 공간)',
        termEn: 'Sort Area',
        descKo: 'ORDER BY나 GROUP BY를 처리할 때 행들을 임시로 정렬하는 공간입니다. PGA가 충분하면 메모리에서 정렬이 끝나지만, 부족하면 디스크(Temp Tablespace)에 데이터를 썼다 읽는 작업이 발생해 쿼리가 급격히 느려집니다.',
        descEn: 'The space used to sort rows for ORDER BY or GROUP BY. If PGA is large enough, sorting stays in memory. If not, Oracle spills to disk (Temp Tablespace), which can make a query many times slower.',
      },
      {
        termKo: 'Hash Join Area (해시 조인 공간)',
        termEn: 'Hash Join Area',
        descKo: '두 테이블을 해시 조인으로 합칠 때, 작은 쪽 테이블을 메모리에 해시 테이블로 올려놓는 공간입니다. 이 공간이 부족하면 역시 디스크로 넘쳐 성능이 떨어집니다.',
        descEn: 'When joining two tables with a hash join, the smaller table is loaded into memory as a hash table here. If there is not enough room, it spills to disk and performance degrades.',
      },
      {
        termKo: 'Bind Variable 값',
        termEn: 'Bind Variable Values',
        descKo: 'SQL에서 ? 또는 :name 형태로 사용하는 바인드 변수의 실제 값을 세션별로 보관합니다. 바인드 변수를 쓰면 SQL 문장 자체는 바뀌지 않아 Library Cache에서 커서를 재사용할 수 있습니다.',
        descEn: 'Stores the actual values of bind variables (:name placeholders) per session. Using bind variables keeps the SQL text identical across executions, allowing the Library Cache to reuse the cursor.',
      },
      {
        termKo: 'Cursor State (커서 상태)',
        termEn: 'Cursor State',
        descKo: '커서란 SQL 실행의 현재 위치를 추적하는 포인터입니다. 예를 들어 SELECT 결과를 한 번에 모두 가져오지 않고 줄 단위로 읽을 때, "지금 몇 번째 행까지 읽었는지"를 여기에 기억해 둡니다.',
        descEn: 'A cursor is a pointer that tracks the current position in a SQL execution. For example, when fetching rows one at a time from a SELECT, this area remembers how far through the result set you have read.',
      },
    ],
    accentCls: 'border-teal-200 bg-teal-50',
    badgeCls: 'bg-teal-500',
  },
  {
    mapId: 'sga',
    highlightIds: ['sga', 'shared-pool', 'library-cache', 'dict-cache', 'buffer-cache', 'redo-buffer', 'undo'],
    labelKo: 'SGA',
    labelEn: 'SGA',
    titleKo: 'SGA — 모든 세션이 함께 쓰는 공용 메모리',
    titleEn: 'SGA — The Shared Memory Arena',
    descKo: 'System Global Area. Oracle 인스턴스가 시작될 때 운영체제로부터 한 번에 할당받는 공용 메모리 공간입니다. 모든 Server Process와 Background Process가 함께 이 메모리를 읽고 씁니다. PGA가 "나만 쓰는 방"이라면, SGA는 "모두가 쓰는 공용 라운지"입니다.',
    descEn: 'System Global Area — a large block of memory allocated from the OS when the Oracle instance starts. Every server and background process reads and writes this shared space. If PGA is your private room, SGA is the shared lounge everyone uses.',
    details: [
      {
        termKo: 'Shared Pool',
        termEn: 'Shared Pool',
        descKo: 'SQL을 처음 실행할 때 분석한 결과(파싱 트리·실행 계획)와 테이블·컬럼 구조 정보를 저장해 둡니다. 같은 SQL이 다시 오면 이 결과를 재사용해 분석 비용을 줄입니다.',
        descEn: 'Stores the results of analysing SQL (parse tree and execution plan) and table/column structure information. When the same SQL arrives again, these results are reused to avoid re-analysis.',
      },
      {
        termKo: 'Buffer Cache (버퍼 캐시)',
        termEn: 'Buffer Cache',
        descKo: '디스크에서 읽어 온 데이터 블록(Oracle이 데이터를 저장하는 최소 단위, 기본 8KB)을 메모리에 보관합니다. 같은 데이터를 다시 읽을 때 디스크 대신 여기서 꺼내면 수천 배 빠릅니다.',
        descEn: 'Keeps data blocks (Oracle\'s smallest storage unit, 8 KB by default) in memory after reading them from disk. Serving the same block from here instead of disk is thousands of times faster.',
      },
      {
        termKo: 'Redo Log Buffer (리두 로그 버퍼)',
        termEn: 'Redo Log Buffer',
        descKo: '데이터를 변경할 때마다 "무엇을 어떻게 바꿨는지"를 기록하는 임시 메모리 공간입니다. Background Process 인 LGWR 프로세스가 이것을 주기적으로 디스크의 Redo Log File에 내려씁니다.',
        descEn: 'A temporary memory area that records "what changed and how" each time data is modified. The LGWR process periodically flushes these records to the on-disk Redo Log Files.',
      },
      {
        termKo: 'Undo Segment (언두 세그먼트)',
        termEn: 'Undo Segment',
        descKo: 'UPDATE·DELETE 직전의 원본 값을 보관합니다. ROLLBACK 시 이 값으로 되돌리고, 다른 세션이 변경 이전 시점의 데이터를 읽어야 할 때도 이 값을 참조합니다.',
        descEn: 'Stores the original values of rows before UPDATE or DELETE. Used to revert changes on ROLLBACK, and to reconstruct an older data snapshot for other sessions that need to read a consistent view.',
      },
    ],
    accentCls: 'border-blue-200 bg-blue-50',
    badgeCls: 'bg-blue-500',
  },
  {
    mapId: 'shared-pool',
    highlightIds: ['shared-pool', 'library-cache', 'dict-cache'],
    labelKo: 'Shared Pool',
    labelEn: 'Shared Pool',
    titleKo: 'Shared Pool — SQL 분석 결과와 테이블 구조 정보의 캐시',
    titleEn: 'Shared Pool — Cache for SQL Analysis and Table Structure',
    descKo: 'SQL을 실행하려면 Oracle이 먼저 두 가지를 알아야 합니다. 첫째, "이 SQL의 의미는 무엇이고 어떻게 실행하면 가장 빠른가(파싱·최적화)". 둘째, "이 테이블에 어떤 컬럼이 있고 인덱스는 무엇인가(딕셔너리 조회)". Shared Pool은 이 두 결과를 캐시해 두어, 같은 SQL이 다시 올 때 분석을 처음부터 반복하지 않도록 합니다.',
    descEn: 'Before Oracle can run any SQL, it needs two things: first, "what does this SQL mean and what is the fastest execution plan?" (parsing and optimisation); second, "what columns and indexes does this table have?" (dictionary lookup). The Shared Pool caches both results so the same work is not repeated when the same SQL arrives again.',
    details: [
      {
        termKo: '파싱(Parsing)이란?',
        termEn: 'What is Parsing?',
        descKo: 'SQL 문장을 받으면 Oracle은 먼저 문법이 맞는지 확인하고, 테이블과 컬럼이 실제로 존재하는지 검사한 뒤, "어떤 순서로 테이블을 읽고 어떤 인덱스를 쓸지"를 결정합니다. 이 전체 과정을 파싱이라 합니다. 파싱 결과는 커서(Cursor)라는 객체로 Library Cache에 저장됩니다.',
        descEn: 'When Oracle receives a SQL statement, it checks syntax, verifies that tables and columns exist, then decides the access order and which indexes to use. This whole process is called parsing. The result is stored as a cursor object in the Library Cache.',
      },
      {
        termKo: 'Library Cache',
        termEn: 'Library Cache',
        descKo: '파싱이 끝난 커서(실행 계획 포함)를 저장해 둡니다. 완전히 같은 SQL이 다시 들어오면 파싱을 건너뛰고 저장된 커서를 재사용합니다(Soft Parse). 문자 하나라도 다르면 새로운 커서를 만들어야 합니다(Hard Parse). 그래서 바인드 변수(:id, :name)를 쓰면 값이 달라도 SQL 문장이 같아서 Soft Parse가 가능합니다.',
        descEn: 'Stores finished cursors (including execution plans). If the exact same SQL text arrives again, Oracle skips parsing and reuses the stored cursor (Soft Parse). Even one character difference forces a new cursor (Hard Parse). This is why bind variables (:id, :name) matter — the SQL text stays identical even when values change, enabling Soft Parse.',
      },
      {
        termKo: '딕셔너리(Dictionary)란?',
        termEn: 'What is the Dictionary?',
        descKo: 'Oracle이 관리하는 내부 메타데이터 저장소입니다. "EMPLOYEES 테이블에는 어떤 컬럼이 있는가", "이 사용자에게 어떤 권한이 있는가", "이 인덱스는 어느 컬럼에 걸려 있는가" 같은 정보가 모두 여기에 있습니다. 파싱 중에 Oracle이 수시로 조회하는 일종의 설계 도면입니다.',
        descEn: 'Oracle\'s internal metadata store. It answers questions like "what columns does EMPLOYEES have?", "what privileges does this user hold?", "which column is this index on?". Oracle consults it constantly during parsing — it is the blueprint of the entire database structure.',
      },
      {
        termKo: 'Dictionary Cache (Row Cache)',
        termEn: 'Dictionary Cache (Row Cache)',
        descKo: '딕셔너리는 사실 SYSTEM Tablespace의 디스크 파일에 저장되어 있습니다. SQL을 실행할 때마다 디스크에서 읽으면 너무 느리기 때문에, 자주 쓰는 딕셔너리 정보를 행(Row) 단위로 메모리에 올려 둔 것이 Dictionary Cache입니다. Row Cache라고도 부릅니다.',
        descEn: 'The dictionary itself lives on disk in the SYSTEM Tablespace. Reading it from disk on every SQL execution would be far too slow, so the Dictionary Cache (also called the Row Cache) keeps frequently used dictionary rows in memory for fast access.',
      },
    ],
    accentCls: 'border-indigo-200 bg-indigo-50',
    badgeCls: 'bg-indigo-500',
  },
  {
    mapId: 'dbwr',
    highlightIds: ['dbwr', 'lgwr', 'ckpt', 'smon', 'pmon', 'arcn'],
    labelKo: 'Background Processes',
    labelEn: 'Background Processes',
    titleKo: 'Background Processes — 눈에 보이지 않는 관리자들',
    titleEn: 'Background Processes — The Invisible Managers',
    descKo: 'Oracle 인스턴스가 켜지면 사용자 요청과 무관하게 백그라운드에서 자동으로 실행되는 시스템 프로세스들입니다. 이들이 없으면 메모리의 변경 내용이 디스크에 저장되지 않고, 서버가 꺼졌을 때 데이터를 복구할 수 없으며, 비정상 종료된 세션이 잠근 데이터가 풀리지 않습니다.',
    descEn: 'System processes that start automatically when the Oracle instance starts and run in the background independently of user requests. Without them, memory changes would never reach disk, crash recovery would be impossible, and locks held by dead sessions would never be released.',
    details: [
      {
        termKo: 'DBWn (Database Writer)',
        termEn: 'DBWn (Database Writer)',
        descKo: 'Buffer Cache에서 데이터를 변경하면 그 블록은 "더럽혀진(Dirty)" 상태가 됩니다. DBWn은 이 Dirty 블록들을 모아서 디스크의 데이터 파일(.dbf)에 실제로 씁니다. 변경할 때마다 바로 디스크에 쓰면 너무 느리기 때문에, DBWn이 적절한 시점에 모아서 처리합니다.',
        descEn: 'When data is modified in the Buffer Cache, the block becomes "dirty". DBWn collects these dirty blocks and writes them to the on-disk data files (.dbf). Writing to disk on every change would be too slow, so DBWn batches the writes at appropriate intervals.',
      },
      {
        termKo: 'LGWR (Log Writer)',
        termEn: 'LGWR (Log Writer)',
        descKo: 'Redo Log Buffer에 쌓인 변경 기록을 디스크의 Redo Log File에 내려씁니다. 중요한 점은 COMMIT을 실행하면 반드시 LGWR이 해당 변경 기록을 디스크에 써야 COMMIT이 완료됩니다. 이 덕분에 서버가 갑자기 꺼져도 커밋된 데이터는 복구할 수 있습니다.',
        descEn: 'Writes redo records from the Redo Log Buffer to the on-disk Redo Log Files. Critically, a COMMIT is not complete until LGWR has written the corresponding records to disk. This guarantees that committed data can always be recovered even after a crash.',
      },
      {
        termKo: 'CKPT (Checkpoint)',
        termEn: 'CKPT (Checkpoint)',
        descKo: '체크포인트란 "이 시점까지의 변경은 모두 디스크에 반영됐다"는 표시입니다. CKPT는 이 시점(SCN)을 컨트롤 파일에 기록합니다. 서버가 다시 켜질 때 이 시점 이후의 Redo만 재실행하면 되므로, 체크포인트가 자주 발생할수록 복구 시간이 짧아집니다.',
        descEn: 'A checkpoint marks the point up to which all changes have been written to disk. CKPT records this point (as an SCN) in the control file. On restart, Oracle only needs to re-apply redo from that point forward — so more frequent checkpoints mean faster recovery.',
      },
      {
        termKo: 'SMON (System Monitor)',
        termEn: 'SMON (System Monitor)',
        descKo: '서버가 비정상 종료된 뒤 다시 켜지면 SMON이 Redo Log를 읽어 커밋된 변경을 재적용하고(Instance Recovery), Undo로 미완료 트랜잭션을 롤백합니다. 또한 사용이 끝난 임시 세그먼트(정렬·조인 중 생긴 임시 공간)를 정리합니다.',
        descEn: 'When the server restarts after a crash, SMON reads the Redo Log to re-apply committed changes (Instance Recovery) and uses Undo to roll back uncommitted transactions. It also cleans up temporary segments left over from sort and join operations.',
      },
      {
        termKo: 'PMON (Process Monitor)',
        termEn: 'PMON (Process Monitor)',
        descKo: '사용자 세션이 네트워크 끊김 등으로 비정상 종료되면, 그 세션이 걸어 둔 락과 점유한 메모리가 그대로 남습니다. PMON은 이를 감지해 트랜잭션을 롤백하고 리소스를 해제합니다. 덕분에 다른 세션이 그 데이터를 다시 사용할 수 있게 됩니다.',
        descEn: 'When a user session terminates abnormally (e.g. a network drop), its locks and memory remain held. PMON detects this, rolls back the abandoned transaction, and releases all resources — allowing other sessions to access the data again.',
      },
      {
        termKo: 'ARCn (Archiver)',
        termEn: 'ARCn (Archiver)',
        descKo: 'Redo Log File은 순환하며 재사용됩니다. 재사용되기 전에 ARCn이 그 내용을 아카이브 로그로 복사해 둡니다. 아카이브 로그가 있으면 "3일 전 오전 9시 상태로 복원"처럼 특정 시점으로 되돌리는 Point-in-Time Recovery가 가능합니다. ARCHIVELOG 모드일 때만 동작합니다.',
        descEn: 'Redo Log Files are reused in rotation. Before a file is overwritten, ARCn copies its contents to an archive log. Having archive logs enables Point-in-Time Recovery — restoring the database to an exact past moment, such as "9 AM three days ago". ARCn only runs in ARCHIVELOG mode.',
      },
    ],
    accentCls: 'border-amber-200 bg-amber-50',
    badgeCls: 'bg-amber-500',
  },
  {
    mapId: 'disk',
    highlightIds: ['disk', 'redo-log-file', 'control-file', 'archive-log'],
    labelKo: 'Disk Storage',
    labelEn: 'Disk Storage',
    titleKo: 'Disk Storage — 전원이 꺼져도 남는 영구 저장소',
    titleEn: 'Disk Storage — Persistent Storage That Survives Power Loss',
    descKo: '메모리(SGA·PGA)는 전원이 끊기면 모든 내용이 사라집니다. 반면 디스크에 저장된 파일은 서버가 꺼졌다 켜져도 그대로 남습니다. Oracle의 모든 데이터는 결국 디스크 파일에 영구 기록되며, 이 파일들이 Oracle Database의 실체입니다.',
    descEn: 'Memory (SGA and PGA) loses all its content when power is cut. Disk files, however, survive a restart. Every piece of Oracle data is ultimately written to disk files — these files are the actual Oracle Database.',
    details: [
      {
        termKo: 'Data Files (.dbf) — 데이터 파일',
        termEn: 'Data Files (.dbf)',
        descKo: '테이블과 인덱스의 실제 데이터가 저장되는 파일입니다. Tablespace라는 논리적 단위 아래에 묶여 관리됩니다. 예를 들어 USERS Tablespace는 users01.dbf 파일로 구성될 수 있습니다. Buffer Cache는 이 파일의 내용을 메모리에 올려 빠르게 접근합니다.',
        descEn: 'The files where actual table and index data is stored. They are grouped under logical units called Tablespaces — for example, the USERS Tablespace might consist of a users01.dbf file. The Buffer Cache loads blocks from these files into memory for fast access.',
      },
      {
        termKo: 'Redo Log Files (.log) — 변경 기록 파일',
        termEn: 'Redo Log Files (.log)',
        descKo: '"무엇을 언제 어떻게 바꿨는지"를 기록한 파일입니다. 서버가 갑자기 꺼졌을 때 SMON이 이 파일을 읽어 커밋된 변경을 디스크에 다시 반영합니다(Instance Recovery). Redo Log는 최소 2개 그룹이 순환하며 재사용됩니다.',
        descEn: 'Records "what changed, when, and how". After a crash, SMON reads these files to re-apply committed changes to the data files (Instance Recovery). Redo Log files are organised in at least two groups that cycle in rotation.',
      },
      {
        termKo: 'Control File (.ctl) — 지도 파일',
        termEn: 'Control File (.ctl)',
        descKo: 'Oracle Database의 구조 정보를 담은 파일입니다. "데이터 파일이 어디 있는지", "마지막 체크포인트 SCN은 얼마인지", "DB 이름은 무엇인지" 등이 여기 있습니다. Oracle은 시작할 때 이 파일을 먼저 읽어 나머지 파일의 위치를 파악합니다. 손상되면 복구가 매우 어려워 여러 복사본을 유지하는 것이 권장됩니다.',
        descEn: 'The file that holds Oracle\'s structural information: where the data files are, the latest checkpoint SCN, the database name, and more. Oracle reads this file first on startup to locate everything else. Corruption is very hard to recover from, so keeping multiple copies is strongly recommended.',
      },
      {
        termKo: 'Archive Logs — 아카이브 로그',
        termEn: 'Archive Logs',
        descKo: 'Redo Log File이 꽉 차서 재사용되기 전에 ARCn이 복사해 둔 파일입니다. 최신 백업 + 아카이브 로그를 함께 쓰면 "며칠 전 특정 시각으로 복원"이 가능합니다. 운영 환경에서는 거의 항상 ARCHIVELOG 모드를 켜서 이 파일을 생성합니다.',
        descEn: 'Copies of Redo Log Files made by ARCn before they are overwritten. Combined with a recent backup, archive logs enable Point-in-Time Recovery — restoring the database to any specific past moment. Production databases are almost always run in ARCHIVELOG mode to generate these files.',
      },
    ],
    accentCls: 'border-slate-200 bg-slate-50',
    badgeCls: 'bg-slate-500',
  },
]

// ── Subtitle JSX ──────────────────────────────────────────────────────────

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
)
const Hi = ({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'amber' | 'teal' | 'orange' }) => {
  const cls = {
    blue:   'text-blue-600 font-semibold',
    amber:  'text-amber-600 font-semibold',
    teal:   'text-teal-600 font-semibold',
    orange: 'text-orange-600 font-semibold',
  }[color]
  return <span className={cls}>{children}</span>
}

const SUBTITLE_KO = (
  <div className="space-y-3">
    <p>
      <B>인덱스가 왜 빠른지</B>, <B>SQL 실행 계획이 어떻게 결정되는지</B>, <B>파티셔닝이 왜 I/O를 줄이는지</B> —
      이런 주제를 공부할 때 오라클 내부 구조가 머릿속에 그려져 있으면 훨씬 직관적으로 이해됩니다.
      구조 없이 외우면 단편적인 지식만 쌓이고, 새로운 상황에서 응용하기 어렵습니다.
      <Hi color="teal"> 이 챕터는 그 토대를 쌓기 위한 챕터입니다.</Hi>
    </p>
    <p>
      Oracle을 실행하면 두 가지가 함께 동작합니다.
      하나는 메모리와 프로세스로 이루어진 <Hi color="blue">Instance</Hi>이고,
      다른 하나는 디스크 위의 파일 묶음인 <Hi color="orange">Database</Hi>입니다.
    </p>
    <p>
      <Hi color="blue">Instance</Hi>란 Oracle이 살아 있는 동안만 존재하는 <B>"실행 중인 상태"</B>입니다.
      서버를 끄면 사라지지만, 디스크의 파일(<Hi color="orange">Database</Hi>)은 그대로 남습니다.
      다시 켜면 새 Instance가 같은 파일을 마운트해 이어 달립니다.
    </p>
    <p>
      <Hi color="blue">메모리(SGA·PGA)</Hi>는 CPU가 직접 읽고 쓸 수 있어 <B>수 나노초 단위로 빠르지만</B>,
      전원이 끊기면 내용이 사라집니다.
      <Hi color="orange"> 디스크</Hi>는 전원이 꺼져도 데이터가 유지되지만 <B>메모리보다 수천 배 느립니다</B>.
      Oracle의 핵심 설계 목표는 자주 쓰는 데이터를 메모리에 올려 두고(<Hi color="blue">Buffer Cache</Hi>),
      변경 이력을 먼저 로그로 남겨(<Hi color="amber">Redo</Hi>) 디스크 접근을 최소화하는 것입니다.
    </p>
    <div className="mt-5" />
  </div>
)

const SUBTITLE_EN = (
  <div className="space-y-3">
    <p>
      <B>Why is an index fast?</B> <B>How does Oracle decide an execution plan?</B> <B>Why does partitioning reduce I/O?</B>{' '}
      These questions become much easier to answer once you have Oracle's internal structure in your head.
      Without that mental model, knowledge stays fragmented and hard to apply in new situations.
      <Hi color="teal"> This chapter builds that foundation.</Hi>
    </p>
    <p>
      When Oracle runs, two things operate together:
      the <Hi color="blue">Instance</Hi> (memory structures + processes) and
      the <Hi color="orange">Database</Hi> (the set of files on disk).
    </p>
    <p>
      The <Hi color="blue">Instance</Hi> is the <B>"live, running state"</B> that exists only while Oracle is up.
      Shut the server down and the Instance disappears — but the files on disk (<Hi color="orange">Database</Hi>) remain.
      When you restart, a new Instance mounts those same files and picks up where it left off.
    </p>
    <p>
      <Hi color="blue">Memory (SGA &amp; PGA)</Hi> can be read and written by the CPU <B>in nanoseconds</B>,
      but its contents vanish when power is cut.
      <Hi color="orange"> Disk</Hi> survives a power loss, but is <B>thousands of times slower</B>.
      Oracle's core design goal is to keep frequently-used data in memory (<Hi color="blue">Buffer Cache</Hi>)
      and record changes as a log first (<Hi color="amber">Redo</Hi>), so that slow disk I/O is minimised.
    </p>
    <div className="mt-5" />
  </div>
)

// ── Strings ────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: '오라클의 내부 구조',
    subtitle: SUBTITLE_KO,
    clickHint: '구성 요소를 클릭하세요',
  },
  en: {
    title: 'Oracle Internal Structure',
    subtitle: SUBTITLE_EN,
    clickHint: 'Click a component',
  },
}

// 클릭 가능한 6개 영역 — mapId와 1:1 대응
const CLICKABLE_IDS: InstanceComponentId[] = [
  'server-process', 'pga', 'sga', 'shared-pool', 'dbwr', 'disk',
]

// ── OverviewSection ────────────────────────────────────────────────────────

export function OverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const active = activeIdx !== null ? TOUR[activeIdx] : null

  function handleSelect(id: InstanceComponentId) {
    const idx = TOUR.findIndex((item) => item.mapId === id)
    if (idx !== -1) setActiveIdx((prev) => (prev === idx ? null : idx))
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle title={t.title} subtitle={t.subtitle} />

      {/* ── Map: full width ── */}
      <div className="mt-8">
        <ClickableMap
          activeIds={active?.highlightIds ?? []}
          onSelect={handleSelect}
        />
      </div>

      {/* ── Detail card: below map ── */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={cn('rounded-xl border-2 overflow-hidden', active.accentCls)}
            >
              {/* 헤더 */}
              <div className={cn('flex items-center gap-2.5 px-5 py-3 border-b border-black/5', active.accentCls)}>
                <span className={cn('rounded px-2.5 py-0.5 font-mono text-xs font-bold text-white', active.badgeCls)}>
                  {lang === 'ko' ? active.labelKo : active.labelEn}
                </span>
                <span className="text-sm font-bold text-foreground/90">
                  {lang === 'ko' ? active.titleKo : active.titleEn}
                </span>
              </div>
              {/* 개요 */}
              <div className="px-5 py-3 border-b border-black/5">
                <Prose>{lang === 'ko' ? active.descKo : active.descEn}</Prose>
              </div>
              {/* 세부 항목 테이블 */}
              {active.details.length > 0 && (
                <div className="flex flex-col divide-y divide-black/5">
                  {active.details.map((row, i) => (
                    <div key={i} className="grid grid-cols-[200px_1fr] text-xs">
                      <div className="flex items-center border-r border-black/5 bg-black/[0.03] px-4 py-2.5">
                        <span className="font-mono font-bold text-slate-600">
                          {lang === 'ko' ? row.termKo : row.termEn}
                        </span>
                      </div>
                      <div className="flex items-center px-4 py-2.5">
                        <span className="leading-snug text-muted-foreground">
                          {lang === 'ko' ? row.descKo : row.descEn}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-border"
            >
              <span className="font-mono text-sm text-muted-foreground">↑ {t.clickHint}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Cursor란? ── */}
      <div className="mt-10">
        <InfoBox variant="note">
          {lang === 'ko' ? (
            <>
              <strong>커서(Cursor)란?</strong>
              <br />
              Oracle이 SQL 실행 상태를 추적하기 위해 메모리(PGA)에 만드는 객체입니다. SQL을 파싱하면 커서가 생성되고, 그 안에 실행 계획과 바인드 변수, 현재까지 읽은 위치 등이 담깁니다.
              <br /><br />
              같은 SQL이 다시 실행되면 Oracle은 Library Cache에서 <strong>공유 커서(Shared Cursor)</strong>를 찾아 파싱을 건너뜁니다. 커서의 라이프사이클은 세 단계입니다: <strong>OPEN</strong>(커서 생성·SQL 파싱) → <strong>FETCH</strong>(행 단위 데이터 읽기) → <strong>CLOSE</strong>(커서 반환·자원 해제).
            </>
          ) : (
            <>
              <strong>What is a Cursor?</strong>
              <br />
              A cursor is an object Oracle creates in the PGA to track SQL execution state. When a SQL statement is parsed, a cursor is opened to hold the execution plan, bind variables, and the current read position.
              <br /><br />
              When the same SQL runs again, Oracle looks for a <strong>shared cursor</strong> in the Library Cache to skip re-parsing. The cursor lifecycle has three phases: <strong>OPEN</strong> (create cursor, parse SQL) → <strong>FETCH</strong> (read rows one at a time) → <strong>CLOSE</strong> (release cursor and resources).
            </>
          )}
        </InfoBox>
      </div>
    </div>
  )
}

// ── ClickableMap ───────────────────────────────────────────────────────────

function ClickableMap({
  activeIds,
  onSelect,
}: {
  activeIds: InstanceComponentId[]
  onSelect: (id: InstanceComponentId) => void
}) {
  const lang = useSimulationStore((s) => s.lang)

  return (
    <div className="w-full">
      <h3 className="mb-3 text-sm font-bold text-foreground/90">
        {lang === 'ko' ? '오라클 데이터베이스 내부구조' : 'Oracle Database Internal Structure'}
      </h3>
      <div
        className="relative"
        onClick={(e) => {
          let el = e.target as HTMLElement | null
          while (el && el !== e.currentTarget) {
            const id = el.getAttribute('data-component-id')
            if (id && CLICKABLE_IDS.includes(id as InstanceComponentId)) {
              onSelect(id as InstanceComponentId)
              return
            }
            el = el.parentElement
          }
        }}
      >
        <OracleInstanceMap
          highlightIds={activeIds}
          callout={lang === 'ko' ? '각 영역을 클릭해보세요' : 'Click each area to explore'}
          horizontal
        />
      </div>
    </div>
  )
}
