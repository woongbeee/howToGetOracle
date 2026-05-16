import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
} from '../shared'
import { IconFingerprintScan } from '@tabler/icons-react'

// ── 텍스트 ────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    pageTitle: 'ROWID 구조',
    pageSubtitle:
      'ROWID는 Oracle 테이블에서 각 행(Row)의 물리적 위치를 나타내는 고유한 주소입니다. ' +
      'B-Tree 인덱스의 Leaf 블록은 인덱스 키값과 함께 ROWID를 저장하며, ' +
      '오라클은 이 ROWID를 이용해 테이블 블록을 단 한 번의 I/O로 직접 찾아갑니다.',

    whatTitle: 'ROWID란?',
    whatDesc:
      'ROWID는 "이 행은 디스크의 어느 파일, 어느 블록, 몇 번째 슬롯에 있다"를 가리키는 포인터입니다. ' +
      '테이블 풀 스캔 없이 특정 행에 바로 접근할 수 있어, 인덱스 기반 조회의 마지막 단계에서 반드시 쓰입니다.',
    whatNote:
      'ROWID는 행이 INSERT될 때 결정되며, 해당 행이 다른 블록으로 이동(행 이동 또는 재구성)되지 않는 한 변하지 않습니다.',

    structureTitle: 'Extended ROWID 구조',
    structureDesc:
      'Oracle 8 이후 파티션 테이블 등을 지원하기 위해 도입된 Extended ROWID는 Base64로 인코딩된 18자리 문자열입니다. ' +
      '4개의 파트로 나뉘며, 각 파트가 다른 위치 정보를 담습니다.',

    parts: [
      {
        label: 'OOOOOO',
        name: 'Data Object Number',
        chars: '6자리',
        desc: '테이블·파티션이 속한 세그먼트를 식별하는 번호. 같은 테이블이라도 파티션마다 다를 수 있습니다.',
        color: 'violet' as const,
      },
      {
        label: 'FFF',
        name: 'Relative File Number',
        chars: '3자리',
        desc: '데이터 파일 번호. 하나의 테이블스페이스 안에서 해당 블록이 어느 .dbf 파일에 있는지를 가리킵니다.',
        color: 'blue' as const,
      },
      {
        label: 'BBBBBB',
        name: 'Block Number',
        chars: '6자리',
        desc: '파일 안에서 해당 블록의 번호. 블록은 Oracle I/O의 최소 단위이므로 이 번호로 블록을 직접 찾습니다.',
        color: 'emerald' as const,
      },
      {
        label: 'RRR',
        name: 'Row Number (Slot)',
        chars: '3자리',
        desc: '블록 안에서 행의 슬롯 번호. 블록 헤더의 Row Directory가 이 번호로 실제 행 데이터 위치를 가리킵니다.',
        color: 'orange' as const,
      },
    ],

    exampleTitle: '실제 ROWID 읽어보기',
    exampleDesc:
      'ROWID 컬럼은 테이블에 저장된 컬럼은 아니지만, SELECT 절에 명시하면 조회할 수 있습니다.',
    exampleSql: `SELECT ROWID, employee_id, last_name
FROM   employees
WHERE  employee_id = 100;`,
    exampleResult: 'AAASXJAAEAAAACXAAA',
    exampleBreakdown: [
      { part: 'AAASXJ', label: 'Object#', color: 'violet' as const },
      { part: 'AAE',    label: 'File#',   color: 'blue' as const },
      { part: 'AAAACX', label: 'Block#',  color: 'emerald' as const },
      { part: 'AAA',    label: 'Row#',    color: 'orange' as const },
    ],
    decodeNote:
      'Base64 디코딩 예시: AAASXJ → Object# 4,951 / AAE → File# 4 / AAAACX → Block# 151 / AAA → Row# 0',

    usageTitle: 'ROWID 활용',
    usageDesc: 'ROWID는 직접 WHERE 조건으로 써서 가장 빠른 단건 조회를 할 수 있습니다.',
    usageSql: `-- ROWID로 직접 행 조회 (가장 빠른 단건 접근)
SELECT * FROM employees WHERE ROWID = 'AAASXJAAEAAAACXAAA';

-- 중복 행 제거 시 ROWID 활용 패턴
DELETE FROM employees
WHERE  ROWID NOT IN (
  SELECT MIN(ROWID)
  FROM   employees
  GROUP BY employee_id
);`,
    usageTip:
      'ROWID를 직접 저장해 두었다가 나중에 그 행을 다시 접근하는 패턴은 행이 이동(파티션 이동, 테이블 재구성)되면 무효가 됩니다. ' +
      '장기 보관용 식별자로는 PK를 사용하세요.',

    indexTitle: 'B-Tree 인덱스에서 ROWID가 쓰이는 순서',
    indexSteps: [
      { n: 1, desc: 'Root → Branch → Leaf 블록을 순서대로 읽으며 인덱스 키값 비교' },
      { n: 2, desc: 'Leaf 블록에서 일치하는 키값의 ROWID 획득' },
      { n: 3, desc: 'ROWID(Object# + File# + Block# + Row#)로 테이블 블록 직접 접근' },
      { n: 4, desc: '블록 내 Row Directory에서 슬롯 번호로 행 데이터 반환' },
    ],
    indexNote:
      '인덱스를 타더라도 Leaf에서 ROWID를 꺼낸 뒤 테이블 블록을 읽는 단계(Table Access by Index ROWID)가 항상 필요합니다. ' +
      '이 때문에 선택도가 낮은(=결과가 많은) 컬럼에 인덱스를 쓰면 오히려 Full Scan보다 느릴 수 있습니다.',
  },
  en: {
    pageTitle: 'ROWID Structure',
    pageSubtitle:
      'A ROWID is a unique physical address that identifies exactly where each row lives on disk. ' +
      'B-Tree Leaf blocks store the ROWID alongside each index key, and Oracle uses it to jump ' +
      'directly to the right table block in a single I/O.',

    whatTitle: 'What is a ROWID?',
    whatDesc:
      'A ROWID is a pointer that says "this row is in this file, this block, and this slot within that block." ' +
      'It lets Oracle reach a specific row without scanning the whole table — it is the final step of every index-based lookup.',
    whatNote:
      'A ROWID is assigned when a row is first inserted and does not change unless the row physically moves (e.g., during partition migration or table reorganization).',

    structureTitle: 'Extended ROWID Structure',
    structureDesc:
      'Introduced in Oracle 8 to support partitioned tables and multiple files, the Extended ROWID is an 18-character Base64-encoded string ' +
      'split into four parts, each encoding a different piece of location information.',

    parts: [
      {
        label: 'OOOOOO',
        name: 'Data Object Number',
        chars: '6 chars',
        desc: 'Identifies the segment (table or partition) that owns the row. Different partitions of the same table have different object numbers.',
        color: 'violet' as const,
      },
      {
        label: 'FFF',
        name: 'Relative File Number',
        chars: '3 chars',
        desc: 'The data file number within the tablespace. Points to which .dbf file contains the block.',
        color: 'blue' as const,
      },
      {
        label: 'BBBBBB',
        name: 'Block Number',
        chars: '6 chars',
        desc: 'The block number within the file. Oracle reads exactly this block — no scan needed.',
        color: 'emerald' as const,
      },
      {
        label: 'RRR',
        name: 'Row Number (Slot)',
        chars: '3 chars',
        desc: 'The row slot index within the block. The block header\'s Row Directory uses this number to find the actual row data.',
        color: 'orange' as const,
      },
    ],

    exampleTitle: 'Reading a Real ROWID',
    exampleDesc:
      'ROWID is not a stored column, but you can include it in the SELECT list to see it.',
    exampleSql: `SELECT ROWID, employee_id, last_name
FROM   employees
WHERE  employee_id = 100;`,
    exampleResult: 'AAASXJAAEAAAACXAAA',
    exampleBreakdown: [
      { part: 'AAASXJ', label: 'Object#', color: 'violet' as const },
      { part: 'AAE',    label: 'File#',   color: 'blue' as const },
      { part: 'AAAACX', label: 'Block#',  color: 'emerald' as const },
      { part: 'AAA',    label: 'Row#',    color: 'orange' as const },
    ],
    decodeNote:
      'Base64 decode example: AAASXJ → Object# 4,951 / AAE → File# 4 / AAAACX → Block# 151 / AAA → Row# 0',

    usageTitle: 'Using ROWID',
    usageDesc: 'You can use ROWID directly in a WHERE clause for the fastest possible single-row access.',
    usageSql: `-- Fastest single-row access via ROWID
SELECT * FROM employees WHERE ROWID = 'AAASXJAAEAAAACXAAA';

-- Remove duplicate rows using ROWID
DELETE FROM employees
WHERE  ROWID NOT IN (
  SELECT MIN(ROWID)
  FROM   employees
  GROUP BY employee_id
);`,
    usageTip:
      'Storing a ROWID for later reuse is risky — if the row moves (partition exchange, table reorganization) the ROWID becomes stale. ' +
      'Use the primary key as a durable long-term identifier.',

    indexTitle: 'How ROWID Is Used in a B-Tree Index Lookup',
    indexSteps: [
      { n: 1, desc: 'Traverse Root → Branch → Leaf blocks, comparing index key values at each level' },
      { n: 2, desc: 'Find the matching key in the Leaf block and retrieve its ROWID' },
      { n: 3, desc: 'Use ROWID (Object# + File# + Block# + Row#) to jump directly to the table block' },
      { n: 4, desc: 'Read the block\'s Row Directory, find the slot, and return the row data' },
    ],
    indexNote:
      'Even when Oracle uses an index, it must still visit the table block after finding the ROWID in the Leaf (Table Access by Index ROWID). ' +
      'This is why low-selectivity columns (many matching rows) can be slower with an index than with a full table scan.',
  },
}

// ── 색상 매핑 ─────────────────────────────────────────────────────────────────

const PART_COLORS = {
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-200',  badge: 'bg-violet-200 text-violet-800',  dot: 'bg-violet-400' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200',    badge: 'bg-blue-200 text-blue-800',      dot: 'bg-blue-400' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', badge: 'bg-emerald-200 text-emerald-800',dot: 'bg-emerald-400' },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-200',  badge: 'bg-orange-200 text-orange-800',  dot: 'bg-orange-400' },
}

// ── ROWID 시각화 컴포넌트 ──────────────────────────────────────────────────────

function RowidVisualizer({ parts, breakdown, decodeNote, isKo }: {
  parts: typeof T['ko']['parts']
  breakdown: typeof T['ko']['exampleBreakdown']
  decodeNote: string
  isKo: boolean
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="rounded-2xl border bg-slate-50 px-6 py-5">
      {/* 포맷 레이블 */}
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {isKo ? 'ROWID 포맷 (18자리 Base64)' : 'ROWID Format (18-char Base64)'}
      </p>

      {/* 파트 블록들 */}
      <div className="mb-6 flex flex-wrap gap-1">
        {parts.map((part, i) => {
          const c = PART_COLORS[part.color]
          const isHovered = hoveredIdx === i
          return (
            <motion.button
              key={part.label}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              animate={{ scale: isHovered ? 1.04 : 1 }}
              transition={{ duration: 0.15 }}
              className={[
                'rounded-lg border-2 px-3 py-2 text-left transition-shadow',
                c.bg, c.border,
                isHovered ? 'shadow-md' : 'shadow-sm',
              ].join(' ')}
            >
              <div className={`font-mono text-lg font-bold tracking-widest ${c.text}`}>{part.label}</div>
              <div className={`mt-0.5 font-mono text-[9px] font-semibold ${c.text} opacity-70`}>{part.chars}</div>
            </motion.button>
          )
        })}
      </div>

      {/* 호버 시 상세 설명 */}
      <div className="mb-6 min-h-[56px]">
        {hoveredIdx !== null ? (() => {
          const part = parts[hoveredIdx]
          const c = PART_COLORS[part.color]
          return (
            <motion.div
              key={hoveredIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`rounded-xl border p-3 ${c.bg} ${c.border}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${c.badge}`}>{part.label}</span>
                <span className={`font-mono text-[11px] font-semibold ${c.text}`}>{part.name}</span>
              </div>
              <p className="text-[12px] leading-relaxed text-muted-foreground">{part.desc}</p>
            </motion.div>
          )
        })() : (
          <p className="font-mono text-[11px] text-slate-400">
            {isKo ? '↑ 파트에 마우스를 올리면 설명이 표시됩니다' : '↑ Hover over a part to see its description'}
          </p>
        )}
      </div>

      {/* 실제 ROWID 예시 분해 */}
      <div className="rounded-xl border bg-white px-4 py-3">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isKo ? '실제 ROWID 예시' : 'Example ROWID'}
        </p>
        <div className="mb-1 flex flex-wrap items-center gap-0.5">
          {breakdown.map((seg, i) => {
            const c = PART_COLORS[seg.color]
            return (
              <span key={i} className={`rounded px-1.5 py-0.5 font-mono text-sm font-bold ${c.bg} ${c.text}`}>
                {seg.part}
              </span>
            )
          })}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {breakdown.map((seg, i) => {
            const c = PART_COLORS[seg.color]
            return (
              <span key={i} className="flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
                <span className="font-mono text-[10px] text-muted-foreground">{seg.label}</span>
              </span>
            )
          })}
        </div>
        <p className="font-mono text-[10px] text-slate-500">{decodeNote}</p>
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function RowidSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconFingerprintScan size={36} color="#7c3aed" stroke={1.5} />}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
      />

      {/* ROWID란? */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>
      <InfoBox variant="note">{t.whatNote}</InfoBox>

      <Divider />

      {/* Extended ROWID 구조 */}
      <SectionTitle>{t.structureTitle}</SectionTitle>
      <Prose>{t.structureDesc}</Prose>
      <RowidVisualizer
        parts={t.parts}
        breakdown={t.exampleBreakdown}
        decodeNote={t.decodeNote}
        isKo={isKo}
      />

      <Divider />

      {/* 실제 ROWID 읽어보기 */}
      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <Prose>{t.exampleDesc}</Prose>

      {/* SQL 예시 */}
      <div className="rounded-xl border bg-slate-900 px-4 py-3">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">SQL</p>
        <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-100">{t.exampleSql}</pre>
      </div>

      <Divider />

      {/* ROWID 활용 */}
      <SectionTitle>{t.usageTitle}</SectionTitle>
      <Prose>{t.usageDesc}</Prose>

      <div className="mb-4 rounded-xl border bg-slate-900 px-4 py-3">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">SQL</p>
        <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-100">{t.usageSql}</pre>
      </div>
      <InfoBox variant="warning">{t.usageTip}</InfoBox>

      <Divider />

      {/* B-Tree 인덱스에서 ROWID 흐름 */}
      <SectionTitle>{t.indexTitle}</SectionTitle>
      <div className="mb-4 space-y-2">
        {t.indexSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 font-mono text-[11px] font-bold text-violet-700">
              {step.n}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </div>
      <InfoBox variant="tip">{t.indexNote}</InfoBox>
    </PageContainer>
  )
}
