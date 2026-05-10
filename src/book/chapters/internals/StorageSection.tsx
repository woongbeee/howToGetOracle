import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  ChapterTitle, Prose,
  InfoBox, Table, ConceptGrid, WipBanner, AccordionSection,
} from '../shared'
import { cn } from '@/lib/utils'
import { IconCube, IconArrowDown, IconArrowUp } from '@tabler/icons-react'


// ── Bilingual strings ──────────────────────────────────────────────────────

const STORAGE_T = {
  ko: {
    sectionTitle: '데이터 저장 구조',
    sectionDesc: 'Oracle은 데이터를 Block → Extent → Segment → Tablespace의 4계층 구조로 관리합니다.\n\n논리적 단위란 Oracle이 데이터를 다루는 방식을 설명하는 개념적 구분입니다. "이 테이블은 하나의 Segment", "이 Segment는 3개의 Extent로 구성"처럼 DBA와 Oracle 엔진이 공간을 인식하고 관리하는 단위입니다.\n\n물리적 단위란 운영체제 파일 시스템 위에 실제로 존재하는 것입니다. Oracle의 모든 데이터는 결국 디스크의 .dbf 파일(데이터 파일)에 바이트로 기록됩니다. 논리 계층은 이 물리 파일 위에 Oracle이 씌운 추상화 계층으로, 파일이 몇 개인지·어느 디렉터리에 있는지와 무관하게 일관된 방식으로 공간을 관리할 수 있게 해줍니다.',

    blockTitle: 'Block — 최소 I/O 단위',

    extentTitle: 'Extent — 연속 블록의 묶음',
    extentDesc: '논리적으로 연속된 Block들의 집합입니다. Segment에 공간을 할당할 때 Extent 단위로 묶어서 할당합니다. 연속 배치로 Sequential I/O 성능을 높입니다.',
    extentDetail: [
      ['할당 단위', '공간 부족 시 Extent 단위로 추가 할당'],
      ['INITIAL', '세그먼트 생성 시 첫 번째로 할당되는 Extent 크기'],
      ['Locally Managed', 'Extent 할당 정보를 Tablespace 비트맵으로 관리 (권장)'],
    ],

    segmentTitle: 'Segment — 오브젝트 저장 공간',
    segmentDesc: '하나의 데이터베이스 오브젝트(테이블, 인덱스 등)가 사용하는 Extent 집합입니다. 테이블 하나 = 하나의 Segment (파티션 테이블은 파티션당 하나).',
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

    infoTitle: '핵심 정리',
    infoBody: 'Block이 I/O의 기본 단위이고, Extent가 할당의 기본 단위이며, Segment가 오브젝트와 1:1 대응하고, Tablespace가 DBA 관리의 논리 단위입니다.',
  },
  en: {
    sectionTitle: 'Data Storage Structure',
    sectionDesc: 'Oracle organizes data in a 4-tier hierarchy: Block → Extent → Segment → Tablespace.\n\nA logical unit is a conceptual grouping that describes how Oracle thinks about and manages data — "this table is one Segment", "this Segment spans three Extents". It exists in Oracle\'s internal bookkeeping, not on disk.\n\nA physical unit is what actually exists on the file system. All Oracle data ultimately lands as bytes inside .dbf data files on disk. The logical tiers are an abstraction layer Oracle places on top of those files, letting it manage space consistently regardless of how many files exist or where they live.',

    blockTitle: 'Block — Smallest I/O Unit',

    extentTitle: 'Extent — Group of Contiguous Blocks',
    extentDesc: 'A logically contiguous set of Blocks. Space is allocated to segments in Extent units. Contiguous block placement improves sequential I/O performance.',
    extentDetail: [
      ['Allocation Unit', 'When a segment runs out of space, another Extent is allocated.'],
      ['INITIAL', 'Size of the first Extent allocated when a segment is created.'],
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

    infoTitle: 'Key Takeaway',
    infoBody: 'Block is the I/O unit. Extent is the allocation unit. Segment maps 1:1 to a database object. Tablespace is the DBA\'s logical management unit.',
  },
}

// ── HierarchyOverview ──────────────────────────────────────────────────────
// upTo controls how many layers to show (innermost first):
//   'block'      → Block only
//   'extent'     → Extent + Block
//   'segment'    → Segment + Extent + Block
//   'tablespace' → Tablespace + Segment + Extent + Block (full)

type HierarchyLevel = 'block' | 'extent' | 'segment' | 'tablespace'

const LEVEL_RANK: Record<HierarchyLevel, number> = {
  block: 1,
  extent: 2,
  segment: 3,
  tablespace: 4,
}

function HierarchyOverview({ upTo }: { upTo: HierarchyLevel }) {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const rank = LEVEL_RANK[upTo]

  // Block-only view: 단일 블록의 내부 구조 (Header / ITL / Data / Free)
  if (rank === 1) {
    return (
      <div className="overflow-hidden rounded-xl border border-orange-300 bg-orange-50 shadow-sm">
        <div className="flex items-center gap-2 border-b border-orange-200 bg-orange-100 px-4 py-2">
          <span className="rounded bg-orange-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">BLOCK</span>
          <span className="font-mono text-[11px] text-orange-700">
            {isKo ? '단일 블록 내부 구조 (기본 8 KB)' : 'Single block layout (default 8 KB)'}
          </span>
        </div>
        <div className="flex h-24 divide-x divide-orange-200">
          {[
            { label: 'Header', sub: isKo ? '타입·DBA·SCN' : 'type·DBA·SCN', w: 'w-[18%]', bg: 'bg-blue-50', text: 'text-blue-600' },
            { label: 'ITL', sub: isKo ? '트랜잭션 슬롯' : 'tx slots', w: 'w-[16%]', bg: 'bg-indigo-50', text: 'text-indigo-600' },
            { label: 'Row Data', sub: isKo ? '실제 행 데이터 ↑' : 'row data ↑', w: 'flex-1', bg: 'bg-orange-50', text: 'text-orange-600' },
            { label: 'Free', sub: 'PCTFREE', w: 'w-[18%]', bg: 'bg-green-50', text: 'text-green-600' },
          ].map((col) => (
            <div key={col.label} className={`${col.w} ${col.bg} flex flex-col items-center justify-center gap-0.5 px-1`}>
              <span className={`font-mono text-[9px] font-bold ${col.text}`}>{col.label}</span>
              <span className="text-center font-mono text-[7px] text-slate-400 leading-tight">{col.sub}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Extent + Block: 연속된 블록들의 묶음
  const blockStrip = (
    <div className="flex gap-0.5">
      {Array.from({ length: 6 }).map((_, bi) => (
        <div
          key={bi}
          className="flex flex-1 flex-col items-center rounded border border-orange-200 bg-orange-100 py-1"
        >
          <span className="font-mono text-[7px] font-bold text-orange-600">B{bi + 1}</span>
        </div>
      ))}
    </div>
  )

  const extentContent = (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-emerald-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">EXTENT</span>
        <span className="font-mono text-[11px] text-emerald-700">
          {isKo ? '연속 Block들의 묶음 — 할당의 기본 단위' : 'Group of contiguous Blocks — allocation unit'}
        </span>
      </div>
      <div className="ml-3 flex gap-2">
        {['Extent 1', 'Extent 2', 'Extent 3'].map((ext) => (
          <div key={ext} className="flex-1 rounded-lg border border-emerald-200 bg-white p-2">
            <div className="mb-1.5">
              <span className="rounded bg-emerald-400 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                {ext.toUpperCase()}
              </span>
            </div>
            {blockStrip}
          </div>
        ))}
      </div>
      <div className="ml-3 mt-1.5 flex items-center gap-1">
        <span className="rounded bg-orange-400 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">BLOCK</span>
        <span className="font-mono text-[10px] text-orange-700">
          {isKo ? '최소 I/O 단위 (기본 8KB)' : 'Smallest I/O unit (default 8KB)'}
        </span>
      </div>
    </div>
  )

  if (rank === 2) return extentContent

  // Segment + Extent + Block
  const segmentContent = (
    <div className="rounded-xl border border-violet-300 bg-violet-50 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-violet-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">SEGMENT</span>
        <span className="font-mono text-[11px] text-violet-700">
          {isKo ? '오브젝트 1개 (테이블·인덱스 등) = Segment 1개' : 'One object (table/index/etc.) = one Segment'}
        </span>
      </div>
      <div className="ml-3">{extentContent}</div>
    </div>
  )

  if (rank === 3) return segmentContent

  // Tablespace + Segment + Extent + Block (full)
  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-blue-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">TABLESPACE</span>
        <span className="font-mono text-[11px] text-blue-700">
          {isKo ? '논리적 저장 컨테이너 — 하나 이상의 .dbf 파일' : 'Logical storage container — one or more .dbf files'}
        </span>
      </div>
      <div className="ml-3">{segmentContent}</div>
    </div>
  )
}

// ── BlockDiagram ───────────────────────────────────────────────────────────

type BlockZoneId = 'header' | 'itl' | 'directory' | 'free' | 'rowdata'

type BlockZoneDef = {
  id: BlockZoneId
  labelKo: string
  labelEn: string
  badgeColor: string   // bg-* for the badge pill
  zoneBg: string       // bg-* for the zone row (unselected)
  activeRing: string   // ring-* for selected zone
  titleKo: string
  titleEn: string
  descKo: string
  descEn: string
  rows: { termKo: string; termEn: string; descKo: string; descEn: string }[]
}

const BLOCK_ZONES: BlockZoneDef[] = [
  {
    id: 'header',
    labelKo: 'Common Header',
    labelEn: 'Common Header',
    badgeColor: 'bg-blue-500',
    zoneBg: 'bg-blue-50',
    activeRing: 'ring-2 ring-blue-400',
    titleKo: 'Common Header (캐시 계층)',
    titleEn: 'Common Header (Cache Layer)',
    descKo: '"캐시 계층"이라 불리는 이유는 이 헤더가 디스크가 아닌 Buffer Cache(메모리) 안에서만 유지되는 정보를 담기 때문입니다. 블록이 디스크에서 메모리로 올라오면 Oracle이 이 영역을 채우고, 블록이 다시 디스크로 내려갈 때는 일부 필드가 제거됩니다.',
    descEn: 'Called the "cache layer" because this header holds fields maintained only while the block lives in the Buffer Cache (memory). Oracle fills it when a block is read from disk and strips some fields when it is written back.',
    rows: [
      { termKo: 'Block Type', termEn: 'Block Type', descKo: '블록 종류 식별자 (데이터·인덱스·언두 등)', descEn: 'Identifies data / index / undo block type' },
      { termKo: 'DBA', termEn: 'DBA', descKo: 'Data Block Address — 이 블록이 디스크의 어느 위치에 있는지 나타내는 주소. 파일 번호 + 블록 번호로 구성됩니다.', descEn: 'Data Block Address — the on-disk location of this block, expressed as file# + block#.' },
      { termKo: 'SCN', termEn: 'SCN', descKo: 'System Change Number. Oracle이 커밋이나 주요 변경마다 전역으로 증가시키는 논리 시계(숫자). 이 블록이 마지막으로 변경된 시점의 SCN이 기록되어, 복구·Read Consistency 판단에 쓰입니다.', descEn: 'System Change Number — a global logical clock Oracle increments on every commit or key change. The SCN recorded here marks when this block was last written, used for recovery and Read Consistency.' },
      { termKo: 'Checksum', termEn: 'Checksum', descKo: '블록 전체 바이트를 특정 알고리즘으로 계산한 검증값. 블록을 디스크에서 읽을 때 다시 계산해 저장된 값과 비교하여, 디스크 오류·비트 손상을 감지합니다. DB_BLOCK_CHECKSUM 파라미터로 활성화합니다.', descEn: 'A value computed over all bytes in the block. On every read from disk, Oracle recomputes and compares it to detect disk errors or bit corruption. Enabled via DB_BLOCK_CHECKSUM.' },
    ],
  },
  {
    id: 'itl',
    labelKo: 'ITL',
    labelEn: 'ITL',
    badgeColor: 'bg-indigo-500',
    zoneBg: 'bg-indigo-50',
    activeRing: 'ring-2 ring-indigo-400',
    titleKo: 'ITL — Interested Transaction List',
    titleEn: 'ITL — Interested Transaction List',
    descKo: '이 블록을 동시에 수정 중인 트랜잭션 슬롯 목록. INITRANS 수만큼 미리 확보하고, 부족하면 Free Space에서 동적 확장합니다.',
    descEn: 'Slots tracking concurrent transactions modifying this block. Pre-allocated by INITRANS; expands into Free Space when needed.',
    rows: [
      { termKo: 'XID', termEn: 'XID', descKo: 'Transaction ID — Undo Seg# · Slot# · Seq# 세 숫자의 조합으로 트랜잭션을 고유하게 식별합니다.', descEn: 'Transaction ID — a three-part key (Undo Seg# · Slot# · Seq#) that uniquely identifies a transaction.' },
      { termKo: 'UBA', termEn: 'UBA', descKo: 'Undo Block Address — 이 트랜잭션이 변경하기 전의 데이터(이전 이미지)가 기록된 Undo 블록의 디스크 주소. 이전 이미지란 UPDATE·DELETE 직전에 Oracle이 Undo Segment에 복사해 둔 원본 값으로, ROLLBACK 시 이 값으로 되돌리고, 다른 세션이 이전 시점의 데이터를 읽을 때(Read Consistency)도 이 값을 참조합니다.', descEn: 'Undo Block Address — the on-disk address of the Undo block that holds the before-image for this transaction. A before-image is the original column value Oracle copies into the Undo Segment just before an UPDATE or DELETE. It is used to revert the row on ROLLBACK, and by other sessions that need to read an older consistent snapshot (Read Consistency).' },
      { termKo: 'Flag', termEn: 'Flag', descKo: 'C = 커밋됨 / U = 행에 잠금 중 / T = 활성 트랜잭션 진행 중', descEn: 'C = committed / U = row locked / T = active transaction in progress' },
      { termKo: 'INITRANS', termEn: 'INITRANS', descKo: '블록 생성 시 ITL 슬롯을 미리 확보하는 수. 기본값은 테이블 1, 인덱스 2. 슬롯이 부족하면 Free Space를 잠식해 동적으로 늘어납니다.', descEn: 'Number of ITL slots pre-allocated when the block is created. Default: 1 for tables, 2 for indexes. If all slots are full, Oracle carves new ones from Free Space.' },
      { termKo: 'MAXTRANS', termEn: 'MAXTRANS', descKo: '한 블록에서 동시에 활성화할 수 있는 ITL 슬롯의 상한. Oracle 10g 이후에는 사실상 255로 고정되어 사용자가 제어할 수 없습니다. INITRANS와 달리 MAXTRANS를 DDL로 지정해도 무시됩니다.', descEn: 'Upper bound on the number of active ITL slots in a block. Since Oracle 10g it is effectively fixed at 255 and cannot be controlled by the user. Unlike INITRANS, any MAXTRANS value set via DDL is silently ignored.' },
    ],
  },
  {
    id: 'directory',
    labelKo: 'Row Directory',
    labelEn: 'Row Directory',
    badgeColor: 'bg-slate-500',
    zoneBg: 'bg-slate-50',
    activeRing: 'ring-2 ring-slate-400',
    titleKo: 'Table / Row Directory',
    titleEn: 'Table / Row Directory',
    descKo: '블록 내 각 행의 위치(바이트 오프셋)를 담은 포인터 배열. ROWID 접근 시 이 배열로 O(1)에 해당 행으로 점프합니다.',
    descEn: 'Pointer array holding the byte offset of each row. ROWID access jumps to the row in O(1) via this directory.',
    rows: [
      { termKo: 'Row #N offset', termEn: 'Row #N offset', descKo: 'N번 행의 블록 내 바이트 오프셋 (ROWID slot# = 배열 인덱스)', descEn: 'Byte offset of row N inside the block (ROWID slot# = array index)' },
      { termKo: 'DELETE 후', termEn: 'After DELETE', descKo: '슬롯은 0xFFFF로 표시 → 재사용될 때까지 유지', descEn: 'Slot is marked 0xFFFF until reused by a new insert' },
    ],
  },
  {
    id: 'free',
    labelKo: 'Free Space',
    labelEn: 'Free Space',
    badgeColor: 'bg-green-500',
    zoneBg: 'bg-green-50',
    activeRing: 'ring-2 ring-green-400',
    titleKo: 'Free Space — PCTFREE 예약 구간',
    titleEn: 'Free Space — PCTFREE Reserved Zone',
    descKo: 'INSERT 상한선(PCTFREE, 기본 10%)을 지키기 위해 비워 두는 구간. UPDATE 시 가변 컬럼이 늘어나는 공간이 됩니다. 위에서 내려오는 Directory와 아래에서 올라오는 Row Data 사이에 위치합니다.',
    descEn: 'Reserved space to honor PCTFREE (default 10%). Used for in-place UPDATE growth. Located between the downward-growing Directory and the upward-growing Row Data.',
    rows: [
      { termKo: 'PCTFREE', termEn: 'PCTFREE', descKo: 'INSERT 상한선 — 여유 공간이 이 비율 이하로 줄면 새 INSERT 금지', descEn: 'INSERT cutoff — new INSERTs blocked once free space drops below this %' },
      { termKo: 'PCTUSED', termEn: 'PCTUSED', descKo: 'Freelist 재진입 하한선 — 이 값 아래로 떨어지면 블록을 Freelist에 재등록', descEn: 'Freelist re-entry floor — block is re-added to Freelist when used% drops below this' },
      { termKo: 'Row Migration', termEn: 'Row Migration', descKo: 'PCTFREE 부족으로 UPDATE 제자리 저장 불가 → 다른 블록으로 이동 + 포인터 남김 → 추가 I/O', descEn: 'UPDATE can\'t fit in place → row moves to another block, forwarding pointer left → extra I/O' },
      { termKo: 'Row Chaining', termEn: 'Row Chaining', descKo: '행 자체가 블록보다 커서 여러 블록에 걸쳐 저장 (LOB 등)', descEn: 'Row larger than one block → stored across multiple blocks (LOB, wide rows)' },
    ],
  },
  {
    id: 'rowdata',
    labelKo: 'Row Data',
    labelEn: 'Row Data',
    badgeColor: 'bg-orange-500',
    zoneBg: 'bg-orange-50',
    activeRing: 'ring-2 ring-orange-400',
    titleKo: 'Row Data',
    titleEn: 'Row Data',
    descKo: '실제 행 데이터가 저장되는 영역. 블록의 끝(높은 주소)에서 위쪽으로 쌓입니다. 새 행이 INSERT 될수록 Free Space를 잠식하며 올라옵니다.',
    descEn: 'Actual row data, growing upward from the bottom (high address) of the block. Each new INSERT consumes Free Space from below.',
    rows: [
      { termKo: 'Row Header', termEn: 'Row Header', descKo: '행 플래그(삭제·마이그레이션 여부), 컬럼 수, 락 바이트 (2~3 bytes)', descEn: 'Row flags (deleted/migrated), column count, lock byte (2–3 bytes)' },
      { termKo: 'Column Data', termEn: 'Column Data', descKo: '컬럼 길이(1 byte) + 실제 데이터. NULL은 0xFF 1바이트', descEn: 'Length byte + column value. NULL stored as 0xFF (1 byte)' },
      { termKo: 'VARCHAR2', termEn: 'VARCHAR2', descKo: '길이 prefix + 문자 데이터 (가변 길이 저장)', descEn: 'Length prefix + character data (variable-length storage)' },
    ],
  },
]

function BlockDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const [active, setActive] = useState<BlockZoneId>('itl')
  const isKo = lang === 'ko'
  const activeZone = BLOCK_ZONES.find((z) => z.id === active)!

  // 이미지 구조:
  // [데이터 블록 헤더{ 캐시 계층(header), 트랜잭션 계층(itl) }]
  // [데이터 헤더{ 테이블 디렉토리, 행 디렉토리(directory) }]
  // [데이터 계층{ 사용 가능한 공간(free) ↕, Row Data(rowdata) }]

  const blockRows: { id: BlockZoneId; labelKo: string; labelEn: string }[] = [
    { id: 'header',    labelKo: '캐시 계층',                      labelEn: 'Cache Layer' },
    { id: 'itl',       labelKo: '트랜잭션 계층',                  labelEn: 'Transaction Layer' },
    { id: 'directory', labelKo: '테이블 / 행 디렉토리',  labelEn: 'Table Dir / Row Dir' },
  ]

  const ROW_H = 48 // header, itl, directory 각각 높이(px)

  return (
    <div className="flex flex-col gap-6">
      {/* ── 타이틀 — 블록 시각과 정렬 맞춤 ── */}
      <div className="flex items-center gap-2 mt-6">
        <IconCube size={18} className="text-slate-600" stroke={1.5} />
        <span className="font-mono text-sm font-bold text-slate-700">
          {isKo ? '오라클의 블록은 이렇게 생겼어요' : 'Anatomy of an Oracle Block'}
        </span>
      </div>

      <div className="flex items-stretch gap-6">
      {/* ── Block visual (left) ── */}
      <div className="flex shrink-0 gap-0">

        {/* 좌측 브라켓 — 블록 왼편, 오른쪽으로 열리는 { 형태: [텍스트][브라켓][블록] */}
        <div className="flex flex-col">
          {/* 데이터 블록 헤더: header(48) + itl(48) = 96px */}
          <div className="relative flex items-center pr-3" style={{ height: ROW_H * 2 }}>
            <span className="font-mono text-[9px] font-bold text-rose-500 leading-tight whitespace-nowrap">
              {isKo ? '데이터 블록 헤더' : 'Block Header'}
            </span>
            <div className="absolute inset-y-2 right-0 w-2 border-l-2 border-t-2 border-b-2 border-rose-400 rounded-l" />
          </div>
          {/* 데이터 헤더: directory(48) */}
          <div className="relative flex items-center pr-3" style={{ height: ROW_H }}>
            <span className="font-mono text-[9px] font-bold text-amber-500 leading-tight whitespace-nowrap">
              {isKo ? '데이터 헤더' : 'Data Header'}
            </span>
            <div className="absolute inset-y-2 right-0 w-2 border-l-2 border-t-2 border-b-2 border-amber-400 rounded-l" />
          </div>
          {/* Free Space — 남은 높이 전부 차지 */}
          <div className="flex-1" />
        </div>

        {/* 블록 본체 */}
        <div className="flex w-52 flex-col overflow-hidden rounded-xl border-2 border-slate-300 shadow-md">
          {/* 상단 3개 행 — 클릭 가능 */}
          {blockRows.map(({ id, labelKo, labelEn }) => {
            const zone = BLOCK_ZONES.find((z) => z.id === id)!
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                style={{ height: ROW_H }}
                className={cn(
                  'flex w-full shrink-0 cursor-pointer items-center gap-3 border-b border-slate-200 px-3 text-left transition-all hover:brightness-95',
                  zone.zoneBg,
                  isActive && zone.activeRing,
                )}
              >
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white', zone.badgeColor)}>
                  {id === 'header' ? 'HDR' : id === 'itl' ? 'ITL' : 'DIR'}
                </span>
                <span className={cn('font-mono text-[11px] leading-tight', isActive ? 'font-bold text-slate-800' : 'text-slate-500')}>
                  {isKo ? labelKo : labelEn}
                </span>
              </button>
            )
          })}

          {/* 사용 가능한 공간 — 남은 높이 전부 차지 */}
          <button
            onClick={() => setActive('free')}
            className={cn(
              'flex min-h-[112px] w-full flex-1 cursor-pointer flex-col items-center justify-center gap-2 transition-all hover:brightness-95',
              BLOCK_ZONES.find((z) => z.id === 'free')!.zoneBg,
              active === 'free' && BLOCK_ZONES.find((z) => z.id === 'free')!.activeRing,
            )}
          >
            <span className="text-xl text-slate-400">↓</span>
            <span className="font-mono text-[12px] font-bold text-slate-500">
              {isKo ? '사용 가능한 공간' : 'Free Space'}
            </span>
            <span className="text-xl text-slate-400">↑</span>
          </button>
        </div>

        {/* 우측 브라켓 — 블록 오른편, 왼쪽으로 열리는 } 형태: [블록][브라켓][텍스트] */}
        <div className="flex flex-col">
          {/* 헤더 3행은 브라켓 없음 */}
          <div style={{ height: ROW_H * 3 }} />
          {/* 데이터 계층 — 남은 높이 전부 */}
          <div className="flex flex-1 items-center gap-1">
            <div className="relative self-stretch w-3 shrink-0">
              <div
                className="absolute inset-y-2 right-0 w-2 border-r-2 border-t-2 border-b-2 border-blue-400 rounded-r"
              />
            </div>
            <span className="font-mono text-[9px] font-bold text-blue-500 leading-tight whitespace-nowrap">
              {isKo ? '데이터 계층' : 'Data Layer'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Detail card (right) ── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className={cn('flex items-center gap-2.5 border-b border-slate-100 px-5 py-3', activeZone.zoneBg)}>
          <span className={cn('rounded px-2.5 py-0.5 font-mono text-xs font-bold text-white', activeZone.badgeColor)}>
            {active.toUpperCase()}
          </span>
          <span className="font-mono text-sm font-bold text-slate-700">
            {isKo ? activeZone.titleKo : activeZone.titleEn}
          </span>
        </div>
        <p className="border-b border-slate-100 px-5 py-3.5 text-[12px] leading-relaxed text-slate-500">
          {isKo ? activeZone.descKo : activeZone.descEn}
        </p>
        <div className="flex flex-col divide-y divide-slate-100">
          {activeZone.rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[160px_1fr] text-xs">
              <div className="flex items-center border-r border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-mono font-bold text-slate-600">{isKo ? row.termKo : row.termEn}</span>
              </div>
              <div className="flex items-center px-4 py-3">
                <span className="font-mono leading-snug text-slate-500">{isKo ? row.descKo : row.descEn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

// ── PctDiagram ────────────────────────────────────────────────────────────

function PctDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  // 위에서부터: PCTFREE(10%) / Row Data(60%) / Free Space(30%)
  // PCTFREE 라인: 10% 지점
  // PCTUSED 라인: 10% + 40% = 50% 지점 (블록의 40%가 Row Data로 사용된 상태)
  const BLOCK_H = 300

  const sections = [
    {
      labelKo: 'PCTFREE 예약 구간',
      labelEn: 'PCTFREE reserved',
      pct: 10,
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-700',
    },
    {
      labelKo: 'Row Data (사용 중)',
      labelEn: 'Row Data (used)',
      pct: 60,
      bg: 'bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-700',
    },
    {
      labelKo: '사용 가능한 공간',
      labelEn: 'Free Space',
      pct: 30,
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-400',
    },
  ]

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <span className="font-mono text-sm font-bold text-slate-700">
          {isKo ? '데이터 블록에 데이터를 어떻게 저장하는 지 더 자세히 알아보기' : 'How Oracle Stores Data Inside a Block'}
        </span>
      </div>

      <div className="flex items-start gap-0">
        {/* ── 블록 본체 (고정 너비) ── */}
        <div
          className="relative shrink-0 flex w-48 flex-col overflow-hidden rounded-xl border-2 border-slate-300 shadow-md"
          style={{ height: BLOCK_H }}
        >
          {sections.map((s) => (
            <div
              key={s.labelKo}
              className={cn('flex items-center justify-center border-b last:border-0', s.bg, s.border)}
              style={{ height: `${s.pct}%` }}
            >
              <span className={cn('font-mono text-[11px] font-bold leading-tight text-center px-2', s.text)}>
                {isKo ? s.labelKo : s.labelEn}
              </span>
            </div>
          ))}
          {/* PCTFREE 라인 — 10% 지점 (PCTFREE 구간 하단) */}
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-green-500" style={{ top: '10%' }} />
          {/* PCTUSED 라인 — 50% 지점 (블록 전체의 40%가 Row Data로 채워진 지점) */}
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-blue-400" style={{ top: '50%' }} />
        </div>

        {/* ── 라인 레이블 (고정 너비 컬럼) ── */}
        <div className="relative shrink-0 w-44" style={{ height: BLOCK_H }}>
          {/* PCTFREE 레이블 — 10% */}
          <div
            className="absolute left-0 flex items-center gap-1.5"
            style={{ top: '10%', transform: 'translateY(-50%)' }}
          >
            <div className="h-px w-3 bg-green-500" />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-green-600 whitespace-nowrap leading-tight">PCTFREE = 10%</span>
              <span className="font-mono text-[9px] text-green-400 whitespace-nowrap leading-tight">
                {isKo ? '블록 전체 크기의 10%' : '10% of total block size'}
              </span>
            </div>
          </div>
          {/* PCTUSED 레이블 — 50% */}
          <div
            className="absolute left-0 flex items-center gap-1.5"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <div className="h-px w-3 bg-blue-400" />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold text-blue-600 whitespace-nowrap leading-tight">PCTUSED = 40%</span>
              <span className="font-mono text-[9px] text-blue-400 whitespace-nowrap leading-tight">
                {isKo ? '블록 전체 크기의 40%' : '40% of total block size'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 설명 카드 ── */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          {/* PCTFREE */}
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <IconArrowDown size={14} className="text-green-600" stroke={2} />
              <span className="font-mono text-xs font-bold text-green-700">PCTFREE</span>
              <span className="font-mono text-[10px] text-green-600">{isKo ? '= INSERT 상한선' : '= INSERT ceiling'}</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-slate-600">
              {isKo
                ? '블록 전체 크기의 10%를 상단에 예약해 둡니다. 여유 공간이 이 비율 아래로 줄면 새 INSERT를 거부하고, 기존 행이 UPDATE로 길어질 때 쓸 공간으로 남겨 둡니다.'
                : 'Reserves 10% of the total block size at the top. Once free space drops below this, new INSERTs are blocked — the space is kept for in-place UPDATE growth on existing rows.'}
            </p>
          </div>

          {/* PCTUSED */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="mb-1.5 flex items-center gap-2">
              <IconArrowUp size={14} className="text-blue-600" stroke={2} />
              <span className="font-mono text-xs font-bold text-blue-700">PCTUSED</span>
              <span className="font-mono text-[10px] text-blue-600">{isKo ? '= Freelist 재진입 하한선' : '= Freelist re-entry floor'}</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-slate-600">
              {isKo
                ? '블록 전체 크기의 40%입니다. DELETE·UPDATE로 실제 Row Data 사용량이 이 비율 아래로 줄면, Oracle이 블록을 Freelist에 재등록해 새 INSERT를 받을 수 있게 합니다.'
                : '40% of the total block size. When DELETE/UPDATE shrinks Row Data usage below this threshold, Oracle re-adds the block to the Freelist so it can accept new INSERTs again.'}
            </p>
          </div>

          {/* 관계 요약 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-mono text-[11px] leading-relaxed text-slate-500">
              {isKo
                ? 'INSERT → PCTFREE 도달 → INSERT 금지 → DELETE로 Row Data가 PCTUSED 이하 → Freelist 재등록 → INSERT 재개. PCTFREE + PCTUSED의 합이 100을 넘으면 안 됩니다.'
                : 'INSERT → hits PCTFREE → blocked → DELETE brings Row Data below PCTUSED → re-added to Freelist → INSERTs resume. PCTFREE + PCTUSED must not exceed 100.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ExtentDiagram ──────────────────────────────────────────────────────────

function ExtentDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-700">
        {isKo ? 'Extent — 연속된 Block의 묶음' : 'Extent — contiguous Blocks'}
      </div>
      <div className="flex items-stretch gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center rounded border border-orange-300 bg-orange-100 py-3 gap-1"
          >
            <span className="font-mono text-[9px] font-bold text-orange-700">Block</span>
            <span className="font-mono text-[8px] text-orange-500">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <div className="h-px flex-1 bg-emerald-300" />
        <span className="font-mono text-[9px] text-emerald-600">
          {isKo ? '물리적으로 연속된 주소' : 'Physically contiguous addresses'}
        </span>
        <div className="h-px flex-1 bg-emerald-300" />
      </div>
    </div>
  )
}

// ── SegmentDiagram ─────────────────────────────────────────────────────────

function SegmentDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-violet-700">
        {isKo ? 'Segment — Extent 집합 (예: EMPLOYEES 테이블)' : 'Segment — set of Extents (e.g. EMPLOYEES table)'}
      </div>
      <div className="flex gap-2">
        {['Extent 1', 'Extent 2', 'Extent 3'].map((ext, ei) => (
          <div key={ext} className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 p-2">
            <div className="mb-1.5 font-mono text-[9px] font-bold text-emerald-700">{ext}</div>
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }).map((_, bi) => (
                <div
                  key={bi}
                  className="flex flex-1 items-center justify-center rounded border border-orange-300 bg-orange-100 py-1.5"
                >
                  <span className="font-mono text-[7px] font-bold text-orange-600">B{ei * 4 + bi + 1}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 font-mono text-[9px] text-violet-600">
        {isKo
          ? '공간 부족 시 Extent를 추가로 할당하며 Segment가 늘어납니다.'
          : 'When space runs out, a new Extent is allocated and the Segment grows.'}
      </div>
    </div>
  )
}

// ── TablespaceDiagram ──────────────────────────────────────────────────────

function TablespaceDiagram() {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'

  const spaces = [
    { name: 'SYSTEM', files: ['system01.dbf'], color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-500' },
    { name: 'UNDO', files: ['undo01.dbf'], color: 'border-orange-300 bg-orange-50', badge: 'bg-orange-500' },
    { name: 'TEMP', files: ['temp01.dbf'], color: 'border-slate-300 bg-slate-50', badge: 'bg-slate-500' },
    { name: 'USERS', files: ['users01.dbf', 'users02.dbf'], color: 'border-violet-300 bg-violet-50', badge: 'bg-violet-500' },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-700">
        {isKo ? 'Tablespace → 데이터 파일 (.dbf)' : 'Tablespace → data files (.dbf)'}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {spaces.map((ts) => (
          <div key={ts.name} className={`rounded-lg border ${ts.color} p-2.5`}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white ${ts.badge}`}>
                {ts.name}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {ts.files.map((f) => (
                <div key={f} className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-1">
                  <span className="text-[10px]">📄</span>
                  <span className="font-mono text-[8px] text-slate-500">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── StorageSection ─────────────────────────────────────────────────────────

const IO_POPUP_T = {
  ko: { before: 'Block — 최소 ', after: ' 단위' },
  en: { before: 'Block — Smallest ', after: ' Unit' },
}

export function StorageSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = STORAGE_T[lang]
  const io = IO_POPUP_T[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <WipBanner />
      <ChapterTitle title={t.sectionTitle} subtitle={t.sectionDesc} />


        {/* Block */}
        <AccordionSection title={`${io.before}I/O${io.after}`}>
          <Prose>{lang === 'ko'
            ? 'Block은 Oracle이 디스크에서 데이터를 읽고 쓰는 최소 단위입니다. 행(Row) 하나가 아닌 Block 전체를 한 번에 읽어 메모리(Buffer Cache)에 올립니다.\n\nI/O(Input/Output)란 데이터를 읽거나 쓰는 작업입니다. 디스크에서 데이터를 읽는 것은 메모리에서 읽는 것보다 수백~수만 배 느리기 때문에, Oracle은 Block 단위로 한꺼번에 읽어 재사용함으로써 불필요한 I/O를 줄입니다. Block 크기를 크게 하면 한 번에 더 많은 행을 읽을 수 있지만, 필요한 행이 적을 때는 쓸모없는 데이터를 함께 읽는 낭비가 생깁니다. 기본값 8 KB는 이 두 가지를 절충한 크기입니다.'
            : 'A Block is the smallest unit Oracle uses to read and write data on disk. Instead of fetching a single row, Oracle always reads an entire Block into memory (the Buffer Cache) at once.\n\nI/O (Input/Output) is any operation that reads or writes data. Disk I/O is hundreds to thousands of times slower than CPU work, so Oracle minimizes unnecessary I/O by loading data in Block-sized chunks and reusing what is already in memory. A larger Block size means more rows per read, but wastes I/O when only a few rows are needed. The default 8 KB is a practical balance between these two.'
          }</Prose>
          <BlockDiagram />
          <PctDiagram />
          <InfoBox variant="note">
            {lang === 'ko'
              ? '슬롯(Slot)이란 블록 안에 미리 잘라 놓은 고정 크기의 자리입니다. ITL 슬롯은 트랜잭션 1개가 들어갈 칸, Row Directory 슬롯은 행 1개의 위치 포인터가 들어갈 칸입니다. 배열의 인덱스처럼 번호로 관리되어, Oracle은 슬롯 번호만 알면 해당 데이터를 바로 찾아갑니다.'
              : 'A slot is a pre-carved, fixed-size entry inside the block. An ITL slot holds one transaction\'s tracking data; a Row Directory slot holds the byte-offset pointer for one row. Slots are numbered like array indices — Oracle can locate any entry in O(1) given just the slot number.'}
          </InfoBox>
        </AccordionSection>

        {/* Extent */}
        <AccordionSection title={t.extentTitle}>
          <HierarchyOverview upTo="extent" />
          <div className="mt-4">
            <Prose>{t.extentDesc}</Prose>
            <ExtentDiagram />
            <Table
              headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']}
              rows={t.extentDetail}
            />
          </div>
        </AccordionSection>

        {/* Segment */}
        <AccordionSection title={t.segmentTitle}>
          <HierarchyOverview upTo="segment" />
          <div className="mt-4">
            <Prose>{t.segmentDesc}</Prose>
            <SegmentDiagram />
            <ConceptGrid items={t.segmentTypes} />
          </div>
        </AccordionSection>

        {/* Tablespace */}
        <AccordionSection title={t.tablespaceTitle}>
          <HierarchyOverview upTo="tablespace" />
          <div className="mt-4">
            <Prose>{t.tablespaceDesc}</Prose>
            <TablespaceDiagram />
            <Table
              headers={[lang === 'ko' ? 'Tablespace' : 'Tablespace', lang === 'ko' ? '용도' : 'Purpose']}
              rows={t.tablespaceTable}
            />
            <InfoBox variant="tip">{t.tablespaceNote}</InfoBox>
          </div>
        </AccordionSection>

      <InfoBox variant="summary">{t.infoBody}</InfoBox>
    </div>
  )
}
