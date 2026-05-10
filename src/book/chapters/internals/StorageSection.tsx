import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  ChapterTitle, SubTitle, Prose,
  InfoBox, Table, ConceptGrid, Divider, WipBanner,
} from '../shared'
import { cn } from '@/lib/utils'


// ── Bilingual strings ──────────────────────────────────────────────────────

const STORAGE_T = {
  ko: {
    sectionTitle: '데이터 저장 구조',
    sectionDesc: 'Oracle은 데이터를 Block → Extent → Segment → Tablespace의 4계층 구조로 관리합니다. 각 계층은 논리적 단위이며, 물리적으로는 데이터 파일(.dbf)에 매핑됩니다.',

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
    sectionDesc: 'Oracle organizes data in a 4-tier hierarchy: Block → Extent → Segment → Tablespace. Each tier is a logical unit that ultimately maps to physical data files (.dbf).',

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

function HierarchyOverview({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 shadow-sm">
      {/* Tablespace */}
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-blue-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">TABLESPACE</span>
        <span className="font-mono text-[11px] text-blue-700">
          {isKo ? '논리적 저장 컨테이너 — 하나 이상의 .dbf 파일' : 'Logical storage container — one or more .dbf files'}
        </span>
      </div>

      {/* Segment */}
      <div className="ml-4 rounded-xl border border-violet-300 bg-violet-50 p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-violet-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">SEGMENT</span>
          <span className="font-mono text-[11px] text-violet-700">
            {isKo ? '오브젝트 1개 (테이블·인덱스 등) = Segment 1개' : 'One object (table/index/etc.) = one Segment'}
          </span>
        </div>

        {/* Extents */}
        <div className="ml-4 flex gap-2">
          {(['Extent 1', 'Extent 2', 'Extent 3'] as const).map((ext, ei) => (
            <div key={ext} className="flex-1 rounded-xl border border-emerald-300 bg-emerald-50 p-2">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                  {ext.toUpperCase()}
                </span>
                {ei === 0 && (
                  <span className="font-mono text-[9px] text-emerald-600">
                    {isKo ? '연속 블록 묶음' : 'contiguous blocks'}
                  </span>
                )}
              </div>

              {/* Blocks */}
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, bi) => (
                  <div
                    key={bi}
                    className="flex flex-1 flex-col items-center rounded border border-orange-300 bg-orange-100 py-1.5"
                  >
                    <span className="font-mono text-[8px] font-bold text-orange-700">BLK</span>
                    <span className="font-mono text-[7px] text-orange-500">{ei * 4 + bi + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Block label row */}
        <div className="ml-4 mt-1.5 flex items-center gap-1">
          <span className="rounded bg-orange-400 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">BLOCK</span>
          <span className="font-mono text-[10px] text-orange-700">
            {isKo ? '최소 I/O 단위 (기본 8KB) — Buffer Cache 캐싱 단위' : 'Smallest I/O unit (default 8KB) — unit of Buffer Cache'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── BlockDiagram ───────────────────────────────────────────────────────────

type BlockField = {
  name: string
  value: string
  note?: string
  accent: string
}

type BlockSection = {
  id: string
  label: string
  badge: string
  bg: string
  activeBg: string
  border: string
  activeBorder: string
  text: string
  size: string
  title: string
  desc: string
  fields: BlockField[]
}

const BLOCK_SECTIONS: Record<'ko' | 'en', BlockSection[]> = {
  ko: [
    {
      id: 'common-header',
      label: '공통 헤더',
      badge: 'bg-blue-500',
      bg: 'bg-blue-50',
      activeBg: 'bg-blue-50',
      border: 'border-blue-200',
      activeBorder: 'border-blue-400',
      text: 'text-blue-700',
      size: 'h-10',
      title: '공통 헤더 (Common Header)',
      desc: '블록 타입·위치·변경 이력을 기록하는 고정 크기 헤더. 모든 블록 타입에 공통으로 존재합니다.',
      fields: [
        { name: 'Block Type',    value: '0x06 (Table Data)',       note: '데이터·인덱스·언두 등 블록 종류', accent: 'bg-blue-100 border-blue-300' },
        { name: 'DBA',           value: '0x00C00123',              note: 'Data Block Address — 파일 번호 + 블록 번호', accent: 'bg-blue-100 border-blue-300' },
        { name: 'SCN (seq/cnt)', value: '0x0000.00A3F2 / 0x0001',  note: '마지막 변경 시점의 System Change Number', accent: 'bg-blue-100 border-blue-300' },
        { name: 'Checksum',      value: '0xB4E2',                  note: '블록 무결성 검증값 (DB_BLOCK_CHECKSUM)', accent: 'bg-blue-100 border-blue-300' },
      ],
    },
    {
      id: 'itl',
      label: 'ITL (Interested Transaction List)',
      badge: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      activeBg: 'bg-indigo-50',
      border: 'border-indigo-200',
      activeBorder: 'border-indigo-400',
      text: 'text-indigo-700',
      size: 'h-16',
      title: 'ITL — Interested Transaction List',
      desc: '이 블록을 동시에 수정 중인 트랜잭션 슬롯 목록. INITRANS 수만큼 미리 확보하고, 부족하면 Free Space에서 동적 확장합니다.',
      fields: [
        { name: 'Slot #1  XID',  value: '0x0005.00B.000012A4',    note: 'Transaction ID — Undo Seg# · Slot# · Seq#', accent: 'bg-indigo-100 border-indigo-300' },
        { name: 'Slot #1  UBA',  value: '0x00800078.0031.02',     note: 'Undo Block Address — 롤백에 필요한 이전 이미지 위치', accent: 'bg-indigo-100 border-indigo-300' },
        { name: 'Slot #1  Flag', value: 'C--- (Committed)',       note: 'C=커밋됨 / U=잠금 중 / T=활성 트랜잭션', accent: 'bg-indigo-100 border-indigo-300' },
        { name: 'Slot #2  XID',  value: '0x0007.01C.0000FFB1',    note: '두 번째 동시 트랜잭션 슬롯 (INITRANS ≥ 2)', accent: 'bg-indigo-200 border-indigo-400' },
        { name: 'INITRANS',      value: '2  (기본: 테이블 1, 인덱스 2)', note: '블록 생성 시 미리 할당하는 슬롯 수 · 슬롯 1개 = 약 24 bytes', accent: 'bg-violet-100 border-violet-300' },
        { name: 'MAXTRANS',      value: '255  (Oracle 10g+ 사실상 무제한)', note: '슬롯 고갈 + Free Space 없음 → enq: TX – allocate ITL entry 대기', accent: 'bg-violet-100 border-violet-300' },
      ],
    },
    {
      id: 'table-dir',
      label: 'Table / Row Directory',
      badge: 'bg-slate-500',
      bg: 'bg-slate-50',
      activeBg: 'bg-slate-50',
      border: 'border-slate-200',
      activeBorder: 'border-slate-400',
      text: 'text-slate-700',
      size: 'h-10',
      title: 'Table / Row Directory',
      desc: '블록 내 행 위치를 O(1)로 찾기 위한 포인터 배열. ROWID 접근 시 이 배열로 오프셋을 조회합니다.',
      fields: [
        { name: 'Table Directory', value: 'OBJ#=74821',             note: '이 블록에 데이터가 있는 테이블 (클러스터 블록에서 유효)', accent: 'bg-slate-100 border-slate-300' },
        { name: 'Row #0  offset',  value: '0x1F8A  (행 0 위치)',    note: 'Row 0의 블록 내 바이트 오프셋 → 직접 점프', accent: 'bg-slate-100 border-slate-300' },
        { name: 'Row #1  offset',  value: '0x1E3C  (행 1 위치)',    note: 'ROWID의 slot# 부분이 이 배열의 인덱스', accent: 'bg-slate-100 border-slate-300' },
        { name: 'Row #2  offset',  value: '0x1CD0  (행 2 위치)',    note: 'DELETE 후 슬롯은 재사용될 때까지 0xFFFF로 표시', accent: 'bg-slate-100 border-slate-300' },
      ],
    },
    {
      id: 'pctfree',
      label: 'Free Space (PCTFREE 예약)',
      badge: 'bg-green-500',
      bg: 'bg-green-50',
      activeBg: 'bg-green-50',
      border: 'border-green-300',
      activeBorder: 'border-green-500',
      text: 'text-green-700',
      size: 'h-20',
      title: 'Free Space — PCTFREE 예약 구간',
      desc: 'UPDATE 시 가변 컬럼 확장을 위해 미리 비워 두는 공간 (기본 10%). INSERT 상한선 역할을 합니다.',
      fields: [
        { name: 'PCTFREE',         value: '10%  →  819 bytes (8KB 기준)', note: 'INSERT 상한선 — 여유 공간이 이 비율 이하로 줄면 새 INSERT 금지. UPDATE 확장용으로 예약', accent: 'bg-green-100 border-green-300' },
        { name: 'PCTUSED',         value: '40%  (기본값)',                 note: 'Freelist 재진입 하한선 — DELETE 등으로 사용률이 이 값 아래로 떨어지면 블록을 Freelist에 재등록 → 새 INSERT 허용', accent: 'bg-green-100 border-green-300' },
        { name: 'PCTFREE + PCTUSED', value: '≤ 100  필수',                note: '합이 100 초과 시 블록이 Freelist에 영구적으로 재진입 불가', accent: 'bg-green-100 border-green-300' },
        { name: 'Row Migration',   value: 'ROWID 유지, 실제 데이터 이동', note: 'PCTFREE 공간 부족으로 UPDATE 제자리 저장 불가 → 다른 블록으로 이동 + 원본 포인터 남김 → 추가 I/O', accent: 'bg-amber-100 border-amber-300' },
        { name: 'Row Chaining',    value: '행 크기 > DB_BLOCK_SIZE',       note: '행 자체가 블록보다 커서 여러 블록에 걸쳐 저장 (LONG, LOB 컬럼 등)', accent: 'bg-amber-100 border-amber-300' },
      ],
    },
    {
      id: 'row-data',
      label: 'Row Data',
      badge: 'bg-orange-500',
      bg: 'bg-orange-50',
      activeBg: 'bg-orange-50',
      border: 'border-orange-200',
      activeBorder: 'border-orange-400',
      text: 'text-orange-700',
      size: 'h-24',
      title: 'Row Data',
      desc: '실제 행 데이터가 저장되는 영역. 블록 끝에서 위로 자라며, 위에서 내려오는 Directory와 가운데 Free Space에서 만납니다.',
      fields: [
        { name: 'Row Header',      value: '2~3 bytes',               note: '행 플래그 (삭제·마이그레이션 여부), 컬럼 수, 락 바이트 포함', accent: 'bg-orange-100 border-orange-300' },
        { name: 'Col #0  (NUMBER)', value: '0x C2 27  → 38',         note: '컬럼 길이(1 byte) + 데이터. NULL은 0xFF 1바이트', accent: 'bg-orange-100 border-orange-300' },
        { name: 'Col #1  (VARCHAR2)', value: '0x 08 "Harrison"',     note: '길이 prefix + 문자 데이터 (가변 길이)', accent: 'bg-orange-100 border-orange-300' },
        { name: 'PCTUSED',         value: '40%  (기본값)',            note: '사용률이 이 값 아래로 떨어지면 블록을 Freelist에 재등록 → 새 INSERT 허용', accent: 'bg-rose-100 border-rose-300' },
        { name: 'PCTFREE + PCTUSED', value: '≤ 100  필수',           note: '합이 100 초과 시 블록이 영원히 Freelist에 재진입 불가', accent: 'bg-rose-100 border-rose-300' },
      ],
    },
  ],
  en: [
    {
      id: 'common-header',
      label: 'Common Header',
      badge: 'bg-blue-500',
      bg: 'bg-blue-50',
      activeBg: 'bg-blue-50',
      border: 'border-blue-200',
      activeBorder: 'border-blue-400',
      text: 'text-blue-700',
      size: 'h-10',
      title: 'Common Header',
      desc: 'Fixed-size header recording block type, location, and change history. Present in every block type.',
      fields: [
        { name: 'Block Type',    value: '0x06 (Table Data)',       note: 'Identifies data / index / undo / etc.', accent: 'bg-blue-100 border-blue-300' },
        { name: 'DBA',           value: '0x00C00123',              note: 'Data Block Address — file number + block number', accent: 'bg-blue-100 border-blue-300' },
        { name: 'SCN (seq/cnt)', value: '0x0000.00A3F2 / 0x0001',  note: 'System Change Number of the last modification', accent: 'bg-blue-100 border-blue-300' },
        { name: 'Checksum',      value: '0xB4E2',                  note: 'Block integrity value (DB_BLOCK_CHECKSUM)', accent: 'bg-blue-100 border-blue-300' },
      ],
    },
    {
      id: 'itl',
      label: 'ITL (Interested Transaction List)',
      badge: 'bg-indigo-500',
      bg: 'bg-indigo-50',
      activeBg: 'bg-indigo-50',
      border: 'border-indigo-200',
      activeBorder: 'border-indigo-400',
      text: 'text-indigo-700',
      size: 'h-16',
      title: 'ITL — Interested Transaction List',
      desc: 'Slots tracking transactions currently modifying this block. Pre-allocated by INITRANS; expands into free space when needed.',
      fields: [
        { name: 'Slot #1  XID',  value: '0x0005.00B.000012A4',    note: 'Transaction ID — Undo Seg# · Slot# · Seq#', accent: 'bg-indigo-100 border-indigo-300' },
        { name: 'Slot #1  UBA',  value: '0x00800078.0031.02',     note: 'Undo Block Address — location of the before-image', accent: 'bg-indigo-100 border-indigo-300' },
        { name: 'Slot #1  Flag', value: 'C--- (Committed)',       note: 'C=committed / U=locked / T=active transaction', accent: 'bg-indigo-100 border-indigo-300' },
        { name: 'Slot #2  XID',  value: '0x0007.01C.0000FFB1',    note: 'Second concurrent transaction slot (INITRANS ≥ 2)', accent: 'bg-indigo-200 border-indigo-400' },
        { name: 'INITRANS',      value: '2  (default: table 1, index 2)', note: 'Slots pre-allocated at block creation · ~24 bytes each', accent: 'bg-violet-100 border-violet-300' },
        { name: 'MAXTRANS',      value: '255  (Oracle 10g+ effectively unlimited)', note: 'Slots exhausted + no free space → "enq: TX – allocate ITL entry" wait', accent: 'bg-violet-100 border-violet-300' },
      ],
    },
    {
      id: 'table-dir',
      label: 'Table / Row Directory',
      badge: 'bg-slate-500',
      bg: 'bg-slate-50',
      activeBg: 'bg-slate-50',
      border: 'border-slate-200',
      activeBorder: 'border-slate-400',
      text: 'text-slate-700',
      size: 'h-10',
      title: 'Table / Row Directory',
      desc: 'Pointer array for O(1) row lookup within the block. ROWID access resolves the in-block offset through this directory.',
      fields: [
        { name: 'Table Directory', value: 'OBJ#=74821',             note: 'Tables with rows in this block (meaningful for clustered tables)', accent: 'bg-slate-100 border-slate-300' },
        { name: 'Row #0  offset',  value: '0x1F8A  (row 0 position)', note: 'Byte offset of row 0 — Oracle jumps directly here', accent: 'bg-slate-100 border-slate-300' },
        { name: 'Row #1  offset',  value: '0x1E3C  (row 1 position)', note: 'The slot# in a ROWID is the index into this array', accent: 'bg-slate-100 border-slate-300' },
        { name: 'Row #2  offset',  value: '0x1CD0  (row 2 position)', note: 'After DELETE, slot is marked 0xFFFF until reused', accent: 'bg-slate-100 border-slate-300' },
      ],
    },
    {
      id: 'pctfree',
      label: 'Free Space (PCTFREE reserved)',
      badge: 'bg-green-500',
      bg: 'bg-green-50',
      activeBg: 'bg-green-50',
      border: 'border-green-300',
      activeBorder: 'border-green-500',
      text: 'text-green-700',
      size: 'h-20',
      title: 'Free Space — PCTFREE Reserved Zone',
      desc: 'Space kept free for in-place UPDATE row growth (default 10%). Acts as the upper INSERT cutoff.',
      fields: [
        { name: 'PCTFREE',           value: '10%  →  819 bytes (in 8KB block)', note: 'INSERT upper cutoff — once free space drops below this, new INSERTs are rejected. Reserved for UPDATE growth', accent: 'bg-green-100 border-green-300' },
        { name: 'PCTUSED',           value: '40%  (default)',                   note: 'Freelist re-entry threshold — when used space falls below this after DELETEs, the block is re-added to the Freelist for new INSERTs', accent: 'bg-green-100 border-green-300' },
        { name: 'PCTFREE + PCTUSED', value: '≤ 100  required',                 note: 'If sum exceeds 100, a block can never re-enter the Freelist', accent: 'bg-green-100 border-green-300' },
        { name: 'Row Migration',     value: 'ROWID kept, data moved',          note: 'UPDATE can\'t fit row in place due to insufficient PCTFREE → row moves to another block, original slot holds a forwarding pointer → extra I/O', accent: 'bg-amber-100 border-amber-300' },
        { name: 'Row Chaining',      value: 'Row size > DB_BLOCK_SIZE',        note: 'Row itself is larger than one block (LONG, LOB columns, wide rows) → stored across multiple blocks', accent: 'bg-amber-100 border-amber-300' },
      ],
    },
    {
      id: 'row-data',
      label: 'Row Data',
      badge: 'bg-orange-500',
      bg: 'bg-orange-50',
      activeBg: 'bg-orange-50',
      border: 'border-orange-200',
      activeBorder: 'border-orange-400',
      text: 'text-orange-700',
      size: 'h-24',
      title: 'Row Data',
      desc: 'Actual row data, growing upward from the bottom of the block toward the downward-growing directory, meeting in the middle Free Space.',
      fields: [
        { name: 'Row Header',        value: '2–3 bytes',               note: 'Row flags (deleted / migrated), column count, lock byte', accent: 'bg-orange-100 border-orange-300' },
        { name: 'Col #0  (NUMBER)',   value: '0x C2 27  → 38',         note: 'Length byte + data. NULL is stored as 0xFF (1 byte)', accent: 'bg-orange-100 border-orange-300' },
        { name: 'Col #1  (VARCHAR2)', value: '0x 08 "Harrison"',       note: 'Length prefix + character data (variable length)', accent: 'bg-orange-100 border-orange-300' },
        { name: 'PCTUSED',           value: '40%  (default)',          note: 'When used space drops below this after DELETEs, block re-enters Freelist for new INSERTs', accent: 'bg-rose-100 border-rose-300' },
        { name: 'PCTFREE + PCTUSED', value: '≤ 100  required',        note: 'If sum exceeds 100, a block can never re-enter the Freelist', accent: 'bg-rose-100 border-rose-300' },
      ],
    },
  ],
}

function BlockDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const [active, setActive] = useState('itl')
  const sections = BLOCK_SECTIONS[lang]
  const activeSection = sections.find((s) => s.id === active)!
  const isKo = lang === 'ko'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Title bar */}
      <div className="flex items-center justify-between bg-slate-700 px-4 py-2.5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-200">
          Oracle Data Block
        </span>
        <span className="font-mono text-[10px] text-slate-400">8 KB (default)</span>
      </div>

      <div className="flex divide-x divide-slate-200">
        {/* Left: block layout */}
        <div className="flex w-52 shrink-0 flex-col">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {isKo ? '▲ 상단 (낮은 주소)' : '▲ Top (low address)'}
            </span>
          </div>
          {sections.map((s) => {
            const isActive = active === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  'flex items-center gap-2 border-b border-slate-100 px-3 text-left transition-all',
                  s.size,
                  isActive ? `${s.activeBg} border-l-2 ${s.activeBorder}` : `${s.bg} border-l-2 border-transparent hover:brightness-95`,
                )}
              >
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold text-white', s.badge)}>
                  {s.id === 'pctfree' ? 'PCTFREE' : s.id === 'row-data' ? 'ROW DATA' : s.id === 'itl' ? 'ITL' : s.id === 'common-header' ? 'HEADER' : 'DIR'}
                </span>
                <span className={cn('font-mono text-[9px] leading-tight', isActive ? s.text : 'text-slate-500')}>
                  {s.label}
                </span>
              </button>
            )
          })}
          <div className="bg-slate-50 px-3 py-1.5">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {isKo ? '▼ 하단 (높은 주소)' : '▼ Bottom (high address)'}
            </span>
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex flex-1 flex-col">
          {/* Section title bar */}
          <div className={cn('flex items-center gap-2 border-b border-slate-100 px-4 py-2.5', activeSection.activeBg)}>
            <span className={cn('rounded px-2 py-0.5 font-mono text-[10px] font-bold text-white', activeSection.badge)}>
              {activeSection.id.toUpperCase()}
            </span>
            <span className={cn('font-mono text-xs font-bold', activeSection.text)}>
              {activeSection.title}
            </span>
          </div>
          {/* Summary desc */}
          <p className="border-b border-slate-100 bg-white px-4 py-2 font-mono text-[10px] leading-relaxed text-slate-500">
            {activeSection.desc}
          </p>
          {/* Field cards */}
          <div className="flex flex-col divide-y divide-slate-100 bg-white">
            {activeSection.fields.map((f) => (
              <div key={f.name} className={cn('grid grid-cols-[180px_1fr] items-stretch', f.accent, 'border-l-0')}>
                {/* Field name + value */}
                <div className={cn('flex flex-col justify-center gap-0.5 border-r border-slate-200 px-3 py-2', f.accent)}>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-slate-500">{f.name}</span>
                  <span className="font-mono text-[10px] font-semibold text-slate-800 break-all">{f.value}</span>
                </div>
                {/* Note */}
                <div className="flex items-center bg-white px-3 py-2">
                  <span className="font-mono text-[10px] leading-snug text-slate-500">{f.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ExtentDiagram ──────────────────────────────────────────────────────────

function ExtentDiagram({ lang }: { lang: 'ko' | 'en' }) {
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

function SegmentDiagram({ lang }: { lang: 'ko' | 'en' }) {
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

function TablespaceDiagram({ lang }: { lang: 'ko' | 'en' }) {
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

export function StorageSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = STORAGE_T[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <WipBanner />
      <ChapterTitle title={t.sectionTitle} subtitle={t.sectionDesc} />

      {/* Overview: 4-tier hierarchy */}
      <HierarchyOverview lang={lang} />

      <Divider />

      {/* Block */}
      <SubTitle>{t.blockTitle}</SubTitle>
      <BlockDiagram lang={lang} />

      <Divider />

      {/* Extent */}
      <SubTitle>{t.extentTitle}</SubTitle>
      <Prose>{t.extentDesc}</Prose>
      <ExtentDiagram lang={lang} />
      <div className="mt-4">
        <Table
          headers={[lang === 'ko' ? '항목' : 'Item', lang === 'ko' ? '설명' : 'Description']}
          rows={t.extentDetail}
        />
      </div>

      <Divider />

      {/* Segment */}
      <SubTitle>{t.segmentTitle}</SubTitle>
      <Prose>{t.segmentDesc}</Prose>
      <SegmentDiagram lang={lang} />
      <div className="mt-4">
        <ConceptGrid items={t.segmentTypes} />
      </div>

      <Divider />

      {/* Tablespace */}
      <SubTitle>{t.tablespaceTitle}</SubTitle>
      <Prose>{t.tablespaceDesc}</Prose>
      <TablespaceDiagram lang={lang} />
      <div className="mt-4">
        <Table
          headers={[lang === 'ko' ? 'Tablespace' : 'Tablespace', lang === 'ko' ? '용도' : 'Purpose']}
          rows={t.tablespaceTable}
        />
        <InfoBox variant="tip" lang={lang}>{t.tablespaceNote}</InfoBox>
      </div>

      <Divider />

      <InfoBox variant="summary" lang={lang}>{t.infoBody}</InfoBox>
    </div>
  )
}
