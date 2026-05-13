import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, Prose } from '../shared'
import type { Lang } from '../shared'
import { cn } from '@/lib/utils'

type BufferState = {
  id: string
  labelKo: string
  labelEn: string
  descKo: string
  descEn: string
  color: string
  dot: string
}

const BUFFER_STATES: BufferState[] = [
  {
    id: 'free',
    labelKo: 'Free',
    labelEn: 'Free',
    descKo: '비어 있어 언제든 새 데이터를 올릴 수 있는 상태입니다.',
    descEn: 'Empty and ready to receive a new block from disk.',
    color: 'border-slate-200 bg-slate-50 text-slate-600',
    dot: 'bg-slate-400',
  },
  {
    id: 'clean',
    labelKo: 'Clean',
    labelEn: 'Clean',
    descKo: '디스크에서 데이터를 읽어왔지만, 아직 아무런 변경도 없는 상태입니다.',
    descEn: 'Loaded from disk but not yet modified.',
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-400',
  },
  {
    id: 'dirty',
    labelKo: 'Dirty',
    labelEn: 'Dirty',
    descKo: '데이터가 수정됐지만 아직 디스크에 쓰이지 않은 상태입니다. DBWn이 디스크에 써야 비로소 Free 상태가 됩니다.',
    descEn: 'Modified in memory but not yet written to disk. DBWn must flush it before it becomes Clean again.',
    color: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-400',
  },
  {
    id: 'pinned',
    labelKo: 'Pinned',
    labelEn: 'Pinned',
    descKo: '현재 Server Process가 읽거나 수정 중인 상태입니다.',
    descEn: 'Currently being read or modified by a Server Process.',
    color: 'border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-400',
  },
]

type IoMode = 'random' | 'append'

function BufferCacheSection({ lang }: { lang: Lang }) {
  const [activeIo, setActiveIo] = useState<IoMode>('random')

  const ioModes: { id: IoMode; labelKo: string; labelEn: string }[] = [
    { id: 'random', labelKo: 'Random I/O', labelEn: 'Random I/O' },
    { id: 'append', labelKo: 'Append (Sequential) I/O', labelEn: 'Append (Sequential) I/O' },
  ]

  const IO_CONTENT = {
    random: {
      titleKo: 'Random I/O — 원하는 위치를 직접 찾아가는 방식',
      titleEn: 'Random I/O — Seeking the exact location each time',
      descKo: `데이터 파일에 블록을 쓸 때 Oracle은 해당 블록이 디스크의 어느 위치에 있는지 계산한 뒤, 그 위치로 바로 이동해서 씁니다. HDD라면 ARM이 물리적으로 그 위치로 이동해야 하고, SSD라면 해당 셀 주소를 찾아야 합니다.

문제는 UPDATE할 행이 테이블 전체에 흩어져 있을 때입니다. 블록 A → 블록 Z → 블록 C → 블록 M... 순서 없이 여기저기 이동하다 보면 이동 횟수가 늘고 느려집니다. 이것이 Random I/O입니다.

Random I/O는 앞으로 인덱스, 조인, 파티셔닝을 배울 때 계속 등장합니다. 여기서는 "디스크의 임의 위치에 쓰는 건 비싸다"는 개념만 기억해두세요.`,
      descEn: `When Oracle writes a block to a data file, it calculates exactly where on disk that block lives, then seeks directly to that location. On an HDD, the ARM physically moves there. On an SSD, it resolves the target cell address.

The problem appears when rows being updated are scattered across the table. Block A → Block Z → Block C → Block M... hopping around in no particular order means more seeks, more latency. That is Random I/O.

Random I/O will come up again when we cover indexes, joins, and partitioning. For now, just remember: writing to arbitrary disk locations is expensive.`,
      visual: (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div className="absolute inset-0 flex items-center justify-center gap-0">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((label, i) => (
              <div
                key={label}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center border-r border-slate-200 font-mono text-xs font-bold',
                  ['A', 'C', 'F'].includes(label)
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-white text-slate-400',
                  i === 7 && 'border-r-0'
                )}
              >
                {label}
              </div>
            ))}
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 112">
            <path d="M20 56 C 20 20, 200 20, 200 56" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="4 2" markerEnd="url(#arrowAmber)" />
            <path d="M200 56 C 200 90, 100 90, 100 56" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="4 2" markerEnd="url(#arrowAmber)" />
            <defs>
              <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
              </marker>
            </defs>
          </svg>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-400">
            {lang === 'ko' ? '순서 없이 블록 A → F → C 이동' : 'Seeks A → F → C out of order'}
          </div>
        </div>
      ),
    },
    append: {
      titleKo: 'Append I/O — 끝에 순서대로 이어 붙이는 방식',
      titleEn: 'Append I/O — Writing sequentially to the end',
      descKo: `Redo Log File은 다릅니다. 어디서부터 어디까지 바꿨는지 추적할 필요가 없고, 그냥 파일 끝에 "다음으로 일어난 일"을 차례대로 이어 씁니다. ARM이 이동할 일이 없습니다. 디스크가 돌아가면서 자연스럽게 다음 위치가 헤드 아래로 옵니다.

이 방식을 Sequential I/O 또는 Append Write라고 합니다. Random I/O에 비해 훨씬 빠르기 때문에, Oracle은 COMMIT 시 Redo Log를 디스크에 먼저 쓰더라도 빠르게 처리할 수 있습니다.

정리하면: "느린 디스크에 써야 한다면, Append 방식으로 써라"가 Oracle의 전략입니다.`,
      descEn: `Redo Log Files work differently. Oracle doesn't need to find where a specific block lives — it just appends "the next thing that happened" to the end of the file in sequence. The ARM never needs to seek. As the disk spins, the next position naturally arrives under the head.

This is called Sequential I/O or Append Write. It is far faster than Random I/O, which is why Oracle can afford to flush the Redo Log to disk synchronously at COMMIT without making commits slow.

The takeaway: "if you must write to slow disk, write sequentially" is Oracle's core strategy.`,
      visual: (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-orange-200 bg-orange-50">
          <div className="absolute inset-0 flex items-center justify-center gap-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
              <div
                key={n}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center border-r border-orange-200 font-mono text-xs font-bold',
                  n <= 5
                    ? 'bg-orange-100 text-orange-700'
                    : n === 6
                    ? 'bg-orange-300 text-white ring-2 ring-orange-400'
                    : 'bg-white text-slate-300',
                  i === 7 && 'border-r-0'
                )}
              >
                {n <= 5 ? n : n === 6 ? '→' : ''}
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-orange-500">
            {lang === 'ko' ? '1 → 2 → 3 → 4 → 5 → 다음 칸에 이어 쓰기' : 'Written 1 → 2 → 3 → 4 → 5, next appended here'}
          </div>
        </div>
      ),
    },
  }

  const activeIoContent = IO_CONTENT[activeIo]

  return (
    <div className="mt-12 border-t border-border pt-10 space-y-8">

      {/* ── 1. 디스크 vs 메모리 ── */}
      <div>
        <h2 className="mt-0 mb-3 text-xl font-bold tracking-tight">
          {lang === 'ko' ? '왜 Buffer Cache가 필요할까? — 디스크와 메모리의 속도 차이' : 'Why Buffer Cache Exists — The Speed Gap Between Disk and Memory'}
        </h2>
        {lang === 'ko' ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">디스크는 물리적인 장치입니다.</strong>{' '}
              회전하는 동그란 원판 위로 긴 팔(arm)이 이동해 데이터의 위치를 찾아야 합니다.
              전기 신호만으로 동작하는 메모리에 비하면 수백 ~ 수천배는 느립니다.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">메모리(RAM)는 전기 신호만으로 동작합니다.</strong>{' '}
              움직이는 부품이 없고 어느 주소나 즉시 접근할 수 있어 디스크보다 훨씬 빠릅니다.
              그래서 Oracle은 디스크에서 블록을 읽으면 Buffer Cache에 올려 두고,
              같은 블록이 다시 필요할 때는 디스크 대신 메모리에서 꺼내 씁니다.
              이런 이유로 대부분의 DBMS는 Buffer Cache 시스템으로 동작합니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Disk is a physical device.</strong>{' '}
              A long arm moves across a spinning circular platter to locate the data.
              Compared to memory, which runs purely on electrical signals, disk is hundreds to thousands of times slower.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Memory (RAM) runs on pure electrical signals.</strong>{' '}
              No moving parts, instant access to any address — far faster than disk.
              So Oracle loads a block into the Buffer Cache the first time it reads it from disk,
              and serves every subsequent access from memory instead.
              This is why virtually every DBMS operates with a Buffer Cache system.
            </p>
          </div>
        )}
      </div>

      {/* ── 2. Buffer 4가지 상태 ── */}
      <div>
        <h3 className="mb-1 text-sm font-bold text-foreground/90">
          {lang === 'ko' ? 'Buffer Cache의 블록은 4가지 상태를 가집니다' : 'Every block in the Buffer Cache has one of four states'}
        </h3>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          {lang === 'ko'
            ? 'Oracle은 Buffer Cache의 각 블록에 상태 태그를 붙여 관리합니다.'
            : 'Oracle tags every buffer in the cache with a state to manage it efficiently.'}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BUFFER_STATES.map((s) => (
            <div key={s.id} className={cn('rounded-lg border-2 p-3', s.color)}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={cn('h-2 w-2 rounded-full shrink-0', s.dot)} />
                <span className="text-xs font-bold">{lang === 'ko' ? s.labelKo : s.labelEn}</span>
              </div>
              <p className="text-xs leading-snug opacity-80">
                {lang === 'ko' ? s.descKo : s.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Write-Ahead Logging ── */}
      <div className="rounded-xl border-2 border-orange-200 bg-orange-50/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">WAL</span>
          <h3 className="text-sm font-bold text-foreground/90">
            {lang === 'ko' ? 'Write-Ahead Logging — 로그 먼저, 데이터 나중' : 'Write-Ahead Logging — Log first, data second'}
          </h3>
        </div>
        {lang === 'ko' ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Buffer Cache가 데이터를 수정할 때 Oracle은 반드시 정해진 순서를 지킵니다.
            </p>
            <ol className="space-y-1.5 list-none">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">1</span>
                <span><strong className="font-semibold text-foreground">Redo Log Buffer에 먼저 기록</strong> — "이 블록의 이 값을 저 값으로 바꾼다"는 변경 내역을 메모리의 로그 버퍼에 씁니다.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">2</span>
                <span><strong className="font-semibold text-foreground">그 다음 Buffer Cache의 블록을 수정</strong> — 실제 데이터 블록을 변경합니다.</span>
              </li>
            </ol>
            <p className="text-sm leading-relaxed text-muted-foreground">
              이 순서는 디스크에 내려쓸 때도 동일합니다.
              <strong className="font-semibold text-foreground"> Redo Log File이 먼저, Data File은 그 다음</strong>입니다.
              이 원칙을 <strong className="font-semibold text-orange-700">Write-Ahead Logging(WAL)</strong>이라 합니다.
              서버가 갑자기 꺼져도 Redo Log만 온전하면 데이터 파일을 복구할 수 있기 때문입니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              When Oracle modifies data in the Buffer Cache, it always follows a strict order.
            </p>
            <ol className="space-y-1.5 list-none">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">1</span>
                <span><strong className="font-semibold text-foreground">Write to the Redo Log Buffer first</strong> — record "change this value in this block to that value" in the in-memory log buffer.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">2</span>
                <span><strong className="font-semibold text-foreground">Then modify the block in the Buffer Cache</strong> — apply the actual change to the data block.</span>
              </li>
            </ol>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The same order holds when flushing to disk:
              <strong className="font-semibold text-foreground"> Redo Log File first, Data File second</strong>.
              This principle is called <strong className="font-semibold text-orange-700">Write-Ahead Logging (WAL)</strong>.
              As long as the Redo Log survives, Oracle can always reconstruct the data files — even after a crash.
            </p>
          </div>
        )}

        {/* WAL 순서 시각화 */}
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
            {lang === 'ko' ? '메모리 쓰기 순서' : 'In-memory write order'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
              ① Redo Log Buffer
            </div>
            <span className="text-sm text-muted-foreground">→</span>
            <div className="flex-1 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700">
              ② Buffer Cache
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-2 mb-1">
            {lang === 'ko' ? '디스크 쓰기 순서 (COMMIT 시)' : 'Disk write order (at COMMIT)'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 text-center text-xs font-bold text-orange-700">
              ① Redo Log File
              <div className="mt-0.5 text-[10px] font-normal opacity-70">{lang === 'ko' ? 'LGWR · COMMIT 즉시' : 'LGWR · at COMMIT'}</div>
            </div>
            <span className="text-sm text-muted-foreground">→</span>
            <div className="flex-1 rounded-lg border-2 border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700">
              ② Data File
              <div className="mt-0.5 text-[10px] font-normal opacity-70">{lang === 'ko' ? 'DBWn · 나중에 일괄' : 'DBWn · batched later'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Random I/O vs Append ── */}
      <div>
        <h3 className="mb-1 text-sm font-bold text-foreground/90">
          {lang === 'ko'
            ? '왜 Redo Log 쓰기가 Data File 쓰기보다 빠를까?'
            : 'Why is writing to the Redo Log faster than writing to the Data File?'}
        </h3>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          {lang === 'ko'
            ? '두 가지 I/O 방식의 차이에 있습니다.'
            : 'The answer lies in the two different I/O patterns.'}
        </p>
        <div className="flex gap-2 mb-4">
          {ioModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveIo(m.id)}
              className={cn(
                'rounded-lg border px-4 py-2 text-xs font-bold transition-all',
                activeIo === m.id
                  ? m.id === 'random'
                    ? 'border-amber-400 bg-amber-500 text-white shadow-sm'
                    : 'border-orange-400 bg-orange-500 text-white shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-slate-400 hover:text-foreground',
              )}
            >
              {lang === 'ko' ? m.labelKo : m.labelEn}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeIo}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className={cn(
              'flex items-center gap-2.5 border-b border-border px-5 py-3',
              activeIo === 'random' ? 'bg-amber-50/60' : 'bg-orange-50/60'
            )}>
              <span className={cn(
                'rounded px-2.5 py-0.5 text-xs font-bold text-white',
                activeIo === 'random' ? 'bg-amber-500' : 'bg-orange-500'
              )}>
                {activeIo === 'random'
                  ? (lang === 'ko' ? 'Data File 쓰기' : 'Data File write')
                  : (lang === 'ko' ? 'Redo Log 쓰기' : 'Redo Log write')}
              </span>
              <span className="text-sm font-bold text-foreground">
                {lang === 'ko' ? activeIoContent.titleKo : activeIoContent.titleEn}
              </span>
            </div>
            <div className="px-5 py-4 space-y-4">
              {activeIoContent.visual}
              <Prose>{lang === 'ko' ? activeIoContent.descKo : activeIoContent.descEn}</Prose>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          💡 {lang === 'ko'
            ? 'Random I/O는 인덱스·조인·파티셔닝 챕터에서 계속 등장합니다. 지금은 "임의 위치 쓰기는 비싸다"는 개념만 기억하세요.'
            : 'Random I/O will reappear throughout the indexes, joins, and partitioning chapters. For now, just remember: writing to arbitrary locations is expensive.'}
        </div>
      </div>
    </div>
  )
}

export function BufferCachePage() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        title={lang === 'ko' ? 'Buffer Cache 원리' : 'Buffer Cache Internals'}
        subtitle={lang === 'ko'
          ? 'Oracle이 디스크와 메모리 사이의 속도 차이를 어떻게 극복하는지, Buffer Cache의 동작 원리와 Write-Ahead Logging을 살펴봅니다.'
          : 'How Oracle bridges the speed gap between disk and memory — Buffer Cache mechanics and Write-Ahead Logging.'}
      />
      <BufferCacheSection lang={lang} />
    </div>
  )
}
