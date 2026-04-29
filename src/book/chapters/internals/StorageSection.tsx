import { useSimulationStore } from '@/store/simulationStore'
import {
  ChapterTitle, SectionTitle, SubTitle, Prose,
  InfoBox, Table, ConceptGrid, Divider,
} from '../shared'
import { cn } from '@/lib/utils'

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

// ── BlockDiagram ───────────────────────────────────────────────────────────

function BlockDiagram() {
  const lang = useSimulationStore((s) => s.lang)
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

// ── StorageHierarchyDiagram ────────────────────────────────────────────────

function StorageHierarchyDiagram() {
  const lang = useSimulationStore((s) => s.lang)
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

// ── InsertFlowDiagram ──────────────────────────────────────────────────────

function InsertFlowDiagram() {
  const lang = useSimulationStore((s) => s.lang)
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

// ── StorageSection ─────────────────────────────────────────────────────────

export function StorageSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = STORAGE_T[lang]

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <ChapterTitle icon="⚙" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />
      <SectionTitle>{t.sectionTitle}</SectionTitle>
      <Prose>{t.sectionDesc}</Prose>

      {/* Hierarchy visual */}
      <SubTitle>{t.hierarchyLabel}</SubTitle>
      <StorageHierarchyDiagram />

      <Divider />

      {/* Two-column: Block + Extent */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Block */}
        <div>
          <SubTitle>{t.blockTitle}</SubTitle>
          <Prose>{t.blockDesc}</Prose>
          <BlockDiagram />
          <div className="mt-3">
            <Table headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']} rows={t.blockDetail} />
          </div>
          <InfoBox color="info" icon="💡" title={lang === 'ko' ? 'Buffer Cache와의 관계' : 'Relationship with Buffer Cache'}>
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
      <InfoBox color="warning" icon="📁" title={lang === 'ko' ? '논리 vs 물리' : 'Logical vs Physical'}>
        {t.tablespaceNote}
      </InfoBox>

      <Divider />

      {/* INSERT flow */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <SubTitle>{t.flowTitle}</SubTitle>
          <Prose>{t.flowDesc}</Prose>
          <InsertFlowDiagram />
        </div>
        <div className="flex items-center">
          <InfoBox color="info" icon="🔑" title={t.infoTitle}>
            {t.infoBody}
          </InfoBox>
        </div>
      </div>
    </div>
  )
}
